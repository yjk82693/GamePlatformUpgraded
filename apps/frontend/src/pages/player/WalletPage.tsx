import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'

interface WalletData {
  cash: string
  coins: { gold: string; silver: string }
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadWallet()
  }, [])

  async function loadWallet() {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch('/player/wallet')
      setWallet(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p>Loading wallet...</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>
  if (!wallet) return null

  return (
    <div>
      <h2>Wallet</h2>
      <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, minWidth: 140 }}>
          <div style={{ color: '#888', fontSize: 14 }}>Cash</div>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>
            ${(Number(wallet.cash) / 100).toFixed(2)}
          </div>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, minWidth: 140 }}>
          <div style={{ color: '#888', fontSize: 14 }}>Gold</div>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>{wallet.coins.gold}</div>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, minWidth: 140 }}>
          <div style={{ color: '#888', fontSize: 14 }}>Silver</div>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>{wallet.coins.silver}</div>
        </div>
      </div>
      <button onClick={loadWallet} style={{ marginTop: 24 }}>Refresh</button>
    </div>
  )
}
