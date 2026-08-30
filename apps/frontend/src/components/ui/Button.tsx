import type { ButtonHTMLAttributes } from 'react'
import { tokens } from '../../theme/tokens'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function Button({ variant = 'primary', style, ...props }: ButtonProps) {
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: tokens.color.accent, color: '#fff', border: 'none' },
    secondary: { background: tokens.color.surfaceAlt, color: tokens.color.text, border: `1px solid ${tokens.color.border}` },
    ghost: { background: 'transparent', color: tokens.color.accentSoft, border: 'none' },
  }
  return (
    <button
      {...props}
      style={{
        ...variants[variant],
        borderRadius: tokens.radius.sm,
        padding: '8px 14px',
        fontWeight: 600,
        fontSize: 13,
        cursor: 'pointer',
        ...style,
      }}
    />
  )
}
