import { tokens } from '../../theme/tokens'
import { Card } from './Card'

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card style={{ minWidth: 120, textAlign: 'center' }}>
      <div style={{ fontFamily: tokens.font.display, fontSize: 18, color: tokens.color.accentSoft }}>
        {value}
      </div>
      <div style={{ color: tokens.color.textMuted, fontSize: 11, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
    </Card>
  )
}
