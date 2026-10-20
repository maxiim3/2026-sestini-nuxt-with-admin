<script setup lang="ts">
import { createOvenScene, type OvenScene } from './oven-scene'

/** Canvas WebGL de la scène du four, chargé en différé par LandingFour */
const props = defineProps<{ progress: number }>()
const emit = defineEmits<{ ready: [], lost: [] }>()

const canvas = ref<HTMLCanvasElement | null>(null)
let scene: OvenScene | null = null
let resizeObserver: ResizeObserver | null = null
let intersection: IntersectionObserver | null = null
let visible = true

function sync() {
  if (!scene) return
  if (visible && document.visibilityState === 'visible') scene.start()
  else scene.stop()
}

function onPointer(e: PointerEvent) {
  scene?.setPointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1))
}

onMounted(() => {
  const el = canvas.value
  if (!el) return
  try {
    scene = createOvenScene({ canvas: el, onReady: () => emit('ready'), onLost: () => emit('lost') })
  }
  catch {
    emit('lost')
    return
  }
  scene.setProgress(props.progress)
  const box = el.parentElement ?? el
  scene.resize(box.clientWidth, box.clientHeight)
  resizeObserver = new ResizeObserver(([entry]) => {
    if (entry) scene?.resize(entry.contentRect.width, entry.contentRect.height)
  })
  resizeObserver.observe(box)
  // Rendu en pause dès que la scène sort de l'écran
  intersection = new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting)
    sync()
  })
  intersection.observe(el)
  document.addEventListener('visibilitychange', sync)
  if (window.matchMedia('(pointer: fine)').matches) window.addEventListener('pointermove', onPointer, { passive: true })
  sync()
})

watch(() => props.progress, p => scene?.setProgress(p))

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  intersection?.disconnect()
  document.removeEventListener('visibilitychange', sync)
  window.removeEventListener('pointermove', onPointer)
  scene?.dispose()
  scene = null
})
</script>

<template>
  <canvas
    ref="canvas"
    class="block size-full"
    aria-hidden="true"
  />
</template>
