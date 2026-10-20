import type { InternalApi } from 'nitropack/types'
import type { PrintModel, PrintOptions } from '~~/shared/domain/print'

/** Données d'un document imprimable, telles que renvoyées par /api/print/<modele> */
export type PrintPayload = InternalApi['/api/print/:modele']['get']
export type PrintPayloadOf<M extends PrintModel> = Extract<PrintPayload, { model: M }>

export interface PrintProps<M extends PrintModel> {
  data: PrintPayloadOf<M>
  text: PrintText
  options: PrintOptions
}
