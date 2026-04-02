import type { Env } from './env'

const ADMIN_COOKIE = 'llmbench_admin'
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MS = 60 * 60 * 1000
const RATE_LIMIT_PREFIX = 'login-attempt:'
const BLOCKLIST_PREFIX = 'block:'

interface AttemptRecord {
  failures: number
  blockedUntil?: number
  updatedAt: number
}

interface SessionPayload {
  sub: 'admin'
  exp: number
}

const textEncoder = new TextEncoder()

export function getClientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
}

export async function getLoginBlockState(request: Request, env: Env) {
  const ip = getClientIp(request)
  const envBlocklist = parseCsvList(env.ADMIN_IP_BLOCKLIST)

  if (envBlocklist.has(ip)) {
    return {
      ip,
      blocked: true,
      status: 403,
      message: 'Access denied for this IP.',
      remainingAttempts: 0,
    }
  }

  if (env.SECURITY_KV) {
    const manualBlock = await env.SECURITY_KV.get(`${BLOCKLIST_PREFIX}${ip}`)
    if (manualBlock) {
      return {
        ip,
        blocked: true,
        status: 403,
        message: 'This IP is blacklisted.',
        remainingAttempts: 0,
      }
    }

    const record = await env.SECURITY_KV.get(`${RATE_LIMIT_PREFIX}${ip}`, 'json') as AttemptRecord | null
    if (record?.blockedUntil && record.blockedUntil > Date.now()) {
      const remainingMinutes = Math.max(1, Math.ceil((record.blockedUntil - Date.now()) / 60000))
      return {
        ip,
        blocked: true,
        status: 429,
        message: `Too many failed logins. Try again in ${remainingMinutes} minutes.`,
        remainingAttempts: 0,
      }
    }

    return {
      ip,
      blocked: false,
      status: 200,
      message: '',
      remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - (record?.failures ?? 0)),
    }
  }

  return {
    ip,
    blocked: false,
    status: 200,
    message: '',
    remainingAttempts: MAX_FAILED_ATTEMPTS,
  }
}

export async function recordFailedLogin(ip: string, env: Env) {
  if (!env.SECURITY_KV) {
    return {
      remainingAttempts: 0,
      blockedUntil: null,
    }
  }

  const key = `${RATE_LIMIT_PREFIX}${ip}`
  const current = await env.SECURITY_KV.get(key, 'json') as AttemptRecord | null
  const failures = (current?.failures ?? 0) + 1
  const updatedAt = Date.now()

  if (failures >= MAX_FAILED_ATTEMPTS) {
    const blockedUntil = updatedAt + LOCKOUT_MS
    const nextRecord: AttemptRecord = {
      failures,
      blockedUntil,
      updatedAt,
    }
    await env.SECURITY_KV.put(key, JSON.stringify(nextRecord), { expirationTtl: 60 * 60 * 12 })
    return {
      remainingAttempts: 0,
      blockedUntil,
    }
  }

  await env.SECURITY_KV.put(
    key,
    JSON.stringify({
      failures,
      updatedAt,
    } satisfies AttemptRecord),
    { expirationTtl: 60 * 60 * 12 },
  )

  return {
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - failures),
    blockedUntil: null,
  }
}

export async function clearFailedLogins(ip: string, env: Env) {
  await env.SECURITY_KV?.delete(`${RATE_LIMIT_PREFIX}${ip}`)
}

export async function createSessionCookie(env: Env): Promise<string> {
  const ttlHours = Number(env.SESSION_TTL_HOURS ?? '24') || 24
  const exp = Date.now() + ttlHours * 60 * 60 * 1000
  const payload: SessionPayload = { sub: 'admin', exp }
  const payloadPart = toBase64Url(JSON.stringify(payload))
  const signature = await sign(payloadPart, getSessionSecret(env))
  const token = `${payloadPart}.${signature}`

  return serializeCookie(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    path: '/',
    maxAge: ttlHours * 60 * 60,
  })
}

export function clearSessionCookie(): string {
  return serializeCookie(ADMIN_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    path: '/',
    maxAge: 0,
  })
}

export async function verifySession(request: Request, env: Env): Promise<{ authenticated: boolean; expiresAt: string | null }> {
  const secret = env.SESSION_SECRET?.trim()
  if (!secret) {
    return { authenticated: false, expiresAt: null }
  }

  const cookies = parseCookies(request.headers.get('cookie'))
  const token = cookies[ADMIN_COOKIE]

  if (!token) {
    return { authenticated: false, expiresAt: null }
  }

  const parts = token.split('.')
  if (parts.length !== 2) {
    return { authenticated: false, expiresAt: null }
  }

  const [payloadPart, signature] = parts
  const expected = await sign(payloadPart, secret)
  if (signature !== expected) {
    return { authenticated: false, expiresAt: null }
  }

  try {
    const payload = JSON.parse(fromBase64Url(payloadPart)) as SessionPayload
    if (payload.sub !== 'admin' || payload.exp <= Date.now()) {
      return { authenticated: false, expiresAt: null }
    }

    return {
      authenticated: true,
      expiresAt: new Date(payload.exp).toISOString(),
    }
  } catch {
    return { authenticated: false, expiresAt: null }
  }
}

function getSessionSecret(env: Env): string {
  const secret = env.SESSION_SECRET?.trim()
  if (!secret) {
    throw new Error('SESSION_SECRET is not configured')
  }
  return secret
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) {
    return {}
  }

  return cookieHeader.split(';').reduce<Record<string, string>>((accumulator, pair) => {
    const [name, ...rest] = pair.trim().split('=')
    if (!name) {
      return accumulator
    }

    accumulator[name] = rest.join('=')
    return accumulator
  }, {})
}

function parseCsvList(value: string | undefined): Set<string> {
  return new Set(
    (value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  )
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(value))
  return arrayBufferToBase64Url(signature)
}

function toBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  return atob(`${normalized}${padding}`)
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return toBase64Url(binary)
}

function serializeCookie(
  name: string,
  value: string,
  options: {
    path: string
    maxAge: number
    httpOnly: boolean
    secure: boolean
    sameSite: 'Strict' | 'Lax' | 'None'
  },
): string {
  const segments = [`${name}=${value}`, `Path=${options.path}`, `Max-Age=${options.maxAge}`, `SameSite=${options.sameSite}`]
  if (options.httpOnly) {
    segments.push('HttpOnly')
  }
  if (options.secure) {
    segments.push('Secure')
  }
  return segments.join('; ')
}