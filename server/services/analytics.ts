/**
 * Résumé d'audience. Branché sur l'API PostHog si NUXT_POSTHOG_PERSONAL_API_KEY
 * et NUXT_POSTHOG_PROJECT_ID sont définis, sinon données de démonstration
 * clairement marquées comme telles.
 */
export interface AnalyticsSummary {
  source: 'posthog' | 'demo'
  days: number
  pageviews: number
  visitors: number
  callClicks: number
  menuViews: number
  topPages: { path: string, views: number }[]
  daily: { date: string, pageviews: number, callClicks: number }[]
}

export async function analyticsSummary(days = 7): Promise<AnalyticsSummary> {
  const config = useRuntimeConfig()
  const { personalApiKey, projectId, host } = config.posthog
  if (personalApiKey && projectId) {
    try {
      return await fromPosthog(host, projectId, personalApiKey, days)
    }
    catch (error) {
      console.error('[analytics] PostHog indisponible, données de démo', error)
    }
  }
  return demo(days)
}

async function hogql<T>(host: string, projectId: string, key: string, query: string): Promise<T[][]> {
  const res = await $fetch<{ results: T[][] }>(`${host}/api/projects/${projectId}/query/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: { query: { kind: 'HogQLQuery', query } },
  })
  return res.results
}

async function fromPosthog(host: string, projectId: string, key: string, days: number): Promise<AnalyticsSummary> {
  const since = `now() - interval ${days} day`
  const [totals, top, daily] = await Promise.all([
    hogql<number>(host, projectId, key, `select countIf(event = '$pageview'), count(distinct if(event = '$pageview', distinct_id, null)), countIf(event = 'call_clicked'), countIf(event = '$pageview' and properties.$pathname like '%/la-carte%') from events where timestamp > ${since}`),
    hogql<string | number>(host, projectId, key, `select properties.$pathname as path, count() as views from events where event = '$pageview' and timestamp > ${since} group by path order by views desc limit 6`),
    hogql<string | number>(host, projectId, key, `select toDate(timestamp) as d, countIf(event = '$pageview'), countIf(event = 'call_clicked') from events where timestamp > ${since} group by d order by d`),
  ])
  const [pageviews = 0, visitors = 0, callClicks = 0, menuViews = 0] = totals[0] ?? []
  return {
    source: 'posthog',
    days,
    pageviews,
    visitors,
    callClicks,
    menuViews,
    topPages: top.map(([path, views]) => ({ path: String(path), views: Number(views) })),
    daily: daily.map(([date, pv, calls]) => ({ date: String(date), pageviews: Number(pv), callClicks: Number(calls) })),
  }
}

function demo(days: number): AnalyticsSummary {
  const daily = Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86_400_000)
    const weekend = [0, 5, 6].includes(d.getDay())
    return { date: d.toISOString().slice(0, 10), pageviews: weekend ? 140 + i * 3 : 70 + i * 2, callClicks: weekend ? 18 : 7 }
  })
  const pageviews = daily.reduce((n, d) => n + d.pageviews, 0)
  return {
    source: 'demo',
    days,
    pageviews,
    visitors: Math.round(pageviews * 0.62),
    callClicks: daily.reduce((n, d) => n + d.callClicks, 0),
    menuViews: Math.round(pageviews * 0.41),
    topPages: [
      { path: '/', views: Math.round(pageviews * 0.45) },
      { path: '/la-carte', views: Math.round(pageviews * 0.33) },
      { path: '/nous-trouver', views: Math.round(pageviews * 0.17) },
    ],
    daily,
  }
}
