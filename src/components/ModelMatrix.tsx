import { BENCHMARKS } from '../../shared/benchmarks'
import type { ModelRecord } from '../../shared/types'
import { useLanguage } from '../lib/language'
import { formatScore, getInitials } from '../lib/leaderboard'

interface ModelMatrixProps {
  models: ModelRecord[]
}

export function ModelMatrix({ models }: ModelMatrixProps) {
  const { language } = useLanguage()
  if (models.length === 0) {
    return null
  }

  return (
    <section className="matrix-card">
      <div className="section-copy">
        <p className="eyebrow">{language === 'zh' ? '全项目矩阵' : 'Cross-benchmark view'}</p>
        <h2>{language === 'zh' ? '模型成绩矩阵' : 'Model matrix'}</h2>
      </div>

      <div className="table-wrap">
        <table className="matrix-table">
          <thead>
            <tr>
              <th>{language === 'zh' ? '模型' : 'Model'}</th>
              <th>{language === 'zh' ? '总分' : 'Overall'}</th>
              {BENCHMARKS.map((benchmark) => (
                <th key={benchmark.key}>{benchmark.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models.map((model) => (
              <tr key={model.id}>
                <td>
                  <div className="table-model">
                    <span className="avatar small" style={{ background: model.color }}>
                      {model.logoUrl ? <img alt="" src={model.logoUrl} /> : getInitials(model.name)}
                    </span>
                    <div>
                      <strong>{model.name}</strong>
                      <small>{model.provider || (language === 'zh' ? '独立条目' : 'Independent')}</small>
                    </div>
                  </div>
                </td>
                <td className="strong-cell">{formatScore(model.overall)}</td>
                {BENCHMARKS.map((benchmark) => (
                  <td key={`${model.id}-${benchmark.key}`}>{formatScore(model.scores[benchmark.key])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}