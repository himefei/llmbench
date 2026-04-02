import { clearFailedLogins, createSessionCookie, getClientIp, getLoginBlockState, recordFailedLogin } from '../../_lib/auth'
import type { Env } from '../../_lib/env'
import { ensureSameOrigin, handleOptions, json, readJson } from '../../_lib/http'

interface LoginRequest {
  password?: string
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!ensureSameOrigin(request)) {
    return json({ success: false, message: 'Cross-origin login is not allowed.' }, { status: 403 })
  }

  const guard = await getLoginBlockState(request, env)
  if (guard.blocked) {
    return json({ success: false, message: guard.message }, { status: guard.status })
  }

  const adminPassword = env.ADMIN_PASSWORD?.trim()
  if (!adminPassword) {
    return json({ success: false, message: 'ADMIN_PASSWORD is not configured.' }, { status: 500 })
  }

  try {
    const body = await readJson<LoginRequest>(request)
    const password = body.password?.trim()

    if (!password) {
      return json({ success: false, message: 'Password is required.' }, { status: 400 })
    }

    if (password !== adminPassword) {
      const failure = await recordFailedLogin(getClientIp(request), env)
      if (failure.blockedUntil) {
        return json(
          { success: false, message: 'Too many failed attempts. This IP has been temporarily blacklisted.' },
          { status: 429 },
        )
      }

      return json(
        { success: false, message: `Invalid password. ${failure.remainingAttempts} attempts remaining.` },
        { status: 401 },
      )
    }

    const ip = getClientIp(request)
    await clearFailedLogins(ip, env)

    return json(
      { success: true },
      {
        status: 200,
        headers: {
          'set-cookie': await createSessionCookie(env),
        },
      },
    )
  } catch (error) {
    return json({ success: false, message: 'Invalid request payload.' }, { status: 400 })
  }
}

export const onRequestOptions: PagesFunction<Env> = async () => handleOptions()