import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { Card, Button, Pill } from '../../components/ui'
import { tokens } from '../../theme/tokens'

interface Profile {
  displayName: string
  avatarRef: string | null
  friendCode: string
  visibility: 'PUBLIC' | 'FRIENDS' | 'PRIVATE'
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const me = await apiFetch('/auth/me')
      const data = await apiFetch(`/player/profile/${me.accountId}`)
      setProfile(data)
      setDisplayName(data.displayName)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setMessage(null)
    try {
      await apiFetch('/player/profile', {
        method: 'PATCH',
        body: JSON.stringify({ displayName }),
      })
      setMessage('Saved.')
      load()
    } catch (err) {
      setMessage((err as Error).message)
    }
  }

  async function handleVisibility(level: 'PUBLIC' | 'FRIENDS' | 'PRIVATE') {
    setMessage(null)
    try {
      await apiFetch('/player/profile/visibility', {
        method: 'PATCH',
        body: JSON.stringify({ level }),
      })
      load()
    } catch (err) {
      setMessage((err as Error).message)
    }
  }

  async function handleRegenerateCode() {
    setMessage(null)
    try {
      await apiFetch('/player/profile/friend-code/regenerate', { method: 'POST' })
      load()
    } catch (err) {
      setMessage((err as Error).message)
    }
  }

  if (loading) return <p style={{ padding: 24, color: tokens.color.textMuted }}>Loading profile...</p>
  if (error) return <p style={{ padding: 24, color: tokens.color.danger }}>{error}</p>
  if (!profile) return null

  const inputStyle: React.CSSProperties = {
    background: tokens.color.surfaceAlt,
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.sm,
    padding: '8px 12px',
    color: tokens.color.text,
    fontSize: 14,
  }

  return (
    <div style={{ padding: 24, maxWidth: 480 }}>
      <h1 style={{ fontFamily: tokens.font.display, fontSize: 20, marginBottom: 24 }}>Profile</h1>
      {message && <Pill tone="neutral">{message}</Pill>}

      <Card style={{ marginTop: 16, marginBottom: 16 }}>
        <label style={{ color: tokens.color.textMuted, fontSize: 12 }}>Display name</label>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
          <Button variant="primary" onClick={handleSave}>Save</Button>
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <label style={{ color: tokens.color.textMuted, fontSize: 12, display: 'block', marginBottom: 10 }}>
          Visibility
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['PUBLIC', 'FRIENDS', 'PRIVATE'] as const).map((v) => (
            <Button
              key={v}
              variant={profile.visibility === v ? 'primary' : 'secondary'}
              onClick={() => handleVisibility(v)}
            >
              {v}
            </Button>
          ))}
        </div>
      </Card>

      <Card>
        <label style={{ color: tokens.color.textMuted, fontSize: 12, display: 'block', marginBottom: 10 }}>
          Friend code
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <code style={{ fontFamily: tokens.font.mono, color: tokens.color.gold, fontSize: 16 }}>
            {profile.friendCode}
          </code>
          <Button variant="secondary" onClick={handleRegenerateCode}>Regenerate</Button>
        </div>
      </Card>
    </div>
  )
}
