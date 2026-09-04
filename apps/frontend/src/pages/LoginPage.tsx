import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { tokens } from '../theme/tokens'
import { Card, Button } from '../components/ui'

type Mode = 'login' | 'register-player' | 'register-company' | 'register-staff'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [domain, setDomain] = useState('')
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
        return
      }

      if (mode === 'register-player') {
        await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        setMessage('Account created. You can log in now.')
        setMode('login')
        return
      }

      if (mode === 'register-company') {
        await apiFetch('/auth/register-company', {
          method: 'POST',
          body: JSON.stringify({ email, password, companyName, domain }),
        })
        setMessage(`Company "${companyName}" registered. You can log in now.`)
        setMode('login')
        return
      }

      if (mode === 'register-staff') {
        await apiFetch('/auth/register-staff', {
          method: 'POST',
          body: JSON.stringify({ email, password, domain }),
        })
        setMessage('Account created. An admin at your company will need to grant you a role before you can access anything.')
        setMode('login')
        return
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

  const titles: Record<Mode, string> = {
    login: 'Log in',
    'register-player': 'Register as a Player',
    'register-company': 'Register a New Company',
    'register-staff': 'Join an Existing Company',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card style={{ width: 380 }}>
        <h1 style={{ fontFamily: tokens.font.display, fontSize: 16, marginBottom: 20 }}>{titles[mode]}</h1>

        {mode === 'login' && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            <button type="button" onClick={() => setMode('register-player')} style={tabStyle}>Player</button>
            <button type="button" onClick={() => setMode('register-company')} style={tabStyle}>New Company</button>
            <button type="button" onClick={() => setMode('register-staff')} style={tabStyle}>Join Company</button>
          </div>
        )}

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

          {mode === 'register-company' && (
            <>
              <input
                placeholder="Company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                style={inputStyle}
              />
              <input
                placeholder="Company domain (e.g. mystudio.com)"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                required
                style={inputStyle}
              />
            </>
          )}

          {mode === 'register-staff' && (
            <input
              placeholder="Your company's domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              required
              style={inputStyle}
            />
          )}

          <Button type="submit" variant="primary">
            {mode === 'login' ? 'Log in' : 'Register'}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode('login')}
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
          {mode === 'login' ? '' : '← Back to login'}
        </button>
        {mode === 'login' && (
          <span style={{ color: tokens.color.textMuted, fontSize: 13 }}>Choose a registration option above, or log in below.</span>
        )}

        {message && <p style={{ marginTop: 16, color: tokens.color.textMuted, fontSize: 13 }}>{message}</p>}
      </Card>
    </div>
  )
}

const tabStyle: React.CSSProperties = {
  flex: 1,
  background: '#242737',
  border: '1px solid #2E3244',
  borderRadius: 4,
  padding: '6px 4px',
  color: '#9A9CB0',
  fontSize: 11,
  cursor: 'pointer',
}
