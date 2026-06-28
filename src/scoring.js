import { PARTICIPANTS, SCORING } from './sweepstake.js'

// teamName -> participant name, for tagging matches/teams with their owner.
export const TEAM_OWNER = Object.fromEntries(
  PARTICIPANTS.flatMap((p) => p.teams.map((t) => [t, p.name]))
)

// All teams that belong to someone in the pool.
const POOL_TEAMS = new Set(Object.keys(TEAM_OWNER))

const LIVE_MATCH_STATUSES = new Set(['IN_PLAY', 'PAUSED', 'LIVE'])
const GROUP_QUALIFYING_PLACES = 2
const FINISHED_MATCH_STATUSES = new Set(['FINISHED', 'AWARDED'])
const UPCOMING_MATCH_STATUSES = new Set(['SCHEDULED', 'TIMED', 'POSTPONED', 'SUSPENDED'])

const STAGE_LABELS = {
  LAST_32: 'Last 32',
  LAST_16: 'Last 16',
  QUARTER_FINALS: 'Quarter-final',
  SEMI_FINALS: 'Semi-final',
  THIRD_PLACE: 'Third place',
  FINAL: 'Final',
}

const teamKey = (team = {}) => team.id ?? team.name

const sameTeam = (a = {}, b = {}) =>
  (a.id != null && b.id != null && a.id === b.id) || (a.name && b.name && a.name === b.name)

const isKnockoutMatch = (match) => match.stage && match.stage !== 'GROUP_STAGE'

const stageLabel = (stage) => STAGE_LABELS[stage] || (stage || '').replaceAll('_', ' ')

const ordinal = (value) => {
  const suffix = value === 1 ? 'st' : value === 2 ? 'nd' : value === 3 ? 'rd' : 'th'
  return `${value}${suffix}`
}

const matchHasTeam = (match, teamName) =>
  match.homeTeam?.name === teamName || match.awayTeam?.name === teamName

const opponentName = (match, teamName) => {
  if (match.homeTeam?.name === teamName) return match.awayTeam?.name || 'TBD'
  if (match.awayTeam?.name === teamName) return match.homeTeam?.name || 'TBD'
  return 'TBD'
}

const teamWonMatch = (match, teamName) => {
  if (match.score?.winner === 'HOME_TEAM') return match.homeTeam?.name === teamName
  if (match.score?.winner === 'AWAY_TEAM') return match.awayTeam?.name === teamName
  return false
}

const scoreLine = (match) => {
  const home = match.homeTeam?.shortName || match.homeTeam?.name || 'TBD'
  const away = match.awayTeam?.shortName || match.awayTeam?.name || 'TBD'
  const homeScore = match.score?.fullTime?.home
  const awayScore = match.score?.fullTime?.away
  if (homeScore == null || awayScore == null) return null
  return `${home} ${homeScore}-${awayScore} ${away}`
}

function groupRowsByTeam(standings = []) {
  const rows = new Map()

  for (const group of standings) {
    const groupComplete = group.table.every(
      (row) => row.playedGames >= Math.max(0, group.table.length - 1)
    )

    for (const row of group.table) {
      rows.set(row.team.name, {
        ...row,
        group: group.group,
        groupComplete,
      })
    }
  }

  return rows
}

export function hasClinchedGroupQualification(row, table = [], matches = []) {
  if (
    row.position <= GROUP_QUALIFYING_PLACES &&
    table.every((teamRow) => teamRow.playedGames === table.length - 1)
  ) {
    return true
  }

  const rowKey = teamKey(row.team)
  const findGroupTeamKey = (team) => {
    const groupRow = table.find((teamRow) => sameTeam(team, teamRow.team))
    return groupRow ? teamKey(groupRow.team) : null
  }
  const remainingGroupMatches = matches.filter((match) => {
    if (match.status === 'FINISHED') return false
    return findGroupTeamKey(match.homeTeam) && findGroupTeamKey(match.awayTeam)
  })

  const canStillMissOut = (matchIndex, pointsByTeam) => {
    if (matchIndex === remainingGroupMatches.length) {
      const rowPoints = pointsByTeam.get(rowKey) ?? 0
      const teamsLevelOrAbove = [...pointsByTeam.entries()].filter(
        ([key, points]) => key !== rowKey && points >= rowPoints
      )
      return teamsLevelOrAbove.length >= GROUP_QUALIFYING_PLACES
    }

    const match = remainingGroupMatches[matchIndex]
    const homeKey = findGroupTeamKey(match.homeTeam)
    const awayKey = findGroupTeamKey(match.awayTeam)
    const outcomes = [
      [homeKey, 3, awayKey, 0],
      [homeKey, 1, awayKey, 1],
      [homeKey, 0, awayKey, 3],
    ]

    return outcomes.some(([firstKey, firstPoints, secondKey, secondPoints]) => {
      const nextPoints = new Map(pointsByTeam)
      nextPoints.set(firstKey, (nextPoints.get(firstKey) ?? 0) + firstPoints)
      nextPoints.set(secondKey, (nextPoints.get(secondKey) ?? 0) + secondPoints)
      return canStillMissOut(matchIndex + 1, nextPoints)
    })
  }

  const startingPoints = new Map(table.map((teamRow) => [teamKey(teamRow.team), teamRow.points ?? 0]))
  return !canStillMissOut(0, startingPoints)
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

export function teamProgress(teamName, matches = [], standings = []) {
  const groupRows = groupRowsByTeam(standings)
  const groupRow = groupRows.get(teamName)
  const knockoutMatches = matches
    .filter((match) => isKnockoutMatch(match) && matchHasTeam(match, teamName))
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
  const nextKnockoutMatch = knockoutMatches.find(
    (match) => LIVE_MATCH_STATUSES.has(match.status) || UPCOMING_MATCH_STATUSES.has(match.status)
  )

  if (nextKnockoutMatch) {
    return {
      team: teamName,
      state: LIVE_MATCH_STATUSES.has(nextKnockoutMatch.status) ? 'live' : 'through',
      label: LIVE_MATCH_STATUSES.has(nextKnockoutMatch.status) ? 'Live' : 'Through',
      detail: `${stageLabel(nextKnockoutMatch.stage)} vs ${opponentName(nextKnockoutMatch, teamName)}`,
      date: nextKnockoutMatch.utcDate,
      stage: nextKnockoutMatch.stage,
      crest: nextKnockoutMatch.homeTeam?.name === teamName
        ? nextKnockoutMatch.homeTeam.crest
        : nextKnockoutMatch.awayTeam?.crest,
      tla: nextKnockoutMatch.homeTeam?.name === teamName
        ? nextKnockoutMatch.homeTeam.tla
        : nextKnockoutMatch.awayTeam?.tla,
    }
  }

  const lastFinishedKnockoutMatch = [...knockoutMatches]
    .reverse()
    .find((match) => FINISHED_MATCH_STATUSES.has(match.status))

  if (lastFinishedKnockoutMatch) {
    const won = teamWonMatch(lastFinishedKnockoutMatch, teamName)
    const line = scoreLine(lastFinishedKnockoutMatch)
    return {
      team: teamName,
      state: won ? 'through' : 'out',
      label: won && lastFinishedKnockoutMatch.stage === 'FINAL' ? 'Winner' : won ? 'Through' : 'Out',
      detail: won
        ? `Won ${stageLabel(lastFinishedKnockoutMatch.stage)}`
        : `Out in ${stageLabel(lastFinishedKnockoutMatch.stage)}`,
      secondary: line,
      date: lastFinishedKnockoutMatch.utcDate,
      stage: lastFinishedKnockoutMatch.stage,
      crest: lastFinishedKnockoutMatch.homeTeam?.name === teamName
        ? lastFinishedKnockoutMatch.homeTeam.crest
        : lastFinishedKnockoutMatch.awayTeam?.crest,
      tla: lastFinishedKnockoutMatch.homeTeam?.name === teamName
        ? lastFinishedKnockoutMatch.homeTeam.tla
        : lastFinishedKnockoutMatch.awayTeam?.tla,
    }
  }

  if (groupRow) {
    const groupDetail = `${groupRow.group}, ${ordinal(groupRow.position)} (${groupRow.points} pts)`

    if (groupRow.groupComplete) {
      if (groupRow.position <= GROUP_QUALIFYING_PLACES) {
        return {
          team: teamName,
          state: 'through',
          label: 'Through',
          detail: 'Qualified from group',
          secondary: groupDetail,
          group: groupRow.group,
          position: groupRow.position,
          crest: groupRow.team.crest,
          tla: groupRow.team.tla,
        }
      }

      return {
        team: teamName,
        state: 'out',
        label: 'Out',
        detail: 'Out after group stage',
        secondary: groupDetail,
        group: groupRow.group,
        position: groupRow.position,
        crest: groupRow.team.crest,
        tla: groupRow.team.tla,
      }
    }

    const table = [...groupRows.values()].filter((row) => row.group === groupRow.group)

    if (hasClinchedGroupQualification(groupRow, table, matches)) {
      return {
        team: teamName,
        state: 'through',
        label: 'Through',
        detail: 'Qualified from group',
        secondary: groupDetail,
        group: groupRow.group,
        position: groupRow.position,
        crest: groupRow.team.crest,
        tla: groupRow.team.tla,
      }
    }

    return {
      team: teamName,
      state: 'pending',
      label: 'Playing',
      detail: 'Group stage',
      secondary: groupDetail,
      group: groupRow.group,
      position: groupRow.position,
      crest: groupRow.team.crest,
      tla: groupRow.team.tla,
    }
  }

  return {
    team: teamName,
    state: 'unknown',
    label: 'Unknown',
    detail: 'No API data yet',
  }
}

export function participantTeamProgress(matches = [], standings = []) {
  return PARTICIPANTS.map((participant) => ({
    name: participant.name,
    teams: participant.teams.map((team) => teamProgress(team, matches, standings)),
  }))
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
