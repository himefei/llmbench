import { clearSessionCookie } from '../../_lib/auth'
import type { Env } from '../../_lib/env'
import { handleOptions, json } from '../../_lib/http'

export const onRequestPost: PagesFunction<Env> = async () =>
  json(
    { success: true },
    {
      headers: {
        'set-cookie': clearSessionCookie(),
      },
    },
  )

export const onRequestOptions: PagesFunction<Env> = async () => handleOptions()