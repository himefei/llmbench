import type { Env } from './_lib/env'

const FILE_EXTENSION_PATTERN = /\.[a-zA-Z0-9]+$/

export const onRequest: PagesFunction<Env> = async ({ request, env, next }) => {
  const url = new URL(request.url)

  if (url.pathname.startsWith('/api/')) {
    return next()
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return next()
  }

  if (FILE_EXTENSION_PATTERN.test(url.pathname)) {
    return env.ASSETS.fetch(request)
  }

  const indexUrl = new URL('/index.html', request.url)
  return env.ASSETS.fetch(new Request(indexUrl, request))
}