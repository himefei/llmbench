import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BENCHMARKS } from '../../shared/benchmarks'
import type { LeaderboardResponse } from '../../shared/types'
import { BenchmarkCompareChart } from '../components/BenchmarkCompareChart'
import { BenchmarkCard } from '../components/BenchmarkCard'
import { ModelMatrix } from '../components/ModelMatrix'
import { useLanguage } from '../lib/language'
import { fetchLeaderboard } from '../lib/api'
import { formatScore, formatTimestamp, getInitials } from '../lib/leaderboard'

interface HomePageProps {
  konamiActivated: boolean
}

export function HomePage({ konamiActivated }: HomePageProps) {
  const { language } = useLanguage()
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
      <BenchmarkCompareChart models={data?.models ?? []} />

      <section className="hero-card">
        <div className="hero-card__copy">
          <p className="eyebrow">{language === 'zh' ? '评测驱动的模型追踪' : 'Benchmark-driven model tracking'}</p>
          <h1>{language === 'zh' ? '一个更适合展示大模型评测分数的榜单。' : 'One polished board for your LLM eval scores.'}</h1>
          <p className="hero-text">
            {language === 'zh'
              ? '把 MMLU、HellaSwag、TruthfulQA、ARC Challenge、GSM8K、HumanEval、MBPP 和 LiveCodeBench 集中展示在同一个 Cloudflare Pages 站点中，并带有隐藏控制台。'
              : 'Track MMLU, HellaSwag, TruthfulQA, ARC Challenge, GSM8K, HumanEval, MBPP, and LiveCodeBench in a single Cloudflare Pages deployment with a private admin console.'}
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#benchmarks">
              {language === 'zh' ? '查看评测项目' : 'View benchmarks'}
            </a>
            {konamiActivated ? (
              <Link className="button button-secondary button-arcade" to="/console">
                {language === 'zh' ? '控制台已解锁' : 'Console unlocked'}
              </Link>
            ) : (
              <div className="secret-access-chip">{language === 'zh' ? '隐藏控制台需通过本地序列输入解锁。' : 'Hidden admin access enabled by local sequence input.'}</div>
            )}
          </div>
        </div>

        <aside className="hero-card__panel">
          <div className="stat-grid">
            <div className="stat-tile">
              <span>{language === 'zh' ? '模型总数' : 'Total models'}</span>
              <strong>{data?.totalModels ?? 0}</strong>
            </div>
            <div className="stat-tile">
              <span>{language === 'zh' ? '评测项目' : 'Benchmarks'}</span>
              <strong>{BENCHMARKS.length}</strong>
            </div>
            <div className="stat-tile stat-tile--wide">
              <span>{language === 'zh' ? '最近更新' : 'Last update'}</span>
              <strong>{formatTimestamp(data?.updatedAt ?? null)}</strong>
            </div>
          </div>

          {leadingModel ? (
            <div className="top-model-card">
              <p className="eyebrow">{language === 'zh' ? '当前第一名' : 'Current leader'}</p>
              <div className="top-model-row">
                <span className="avatar hero-avatar" style={{ background: leadingModel.color }}>
                  {leadingModel.logoUrl ? <img alt="" src={leadingModel.logoUrl} /> : getInitials(leadingModel.name)}
                </span>
                <div>
                  <h3>{leadingModel.name}</h3>
                  <p>{leadingModel.provider || (language === 'zh' ? '私有榜单条目' : 'Private benchmark entry')}</p>
                </div>
              </div>
              <div className="top-model-metrics">
                <div>
                  <span>{language === 'zh' ? '总分' : 'Overall'}</span>
                  <strong>{formatScore(leadingModel.overall)}</strong>
                </div>
                <div>
                  <span>{language === 'zh' ? '备注' : 'Notes'}</span>
                  <strong>{leadingModel.notes || (language === 'zh' ? '暂无备注' : 'No notes yet')}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-panel compact">
              {language === 'zh' ? '榜单已经准备好，但目前还没有录入任何模型。' : 'This leaderboard is ready, but no models have been entered yet.'}
            </div>
          )}
        </aside>
      </section>

      {error ? <div className="status-banner error">{error}</div> : null}
      {isLoading ? <div className="status-banner">{language === 'zh' ? '正在加载榜单...' : 'Loading leaderboard...'}</div> : null}

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
                  <small>{model.provider || (language === 'zh' ? '私有榜单条目' : 'Private benchmark entry')}</small>
                </div>
              </div>
              <div className="spotlight-score">{formatScore(model.overall)}</div>
              <p>{model.notes || (language === 'zh' ? '在当前评测组合下整体表现稳定。' : 'Strong overall profile across the current benchmark mix.')}</p>
            </article>
          ))}
        </section>
      ) : null}

      <section className="section-copy" id="benchmarks">
        <p className="eyebrow">{language === 'zh' ? '分项目榜单' : 'Benchmark cards'}</p>
        <h2>{language === 'zh' ? '按单个评测项目查看模型表现。' : 'Drill into each eval independently.'}</h2>
      </section>

      {data && data.models.length === 0 && !isLoading ? (
        <div className="empty-panel">
          <h3>{language === 'zh' ? '还没有模型' : 'No models yet'}</h3>
          <p>{language === 'zh' ? '先部署站点、解锁控制台，再录入你的第一批模型与评测分数。' : 'Deploy this site, unlock the console, and add your first model with scores across the eight built-in benchmarks.'}</p>
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