import Upcoming from './components/Upcoming.jsx'
import Standings from './components/Standings.jsx'

export default function App() {
  return (
    <div className="app">
      <header>
        <h1>🏆 World Cup 2026 Sweepstakes</h1>
        <p className="muted">Group standings — names show who drew each team.</p>
      </header>
      <main>
        <Upcoming />
        <Standings />
      </main>
    </div>
  )
}
