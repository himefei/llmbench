import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { ConsolePage } from './pages/ConsolePage'
import { useKonamiGate } from './hooks/useKonamiGate'

export default function App() {
  const location = useLocation()
  const { activated: konamiActivated } = useKonamiGate()

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
          {konamiActivated ? (
            <Link className={location.pathname === '/console' ? 'nav-link nav-link-secret active' : 'nav-link nav-link-secret'} to="/console">
              Console
            </Link>
          ) : null}
        </nav>
      </header>

      <main className="page-frame">
        <Routes>
          <Route path="/" element={<HomePage konamiActivated={konamiActivated} />} />
          <Route path="/console" element={konamiActivated ? <ConsolePage /> : <HiddenConsolePage />} />
        </Routes>
      </main>
    </div>
  )
}

function HiddenConsolePage() {
  return (
    <section className="console-locked-card">
      <div className="section-copy">
        <p className="eyebrow">Restricted route</p>
        <h1>Console access is hidden behind a local input sequence.</h1>
        <p>
          The first gate is client-side discovery. Once the sequence is accepted, the admin route becomes visible and the
          password form appears as the second gate.
        </p>
      </div>

      <div className="console-locked-panel">
        <span className="console-locked-led" />
        <strong>Awaiting unlock sequence</strong>
        <p>Input the owner sequence on this page to reveal the console entry.</p>
      </div>
    </section>
  )
}