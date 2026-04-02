import type { AdminModelPayload, LeaderboardResponse, ModelRecord, SessionResponse } from '../../shared/types'

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: 'same-origin',
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  const text = await response.text()
  const payload = text ? (JSON.parse(text) as T & { message?: string }) : ({} as T & { message?: string })

  if (!response.ok) {
    throw new Error(payload.message ?? 'Request failed')
  }

  return payload as T
}

export function fetchLeaderboard() {
  return request<LeaderboardResponse>('/api/leaderboard', {
    method: 'GET',
    headers: {},
  })
}

export function fetchAdminModels() {
  return request<LeaderboardResponse>('/api/admin/models', {
    method: 'GET',
    headers: {},
  })
}

export function fetchSession() {
  return request<SessionResponse>('/api/auth/session', {
    method: 'GET',
    headers: {},
  })
}

export function login(password: string) {
  return request<{ success: true }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
}

export function logout() {
  return request<{ success: true }>('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

export function createModel(payload: AdminModelPayload) {
  return request<ModelRecord>('/api/admin/models', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateModel(id: string, payload: AdminModelPayload) {
  return request<ModelRecord>(`/api/admin/models/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteModel(id: string) {
  return request<{ success: true }>(`/api/admin/models/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({}),
  })
}