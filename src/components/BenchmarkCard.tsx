import { type CSSProperties } from 'react'
import type { BenchmarkKey } from '../../shared/benchmarks'
import type { ModelRecord } from '../../shared/types'
import { useLanguage } from '../lib/language'
import { formatScore, getInitials } from '../lib/leaderboard'

interface BenchmarkCardProps {
  benchmark: {
    key: BenchmarkKey
    label: string
    description: string
    descriptionZh: string
    accent: string
  }
  models: ModelRecord[]
}

export function BenchmarkCard({ benchmark, models }: BenchmarkCardProps) {
  const { language } = useLanguage()
  const ranked = models
    .filter((model) => model.scores[benchmark.key] !== null)
    .sort((left, right) => (right.scores[benchmark.key] ?? 0) - (left.scores[benchmark.key] ?? 0))
    .slice(0, 6)

  return (
    <section className="benchmark-card" style={{ '--accent-hsl': benchmark.accent } as CSSProperties}>
      <div className="benchmark-card__header">
        <div>
          <p className="eyebrow">{benchmark.label}</p>
          <h3>{language === 'zh' ? benchmark.descriptionZh : benchmark.description}</h3>
        </div>
        <span className="badge">{language === 'zh' ? `${ranked.length || 0} 个模型` : `${ranked.length || 0} models`}</span>
      </div>

      {ranked.length > 0 ? (
        <div className="bars">
          {ranked.map((model, index) => {
            const score = model.scores[benchmark.key] ?? 0
            return (
              <div className="bar-row" key={`${benchmark.key}-${model.id}`}>
                <div className="bar-label">
                  <span className="avatar" style={{ background: model.color }}>
                    {model.logoUrl ? <img alt="" src={model.logoUrl} /> : getInitials(model.name)}
                  </span>
                  <div>
                    <strong>{model.name}</strong>
                    <small>{model.provider || (language === 'zh' ? `第 ${index + 1} 名` : `Rank ${index + 1}`)}</small>
                  </div>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.max(score, 8)}%`, background: model.color }} />
                </div>
                <span className="bar-score">{formatScore(score)}</span>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-panel compact">
          {language === 'zh' ? '这个 benchmark 还没有数据，先去后台添加模型与得分。' : 'No data for this benchmark yet. Add your first model from the admin console.'}
        </div>
      )}
    </section>
  )
}