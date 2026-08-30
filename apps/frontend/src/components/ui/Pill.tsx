import type { ReactNode } from 'react'
import { tokens } from '../../theme/tokens'

export function Pill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'locked'
}) {
  const toneColors: Record<string, { bg: string; text: string }> = {
    neutral: { bg: tokens.color.surfaceAlt, text: tokens.color.text },
    success: { bg: 'rgba(47,230,196,0.15)', text: tokens.color.mint },
    warning: { bg: 'rgba(245,185,62,0.15)', text: tokens.color.gold },
    locked: { bg: tokens.color.surfaceAlt, text: tokens.color.textMuted },
  }
  const c = toneColors[tone]
  return (
    <span
      style={{
        background: c.bg,
        color: c.text,
        borderRadius: tokens.radius.sm,
        padding: '4px 10px',
        fontSize: 12,
        fontWeight: 600,
        display: 'inline-block',
      }}
    >
      {children}
    </span>
  )
}
