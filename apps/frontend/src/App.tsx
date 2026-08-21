import { useState } from 'react'

const API_URL = 'http://localhost:4000'

function App() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.error || 'Something went wrong')
        return
      }
      if (mode === 'login') {
        setToken(data.token)
        setMessage(`Logged in. Session expires ${new Date(data.expiresAt).toLocaleString()}`)
      } else {
        setMessage(`Account created: ${data.email}. You can log in now.`)
        setMode('login')
      }
    } catch (err) {
      setMessage('Could not reach the server')
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '80px auto', fontFamily: 'sans-serif' }}>
      <h1>{mode === 'login' ? 'Log in' : 'Register'}</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">{mode === 'login' ? 'Log in' : 'Register'}</button>
      </form>
      <button
        type="button"
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        style={{ marginTop: 12, background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}
      >
        {mode === 'login' ? 'Need an account? Register' : 'Have an account? Log in'}
      </button>
      {message && <p style={{ marginTop: 16 }}>{message}</p>}
      {token && (
        <p style={{ wordBreak: 'break-all', fontSize: 12, color: '#666' }}>
          Token: {token}
        </p>
      )}
    </div>
  )
}

export default App
