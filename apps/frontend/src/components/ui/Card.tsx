import type { ReactNode, CSSProperties, MouseEventHandler } from 'react'
import { tokens } from '../../theme/tokens'

export function Card({
  children,
  accent,
  style,
  onClick,
}: {
  children: ReactNode
  accent?: string
  style?: CSSProperties
  onClick?: MouseEventHandler<HTMLDivElement>
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderTop: accent ? `3px solid ${accent}` : `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius.md,
        padding: 16,
        boxShadow: tokens.shadow.card,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.12s ease, box-shadow 0.12s ease',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
