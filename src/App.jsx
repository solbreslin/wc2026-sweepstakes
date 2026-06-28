import Upcoming from './components/Upcoming.jsx'
import TeamStatuses from './components/TeamStatuses.jsx'

export default function App() {
  return (
    <div className="app">
      <header>
        <h1>🏆 World Cup 2026 Sweepstakes</h1>
        <p className="muted">Knockout status for every drawn team.</p>
      </header>
      <main>
        <Upcoming />
        <TeamStatuses />
      </main>
    </div>
  )
}
