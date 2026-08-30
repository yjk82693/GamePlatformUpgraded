import { tokens } from '../../theme/tokens'

export function ProgressBar({ current, total, color }: { current: number; total: number; color?: string }) {
  const pct = total ? Math.min(100, (current / total) * 100) : 0
  return (
    <div style={{ background: tokens.color.surfaceAlt, borderRadius: 4, height: 8 }}>
      <div
        style={{
          width: `${pct}%`,
          background: color ?? tokens.color.accent,
          height: 8,
          borderRadius: 4,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  )
}
