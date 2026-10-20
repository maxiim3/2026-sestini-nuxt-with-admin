import { isPrintModel, modelParams } from '../../../shared/domain/print'
import { loadPrintData } from '../../services/print'

/** Données publiques d'un document imprimable (lecture seule) */
export default defineEventHandler(async (event) => {
  const model = getRouterParam(event, 'modele')
  if (!isPrintModel(model)) throw createError({ statusCode: 404, statusMessage: 'Modèle d\'impression inconnu' })
  const params = modelParams(model, getQuery(event))
  setResponseHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=600')
  setResponseHeader(event, 'X-Robots-Tag', 'noindex')
  return loadPrintData(await readyDb(), model, params)
})
