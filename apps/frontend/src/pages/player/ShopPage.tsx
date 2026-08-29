import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'

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

  if (loading) return <p>Loading shop...</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>

  const grouped = products.reduce<Record<string, Product[]>>((acc, p) => {
    const key = p.app?.name ?? p.appId
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})

  return (
    <div>
      <h2>Shop</h2>
      {message && <p style={{ color: message.includes('successful') ? 'green' : 'red' }}>{message}</p>}
      {products.length === 0 && <p>No products available.</p>}
      {Object.entries(grouped).map(([gameName, items]) => (
        <div key={gameName} style={{ marginBottom: 32 }}>
          <h3>{gameName}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {items.map((p) => (
              <div key={p.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
                <strong>{p.name}</strong>
                <div style={{ margin: '8px 0', color: '#555' }}>
                  {p.priceCents != null && <div>${(p.priceCents / 100).toFixed(2)}</div>}
                  {p.priceCoins != null && <div>{p.priceCoins} coins</div>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {p.priceCents != null && (
                    <button onClick={() => handlePurchase(p.id, 'CASH')}>Buy (cash)</button>
                  )}
                  {p.priceCoins != null && (
                    <button onClick={() => handlePurchase(p.id, 'COIN')}>Buy (coins)</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
