import Upcoming from './components/Upcoming.jsx'
import TeamStatuses from './components/TeamStatuses.jsx'

export default function App() {
  return (
    <div className="app">
      <header>
        <h1>🏆 World Cup 2026 Sweepstakes</h1>
      </header>
      <main>
        <Upcoming />
        <TeamStatuses />
      </main>
    </div>
  )
}
