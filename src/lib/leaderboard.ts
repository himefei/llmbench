import { BENCHMARKS, type BenchmarkKey } from '../../shared/benchmarks'
import type { AdminModelPayload, ModelRecord } from '../../shared/types'

export const EMPTY_SCORES = Object.fromEntries(
  BENCHMARKS.map((benchmark) => [benchmark.key, '']),
) as Record<BenchmarkKey, string>

export function formatScore(score: number | null): string {
  return score === null ? '--' : score.toFixed(1)
}

export function formatTimestamp(value: string | null): string {
  if (!value) {
    return 'No updates yet'
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function averageScore(model: ModelRecord): number | null {
  const values = Object.values(model.scores).filter((score): score is number => typeof score === 'number')
  if (values.length === 0) {
    return null
  }
  return Math.round((values.reduce((sum, score) => sum + score, 0) / values.length) * 10) / 10
}

export function createEmptyDraft(): DraftModel {
  return {
    id: null,
    name: '',
    provider: '',
    color: '#2563eb',
    logoUrl: '',
    homepageUrl: '',
    notes: '',
    scores: { ...EMPTY_SCORES },
  }
}

export function modelToDraft(model: ModelRecord): DraftModel {
  return {
    id: model.id,
    name: model.name,
    provider: model.provider,
    color: model.color,
    logoUrl: model.logoUrl ?? '',
    homepageUrl: model.homepageUrl ?? '',
    notes: model.notes,
    scores: Object.fromEntries(
      BENCHMARKS.map((benchmark) => [benchmark.key, model.scores[benchmark.key]?.toString() ?? '']),
    ) as Record<BenchmarkKey, string>,
  }
}

export function draftToPayload(draft: DraftModel): AdminModelPayload {
  return {
    name: draft.name,
    provider: draft.provider,
    color: draft.color,
    logoUrl: draft.logoUrl || null,
    homepageUrl: draft.homepageUrl || null,
    notes: draft.notes,
    scores: Object.fromEntries(
      BENCHMARKS.map((benchmark) => {
        const raw = draft.scores[benchmark.key].trim()
        if (!raw) {
          return [benchmark.key, null]
        }
        return [benchmark.key, Number(raw)]
      }),
    ) as Partial<Record<BenchmarkKey, number | null>>,
  }
}

export interface DraftModel {
  id: string | null
  name: string
  provider: string
  color: string
  logoUrl: string
  homepageUrl: string
  notes: string
  scores: Record<BenchmarkKey, string>
}