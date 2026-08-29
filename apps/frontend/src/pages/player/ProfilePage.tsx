import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'

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

  if (loading) return <p>Loading profile...</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>
  if (!profile) return null

  return (
    <div>
      <h2>Profile</h2>
      {message && <p>{message}</p>}

      <div style={{ marginTop: 16 }}>
        <label>Display name</label>
        <br />
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <button onClick={handleSave} style={{ marginLeft: 8 }}>Save</button>
      </div>

      <div style={{ marginTop: 16 }}>
        <label>Visibility: </label>
        {(['PUBLIC', 'FRIENDS', 'PRIVATE'] as const).map((v) => (
          <button
            key={v}
            onClick={() => handleVisibility(v)}
            style={{ marginLeft: 8, fontWeight: profile.visibility === v ? 'bold' : 'normal' }}
          >
            {v}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <label>Friend code: </label>
        <code>{profile.friendCode}</code>
        <button onClick={handleRegenerateCode} style={{ marginLeft: 8 }}>Regenerate</button>
      </div>
    </div>
  )
}
