import { z } from 'zod'
import { LOCALES } from '../../../shared/domain/constants'
import {
  COMMON_PRINT_PARAMS,
  PRINT_FORMATS,
  PRINT_MODEL_SPECS,
  PRINT_MODELS,
  PRINT_ORIENTATIONS,
  PRINT_THEMES,
  printPath,
} from '../../../shared/domain/print'

const PDF_HOWTO = [
  'La page est au format exact (@page) : un navigateur headless produit le PDF tel quel,',
  'par ex. Playwright : await page.emulateMedia({ media: \'print\' }); await page.goto(url);',
  'await page.waitForSelector(\'[data-print-ready="1"]\');',
  'await page.pdf({ path, preferCSSPageSize: true, printBackground: true }).',
  'Un humain ouvre l\'URL et clique « Imprimer / Enregistrer en PDF ».',
].join(' ')

export default defineMcpTool({
  name: 'get_print_document',
  description: [
    'Atelier d\'impression : renvoie l\'URL d\'un document imprimable (PDF A5/A4/A3) généré à partir des données réelles du site :',
    'la carte complète (carte), un flyer de la pizza du moment (pizza-du-moment), une affiche de fermeture ou de congés (fermeture),',
    'une annonce d\'événement (evenement), la tournée de la semaine (semaine).',
    'Appelé sans « model », liste les modèles et leurs paramètres. Thème « clair » (défaut) = fond farine, économe en encre ;',
    '« sombre » = fond charbon pour un affichage. Pour une fermeture, crée d\'abord l\'exception avec add_schedule_exception',
    '(ou passe from/to) ; l\'ID d\'une exception ou d\'un message se lit avec get_schedule / list_modal_messages.',
    'L\'outil ne fabrique pas le PDF : il donne l\'URL et la marche à suivre.',
  ].join(' '),
  inputSchema: {
    model: z.enum(PRINT_MODELS).optional().describe('Modèle de document. Omettre pour lister les modèles.'),
    format: z.enum(PRINT_FORMATS).optional().describe('A5 (flyer), A4, A3 (affiche). Défaut selon le modèle.'),
    orientation: z.enum(PRINT_ORIENTATIONS).optional().describe('portrait (défaut) ou landscape'),
    theme: z.enum(PRINT_THEMES).optional().describe('clair (défaut, économe en encre) ou sombre'),
    lang: z.enum(LOCALES).optional().describe('Langue du document (défaut fr)'),
    params: z.record(z.string(), z.string()).optional().describe('Paramètres propres au modèle, ex. { exception: "<id>" } ou { from: "2026-11-02", to: "2026-11-10", message: "<id>" }'),
  },
  annotations: { readOnlyHint: true },
  handler: async input => mcpCall('get_print_document', input, 'read', async () => {
    const origin = getRequestURL(useEvent()).origin
    if (!input.model) {
      return {
        models: Object.values(PRINT_MODEL_SPECS).map(spec => ({
          model: spec.model,
          label: spec.label,
          description: spec.description,
          formats: spec.formats,
          defaultFormat: spec.defaultFormat,
          params: spec.params,
          exampleUrl: `${origin}${printPath(spec.model)}`,
        })),
        commonParams: COMMON_PRINT_PARAMS,
        pdf: PDF_HOWTO,
      }
    }

    const spec = PRINT_MODEL_SPECS[input.model]
    const allowed = new Set(spec.params.map(p => p.name))
    const unknown = Object.keys(input.params ?? {}).filter(k => !allowed.has(k))
    if (unknown.length) throw new Error(`Paramètres inconnus pour « ${spec.model} » : ${unknown.join(', ')}. Attendus : ${[...allowed].join(', ')}`)

    const path = printPath(spec.model, {
      format: input.format,
      orientation: input.orientation,
      theme: input.theme,
      lang: input.lang,
      ...input.params,
    })
    return {
      model: spec.model,
      label: spec.label,
      url: `${origin}${path}`,
      dataUrl: `${origin}${path.replace('/print/', '/api/print/')}`,
      format: input.format ?? spec.defaultFormat,
      note: input.format && !spec.formats.includes(input.format)
        ? `Format inhabituel pour ce modèle (conseillés : ${spec.formats.join(', ')}).`
        : undefined,
      pdf: PDF_HOWTO,
      adminUrl: `${origin}/atelier/impression`,
    }
  }),
})
