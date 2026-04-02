import { useEffect, useMemo, useState } from 'react'
import { BENCHMARKS, type BenchmarkKey } from '../../shared/benchmarks'
import type { DraftModel } from '../lib/leaderboard'
import { createModel, deleteModel, fetchAdminModels, fetchSession, login, logout, updateModel } from '../lib/api'
import { clearKonamiActivation } from '../hooks/useKonamiGate'
import { createEmptyDraft, draftToPayload, formatScore, modelToDraft } from '../lib/leaderboard'

export function ConsolePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [models, setModels] = useState<Awaited<ReturnType<typeof fetchAdminModels>>['models']>([])
  const [draft, setDraft] = useState<DraftModel>(createEmptyDraft())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const session = await fetchSession()
        if (cancelled) {
          return
        }

        setIsAuthenticated(session.authenticated)
        setExpiresAt(session.expiresAt)

        if (session.authenticated) {
          const data = await fetchAdminModels()
          if (cancelled) {
            return
          }
          setModels(data.models)
          if (data.models[0]) {
            setSelectedId(data.models[0].id)
            setDraft(modelToDraft(data.models[0]))
          }
        }
      } catch (bootstrapError) {
        if (!cancelled) {
          setAuthMessage(bootstrapError instanceof Error ? bootstrapError.message : 'Failed to load console')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [])

  const selectedModel = useMemo(() => models.find((model) => model.id === selectedId) ?? null, [models, selectedId])

  async function refreshModels(preferredId?: string | null) {
    const data = await fetchAdminModels()
    setModels(data.models)

    const nextSelectedId = preferredId ?? data.models[0]?.id ?? null
    setSelectedId(nextSelectedId)
    const nextModel = data.models.find((model) => model.id === nextSelectedId)
    setDraft(nextModel ? modelToDraft(nextModel) : createEmptyDraft())
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthMessage(null)

    try {
      await login(password)
      const session = await fetchSession()
      setIsAuthenticated(session.authenticated)
      setExpiresAt(session.expiresAt)
      setPassword('')
      await refreshModels()
    } catch (loginError) {
      setAuthMessage(loginError instanceof Error ? loginError.message : 'Login failed')
    }
  }

  async function handleLogout() {
    await logout()
    clearKonamiActivation()
    setIsAuthenticated(false)
    setExpiresAt(null)
    setModels([])
    setSelectedId(null)
    setDraft(createEmptyDraft())
    setMessage(null)
  }

  function handleSelectModel(modelId: string) {
    const model = models.find((entry) => entry.id === modelId)
    if (!model) {
      return
    }
    setSelectedId(modelId)
    setDraft(modelToDraft(model))
    setMessage(null)
  }

  function handleFieldChange(field: Exclude<keyof DraftModel, 'scores' | 'id'>, value: string) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleScoreChange(benchmarkKey: BenchmarkKey, value: string) {
    setDraft((current) => ({
      ...current,
      scores: {
        ...current.scores,
        [benchmarkKey]: value,
      },
    }))
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setMessage(null)

    try {
      const payload = draftToPayload(draft)
      if (draft.id) {
        const saved = await updateModel(draft.id, payload)
        await refreshModels(saved.id)
        setMessage(`${saved.name} updated.`)
      } else {
        const created = await createModel(payload)
        await refreshModels(created.id)
        setMessage(`${created.name} created.`)
      }
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedModel) {
      return
    }

    const confirmed = window.confirm(`Delete ${selectedModel.name}?`)
    if (!confirmed) {
      return
    }

    try {
      await deleteModel(selectedModel.id)
      await refreshModels(null)
      setMessage(`${selectedModel.name} deleted.`)
    } catch (deleteError) {
      setMessage(deleteError instanceof Error ? deleteError.message : 'Delete failed')
    }
  }

  if (isLoading) {
    return <div className="status-banner">Loading console...</div>
  }

  if (!isAuthenticated) {
    return (
      <section className="console-login-card">
        <div className="section-copy">
          <p className="eyebrow">Private admin console</p>
          <h1>Sequence accepted. Enter the environment password.</h1>
          <p>
            The first gate is the hidden local input sequence. The second gate is the server-side password backed by a signed
            HttpOnly cookie, plus IP tracking and lockout in KV.
          </p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <label className="field">
            <span>Admin password</span>
            <input
              autoComplete="current-password"
              className="input"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter ADMIN_PASSWORD"
              type="password"
              value={password}
            />
          </label>

          {authMessage ? <div className="status-banner error">{authMessage}</div> : null}

          <button className="button button-primary" type="submit">
            Unlock console
          </button>
        </form>
      </section>
    )
  }

  return (
    <div className="console-layout">
      <aside className="console-sidebar">
        <div className="sidebar-header">
          <div>
            <p className="eyebrow">Session</p>
            <h2>Admin workspace</h2>
          </div>
          <button className="button button-secondary" onClick={() => {
            setSelectedId(null)
            setDraft(createEmptyDraft())
            setMessage(null)
          }} type="button">
            New model
          </button>
        </div>

        <div className="session-chip">
          <span>Signed in</span>
          <strong>{expiresAt ? `Expires ${new Date(expiresAt).toLocaleString()}` : 'Active session'}</strong>
        </div>

        <div className="model-list">
          {models.map((model) => (
            <button
              className={selectedId === model.id ? 'model-list-item active' : 'model-list-item'}
              key={model.id}
              onClick={() => handleSelectModel(model.id)}
              type="button"
            >
              <div>
                <strong>{model.name}</strong>
                <small>{model.provider || 'No provider'}</small>
              </div>
              <span>{formatScore(model.overall)}</span>
            </button>
          ))}

          {models.length === 0 ? <div className="empty-panel compact">No models yet. Create your first entry.</div> : null}
        </div>

        <button className="button button-ghost" onClick={() => void handleLogout()} type="button">
          Log out
        </button>
      </aside>

      <section className="console-editor">
        <div className="section-copy">
          <p className="eyebrow">Editor</p>
          <h1>{draft.id ? 'Edit model' : 'Add a new model'}</h1>
          <p>Fill in any subset of the eight benchmark scores. Empty fields stay blank on the public board.</p>
        </div>

        {message ? <div className="status-banner">{message}</div> : null}

        <form className="editor-form" onSubmit={handleSave}>
          <div className="field-grid">
            <label className="field">
              <span>Model name</span>
              <input className="input" onChange={(event) => handleFieldChange('name', event.target.value)} required value={draft.name} />
            </label>
            <label className="field">
              <span>Provider</span>
              <input className="input" onChange={(event) => handleFieldChange('provider', event.target.value)} value={draft.provider} />
            </label>
            <label className="field">
              <span>Brand color</span>
              <input className="input" onChange={(event) => handleFieldChange('color', event.target.value)} value={draft.color} />
            </label>
            <label className="field">
              <span>Logo URL</span>
              <input className="input" onChange={(event) => handleFieldChange('logoUrl', event.target.value)} value={draft.logoUrl} />
            </label>
            <label className="field">
              <span>Homepage URL</span>
              <input className="input" onChange={(event) => handleFieldChange('homepageUrl', event.target.value)} value={draft.homepageUrl} />
            </label>
          </div>

          <label className="field">
            <span>Notes</span>
            <textarea className="textarea" onChange={(event) => handleFieldChange('notes', event.target.value)} rows={3} value={draft.notes} />
          </label>

          <div className="score-grid">
            {BENCHMARKS.map((benchmark) => (
              <label className="score-card" key={benchmark.key}>
                <span>{benchmark.label}</span>
                <small>{benchmark.description}</small>
                <input
                  className="input"
                  inputMode="decimal"
                  max="100"
                  min="0"
                  onChange={(event) => handleScoreChange(benchmark.key, event.target.value)}
                  placeholder="0-100"
                  step="0.1"
                  type="number"
                  value={draft.scores[benchmark.key]}
                />
              </label>
            ))}
          </div>

          <div className="form-actions">
            <button className="button button-primary" disabled={isSaving} type="submit">
              {isSaving ? 'Saving...' : draft.id ? 'Save changes' : 'Create model'}
            </button>
            {draft.id ? (
              <button className="button button-danger" onClick={() => void handleDelete()} type="button">
                Delete model
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  )
}