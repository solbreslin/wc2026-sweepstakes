// Thin wrapper around the football-data.org v4 API.
// Calls go through the Vite dev proxy (/api -> api.football-data.org)
// which injects the X-Auth-Token header. See vite.config.js.
//
// World Cup competition code is "WC". Free tier allows 10 calls/min,
// so fetch sparingly and lean on the in-memory cache below.

const BASE = '/api/v4'
const COMP = 'WC'

const cache = new Map()

async function get(path) {
  if (cache.has(path)) return cache.get(path)

  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${body || res.statusText}`)
  }
  const data = await res.json()
  cache.set(path, data)
  return data
}

export function getMatches() {
  return get(`/competitions/${COMP}/matches`)
}

export function getStandings() {
  return get(`/competitions/${COMP}/standings`)
}

export function getTeams() {
  return get(`/competitions/${COMP}/teams`)
}
