import * as THREE from 'three'
import { brickTexture, doughTexture, glowTexture, mottleTexture, sauceTexture, seeded, shadowTexture, soleTexture } from './textures'

/**
 * Scène « Le Four » : l'arche de l'emblème en briques, le feu, et une pizza
 * qui s'assemble puis cuit selon l'avancement du défilement (0 → 1).
 * Three.js pur, tout est procédural.
 */

export interface OvenSceneOptions {
  canvas: HTMLCanvasElement
  /** Appelé après la première image rendue (pour le fondu d'apparition) */
  onReady?: () => void
  /** Contexte WebGL perdu : on repasse au visuel statique */
  onLost?: () => void
}

export interface OvenScene {
  setProgress: (p: number) => void
  setPointer: (x: number, y: number) => void
  resize: (width: number, height: number) => void
  start: () => void
  stop: () => void
  dispose: () => void
}

const CHARBON = new THREE.Color('#0e1011')
const CREAM = new THREE.Color('#fcf7ee')
const DARK_BRICK = new THREE.Color('#4a4643')

/** Dimensions (unités ≈ mètres, centre de l'arche au sol) */
const CREAM_IN = 3.3
const CREAM_OUT = 4.4
const VAULT_IN = 2.45
const VAULT_OUT = 3.05
const FRONT_DEPTH = 0.55
const VAULT_ROWS = 14
const ROW_DEPTH = 0.3
const OVEN_BACK = 0.2 - FRONT_DEPTH - VAULT_ROWS * ROW_DEPTH
const FIRE_Z = -3.75
const PIZZA_Z = -1.55
const PIZZA_R = 1.08

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smooth = (x: number) => x * x * (3 - 2 * x)
/** Avancement local de p entre a et b, adouci */
const span = (p: number, a: number, b: number) => smooth(clamp01((p - a) / (b - a)))
const easeOutBack = (x: number) => {
  const c = 1.4
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2)
}

/** Brique en secteur d'anneau, centrée sur l'angle 0 et sur z = 0 */
function sectorBrick(rIn: number, rOut: number, angle: number, depth: number, bevel: number): THREE.ExtrudeGeometry {
  const half = angle / 2
  const shape = new THREE.Shape()
  shape.absarc(0, 0, rOut - bevel, -half, half, false)
  shape.absarc(0, 0, rIn + bevel, half, -half, true)
  shape.closePath()
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: depth - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 12,
  })
  geo.translate(0, 0, -(depth - bevel * 2) / 2)
  return geo
}

/** Shader de flamme : bruit fractal qui monte, dégradé braise → ocre → blanc chaud */
const flameVertex = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const flameFragment = /* glsl */`
varying vec2 vUv;
uniform float uTime;
uniform float uSeed;
uniform float uIntensity;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}
void main() {
  vec2 p = vec2((vUv.x - 0.5) * 2.0, vUv.y);
  float t = uTime + uSeed * 17.0;
  float n = fbm(vec2(p.x * 1.8 + uSeed, p.y * 2.6 - t * 1.25));
  float n2 = fbm(vec2(p.x * 3.6 - uSeed, p.y * 4.2 - t * 2.1));
  float sway = (n - 0.5) * 0.9 * p.y;
  float w = mix(0.78, 0.04, pow(p.y, 0.75));
  float shape = 1.0 - smoothstep(w * 0.35, w, abs(p.x + sway));
  float body = shape * (1.0 - smoothstep(0.15, 1.0, p.y + (n2 - 0.5) * 0.55));
  float f = body * (0.55 + n * 0.9);
  f = smoothstep(0.12, 0.85, f) * smoothstep(0.0, 0.1, p.y) * (1.0 - smoothstep(0.7, 0.98, p.y)) * uIntensity;
  f *= 1.0 - smoothstep(0.75, 1.0, abs(p.x));
  vec3 deep = vec3(0.62, 0.14, 0.02);
  vec3 ocre = vec3(0.878, 0.667, 0.243);
  vec3 hot = vec3(1.0, 0.96, 0.86);
  vec3 col = mix(deep, ocre, smoothstep(0.05, 0.5, f));
  col = mix(col, hot, smoothstep(0.7, 1.25, f));
  gl_FragColor = vec4(col * 1.1, clamp(f * 0.9, 0.0, 1.0));
}`

interface Key { target: THREE.Vector3, dir: THREE.Vector3, width: number, min: number }

/** Plans de caméra : héros, pâte, produits, cuisson, sortie */
const KEYS: Key[] = [
  { target: new THREE.Vector3(0, 2.05, 0), dir: new THREE.Vector3(0, 0.12, 1), width: 10.2, min: 17 },
  { target: new THREE.Vector3(0, 0.25, PIZZA_Z - 0.2), dir: new THREE.Vector3(0, 0.55, 1), width: 4.8, min: 4.4 },
  { target: new THREE.Vector3(0, 0.1, PIZZA_Z), dir: new THREE.Vector3(0.2, 0.9, 1), width: 4.4, min: 3.6 },
  { target: new THREE.Vector3(-0.05, 0.35, PIZZA_Z - 0.6), dir: new THREE.Vector3(-0.38, 0.36, 1), width: 5, min: 3.8 },
  { target: new THREE.Vector3(0, 1.45, -0.6), dir: new THREE.Vector3(0.22, 0.22, 1), width: 10.5, min: 10 },
]
for (const k of KEYS) k.dir.normalize()

export function createOvenScene({ canvas, onReady, onLost }: OvenSceneOptions): OvenScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setClearColor(CHARBON, 1)

  const scene = new THREE.Scene()
  scene.background = CHARBON
  scene.fog = new THREE.Fog(CHARBON, 14, 34)

  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 80)
  const small = Math.min(window.innerWidth, window.innerHeight) < 600
  const rand = seeded(42)

  // ── Lumières ─────────────────────────────────────────────
  scene.add(new THREE.HemisphereLight('#4a4038', '#0a0a0a', 0.7))
  const key = new THREE.DirectionalLight('#ffeedd', 1.25)
  key.position.set(-5, 7, 9)
  scene.add(key)
  const fireLight = new THREE.PointLight('#ff8a2e', 28, 0, 1.6)
  fireLight.position.set(0, 1.5, FIRE_Z + 1.0)
  scene.add(fireLight)
  const mouthLight = new THREE.PointLight('#ffae55', 9, 0, 1.6)
  mouthLight.position.set(0, 1.1, 1.0)
  scene.add(mouthLight)
  const pizzaLight = new THREE.PointLight('#ffe2b8', 0, 0, 1.8)
  pizzaLight.position.set(0.6, 1.9, PIZZA_Z + 0.9)
  scene.add(pizzaLight)

  // ── Textures ─────────────────────────────────────────────
  const texSize = small ? 512 : 1024
  const mottle = mottleTexture()
  mottle.repeat.set(0.6, 0.6)
  const facadeBricks = brickTexture(512, '#24201d')
  facadeBricks.repeat.set(0.36, 0.36)
  const backBricks = brickTexture(512, '#3b3532', '#16110e')
  backBricks.repeat.set(0.4, 0.4)
  const sole = soleTexture()
  const glow = glowTexture()
  const softGlow = glowTexture(128, 'rgba(255,190,110,0.9)', 'rgba(224,130,40,0.25)')
  const rawDough = doughTexture(texSize, false)
  const bakedDough = doughTexture(texSize, true)
  const sauceTex = sauceTexture()
  const contact = shadowTexture()

  // ── Façade et sol ────────────────────────────────────────
  const facadeShape = new THREE.Shape()
  facadeShape.moveTo(-16, -0.5)
  facadeShape.lineTo(16, -0.5)
  facadeShape.lineTo(16, 12)
  facadeShape.lineTo(-16, 12)
  facadeShape.closePath()
  const hole = new THREE.Path()
  hole.moveTo(VAULT_OUT + 0.15, 0)
  hole.absarc(0, 0, VAULT_OUT + 0.15, 0, Math.PI, false)
  hole.closePath()
  facadeShape.holes.push(hole)
  const facade = new THREE.Mesh(
    new THREE.ShapeGeometry(facadeShape, 32),
    new THREE.MeshStandardMaterial({ map: facadeBricks, color: '#a69a8e', roughness: 0.95 }),
  )
  facade.position.z = -0.32
  scene.add(facade)

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 30),
    new THREE.MeshStandardMaterial({ color: '#15130f', roughness: 0.78, metalness: 0 }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.set(0, 0, 14.6)
  scene.add(ground)

  // ── Arche crème (8 voussoirs) ────────────────────────────
  const creamGeo = sectorBrick(CREAM_IN, CREAM_OUT, Math.PI / 8 - 0.034, 1.0, 0.05)
  const creamMat = new THREE.MeshStandardMaterial({ color: '#ffffff', map: mottle, roughness: 0.82 })
  const cream = new THREE.InstancedMesh(creamGeo, creamMat, 8)
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const v = new THREE.Vector3()
  const s = new THREE.Vector3(1, 1, 1)
  const zAxis = new THREE.Vector3(0, 0, 1)
  const tint = new THREE.Color()
  for (let i = 0; i < 8; i++) {
    q.setFromAxisAngle(zAxis, (i + 0.5) * Math.PI / 8)
    m.compose(v.set(0, 0, 0.16), q, s)
    cream.setMatrixAt(i, m)
    cream.setColorAt(i, tint.copy(CREAM).offsetHSL(0, 0, -rand() * 0.05))
  }
  scene.add(cream)

  // ── Voûte sombre ─────────────────────────────────────────
  // Rang de façade : les 7 briques de l'emblème
  const frontGeo = sectorBrick(VAULT_IN, VAULT_OUT, Math.PI / 7 - 0.03, FRONT_DEPTH, 0.04)
  const vaultMat = new THREE.MeshStandardMaterial({ color: '#ffffff', map: mottle, roughness: 0.9 })
  const front = new THREE.InstancedMesh(frontGeo, vaultMat, 7)
  for (let i = 0; i < 7; i++) {
    q.setFromAxisAngle(zAxis, (i + 0.5) * Math.PI / 7)
    m.compose(v.set(0, 0, 0.2 - FRONT_DEPTH / 2), q, s)
    front.setMatrixAt(i, m)
    front.setColorAt(i, tint.copy(DARK_BRICK).offsetHSL(0, 0, (rand() - 0.5) * 0.03))
  }
  scene.add(front)

  // Intérieur : petites briques à joints croisés, de plus en plus noircies par la suie
  const PER_ROW = 15
  const bodyGeo = sectorBrick(VAULT_IN, VAULT_IN + 0.4, Math.PI / 14 - 0.022, ROW_DEPTH - 0.022, 0.018)
  const body = new THREE.InstancedMesh(bodyGeo, vaultMat, PER_ROW * VAULT_ROWS)
  let n = 0
  for (let r = 0; r < VAULT_ROWS; r++) {
    const odd = r % 2 === 1
    for (let i = 0; i < PER_ROW; i++) {
      // Rangées impaires décalées d'une demi-brique ; les briques du bord plongent sous la sole
      const angle = odd ? i * Math.PI / 14 : (i + 0.5) * Math.PI / 14
      q.setFromAxisAngle(zAxis, angle)
      m.compose(v.set(0, 0, 0.2 - FRONT_DEPTH - (r + 0.5) * ROW_DEPTH), q, s.setScalar(!odd && i === PER_ROW - 1 ? 0 : 1))
      body.setMatrixAt(n, m)
      const soot = r / VAULT_ROWS
      body.setColorAt(n, tint.set('#4f4843').offsetHSL((rand() - 0.5) * 0.02, -soot * 0.1, (rand() - 0.5) * 0.09 - soot * 0.12))
      n++
    }
  }
  s.setScalar(1)
  scene.add(body)

  const backWall = new THREE.Mesh(
    new THREE.CircleGeometry(VAULT_OUT, 48, 0, Math.PI),
    new THREE.MeshStandardMaterial({ map: backBricks, roughness: 0.95 }),
  )
  backWall.position.z = OVEN_BACK
  scene.add(backWall)

  const soleMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(VAULT_IN * 2, 0.2 - OVEN_BACK),
    new THREE.MeshStandardMaterial({ map: sole, roughness: 0.85 }),
  )
  soleMesh.rotation.x = -Math.PI / 2
  soleMesh.position.set(0, 0.004, (0.2 + OVEN_BACK) / 2)
  scene.add(soleMesh)

  // ── Le feu : bûches croisées, braises, flammes, halos ────
  const logGeo = new THREE.CylinderGeometry(0.12, 0.15, 1.7, 12)
  const logMat = new THREE.MeshStandardMaterial({ color: '#0f0a07', map: mottle, roughness: 1, emissive: '#ff3c06', emissiveIntensity: 0.05 })
  for (const sign of [-1, 1]) {
    const log = new THREE.Mesh(logGeo, logMat)
    log.rotation.set(0, sign * 0.5, Math.PI / 2)
    log.position.set(0, 0.15 + (sign > 0 ? 0.18 : 0), FIRE_Z)
    scene.add(log)
  }

  const COALS = 40
  const coals = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(0.05, 0),
    new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, emissive: '#ff6a12', emissiveIntensity: 0.3 }),
    COALS,
  )
  for (let i = 0; i < COALS; i++) {
    const a = rand() * Math.PI * 2
    const d = 0.25 + Math.sqrt(rand()) * 0.75
    q.setFromEuler(new THREE.Euler(rand() * 3, rand() * 3, rand() * 3))
    const k = 0.6 + rand() * 0.9
    m.compose(v.set(Math.cos(a) * d * 1.2, 0.012, FIRE_Z + Math.sin(a) * d * 0.45), q, s.set(k, k * 0.6, k))
    coals.setMatrixAt(i, m)
    coals.setColorAt(i, tint.setHSL(0.03, 0.2, 0.004 + rand() * 0.01))
  }
  s.set(1, 1, 1)
  scene.add(coals)

  const flameTime = { value: 0 }
  const flameHeat = { value: 1 }
  const flames: THREE.Mesh[] = []
  const flameSpecs: [number, number, number, number, number][] = [
    // x, z, largeur, hauteur, graine
    [0, FIRE_Z, 1.7, 2.3, 0.1],
    [-0.42, FIRE_Z + 0.18, 1.0, 1.55, 0.53],
    [0.46, FIRE_Z + 0.12, 1.05, 1.7, 0.87],
  ]
  const flameGeo = new THREE.PlaneGeometry(1, 1)
  flameGeo.translate(0, 0.5, 0)
  for (const [x, z, w, h, seed] of flameSpecs) {
    const mat = new THREE.ShaderMaterial({
      vertexShader: flameVertex,
      fragmentShader: flameFragment,
      uniforms: { uTime: flameTime, uIntensity: flameHeat, uSeed: { value: seed } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const mesh = new THREE.Mesh(flameGeo, mat)
    mesh.position.set(x, 0.08, z)
    mesh.scale.set(w, h, 1)
    mesh.renderOrder = 2
    flames.push(mesh)
    scene.add(mesh)
  }

  const makeSprite = (map: THREE.Texture, opacity: number, scale: number, pos: [number, number, number]) => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }))
    sprite.scale.setScalar(scale)
    sprite.position.set(...pos)
    sprite.renderOrder = 3
    scene.add(sprite)
    return sprite
  }
  // Lit de braises sous les bûches
  const bed = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 1.3),
    new THREE.MeshBasicMaterial({ map: softGlow, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }),
  )
  bed.rotation.x = -Math.PI / 2
  bed.position.set(0, 0.012, FIRE_Z)
  scene.add(bed)

  const fireGlow = makeSprite(softGlow, 0.85, 4.2, [0, 0.9, FIRE_Z + 0.3])
  const mouthGlow = makeSprite(softGlow, 0.22, 7.5, [0, 1.3, 0.75])

  // ── Braises qui montent, lèchent la voûte et sortent par la bouche ──
  const EMBERS = small ? 70 : 120
  const embers = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
    EMBERS,
  )
  embers.frustumCulled = false
  embers.renderOrder = 4
  const ep = new Float32Array(EMBERS * 3)
  const ev = new Float32Array(EMBERS * 3)
  const life = new Float32Array(EMBERS)
  const maxLife = new Float32Array(EMBERS)
  const esize = new Float32Array(EMBERS)
  const eseed = new Float32Array(EMBERS)
  const spawn = (i: number, initial: boolean) => {
    ep[i * 3] = (rand() - 0.5) * 1.3
    ep[i * 3 + 1] = 0.3 + rand() * 0.5
    ep[i * 3 + 2] = FIRE_Z + (rand() - 0.5) * 0.6
    ev[i * 3] = (rand() - 0.5) * 0.25
    ev[i * 3 + 1] = 0.6 + rand() * 0.8
    ev[i * 3 + 2] = 0.25 + rand() * 0.5
    maxLife[i] = 3 + rand() * 4
    life[i] = initial ? rand() * maxLife[i] : 0
    esize[i] = 0.025 + rand() * 0.04
    eseed[i] = rand() * 100
  }
  for (let i = 0; i < EMBERS; i++) {
    spawn(i, true)
    embers.setColorAt(i, tint.set(0, 0, 0))
  }
  scene.add(embers)
  const emberHot = new THREE.Color('#fff1cf')
  const emberOcre = new THREE.Color('#e0aa3e')

  // ── La pizza ─────────────────────────────────────────────
  const pizza = new THREE.Group()
  pizza.position.set(0, 0.005, PIZZA_Z)
  scene.add(pizza)

  const bake = { value: 0 }
  const doughMat = new THREE.MeshStandardMaterial({ map: rawDough, roughness: 0.78 })
  doughMat.onBeforeCompile = (shader) => {
    shader.uniforms.uBaked = { value: bakedDough }
    shader.uniforms.uBake = bake
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D uBaked;\nuniform float uBake;')
      .replace('#include <map_fragment>', `
        vec4 rawColor = texture2D( map, vMapUv );
        vec4 bakedColor = texture2D( uBaked, vMapUv );
        diffuseColor *= mix( rawColor, bakedColor, uBake );
      `)
  }

  // Profil du disque : centre fin, cornicione bombé
  const profile = [
    [0, 0], [1.04, 0.004], [1.075, 0.035], [1.08, 0.085], [1.06, 0.13], [1.02, 0.155],
    [0.97, 0.15], [0.91, 0.115], [0.86, 0.07], [0.8, 0.052], [0.5, 0.05], [0, 0.048],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  const discGeo = new THREE.LatheGeometry(profile, 72)
  // UV en projection plane, pour que la texture se lise vue de dessus
  const pos = discGeo.attributes.position!
  const uv = discGeo.attributes.uv!
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, 0.5 + 0.47 * pos.getX(i) / PIZZA_R, 0.5 - 0.47 * pos.getZ(i) / PIZZA_R)
  }
  uv.needsUpdate = true
  const disc = new THREE.Mesh(discGeo, doughMat)
  pizza.add(disc)

  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.5, 40, 24), doughMat)
  pizza.add(ball)

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.9, 2.9),
    new THREE.MeshBasicMaterial({ map: contact, transparent: true, depthWrite: false, opacity: 0.8 }),
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.003
  pizza.add(shadow)

  // Sauce : disque au bord irrégulier
  const sauceGeo = new THREE.CircleGeometry(0.8, 160)
  const sp = sauceGeo.attributes.position!
  for (let i = 1; i < sp.count; i++) {
    const x = sp.getX(i)
    const y = sp.getY(i)
    const a = Math.atan2(y, x)
    const k = 1 + 0.035 * Math.sin(a * 5 + 1) + 0.02 * Math.sin(a * 11 + 2) + 0.012 * Math.sin(a * 23)
    sp.setXY(i, x * k, y * k)
  }
  sauceGeo.rotateX(-Math.PI / 2)
  const sauceMat = new THREE.MeshStandardMaterial({ map: sauceTex, roughness: 0.45, polygonOffset: true, polygonOffsetFactor: -2 })
  const sauce = new THREE.Mesh(sauceGeo, sauceMat)
  sauce.position.y = 0.054
  pizza.add(sauce)

  // Mozzarella : morceaux déchirés à la main (sphère bosselée), qui fondent à la cuisson
  const MOZZ = 13
  const mozzGeo = new THREE.SphereGeometry(1, 28, 18)
  const mp = mozzGeo.attributes.position!
  for (let i = 0; i < mp.count; i++) {
    v.fromBufferAttribute(mp, i)
    const bump = 1 + 0.18 * Math.sin(v.x * 4.1 + v.z * 2.3) + 0.12 * Math.sin(v.z * 5.7 - v.y * 3.1) + 0.05 * Math.sin(v.x * 9 + v.y * 7)
    v.multiplyScalar(bump)
    mp.setXYZ(i, v.x, v.y, v.z)
  }
  mozzGeo.computeVertexNormals()
  const mozzMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.32 })
  const mozz = new THREE.InstancedMesh(mozzGeo, mozzMat, MOZZ)
  const mozzBase: { x: number, z: number, sx: number, sz: number, ry: number, delay: number }[] = []
  for (let i = 0; i < MOZZ; i++) {
    const a = i * 2.39996 + rand() * 0.4
    const d = 0.66 * Math.sqrt((i + 0.5) / MOZZ) + (rand() - 0.5) * 0.06
    mozzBase.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, sx: 0.085 + rand() * 0.05, sz: 0.07 + rand() * 0.04, ry: rand() * Math.PI, delay: rand() })
  }
  pizza.add(mozz)
  const mozzRaw = new THREE.Color('#fbf7ee')
  const mozzBaked = new THREE.Color('#f3dfb0')

  // Basilic : feuilles pliées le long de la nervure, posées après cuisson
  const leaf = new THREE.Shape()
  leaf.moveTo(0, -0.15)
  leaf.bezierCurveTo(0.085, -0.1, 0.1, 0.05, 0, 0.16)
  leaf.bezierCurveTo(-0.1, 0.05, -0.085, -0.1, 0, -0.15)
  const leafGeo = new THREE.ShapeGeometry(leaf, 10)
  const lp = leafGeo.attributes.position!
  for (let i = 0; i < lp.count; i++) {
    const x = lp.getX(i)
    const y = lp.getY(i)
    lp.setZ(i, Math.abs(x) * 0.35 + 0.08 * y * y)
  }
  leafGeo.rotateX(-Math.PI / 2)
  leafGeo.computeVertexNormals()
  const BASIL = 5
  const basil = new THREE.InstancedMesh(leafGeo, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.42, side: THREE.DoubleSide }), BASIL)
  const basilBase: { x: number, z: number, ry: number, k: number }[] = []
  for (let i = 0; i < BASIL; i++) {
    const a = (i / BASIL) * Math.PI * 2 + 0.6
    const d = i === 0 ? 0.08 : 0.42 + rand() * 0.12
    basilBase.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, ry: rand() * Math.PI * 2, k: 0.9 + rand() * 0.45 })
    basil.setColorAt(i, tint.set(i % 2 ? '#2f6e24' : '#3c8030'))
  }
  pizza.add(basil)

  // ── Animation ────────────────────────────────────────────
  let target = 0
  let progress = 0
  const pointer = new THREE.Vector2()
  const pointerSmooth = new THREE.Vector2()
  let width = 1
  let height = 1
  let shiftX = 0
  let shiftY = 0
  const camPos = new THREE.Vector3()
  const camTarget = new THREE.Vector3()
  const tmpA = new THREE.Vector3()
  const tmpB = new THREE.Vector3()
  const tmpC = new THREE.Vector3()
  const tmpD = new THREE.Vector3()

  function keyPose(k: Key, outPos: THREE.Vector3, outTarget: THREE.Vector3) {
    const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect)
    const d = Math.max(k.min, k.width / (2 * Math.tan(hfov / 2)))
    outTarget.copy(k.target)
    outPos.copy(k.dir).multiplyScalar(d).add(k.target)
  }

  function updateCamera(p: number) {
    const x = p * (KEYS.length - 1)
    const i = Math.min(KEYS.length - 2, Math.floor(x))
    const t = smooth(clamp01(x - i))
    keyPose(KEYS[i]!, tmpA, tmpB)
    keyPose(KEYS[i + 1]!, tmpC, tmpD)
    camPos.lerpVectors(tmpA, tmpC, t)
    camTarget.lerpVectors(tmpB, tmpD, t)
    // Légère parallaxe au pointeur, surtout sur le premier écran
    const weight = 1 - 0.75 * span(p, 0, 0.25)
    camPos.x += pointerSmooth.x * 0.7 * weight
    camPos.y += pointerSmooth.y * 0.35 * weight
    camera.position.copy(camPos)
    camera.lookAt(camTarget)
    camera.updateProjectionMatrix()
    // Décalage optique : la scène glisse à droite (texte à gauche) ou vers le haut (mobile)
    camera.projectionMatrix.elements[8] = -shiftX
    camera.projectionMatrix.elements[9] = -shiftY
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()

    const dist = camPos.distanceTo(camTarget)
    const fog = scene.fog as THREE.Fog
    fog.near = dist + 3
    fog.far = dist + 26
  }

  function updatePizza(p: number, time: number) {
    const appear = span(p, 0.06, 0.16)
    const flatten = span(p, 0.17, 0.3)
    const sauceK = span(p, 0.33, 0.45)
    const bakeK = span(p, 0.58, 0.76)
    const basilK = clamp01((p - 0.8) / 0.1)

    pizza.visible = appear > 0.001
    pizza.rotation.y = p * 1.4

    // Pâton qui « respire », puis s'étale
    const breathe = 1 + Math.sin(time * 1.6) * 0.015 * (1 - flatten)
    const ballK = easeOutBack(appear)
    ball.visible = flatten < 0.92
    ball.scale.set(
      ballK * THREE.MathUtils.lerp(1, 2.05, flatten) * breathe,
      ballK * THREE.MathUtils.lerp(0.72, 0.06, flatten) * breathe,
      ballK * THREE.MathUtils.lerp(1, 2.05, flatten) * breathe,
    )
    ball.position.y = ball.scale.y * 0.5 * 0.92
    disc.visible = flatten > 0.25
    const discK = THREE.MathUtils.lerp(0.55, 1, smooth(clamp01((flatten - 0.25) / 0.75)))
    // Le cornicione gonfle à la cuisson
    const puff = 1 + bakeK * 0.22
    disc.scale.set(discK, discK * puff, discK)
    shadow.scale.setScalar(Math.max(0.35, appear * (0.45 + 0.55 * flatten)))
    ;(shadow.material as THREE.MeshBasicMaterial).opacity = 0.8 * appear

    sauce.visible = sauceK > 0.001
    sauce.scale.setScalar(sauceK)
    sauce.rotation.y = (1 - sauceK) * -2.5
    sauce.position.y = 0.054 * puff
    sauceMat.color.setRGB(1 - bakeK * 0.22, 1 - bakeK * 0.32, 1 - bakeK * 0.38)

    mozz.visible = p > 0.37
    for (let i = 0; i < MOZZ; i++) {
      const b = mozzBase[i]!
      const drop = clamp01((p - 0.38 - b.delay * 0.08) / 0.07)
      const fall = 1 - easeOutBack(drop)
      const melt = bakeK
      q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, b.ry)
      const shown = drop > 0 ? 1 : 0
      m.compose(
        v.set(b.x, 0.054 * puff + 0.022 - melt * 0.01 + fall * 0.9, b.z),
        q,
        s.set(b.sx * (1 + melt * 0.8) * shown, 0.045 * (1 - melt * 0.55) * shown, b.sz * (1 + melt * 0.8) * shown),
      )
      mozz.setMatrixAt(i, m)
      mozz.setColorAt(i, tint.copy(mozzRaw).lerp(mozzBaked, melt * (0.5 + 0.5 * (i % 3) / 2)))
    }
    mozz.instanceMatrix.needsUpdate = true
    if (mozz.instanceColor) mozz.instanceColor.needsUpdate = true

    basil.visible = basilK > 0
    for (let i = 0; i < BASIL; i++) {
      const b = basilBase[i]!
      const k = clamp01(basilK * 1.6 - i * 0.12)
      q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, b.ry + (1 - k) * 1.5)
      m.compose(v.set(b.x, 0.054 * puff + 0.03 + (1 - easeOutBack(k)) * 0.6, b.z), q, s.setScalar(b.k * (k > 0 ? 1 : 0)))
      basil.setMatrixAt(i, m)
    }
    s.set(1, 1, 1)
    basil.instanceMatrix.needsUpdate = true

    bake.value = bakeK
    pizzaLight.intensity = 2.2 * span(p, 0.1, 0.24) * (1 - 0.6 * span(p, 0.8, 1))
    return bakeK
  }

  function updateFire(time: number, dt: number, bakeK: number, p: number) {
    const flicker = 0.82 + 0.1 * Math.sin(time * 7.3) + 0.06 * Math.sin(time * 13.1 + 1) + 0.04 * Math.sin(time * 23.7 + 2)
    // Le feu est ravivé au moment de la cuisson
    const heat = 1 + 0.35 * Math.sin(Math.PI * clamp01((p - 0.52) / 0.32))
    flameTime.value = time
    flameHeat.value = heat * (0.92 + 0.08 * flicker)
    fireLight.intensity = 28 * flicker * heat
    mouthLight.intensity = 9 * (0.9 + 0.1 * flicker) * (1 - 0.6 * span(p, 0.12, 0.3))
    fireGlow.material.opacity = 0.75 * flicker * heat
    ;(bed.material as THREE.MeshBasicMaterial).opacity = 0.7 + 0.3 * flicker
    mouthGlow.material.opacity = 0.22 * (1 - span(p, 0.08, 0.22)) * flicker
    ;(coals.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2 + 0.25 * flicker * heat
    logMat.emissiveIntensity = 0.04 + 0.05 * flicker
    for (const f of flames) f.rotation.y = Math.atan2(camera.position.x - f.position.x, camera.position.z - f.position.z)

    // Braises
    for (let i = 0; i < EMBERS; i++) {
      life[i]! += dt
      if (life[i]! > maxLife[i]!) spawn(i, false)
      const j = i * 3
      ev[j]! += Math.sin(time * 2.1 + eseed[i]!) * 0.35 * dt
      let x = ep[j]! + ev[j]! * dt
      let y = ep[j + 1]! + ev[j + 1]! * dt
      const z = ep[j + 2]! + ev[j + 2]! * dt * (1 + bakeK * 0.2)
      // Sous la voûte, la braise glisse le long du plafond vers la bouche
      if (z < 0.6) {
        const ceiling = Math.sqrt(Math.max(0, VAULT_IN * VAULT_IN - x * x)) - 0.12
        if (y > ceiling) {
          y = ceiling
          ev[j + 2] = Math.max(ev[j + 2]!, 0.5)
          x *= 0.995
        }
      }
      ep[j] = x
      ep[j + 1] = y
      ep[j + 2] = z
      const lf = life[i]! / maxLife[i]!
      const glowK = Math.sin(Math.PI * Math.min(1, lf * 1.15)) * (0.6 + 0.4 * Math.sin(time * 9 + eseed[i]!))
      q.copy(camera.quaternion)
      m.compose(v.set(x, y, z), q, s.setScalar(esize[i]! * (0.7 + 0.6 * glowK) * 3))
      embers.setMatrixAt(i, m)
      embers.setColorAt(i, tint.copy(emberOcre).lerp(emberHot, 1 - lf).multiplyScalar(Math.max(0, glowK) * 1.6))
    }
    s.set(1, 1, 1)
    embers.instanceMatrix.needsUpdate = true
    if (embers.instanceColor) embers.instanceColor.needsUpdate = true
  }

  // ── Boucle ───────────────────────────────────────────────
  let raf = 0
  let running = false
  let ready = false
  let last = 0
  let time = 0

  function frame(now: number) {
    if (!running) return
    raf = requestAnimationFrame(frame)
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016)
    last = now
    time += dt
    progress += (target - progress) * (1 - Math.exp(-dt * 5))
    pointerSmooth.lerp(pointer, 1 - Math.exp(-dt * 3))
    updateCamera(progress)
    const bakeK = updatePizza(progress, time)
    updateFire(time, dt, bakeK, progress)
    renderer.render(scene, camera)
    if (!ready) {
      ready = true
      onReady?.()
    }
  }

  function onContextLost(e: Event) {
    e.preventDefault()
    stop()
    onLost?.()
  }
  canvas.addEventListener('webglcontextlost', onContextLost)

  function resize(w: number, h: number) {
    width = Math.max(1, w)
    height = Math.max(1, h)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.fov = camera.aspect < 0.8 ? 50 : camera.aspect < 1.2 ? 42 : 34
    shiftX = camera.aspect > 1.15 ? 0.3 : 0
    shiftY = camera.aspect < 0.8 ? 0.4 : camera.aspect < 1.15 ? 0.2 : 0
    if (!running) {
      updateCamera(progress)
      renderer.render(scene, camera)
    }
  }

  function start() {
    if (running) return
    running = true
    last = 0
    raf = requestAnimationFrame(frame)
  }

  function stop() {
    running = false
    cancelAnimationFrame(raf)
  }

  function dispose() {
    stop()
    canvas.removeEventListener('webglcontextlost', onContextLost)
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      mesh.geometry?.dispose()
      const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []
      for (const mat of mats) mat.dispose()
    })
    for (const tex of [mottle, facadeBricks, backBricks, sole, glow, softGlow, rawDough, bakedDough, sauceTex, contact]) tex.dispose()
    renderer.dispose()
  }

  return {
    setProgress: (p: number) => (target = clamp01(p)),
    setPointer: (x: number, y: number) => pointer.set(x, y),
    resize,
    start,
    stop,
    dispose,
  }
}
