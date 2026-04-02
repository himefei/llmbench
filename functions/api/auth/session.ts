import { verifySession } from '../../_lib/auth'
import type { Env } from '../../_lib/env'
import { handleOptions, json } from '../../_lib/http'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const session = await verifySession(request, env)
  return json(session)
}

export const onRequestOptions: PagesFunction<Env> = async () => handleOptions()