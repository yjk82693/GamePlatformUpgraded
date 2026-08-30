import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { Card, Button, Pill } from '../../components/ui'
import { tokens } from '../../theme/tokens'

export default function SocialPage() {
  const [friends, setFriends] = useState<string[]>([])
  const [friendCode, setFriendCode] = useState('')
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
      const data = await apiFetch('/player/social/friends')
      setFriends(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddFriend(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    try {
      await apiFetch('/player/social/friends', {
        method: 'POST',
        body: JSON.stringify({ friendCode }),
      })
      setMessage('Friend request sent.')
      setFriendCode('')
      load()
    } catch (err) {
      setMessage((err as Error).message)
    }
  }

  async function handleRemove(accountId: string) {
    setMessage(null)
    try {
      await apiFetch(`/player/social/friends/${accountId}`, { method: 'DELETE' })
      load()
    } catch (err) {
      setMessage((err as Error).message)
    }
  }

  if (loading) return <p style={{ padding: 24, color: tokens.color.textMuted }}>Loading friends...</p>
  if (error) return <p style={{ padding: 24, color: tokens.color.danger }}>{error}</p>

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
      <h1 style={{ fontFamily: tokens.font.display, fontSize: 20, marginBottom: 24 }}>Friends</h1>
      {message && <Pill tone="neutral">{message}</Pill>}

      <form onSubmit={handleAddFriend} style={{ display: 'flex', gap: 8, margin: '16px 0 24px' }}>
        <input
          placeholder="Friend code"
          value={friendCode}
          onChange={(e) => setFriendCode(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        />
        <Button variant="primary" type="submit">Add friend</Button>
      </form>

      {friends.length === 0 && <p style={{ color: tokens.color.textMuted }}>No friends yet.</p>}
      {friends.map((accountId) => (
        <Card key={accountId} style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <code style={{ fontFamily: tokens.font.mono, fontSize: 13, color: tokens.color.textMuted }}>
            {accountId}
          </code>
          <Button variant="secondary" onClick={() => handleRemove(accountId)}>Remove</Button>
        </Card>
      ))}
    </div>
  )
}
