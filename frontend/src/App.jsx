import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

const LS_KEY = 'taskapp_auth_v1'

function loadAuth() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const v = JSON.parse(raw)
    if (!v?.token || !v?.user) return null
    return v
  } catch {
    return null
  }
}

function saveAuth(auth) {
  if (!auth) localStorage.removeItem(LS_KEY)
  else localStorage.setItem(LS_KEY, JSON.stringify(auth))
}

async function api(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`/api/v1${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { error: { message: text || 'Bad response' } }
  }
  if (!res.ok) {
    const msg =
      json?.error?.message ||
      json?.message ||
      `Request failed (${res.status})`
    const err = new Error(msg)
    err.status = res.status
    err.details = json?.error?.details
    throw err
  }
  return json
}

export default function App() {
  const [auth, setAuth] = useState(() => loadAuth())
  const [tab, setTab] = useState(() => (loadAuth() ? 'dash' : 'login'))
  const [banner, setBanner] = useState({ type: 'info', text: '' })

  const token = auth?.token
  const user = auth?.user

  const show = useCallback((type, text) => {
    setBanner({ type, text })
  }, [])

  useEffect(() => {
    if (!banner.text) return
    const t = setTimeout(() => setBanner({ type: 'info', text: '' }), 5000)
    return () => clearTimeout(t)
  }, [banner.text])

  const logout = useCallback(() => {
    saveAuth(null)
    setAuth(null)
    setTab('login')
    show('info', 'You logged out.')
  }, [show])

  const login = useCallback(
    async (email, password) => {
      const json = await api('/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      const next = {
        token: json.data.accessToken,
        user: json.data.user,
      }
      saveAuth(next)
      setAuth(next)
      setTab('dash')
      show('ok', 'You are in! Welcome back.')
    },
    [show],
  )

  const register = useCallback(
    async (email, password) => {
      await api('/auth/register', { method: 'POST', body: { email, password } })
      show('ok', 'Account created. Now log in.')
      setTab('login')
    },
    [show],
  )

  const header = useMemo(() => {
    return (
      <header className="top">
        <div className="brand">Tasks</div>
        <nav className="nav">
          {!token ? (
            <>
              <button
                type="button"
                className={tab === 'login' ? 'active' : ''}
                onClick={() => setTab('login')}
              >
                Log in
              </button>
              <button
                type="button"
                className={tab === 'register' ? 'active' : ''}
                onClick={() => setTab('register')}
              >
                Register
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={tab === 'dash' ? 'active' : ''}
                onClick={() => setTab('dash')}
              >
                My tasks
              </button>
              {user?.role === 'ADMIN' ? (
                <button
                  type="button"
                  className={tab === 'admin' ? 'active' : ''}
                  onClick={() => setTab('admin')}
                >
                  Admin: all tasks
                </button>
              ) : null}
              <button type="button" onClick={logout}>
                Log out
              </button>
            </>
          )}
        </nav>
      </header>
    )
  }, [logout, tab, token, user?.role])

  return (
    <div className="page">
      {header}

      {banner.text ? (
        <div className={`banner banner-${banner.type}`}>{banner.text}</div>
      ) : null}

      {!token && tab === 'login' ? (
        <AuthForm
          title="Log in"
          submitLabel="Log in"
          onSubmit={login}
          onError={(e) => show('bad', e.message)}
        />
      ) : null}

      {!token && tab === 'register' ? (
        <AuthForm
          title="Register"
          submitLabel="Create account"
          onSubmit={register}
          onError={(e) => show('bad', e.message)}
        />
      ) : null}

      {token && tab === 'dash' ? (
        <Dashboard token={token} show={show} />
      ) : null}

      {token && tab === 'admin' && user?.role === 'ADMIN' ? (
        <AdminTasks token={token} show={show} />
      ) : null}

    </div>
  )
}

function AuthForm({ title, submitLabel, onSubmit, onError }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <main className="card">
      <h1>{title}</h1>
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          try {
            await onSubmit(email.trim(), password)
            setPassword('')
          } catch (err) {
            onError(err)
          } finally {
            setBusy(false)
          }
        }}
      >
        <label className="field">
          <span>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        <button className="primary" disabled={busy} type="submit">
          {busy ? 'Please wait…' : submitLabel}
        </button>
      </form>
    </main>
  )
}

function Dashboard({ token, show }) {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    const json = await api('/tasks', { token })
    setTasks(json.data.tasks)
  }, [token])

  useEffect(() => {
    refresh().catch((e) => show('bad', e.message))
  }, [refresh, show])

  return (
    <main className="grid">
      <section className="card">
        <h1>My tasks</h1>
        <p className="muted">This page only works because you brought your JWT sticker.</p>

        <form
          className="form"
          onSubmit={async (e) => {
            e.preventDefault()
            setBusy(true)
            try {
              await api('/tasks', {
                method: 'POST',
                token,
                body: { title, description: description || null },
              })
              setTitle('')
              setDescription('')
              await refresh()
              show('ok', 'Task created.')
            } catch (err) {
              show('bad', err.message)
            } finally {
              setBusy(false)
            }
          }}
        >
          <label className="field">
            <span>New task title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="field">
            <span>Description (optional)</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <button className="primary" disabled={busy} type="submit">
            {busy ? 'Saving…' : 'Add task'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>List</h2>
        {tasks.length === 0 ? (
          <p className="muted">No tasks yet. Add one!</p>
        ) : (
          <ul className="list">
            {tasks.map((t) => (
              <TaskRow key={t.id} task={t} token={token} onChanged={refresh} show={show} />
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

function TaskRow({ task, token, onChanged, show }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [status, setStatus] = useState(task.status)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setTitle(task.title)
    setStatus(task.status)
  }, [task.title, task.status])

  return (
    <li className="row">
      {!editing ? (
        <>
          <div>
            <div className="row-title">{task.title}</div>
            <div className="muted small">
              {task.status}
              {task.description ? ` · ${task.description}` : ''}
            </div>
          </div>
          <div className="row-actions">
            <button type="button" onClick={() => setEditing(true)}>
              Edit
            </button>
            <button
              type="button"
              className="danger"
              onClick={async () => {
                if (!confirm('Delete this task?')) return
                setBusy(true)
                try {
                  await api(`/tasks/${task.id}`, { method: 'DELETE', token })
                  await onChanged()
                  show('ok', 'Deleted.')
                } catch (e) {
                  show('bad', e.message)
                } finally {
                  setBusy(false)
                }
              }}
              disabled={busy}
            >
              Delete
            </button>
          </div>
        </>
      ) : (
        <div className="edit">
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>TODO</option>
            <option>DOING</option>
            <option>DONE</option>
          </select>
          <button
            type="button"
            className="primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              try {
                await api(`/tasks/${task.id}`, {
                  method: 'PATCH',
                  token,
                  body: { title, status },
                })
                setEditing(false)
                await onChanged()
                show('ok', 'Saved.')
              } catch (e) {
                show('bad', e.message)
              } finally {
                setBusy(false)
              }
            }}
          >
            Save
          </button>
          <button type="button" onClick={() => setEditing(false)} disabled={busy}>
            Cancel
          </button>
        </div>
      )}
    </li>
  )
}

function AdminTasks({ token, show }) {
  const [tasks, setTasks] = useState([])
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setBusy(true)
    try {
      const json = await api('/admin/tasks', { token })
      setTasks(json.data.tasks)
      show('ok', 'Loaded every task (admin magic).')
    } catch (e) {
      show('bad', e.message)
    } finally {
      setBusy(false)
    }
  }, [show, token])

  useEffect(() => {
    load()
  }, [load])

  return (
    <main className="card">
      <h1>All tasks (admin)</h1>
      <p className="muted">Only ADMIN users can open this toy chest.</p>
      <button className="primary" type="button" onClick={load} disabled={busy}>
        {busy ? 'Loading…' : 'Refresh'}
      </button>

      <ul className="list" style={{ marginTop: 16 }}>
        {tasks.map((t) => (
          <li key={t.id} className="row">
            <div>
              <div className="row-title">{t.title}</div>
              <div className="muted small">
                {t.status} · owner {t.user?.email || t.userId}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
