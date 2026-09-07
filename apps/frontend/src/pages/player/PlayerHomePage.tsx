import { useNavigate } from 'react-router-dom'
import { tokens } from '../../theme/tokens'
import { Card } from '../../components/ui'

export default function PlayerHomePage() {
  const navigate = useNavigate()
  return (
    <div style={{ padding: 24, maxWidth: 700, margin: '60px auto 0' }}>
      <h1 style={{ fontFamily: tokens.font.display, fontSize: 22, marginBottom: 32, textAlign: 'center' }}>
        Player
      </h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card onClick={() => navigate('/player/profile')} style={{ padding: 32, textAlign: 'center', cursor: 'pointer' }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Profile</div>
          <div style={{ color: tokens.color.textMuted, fontSize: 13 }}>
            Library, wallet, friends, achievements & support
          </div>
        </Card>
        <Card onClick={() => navigate('/player/store')} style={{ padding: 32, textAlign: 'center', cursor: 'pointer' }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Store</div>
          <div style={{ color: tokens.color.textMuted, fontSize: 13 }}>
            Browse and purchase games
          </div>
        </Card>
      </div>
    </div>
  )
}
