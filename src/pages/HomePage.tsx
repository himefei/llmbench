import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BENCHMARKS } from '../../shared/benchmarks'
import type { LeaderboardResponse } from '../../shared/types'
import { BenchmarkCard } from '../components/BenchmarkCard'
import { ModelMatrix } from '../components/ModelMatrix'
import { fetchLeaderboard } from '../lib/api'
import { formatScore, formatTimestamp, getInitials } from '../lib/leaderboard'

interface HomePageProps {
  konamiActivated: boolean
}

export function HomePage({ konamiActivated }: HomePageProps) {
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setIsLoading(true)
        const leaderboard = await fetchLeaderboard()
        if (!cancelled) {
          setData(leaderboard)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load leaderboard')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const topThree = useMemo(() => data?.models.slice(0, 3) ?? [], [data])
  const leadingModel = topThree[0] ?? null

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div className="hero-card__copy">
          <p className="eyebrow">Benchmark-driven model tracking</p>
          <h1>One polished board for your LLM eval scores.</h1>
          <p className="hero-text">
            Track MMLU, HellaSwag, TruthfulQA, ARC Challenge, GSM8K, HumanEval, MBPP, and LiveCodeBench in a single
            Cloudflare Pages deployment with a private admin console.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#benchmarks">
              View benchmarks
            </a>
            {konamiActivated ? (
              <Link className="button button-secondary button-arcade" to="/console">
                Console unlocked
              </Link>
            ) : (
              <div className="secret-access-chip">Hidden admin access enabled by local sequence input.</div>
            )}
          </div>
        </div>

        <aside className="hero-card__panel">
          <div className="stat-grid">
            <div className="stat-tile">
              <span>Total models</span>
              <strong>{data?.totalModels ?? 0}</strong>
            </div>
            <div className="stat-tile">
              <span>Benchmarks</span>
              <strong>{BENCHMARKS.length}</strong>
            </div>
            <div className="stat-tile stat-tile--wide">
              <span>Last update</span>
              <strong>{formatTimestamp(data?.updatedAt ?? null)}</strong>
            </div>
          </div>

          {leadingModel ? (
            <div className="top-model-card">
              <p className="eyebrow">Current leader</p>
              <div className="top-model-row">
                <span className="avatar hero-avatar" style={{ background: leadingModel.color }}>
                  {leadingModel.logoUrl ? <img alt="" src={leadingModel.logoUrl} /> : getInitials(leadingModel.name)}
                </span>
                <div>
                  <h3>{leadingModel.name}</h3>
                  <p>{leadingModel.provider || 'Private benchmark entry'}</p>
                </div>
              </div>
              <div className="top-model-metrics">
                <div>
                  <span>Overall</span>
                  <strong>{formatScore(leadingModel.overall)}</strong>
                </div>
                <div>
                  <span>Notes</span>
                  <strong>{leadingModel.notes || 'No notes yet'}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-panel compact">
              This leaderboard is ready, but no models have been entered yet.
            </div>
          )}
        </aside>
      </section>

      {error ? <div className="status-banner error">{error}</div> : null}
      {isLoading ? <div className="status-banner">Loading leaderboard...</div> : null}

      {topThree.length > 0 ? (
        <section className="spotlight-grid">
          {topThree.map((model, index) => (
            <article className="spotlight-card" key={model.id} style={{ '--card-accent': model.color } as React.CSSProperties}>
              <span className="spotlight-rank">0{index + 1}</span>
              <div className="table-model">
                <span className="avatar" style={{ background: model.color }}>
                  {model.logoUrl ? <img alt="" src={model.logoUrl} /> : getInitials(model.name)}
                </span>
                <div>
                  <strong>{model.name}</strong>
                  <small>{model.provider || 'Private benchmark entry'}</small>
                </div>
              </div>
              <div className="spotlight-score">{formatScore(model.overall)}</div>
              <p>{model.notes || 'Strong overall profile across the current benchmark mix.'}</p>
            </article>
          ))}
        </section>
      ) : null}

      <section className="section-copy" id="benchmarks">
        <p className="eyebrow">Benchmark cards</p>
        <h2>Drill into each eval independently.</h2>
      </section>

      {data && data.models.length === 0 && !isLoading ? (
        <div className="empty-panel">
          <h3>No models yet</h3>
          <p>Deploy this site, unlock the console, and add your first model with scores across the eight built-in benchmarks.</p>
        </div>
      ) : null}

      <div className="benchmark-grid">
        {(data?.models ? BENCHMARKS : []).map((benchmark) => (
          <BenchmarkCard benchmark={benchmark} key={benchmark.key} models={data?.models ?? []} />
        ))}
      </div>

      <ModelMatrix models={data?.models ?? []} />
    </div>
  )
}