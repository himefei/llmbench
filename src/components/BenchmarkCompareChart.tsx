import { useEffect, useMemo, useState } from 'react'
import { BENCHMARKS } from '../../shared/benchmarks'
import type { ModelRecord } from '../../shared/types'
import { useLanguage } from '../lib/language'
import { formatScore } from '../lib/leaderboard'

const CHART_PALETTE = ['#2563eb', '#0f9d8a', '#f97316', '#7c3aed', '#e11d48'] as const

interface BenchmarkCompareChartProps {
  models: ModelRecord[]
}

export function BenchmarkCompareChart({ models }: BenchmarkCompareChartProps) {
  const { language } = useLanguage()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectionMessage, setSelectionMessage] = useState<string | null>(null)

  useEffect(() => {
    setSelectedIds((current) => {
      const availableIds = new Set(models.map((model) => model.id))
      const preserved = current.filter((id) => availableIds.has(id))
      if (preserved.length > 0) {
        return preserved.slice(0, 5)
      }
      return models.slice(0, 3).map((model) => model.id)
    })
  }, [models])

  const selectedModels = useMemo(
    () => selectedIds.map((id) => models.find((model) => model.id === id)).filter((model): model is ModelRecord => Boolean(model)),
    [models, selectedIds],
  )

  const colorByModelId = useMemo(
    () =>
      Object.fromEntries(selectedModels.map((model, index) => [model.id, CHART_PALETTE[index % CHART_PALETTE.length]])) as Record<string, string>,
    [selectedModels],
  )

  function handleToggleModel(modelId: string) {
    setSelectionMessage(null)
    setSelectedIds((current) => {
      if (current.includes(modelId)) {
        return current.filter((id) => id !== modelId)
      }

      if (current.length >= 5) {
        setSelectionMessage(language === 'zh' ? '最多只能选择 5 个模型。' : 'You can compare up to 5 models.')
        return current
      }

      return [...current, modelId]
    })
  }

  return (
    <section className="compare-card">
      <div className="compare-card__header">
        <div className="section-copy">
          <p className="eyebrow">{language === 'zh' ? '对比柱状图' : 'Comparison chart'}</p>
          <h2>{language === 'zh' ? '按评测项目分组查看模型成绩' : 'Compare models by benchmark group'}</h2>
          <p>
            {language === 'zh'
              ? '最多选择 5 个模型，柱状图会按 benchmark 分组展示每个模型的分数。'
              : 'Choose up to 5 models to view grouped vertical bars for each benchmark.'}
          </p>
        </div>
        <span className="compare-card__meta">
          {language === 'zh' ? `已选 ${selectedModels.length}/5` : `${selectedModels.length}/5 selected`}
        </span>
      </div>

      <div className="compare-selector-row">
        {models.map((model) => {
          const active = selectedIds.includes(model.id)
          return (
            <button
              className={active ? 'compare-chip active' : 'compare-chip'}
              key={model.id}
              onClick={() => handleToggleModel(model.id)}
              type="button"
            >
              <span className="compare-chip__dot" style={{ background: colorByModelId[model.id] ?? CHART_PALETTE[0] }} />
              <span>{model.name}</span>
            </button>
          )
        })}
      </div>

      {selectionMessage ? <div className="status-banner error">{selectionMessage}</div> : null}

      {selectedModels.length > 0 ? (
        <div className="compare-chart-wrap">
          {BENCHMARKS.map((benchmark) => (
            <div className="compare-group" key={benchmark.key}>
              <div className="compare-bars">
                {selectedModels.map((model) => {
                  const value = model.scores[benchmark.key]
                  const height = value === null ? 6 : Math.max(10, value)
                  const chartColor = colorByModelId[model.id] ?? CHART_PALETTE[0]
                  return (
                    <div className="compare-bar-column" key={`${benchmark.key}-${model.id}`}>
                      <span className="compare-bar-value">{formatScore(value)}</span>
                      <div className="compare-bar-track">
                        <div
                          className={value === null ? 'compare-bar compare-bar-empty' : 'compare-bar'}
                          style={{ height: `${height}%`, background: value === null ? undefined : `linear-gradient(180deg, ${chartColor}, color-mix(in srgb, ${chartColor} 62%, white))` }}
                        />
                      </div>
                      <span className="compare-bar-model">{model.name}</span>
                    </div>
                  )
                })}
              </div>
              <div className="compare-group__label">
                <strong>{benchmark.label}</strong>
                <small>{language === 'zh' ? benchmark.descriptionZh : benchmark.description}</small>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-panel">
          {language === 'zh' ? '请选择至少一个模型以显示柱状图。' : 'Select at least one model to render the chart.'}
        </div>
      )}
    </section>
  )
}