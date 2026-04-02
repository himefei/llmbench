import { loadLeaderboard } from '../_lib/leaderboard'
import { json, handleOptions } from '../_lib/http'
import type { Env } from '../_lib/env'

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const leaderboard = await loadLeaderboard(env)
  return json(leaderboard)
}

export const onRequestOptions: PagesFunction<Env> = async () => handleOptions()