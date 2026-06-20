import { useEffect, useState } from 'react'
import { getMatches } from '../api.js'
import { upcomingPoolMatches, TEAM_OWNER } from '../scoring.js'

const fmtDate = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

// Show a team as "Person · Team" when it belongs to someone in the pool,
// otherwise just the team name.
function Side({ name }) {
  const owner = TEAM_OWNER[name]
  return (
    <span className="side">
      {owner ? (
        <>
          <strong>{owner}</strong>{' '}
          <span className="muted small">{name}</span>
        </>
      ) : (
        <span className="muted">{name || 'TBD'}</span>
      )}
    </span>
  )
}

export default function Upcoming({ limit = 5 }) {
  const [matches, setMatches] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getMatches()
      .then((data) => setMatches(data.matches || []))
      .catch((e) => setError(e.message))
  }, [])

  if (error) return null // standings below will surface any API problem
  if (!matches) return null

  const next = upcomingPoolMatches(matches, limit)
  if (next.length === 0) return null

  return (
    <section className="upcoming">
      <h2>Coming up</h2>
      <ul className="fixtures">
        {next.map((m) => (
          <li key={m.id}>
            <span className="when muted">{fmtDate(m.utcDate)}</span>
            <Side name={m.homeTeam.name} />
            <span className="vs">v</span>
            <Side name={m.awayTeam.name} />
          </li>
        ))}
      </ul>
    </section>
  )
}
