import { createModel, loadLeaderboard } from '../../_lib/leaderboard'
import { verifySession } from '../../_lib/auth'
import type { Env } from '../../_lib/env'
import { ensureSameOrigin, handleOptions, json, readJson } from '../../_lib/http'
import type { AdminModelPayload } from '../../../shared/types'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const session = await verifySession(request, env)
  if (!session.authenticated) {
    return json({ message: 'Unauthorized' }, { status: 401 })
  }

  return json(await loadLeaderboard(env))
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!ensureSameOrigin(request)) {
    return json({ message: 'Cross-origin request rejected.' }, { status: 403 })
  }

  const session = await verifySession(request, env)
  if (!session.authenticated) {
    return json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await readJson<AdminModelPayload>(request)
    const model = await createModel(env, payload)
    return json(model, { status: 201 })
  } catch (error) {
    return json({ message: error instanceof Error ? error.message : 'Failed to create model.' }, { status: 400 })
  }
}

export const onRequestOptions: PagesFunction<Env> = async () => handleOptions()