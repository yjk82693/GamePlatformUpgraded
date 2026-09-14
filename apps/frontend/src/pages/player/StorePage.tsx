import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  genre: string | null
  gameProduct: Product | null
  dlc: Product[]
  isFreeToPlay: boolean
  canAdd: boolean
  inLibrary: boolean
  avgRating: number | null
  reviewCount: number
  isMultiplayer: boolean
}

export default function StorePage() {
  const navigate = useNavigate()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [genreFilter, setGenreFilter] = useState('All')
  const [freeOnly, setFreeOnly] = useState(false)

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

  async function handleBuy(e: React.MouseEvent, productId: string, payWith: 'CASH' | 'COIN') {
    e.stopPropagation()
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

  async function handleAddToLibrary(e: React.MouseEvent, appId: string) {
    e.stopPropagation()
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

  const genres = useMemo(() => {
    const set = new Set<string>()
    for (const g of games) if (g.genre) set.add(g.genre)
    return ['All', ...Array.from(set).sort()]
  }, [games])

  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false
      if (genreFilter !== 'All' && g.genre !== genreFilter) return false
      if (freeOnly && !g.isFreeToPlay) return false
      return true
    })
  }, [games, search, genreFilter, freeOnly])

  const topRated = useMemo(
    () => games.filter((g) => g.avgRating != null).sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0)).slice(0, 4),
    [games]
  )
  const multiplayer = useMemo(() => games.filter((g) => g.isMultiplayer).slice(0, 4), [games])
  const freeToPlay = useMemo(() => games.filter((g) => g.isFreeToPlay).slice(0, 4), [games])

  const hero = topRated[0] ?? games[0] ?? null

  if (loading) return <p style={{ color: tokens.color.textMuted, padding: 24 }}>Loading store...</p>
  if (error) return <p style={{ color: tokens.color.danger, padding: 24 }}>{error}</p>

  const inputStyle: React.CSSProperties = {
    background: tokens.color.surfaceAlt,
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.sm,
    padding: '8px 12px',
    color: tokens.color.text,
    fontSize: 14,
    fontFamily: tokens.font.body,
  }

  function MiniRow({ title, list }: { title: string; list: Game[] }) {
    if (list.length === 0) return null
    return (
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>{title}</h3>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
          {list.map((g) => {
            const accent = gameAccent(g.name)
            return (
              <div
                key={g.appId}
                onClick={() => navigate(`/player/store/game/${g.appId}`)}
                style={{
                  minWidth: 160,
                  cursor: 'pointer',
                  background: tokens.color.surface,
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.md,
                  padding: 14,
                }}
              >
                <div style={{ width: '100%', height: 6, background: accent, borderRadius: 2, marginBottom: 10 }} />
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{g.name}</div>
                {g.avgRating != null && (
                  <div style={{ fontSize: 12, color: tokens.color.gold }}>★ {g.avgRating.toFixed(1)}</div>
                )}
                {g.isFreeToPlay && <div style={{ fontSize: 11, color: tokens.color.textMuted }}>Free to Play</div>}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontFamily: tokens.font.display, fontSize: 20, marginBottom: 20 }}>Store</h1>

      {hero && (
        <div
          onClick={() => navigate(`/player/store/game/${hero.appId}`)}
          style={{
            height: 160,
            background: gameAccent(hero.name),
            borderRadius: tokens.radius.md,
            marginBottom: 28,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: 24,
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', letterSpacing: 1, marginBottom: 4 }}>
            {hero.avgRating != null ? 'TOP RATED' : 'FEATURED'}
          </div>
          <h2 style={{ fontFamily: tokens.font.display, fontSize: 24, color: '#fff', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>
            {hero.name}
          </h2>
          {hero.genre && <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 }}>{hero.genre}</div>}
        </div>
      )}

      <MiniRow title="Top Rated" list={topRated} />
      <MiniRow title="Multiplayer" list={multiplayer} />
      <MiniRow title="Free to Play" list={freeToPlay} />

      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>All Games</h3>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          placeholder="Search games..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, width: 220 }}
        />
        <select
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          style={{ ...inputStyle, width: 180 }}
        >
          {genres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: tokens.color.textMuted, cursor: 'pointer' }}>
          <input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} />
          Free to Play only
        </label>
      </div>

      {message && <Pill tone={message.includes('successful') || message.includes('Added') ? 'success' : 'warning'}>{message}</Pill>}

      {filteredGames.length === 0 && (
        <p style={{ color: tokens.color.textMuted, marginTop: 16 }}>No games match your filters.</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginTop: 16 }}>
        {filteredGames.map((g) => {
          const accent = gameAccent(g.name)
          return (
            <Card
              key={g.appId}
              accent={accent}
              onClick={() => navigate(`/player/store/game/${g.appId}`)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 6, height: 22, background: accent, borderRadius: 2 }} />
                <div style={{ fontWeight: 700, fontSize: 15 }}>{g.name}</div>
              </div>

              {g.genre && (
                <div style={{ marginBottom: 8 }}>
                  <Pill tone="neutral">{g.genre}</Pill>
                </div>
              )}

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
                <Button variant="primary" onClick={(e) => handleAddToLibrary(e, g.appId)}>
                  Add to Library
                </Button>
              ) : (
                g.gameProduct && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {g.gameProduct.priceCents != null && (
                      <Button variant="primary" onClick={(e) => handleBuy(e, g.gameProduct!.id, 'CASH')}>
                        Buy (cash)
                      </Button>
                    )}
                    {g.gameProduct.priceCoins != null && (
                      <Button variant="secondary" onClick={(e) => handleBuy(e, g.gameProduct!.id, 'COIN')}>
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
