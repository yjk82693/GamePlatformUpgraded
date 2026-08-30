import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { Card, Button, Pill } from '../../components/ui'
import { tokens, gameAccent } from '../../theme/tokens'

interface Product {
  id: string
  appId: string
  name: string
  priceCents: number | null
  priceCoins: number | null
  app?: { name: string }
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch('/player/shop/browse')
      setProducts(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handlePurchase(productId: string, payWith: 'CASH' | 'COIN') {
    setMessage(null)
    try {
      await apiFetch('/player/shop/purchase', {
        method: 'POST',
        body: JSON.stringify({ productId, payWith }),
      })
      setMessage('Purchase successful!')
    } catch (err) {
      setMessage((err as Error).message)
    }
  }

  if (loading) return <p style={{ color: tokens.color.textMuted, padding: 24 }}>Loading shop...</p>
  if (error) return <p style={{ color: tokens.color.danger, padding: 24 }}>{error}</p>

  const grouped = products.reduce<Record<string, Product[]>>((acc, p) => {
    const key = p.app?.name ?? p.appId
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontFamily: tokens.font.display, fontSize: 20, marginBottom: 24 }}>Shop</h1>

      {message && (
        <Pill tone={message.includes('successful') ? 'success' : 'warning'}>{message}</Pill>
      )}

      {products.length === 0 && <p style={{ color: tokens.color.textMuted }}>No products available.</p>}

      {Object.entries(grouped).map(([gameName, items]) => {
        const accent = gameAccent(gameName)
        return (
          <div key={gameName} style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 6, height: 22, background: accent, borderRadius: 2 }} />
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{gameName}</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 }}>
              {items.map((p) => (
                <Card key={p.id} accent={accent}>
                  <div style={{ fontWeight: 600, marginBottom: 10 }}>{p.name}</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    {p.priceCents != null && (
                      <span style={{ fontFamily: tokens.font.mono, color: tokens.color.text, fontSize: 14 }}>
                        ${(p.priceCents / 100).toFixed(2)}
                      </span>
                    )}
                    {p.priceCoins != null && (
                      <span style={{ fontFamily: tokens.font.mono, color: tokens.color.gold, fontSize: 14 }}>
                        {p.priceCoins} coins
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {p.priceCents != null && (
                      <Button variant="primary" onClick={() => handlePurchase(p.id, 'CASH')}>
                        Buy (cash)
                      </Button>
                    )}
                    {p.priceCoins != null && (
                      <Button variant="secondary" onClick={() => handlePurchase(p.id, 'COIN')}>
                        Buy (coins)
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
