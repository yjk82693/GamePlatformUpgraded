import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { Card, Button, Pill } from '../../components/ui'
import { tokens, gameAccent } from '../../theme/tokens'

interface Product {
  id: string
  name: string
  priceCents: number | null
  priceCoins: number | null
}

interface Game {
  appId: string
  name: string
  gameProduct: Product | null
  dlc: Product[]
  isFreeToPlay: boolean
  canAdd: boolean
  inLibrary: boolean
}

export default function StorePage() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    loadGames()
  }, [])

  async function loadGames() {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch('/player/shop/games')
      setGames(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleBuy(productId: string, payWith: 'CASH' | 'COIN') {
    setMessage(null)
    try {
      await apiFetch('/player/shop/purchase', {
        method: 'POST',
        body: JSON.stringify({ productId, payWith }),
      })
      setMessage('Purchase successful! You can now add it to your library.')
      loadGames()
    } catch (err) {
      setMessage((err as Error).message)
    }
  }

  async function handleAddToLibrary(appId: string) {
    setMessage(null)
    try {
      await apiFetch('/player/shop/library/add', {
        method: 'POST',
        body: JSON.stringify({ appId }),
      })
      setMessage('Added to your library.')
      loadGames()
    } catch (err) {
      setMessage((err as Error).message)
    }
  }

  if (loading) return <p style={{ color: tokens.color.textMuted, padding: 24 }}>Loading store...</p>
  if (error) return <p style={{ color: tokens.color.danger, padding: 24 }}>{error}</p>

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontFamily: tokens.font.display, fontSize: 20, marginBottom: 24 }}>Store</h1>

      {message && <Pill tone={message.includes('successful') || message.includes('Added') ? 'success' : 'warning'}>{message}</Pill>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginTop: 16 }}>
        {games.map((g) => {
          const accent = gameAccent(g.name)
          return (
            <Card key={g.appId} accent={accent}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 6, height: 22, background: accent, borderRadius: 2 }} />
                <div style={{ fontWeight: 700, fontSize: 15 }}>{g.name}</div>
              </div>

              {g.isFreeToPlay ? (
                <div style={{ fontSize: 13, color: tokens.color.textMuted, marginBottom: 10 }}>Free to Play</div>
              ) : g.gameProduct ? (
                <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  {g.gameProduct.priceCents != null && (
                    <span style={{ fontFamily: tokens.font.mono, fontSize: 14 }}>
                      ${(g.gameProduct.priceCents / 100).toFixed(2)}
                    </span>
                  )}
                </div>
              ) : null}

              {g.dlc.length > 0 && (
                <div style={{ fontSize: 12, color: tokens.color.textMuted, marginBottom: 10 }}>
                  + {g.dlc.length} DLC available
                </div>
              )}

              {g.inLibrary ? (
                <Pill tone="success">In Library</Pill>
              ) : g.canAdd ? (
                <Button variant="primary" onClick={() => handleAddToLibrary(g.appId)}>
                  Add to Library
                </Button>
              ) : (
                g.gameProduct && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {g.gameProduct.priceCents != null && (
                      <Button variant="primary" onClick={() => handleBuy(g.gameProduct!.id, 'CASH')}>
                        Buy (cash)
                      </Button>
                    )}
                    {g.gameProduct.priceCoins != null && (
                      <Button variant="secondary" onClick={() => handleBuy(g.gameProduct!.id, 'COIN')}>
                        Buy (coins)
                      </Button>
                    )}
                  </div>
                )
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
