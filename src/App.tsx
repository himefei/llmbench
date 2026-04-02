import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { ConsolePage } from './pages/ConsolePage'

export default function App() {
  const location = useLocation()

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="site-header">
        <Link className="brand" to="/">
          <span className="brand-mark">LB</span>
          <span>
            <strong>LLM Bench Atlas</strong>
            <small>Cloudflare-ready evaluation board</small>
          </span>
        </Link>
        <nav className="site-nav">
          <Link className={location.pathname === '/' ? 'nav-link active' : 'nav-link'} to="/">
            Leaderboard
          </Link>
          <Link className={location.pathname === '/console' ? 'nav-link active' : 'nav-link'} to="/console">
            Console
          </Link>
        </nav>
      </header>

      <main className="page-frame">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/console" element={<ConsolePage />} />
        </Routes>
      </main>
    </div>
  )
}