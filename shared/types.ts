import type { BenchmarkKey } from './benchmarks'

export type ModelScores = Record<BenchmarkKey, number | null>

export interface ModelRecord {
  id: string
  name: string
  provider: string
  color: string
  logoUrl: string | null
  homepageUrl: string | null
  notes: string
  createdAt: string
  updatedAt: string
  overall: number | null
  scores: ModelScores
}

export interface LeaderboardResponse {
  models: ModelRecord[]
  updatedAt: string | null
  totalModels: number
}

export interface AdminModelPayload {
  name: string
  provider: string
  color: string
  logoUrl: string | null
  homepageUrl: string | null
  notes: string
  scores: Partial<Record<BenchmarkKey, number | null>>
}

export interface SessionResponse {
  authenticated: boolean
  expiresAt: string | null
}