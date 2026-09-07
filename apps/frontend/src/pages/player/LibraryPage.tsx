import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import { Card } from '../../components/ui'
import { tokens, gameAccent } from '../../theme/tokens'

interface Game {
  id: string
  name: string
}

export default function LibraryPage() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadLibrary()
  }, [])

  async function loadLibrary() {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch('/player/shop/library')
      setGames(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p style={{ color: tokens.color.textMuted, padding: 24 }}>Loading library...</p>
  if (error) return <p style={{ color: tokens.color.danger, padding: 24 }}>{error}</p>

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontFamily: tokens.font.display, fontSize: 20, marginBottom: 24 }}>Library</h1>

      {games.length === 0 ? (
        <p style={{ color: tokens.color.textMuted }}>
          Nothing here yet — head to the{' '}
          <Link to="/player/store" style={{ color: tokens.color.accentSoft }}>
            Store
          </Link>{' '}
          to add a game.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {games.map((g) => {
            const accent = gameAccent(g.name)
            return (
              <Card key={g.id} accent={accent}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 6, height: 22, background: accent, borderRadius: 2 }} />
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{g.name}</div>
                </div>
                <Link
                  to={`/player/topup?appId=${g.id}`}
                  style={{ fontSize: 13, color: tokens.color.accentSoft, textDecoration: 'none' }}
                >
                  Visit Topup Center →
                </Link>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
