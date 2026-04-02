export interface Env {
  ASSETS: Fetcher
  DB: D1Database
  SECURITY_KV?: KVNamespace
  ADMIN_PASSWORD?: string
  SESSION_SECRET?: string
  SESSION_TTL_HOURS?: string
  ADMIN_IP_BLOCKLIST?: string
}