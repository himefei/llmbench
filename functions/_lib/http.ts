export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json; charset=utf-8')
  }
  headers.set('cache-control', 'no-store')

  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  })
}

export async function readJson<T>(request: Request): Promise<T> {
  return request.json() as Promise<T>
}

export function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'cache-control': 'no-store',
    },
  })
}

export function ensureSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) {
    return true
  }

  return origin === new URL(request.url).origin
}