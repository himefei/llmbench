import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { ConsolePage } from './pages/ConsolePage'
import { useKonamiGate } from './hooks/useKonamiGate'
import { useLanguage } from './lib/language'

export default function App() {
  const location = useLocation()
  const { activated: konamiActivated } = useKonamiGate()
  const { language, toggleLanguage } = useLanguage()

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="site-header">
        <Link className="brand" to="/">
          <span className="brand-mark">LB</span>
          <span>
            <strong>LLM Bench Atlas</strong>
            <small>{language === 'zh' ? '适用于 Cloudflare 的大模型评测榜单' : 'Cloudflare-ready evaluation board'}</small>
          </span>
        </Link>
        <div className="site-header__actions">
          <nav className="site-nav">
          <Link className={location.pathname === '/' ? 'nav-link active' : 'nav-link'} to="/">
            {language === 'zh' ? '榜单' : 'Leaderboard'}
          </Link>
          {konamiActivated ? (
            <Link className={location.pathname === '/console' ? 'nav-link nav-link-secret active' : 'nav-link nav-link-secret'} to="/console">
              {language === 'zh' ? '控制台' : 'Console'}
            </Link>
          ) : null}
          </nav>
          <button className="language-toggle" onClick={toggleLanguage} type="button">
            {language === 'zh' ? 'EN' : '中文'}
          </button>
        </div>
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
  const { language } = useLanguage()

  return (
    <section className="console-locked-card">
      <div className="section-copy">
        <p className="eyebrow">{language === 'zh' ? '受限路由' : 'Restricted route'}</p>
        <h1>
          {language === 'zh'
            ? '控制台入口默认隐藏，需要本地输入序列先解锁。'
            : 'Console access is hidden behind a local input sequence.'}
        </h1>
        <p>
          {language === 'zh'
            ? '第一层是前端本地发现机制，序列输入成功后才会显示控制台入口；第二层仍然是服务端密码校验。'
            : 'The first gate is client-side discovery. Once the sequence is accepted, the admin route becomes visible and the password form appears as the second gate.'}
        </p>
      </div>

      <div className="console-locked-panel">
        <span className="console-locked-led" />
        <strong>{language === 'zh' ? '等待输入解锁序列' : 'Awaiting unlock sequence'}</strong>
        <p>{language === 'zh' ? '在当前页面输入拥有者序列后才会显示控制台入口。' : 'Input the owner sequence on this page to reveal the console entry.'}</p>
      </div>
    </section>
  )
}