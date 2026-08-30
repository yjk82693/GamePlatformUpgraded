import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { tokens } from '../theme/tokens'
import { Card, Button } from '../components/ui'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    try {
      if (mode === 'login') {
        const data = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        login(data.token)
        navigate('/')
      } else {
        await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        setMessage('Account created. You can log in now.')
        setMode('login')
      }
    } catch (err) {
      setMessage((err as Error).message)
    }
  }

  const inputStyle: React.CSSProperties = {
    background: tokens.color.surfaceAlt,
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.sm,
    padding: '10px 12px',
    color: tokens.color.text,
    fontSize: 14,
    fontFamily: tokens.font.body,
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card style={{ width: 360 }}>
        <h1 style={{ fontFamily: tokens.font.display, fontSize: 18, marginBottom: 24 }}>
          {mode === 'login' ? 'Log in' : 'Register'}
        </h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
          <Button type="submit" variant="primary">
            {mode === 'login' ? 'Log in' : 'Register'}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          style={{
            marginTop: 16,
            background: 'none',
            border: 'none',
            color: tokens.color.accentSoft,
            cursor: 'pointer',
            fontSize: 13,
            padding: 0,
          }}
        >
          {mode === 'login' ? 'Need an account? Register' : 'Have an account? Log in'}
        </button>
        {message && <p style={{ marginTop: 16, color: tokens.color.textMuted, fontSize: 13 }}>{message}</p>}
      </Card>
    </div>
  )
}
