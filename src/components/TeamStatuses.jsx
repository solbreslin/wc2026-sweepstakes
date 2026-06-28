import { useEffect, useState } from 'react'
import { getMatches, getStandings } from '../api.js'
import { participantTeamProgress } from '../scoring.js'

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

function Crest({ team }) {
  if (team.crest) {
    return <img className="team-crest" src={team.crest} alt="" loading="lazy" />
  }

  return <span className="team-crest team-crest-fallback">{team.tla || team.team.slice(0, 3)}</span>
}

function TeamStatus({ team }) {
  const date = fmtDate(team.date)

  return (
    <li className={`team-status team-status-${team.state}`}>
      <Crest team={team} />
      <div className="team-status-main">
        <div className="team-status-topline">
          <span className="team-status-name">{team.team}</span>
          <span className="team-status-badge">{team.label}</span>
        </div>
        <div className="team-status-detail">{team.detail}</div>
        {(team.secondary || date) && (
          <div className="team-status-meta muted">{team.secondary || date}</div>
        )}
      </div>
    </li>
  )
}

export default function TeamStatuses() {
  const [participants, setParticipants] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getMatches(), getStandings()])
      .then(([matchesData, standingsData]) => {
        setParticipants(
          participantTeamProgress(matchesData.matches || [], standingsData.standings || [])
        )
      })
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="error">Couldn't load team statuses: {error}</div>
  if (!participants) return <p className="muted">Loading team statuses...</p>

  const teams = participants.flatMap((participant) => participant.teams)
  const through = teams.filter((team) => team.state === 'through' || team.state === 'live').length
  const out = teams.filter((team) => team.state === 'out').length

  return (
    <section className="team-statuses">
      <div className="section-heading">
        <h2>Team status</h2>
        <div className="status-summary" aria-label={`${through} through, ${out} out`}>
          <span className="summary-pill summary-through">{through} through</span>
          <span className="summary-pill summary-out">{out} out</span>
        </div>
      </div>
      <div className="participant-grid">
        {participants.map((participant) => (
          <article key={participant.name} className="participant-status">
            <h3>{participant.name}</h3>
            <ul>
              {participant.teams.map((team) => (
                <TeamStatus key={team.team} team={team} />
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
