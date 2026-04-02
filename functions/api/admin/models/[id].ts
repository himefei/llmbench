import { deleteModel, updateModel } from '../../../_lib/leaderboard'
import { verifySession } from '../../../_lib/auth'
import type { Env } from '../../../_lib/env'
import { ensureSameOrigin, handleOptions, json, readJson } from '../../../_lib/http'
import type { AdminModelPayload } from '../../../../shared/types'

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!ensureSameOrigin(request)) {
    return json({ message: 'Cross-origin request rejected.' }, { status: 403 })
  }

  const session = await verifySession(request, env)
  if (!session.authenticated) {
    return json({ message: 'Unauthorized' }, { status: 401 })
  }

  const id = String(params.id)

  try {
    const payload = await readJson<AdminModelPayload>(request)
    const model = await updateModel(env, id, payload)
    if (!model) {
      return json({ message: 'Model not found.' }, { status: 404 })
    }
    return json(model)
  } catch (error) {
    return json({ message: error instanceof Error ? error.message : 'Failed to update model.' }, { status: 400 })
  }
}

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!ensureSameOrigin(request)) {
    return json({ message: 'Cross-origin request rejected.' }, { status: 403 })
  }

  const session = await verifySession(request, env)
  if (!session.authenticated) {
    return json({ message: 'Unauthorized' }, { status: 401 })
  }

  const deleted = await deleteModel(env, String(params.id))
  if (!deleted) {
    return json({ message: 'Model not found.' }, { status: 404 })
  }

  return json({ success: true })
}

export const onRequestOptions: PagesFunction<Env> = async () => handleOptions()