import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { StatCard, Button } from '../../components/ui'
import { tokens } from '../../theme/tokens'

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

  if (loading) return <p style={{ padding: 24, color: tokens.color.textMuted }}>Loading wallet...</p>
  if (error) return <p style={{ padding: 24, color: tokens.color.danger }}>{error}</p>
  if (!wallet) return null

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontFamily: tokens.font.display, fontSize: 20, marginBottom: 24 }}>Wallet</h1>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatCard label="Cash" value={`$${(Number(wallet.cash) / 100).toFixed(2)}`} />
        <StatCard label="Gold" value={wallet.coins.gold} />
        <StatCard label="Silver" value={wallet.coins.silver} />
      </div>
      <Button variant="secondary" onClick={loadWallet}>Refresh</Button>
    </div>
  )
}
