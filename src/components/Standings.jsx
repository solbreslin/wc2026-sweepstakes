import { useEffect, useState } from 'react'
import { getMatches, getStandings } from '../api.js'
import { hasClinchedGroupQualification, TEAM_OWNER } from '../scoring.js'

function QualifiedStar({ show }) {
  if (!show) return null
  return (
    <span className="qualified-star" title="Qualified for the next round" aria-label="Qualified for the next round">
      ★
    </span>
  )
}

export default function Standings() {
  const [groups, setGroups] = useState(null)
  const [matches, setMatches] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getStandings(), getMatches()])
      .then(([standingsData, matchesData]) => {
        setGroups(standingsData.standings || [])
        setMatches(matchesData.matches || [])
      })
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="error">Couldn't load standings: {error}</div>
  if (!groups || !matches) return <p className="muted">Loading standings…</p>
  if (groups.length === 0) return <p className="muted">No standings published yet.</p>

  return (
    <section className="groups">
      {groups.map((g) => (
        <div key={g.group || g.stage} className="group">
          <h3>{(g.group || g.stage || '').replace('_', ' ')}</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Team</th>
                <th>P</th>
                <th>W</th>
                <th>D</th>
                <th>L</th>
                <th>GD</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {g.table.map((row) => {
                const owner = TEAM_OWNER[row.team.name]
                const isQualified = hasClinchedGroupQualification(row, g.table, matches)
                return (
                <tr key={row.team.id} className={owner ? 'owned-row' : ''}>
                  <td>{row.position}</td>
                  <td>
                    {owner ? (
                      <>
                        <strong>{owner}</strong>{' '}
                        <span className="muted small">{row.team.name}</span>
                        <QualifiedStar show={isQualified} />
                      </>
                    ) : (
                      <>
                        <span className="muted">{row.team.name}</span>
                        <QualifiedStar show={isQualified} />
                      </>
                    )}
                  </td>
                  <td>{row.playedGames}</td>
                  <td>{row.won}</td>
                  <td>{row.draw}</td>
                  <td>{row.lost}</td>
                  <td>{row.goalDifference}</td>
                  <td className="points">{row.points}</td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  )
}
