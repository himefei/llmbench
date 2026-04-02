import { BENCHMARK_KEYS, type BenchmarkKey } from '../../shared/benchmarks'
import type { AdminModelPayload, LeaderboardResponse, ModelRecord, ModelScores } from '../../shared/types'
import type { Env } from './env'

interface ModelRow {
  id: string
  name: string
  provider: string
  color: string
  logo_url: string | null
  homepage_url: string | null
  notes: string
  created_at: string
  updated_at: string
}

interface ScoreRow {
  model_id: string
  benchmark_key: BenchmarkKey
  score: number
}

export async function loadLeaderboard(env: Env): Promise<LeaderboardResponse> {
  const modelResults = await env.DB.prepare(
    `SELECT id, name, provider, color, logo_url, homepage_url, notes, created_at, updated_at
     FROM models
     ORDER BY updated_at DESC, name ASC`,
  ).all<ModelRow>()

  const scoreResults = await env.DB.prepare(
    `SELECT model_id, benchmark_key, score
     FROM scores`,
  ).all<ScoreRow>()

  const scoreMap = new Map<string, ModelScores>()
  for (const row of modelResults.results) {
    scoreMap.set(row.id, createEmptyScores())
  }

  for (const score of scoreResults.results) {
    const modelScores = scoreMap.get(score.model_id)
    if (!modelScores) {
      continue
    }
    modelScores[score.benchmark_key] = roundScore(score.score)
  }

  const models = modelResults.results
    .map<ModelRecord>((row) => {
      const scores = scoreMap.get(row.id) ?? createEmptyScores()
      return {
        id: row.id,
        name: row.name,
        provider: row.provider,
        color: row.color,
        logoUrl: row.logo_url,
        homepageUrl: row.homepage_url,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        scores,
        overall: calculateOverall(scores),
      }
    })
    .sort(sortModels)

  return {
    models,
    updatedAt: models[0]?.updatedAt ?? null,
    totalModels: models.length,
  }
}

export async function createModel(env: Env, payload: AdminModelPayload): Promise<ModelRecord> {
  const model = normalizePayload(payload)
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  await env.DB.prepare(
    `INSERT INTO models (id, name, provider, color, logo_url, homepage_url, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      model.name,
      model.provider,
      model.color,
      model.logoUrl,
      model.homepageUrl,
      model.notes,
      now,
      now,
    )
    .run()

  await replaceScores(env, id, model.scores)
  const created = await getModelById(env, id)
  if (!created) {
    throw new Error('Failed to read the created model.')
  }
  return created
}

export async function updateModel(env: Env, id: string, payload: AdminModelPayload): Promise<ModelRecord | null> {
  const existing = await getModelById(env, id)
  if (!existing) {
    return null
  }

  const model = normalizePayload(payload)
  const now = new Date().toISOString()
  await env.DB.prepare(
    `UPDATE models
     SET name = ?, provider = ?, color = ?, logo_url = ?, homepage_url = ?, notes = ?, updated_at = ?
     WHERE id = ?`,
  )
    .bind(
      model.name,
      model.provider,
      model.color,
      model.logoUrl,
      model.homepageUrl,
      model.notes,
      now,
      id,
    )
    .run()

  await replaceScores(env, id, model.scores)
  return getModelById(env, id)
}

export async function deleteModel(env: Env, id: string): Promise<boolean> {
  await env.DB.prepare('DELETE FROM scores WHERE model_id = ?').bind(id).run()
  const result = await env.DB.prepare('DELETE FROM models WHERE id = ?').bind(id).run()
  return (result.meta.changes ?? 0) > 0
}

export async function getModelById(env: Env, id: string): Promise<ModelRecord | null> {
  const leaderboard = await loadLeaderboard(env)
  return leaderboard.models.find((model) => model.id === id) ?? null
}

function normalizePayload(payload: AdminModelPayload): AdminModelPayload {
  const name = payload.name.trim()
  if (!name) {
    throw new Error('Model name is required')
  }

  const scores: Partial<Record<BenchmarkKey, number | null>> = {}
  for (const key of BENCHMARK_KEYS) {
    const value = payload.scores[key]
    if (value === null || value === undefined) {
      scores[key] = null
      continue
    }

    const numeric = Number(value)
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100) {
      throw new Error(`Invalid score for ${key}`)
    }
    scores[key] = roundScore(numeric)
  }

  return {
    name,
    provider: payload.provider.trim(),
    color: payload.color?.trim() || '#2563eb',
    logoUrl: payload.logoUrl?.trim() || null,
    homepageUrl: payload.homepageUrl?.trim() || null,
    notes: payload.notes.trim(),
    scores,
  }
}

async function replaceScores(env: Env, modelId: string, scores: Partial<Record<BenchmarkKey, number | null>>) {
  await env.DB.prepare('DELETE FROM scores WHERE model_id = ?').bind(modelId).run()

  const statements = BENCHMARK_KEYS.flatMap((key) => {
    const value = scores[key]
    if (value === null || value === undefined) {
      return []
    }

    return [
      env.DB.prepare(
        `INSERT INTO scores (model_id, benchmark_key, score, updated_at)
         VALUES (?, ?, ?, ?)`,
      ).bind(modelId, key, value, new Date().toISOString()),
    ]
  })

  if (statements.length > 0) {
    await env.DB.batch(statements)
  }
}

function createEmptyScores(): ModelScores {
  return Object.fromEntries(BENCHMARK_KEYS.map((key) => [key, null])) as ModelScores
}

function calculateOverall(scores: ModelScores): number | null {
  const values = Object.values(scores).filter((score): score is number => typeof score === 'number')
  if (values.length === 0) {
    return null
  }
  return roundScore(values.reduce((sum, score) => sum + score, 0) / values.length)
}

function roundScore(value: number): number {
  return Math.round(value * 10) / 10
}

function sortModels(left: ModelRecord, right: ModelRecord): number {
  const leftOverall = left.overall ?? -1
  const rightOverall = right.overall ?? -1
  if (rightOverall !== leftOverall) {
    return rightOverall - leftOverall
  }
  return left.name.localeCompare(right.name)
}