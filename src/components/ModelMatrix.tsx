import { BENCHMARKS } from '../../shared/benchmarks'
import type { ModelRecord } from '../../shared/types'
import { formatScore, getInitials } from '../lib/leaderboard'

interface ModelMatrixProps {
  models: ModelRecord[]
}

export function ModelMatrix({ models }: ModelMatrixProps) {
  if (models.length === 0) {
    return null
  }

  return (
    <section className="matrix-card">
      <div className="section-copy">
        <p className="eyebrow">Cross-benchmark view</p>
        <h2>Model matrix</h2>
      </div>

      <div className="table-wrap">
        <table className="matrix-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Overall</th>
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
                      <small>{model.provider || 'Independent'}</small>
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