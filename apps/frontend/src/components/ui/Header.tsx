import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { tokens } from '../../theme/tokens'

export function Header() {
  const [open, setOpen] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()

  const menuItemStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    background: 'transparent',
    border: 'none',
    padding: '10px 14px',
    color: tokens.color.text,
    cursor: 'pointer',
    fontSize: 13,
  }

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: 56,
        borderBottom: `1px solid ${tokens.color.border}`,
        background: tokens.color.surface,
      }}
    >
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: tokens.color.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: tokens.font.display,
            fontSize: 11,
            color: '#fff',
          }}
        >
          GP
        </div>
        <span style={{ fontFamily: tokens.font.display, fontSize: 11, color: tokens.color.text }}>
          GAME PLATFORM
        </span>
      </Link>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            background: 'transparent',
            border: `1px solid ${tokens.color.border}`,
            color: tokens.color.text,
            borderRadius: tokens.radius.sm,
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Menu ▾
        </button>
        {open && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 6px)',
              background: tokens.color.surfaceAlt,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.sm,
              minWidth: 140,
              boxShadow: tokens.shadow.card,
              zIndex: 10,
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => {
                setOpen(false)
                navigate('/player/profile')
              }}
              style={menuItemStyle}
            >
              Settings
            </button>
            <button
              onClick={() => {
                setOpen(false)
                logout()
              }}
              style={{ ...menuItemStyle, color: tokens.color.danger }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
