import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'

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

  if (loading) return <p>Loading friends...</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>

  return (
    <div>
      <h2>Friends</h2>
      {message && <p>{message}</p>}

      <form onSubmit={handleAddFriend} style={{ marginBottom: 24 }}>
        <input
          placeholder="Friend code"
          value={friendCode}
          onChange={(e) => setFriendCode(e.target.value)}
        />
        <button type="submit" style={{ marginLeft: 8 }}>Add friend</button>
      </form>

      {friends.length === 0 && <p>No friends yet.</p>}
      <ul>
        {friends.map((accountId) => (
          <li key={accountId} style={{ marginBottom: 8 }}>
            <code>{accountId}</code>
            <button onClick={() => handleRemove(accountId)} style={{ marginLeft: 8 }}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
