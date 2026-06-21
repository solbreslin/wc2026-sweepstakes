import { PARTICIPANTS, SCORING } from './sweepstake.js'

// teamName -> participant name, for tagging matches/teams with their owner.
export const TEAM_OWNER = Object.fromEntries(
  PARTICIPANTS.flatMap((p) => p.teams.map((t) => [t, p.name]))
)

// All teams that belong to someone in the pool.
const POOL_TEAMS = new Set(Object.keys(TEAM_OWNER))

const LIVE_MATCH_STATUSES = new Set(['IN_PLAY', 'PAUSED', 'LIVE'])

export function hasClinchedGroupQualification(row, table = []) {
  const groupGames = Math.max(0, table.length - 1)
  const rowPoints = row.points ?? 0

  const teamsThatCanCatchOrPass = table.filter((other) => {
    if (other.team.id === row.team.id) return false
    const remainingGames = Math.max(0, groupGames - (other.playedGames ?? 0))
    const maxPoints = (other.points ?? 0) + remainingGames * 3
    return maxPoints >= rowPoints
  })

  return teamsThatCanCatchOrPass.length <= 1
}

// Upcoming matches involving at least one pool team, soonest first.
export function upcomingPoolMatches(matches = [], limit = 8) {
  const now = Date.now()
  return matches
    .filter((m) => {
      const kickoff = new Date(m.utcDate).getTime()
      const isLive = LIVE_MATCH_STATUSES.has(m.status)
      return (
        (kickoff >= now || isLive) &&
        m.status !== 'FINISHED' &&
        (POOL_TEAMS.has(m.homeTeam.name) || POOL_TEAMS.has(m.awayTeam.name))
      )
    })
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
    .slice(0, limit)
}

// Build a map of teamName -> { played, won, drawn, lost, goalsFor, points }
// from the list of matches. Only FINISHED matches count.
export function computeTeamStats(matches = []) {
  const stats = {}

  const ensure = (name) => {
    if (!stats[name]) {
      stats[name] = {
        name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        points: 0,
      }
    }
    return stats[name]
  }

  for (const m of matches) {
    if (m.status !== 'FINISHED') continue
    const home = ensure(m.homeTeam.name)
    const away = ensure(m.awayTeam.name)
    const hg = m.score.fullTime.home ?? 0
    const ag = m.score.fullTime.away ?? 0

    home.played++
    away.played++
    home.goalsFor += hg
    away.goalsFor += ag

    if (m.score.winner === 'HOME_TEAM') {
      home.won++
      away.lost++
    } else if (m.score.winner === 'AWAY_TEAM') {
      away.won++
      home.lost++
    } else {
      home.drawn++
      away.drawn++
    }
  }

  for (const t of Object.values(stats)) {
    t.points =
      t.won * SCORING.win +
      t.drawn * SCORING.draw +
      t.goalsFor * SCORING.goal
  }

  return stats
}

// Aggregate team stats into a participant leaderboard, sorted by points.
export function computeLeaderboard(matches = []) {
  const stats = computeTeamStats(matches)

  return PARTICIPANTS.map((p) => {
    const teams = p.teams.map((name) => stats[name] || { name, points: 0, played: 0, goalsFor: 0 })
    const points = teams.reduce((sum, t) => sum + t.points, 0)
    const goalsFor = teams.reduce((sum, t) => sum + t.goalsFor, 0)
    return { name: p.name, points, goalsFor, teams }
  }).sort((a, b) => b.points - a.points || b.goalsFor - a.goalsFor)
}
