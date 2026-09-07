import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import { Card, Button, Pill } from '../../components/ui'
import { tokens, gameAccent } from '../../theme/tokens'

interface Product {
  id: string
  name: string
  priceCents: number | null
  priceCoins: number | null
}

interface Review {
  id: string
  rating: number
  body: string
}

interface GameDetail {
  appId: string
  name: string
  description: string | null
  genre: string | null
  gameProduct: Product | null
  dlc: Product[]
  isFreeToPlay: boolean
  canAdd: boolean
  inLibrary: boolean
  reviews: Review[]
}

export default function GameDetailPage() {
  const { appId } = useParams<{ appId: string }>()
  const navigate = useNavigate()
  const [game, setGame] = useState<GameDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewBody, setReviewBody] = useState('')

  useEffect(() => {
    loadGame()
  }, [appId])

  async function loadGame() {
    if (!appId) return
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch(`/player/shop/games/${appId}`)
      setGame(data)
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
      loadGame()
    } catch (err) {
      setMessage((err as Error).message)
    }
  }

  async function handleAddToLibrary() {
    if (!appId) return
    setMessage(null)
    try {
      await apiFetch('/player/shop/library/add', {
        method: 'POST',
        body: JSON.stringify({ appId }),
      })
      setMessage('Added to your library.')
      loadGame()
    } catch (err) {
      setMessage((err as Error).message)
    }
  }

  async function handleRemoveFromLibrary() {
    if (!appId) return
    setMessage(null)
    try {
      await apiFetch(`/player/shop/library/${appId}`, { method: 'DELETE' })
      setMessage('Removed from your library.')
      loadGame()
    } catch (err) {
      setMessage((err as Error).message)
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!game || !appId) return
    setMessage(null)
    const target = game.gameProduct ? { productId: game.gameProduct.id } : { appId }
    try {
      await apiFetch('/player/shop/reviews', {
        method: 'POST',
        body: JSON.stringify({ ...target, rating: reviewRating, body: reviewBody }),
      })
      setMessage('Review submitted. Thanks!')
      setReviewBody('')
      loadGame()
    } catch (err) {
      setMessage((err as Error).message)
    }
  }

  if (loading) return <p style={{ color: tokens.color.textMuted, padding: 24 }}>Loading...</p>
  if (error) return <p style={{ color: tokens.color.danger, padding: 24 }}>{error}</p>
  if (!game) return null

  const accent = gameAccent(game.name)
  const avgRating = game.reviews.length > 0
    ? (game.reviews.reduce((sum, r) => sum + r.rating, 0) / game.reviews.length).toFixed(1)
    : null

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <button
        onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', color: tokens.color.accentSoft, cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 16 }}
      >
        ← Back to Store
      </button>

      <div style={{ height: 140, background: accent, borderRadius: tokens.radius.md, marginBottom: 20, display: 'flex', alignItems: 'flex-end', padding: 20 }}>
        <h1 style={{ fontFamily: tokens.font.display, fontSize: 22, color: '#fff', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>
          {game.name}
        </h1>
      </div>

      {message && <Pill tone={message.includes('successful') || message.includes('Added') || message.includes('Thanks') ? 'success' : 'warning'}>{message}</Pill>}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, marginTop: 12 }}>
        {game.genre && <Pill tone="neutral">{game.genre}</Pill>}
        {avgRating && (
          <span style={{ fontSize: 13, color: tokens.color.gold }}>★ {avgRating} ({game.reviews.length} reviews)</span>
        )}
      </div>

      {game.description && (
        <p style={{ color: tokens.color.text, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          {game.description}
        </p>
      )}

      <Card style={{ marginBottom: 24 }}>
        {game.isFreeToPlay ? (
          <div style={{ fontSize: 13, color: tokens.color.textMuted, marginBottom: 10 }}>Free to Play</div>
        ) : game.gameProduct ? (
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            {game.gameProduct.priceCents != null && (
              <span style={{ fontFamily: tokens.font.mono, fontSize: 16 }}>
                ${(game.gameProduct.priceCents / 100).toFixed(2)}
              </span>
            )}
          </div>
        ) : null}

        {game.inLibrary ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Pill tone="success">In Library</Pill>
            <Button variant="secondary" onClick={handleRemoveFromLibrary}>
              Remove from Library
            </Button>
          </div>
        ) : game.canAdd ? (
          <Button variant="primary" onClick={handleAddToLibrary}>Add to Library</Button>
        ) : (
          game.gameProduct && (
            <div style={{ display: 'flex', gap: 8 }}>
              {game.gameProduct.priceCents != null && (
                <Button variant="primary" onClick={() => handleBuy(game.gameProduct!.id, 'CASH')}>
                  Buy (cash)
                </Button>
              )}
              {game.gameProduct.priceCoins != null && (
                <Button variant="secondary" onClick={() => handleBuy(game.gameProduct!.id, 'COIN')}>
                  Buy (coins)
                </Button>
              )}
            </div>
          )
        )}
      </Card>

      {game.dlc.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>DLC</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {game.dlc.map((d) => (
              <Card key={d.id} accent={accent}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{d.name}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {d.priceCents != null && (
                    <Button variant="primary" onClick={() => handleBuy(d.id, 'CASH')}>
                      ${(d.priceCents / 100).toFixed(2)}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Reviews</h3>
        {game.reviews.length === 0 ? (
          <p style={{ color: tokens.color.textMuted, fontSize: 13, marginBottom: 16 }}>No reviews yet.</p>
        ) : (
          <div style={{ marginBottom: 16 }}>
            {game.reviews.map((r) => (
              <Card key={r.id} style={{ marginBottom: 10 }}>
                <div style={{ color: tokens.color.gold, marginBottom: 6 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                <div style={{ fontSize: 13 }}>{r.body}</div>
              </Card>
            ))}
          </div>
        )}

        {game.inLibrary ? (
          <Card>
            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>Write a Review</div>
            <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <select
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
                style={{
                  background: tokens.color.surfaceAlt,
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.sm,
                  padding: '8px 12px',
                  color: tokens.color.text,
                  fontSize: 14,
                  width: 140,
                }}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>
                ))}
              </select>
              <textarea
                placeholder="What did you think?"
                value={reviewBody}
                onChange={(e) => setReviewBody(e.target.value)}
                required
                rows={3}
                style={{
                  background: tokens.color.surfaceAlt,
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.sm,
                  padding: '8px 12px',
                  color: tokens.color.text,
                  fontSize: 14,
                  fontFamily: tokens.font.body,
                  resize: 'vertical',
                }}
              />
              <Button variant="primary" type="submit">Submit Review</Button>
            </form>
          </Card>
        ) : (
          <p style={{ color: tokens.color.textMuted, fontSize: 13 }}>
            Add this game to your library to write a review.
          </p>
        )}
      </div>
    </div>
  )
}
