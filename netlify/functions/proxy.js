// Production proxy to football-data.org.
//
// In dev, Vite's proxy (vite.config.js) handles /api and injects the token.
// In production there's no Vite, so this Netlify Function does the same job:
// it forwards /api/* requests to the API with the token pulled from the
// FOOTBALL_DATA_TOKEN environment variable (set in the Netlify dashboard or
// via `netlify env:set`). The token never reaches the browser.

export default async (req) => {
  const url = new URL(req.url)
  // Strip the function mount path to recover the real API path, e.g.
  // /.netlify/functions/proxy/v4/competitions/WC/matches -> /v4/competitions/WC/matches
  const path = url.pathname.replace('/.netlify/functions/proxy', '')
  const target = `https://api.football-data.org${path}${url.search}`

  const token = process.env.FOOTBALL_DATA_TOKEN
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'FOOTBALL_DATA_TOKEN is not set on the server' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }

  const upstream = await fetch(target, { headers: { 'X-Auth-Token': token } })
  const body = await upstream.text()

  return new Response(body, {
    status: upstream.status,
    headers: {
      'content-type': 'application/json',
      // Cache at the CDN for a minute to stay under the free tier's
      // 10 requests/minute limit when several people view the dashboard.
      'cache-control': 'public, max-age=60, s-maxage=60',
    },
  })
}
