import { NavLink, Outlet } from 'react-router-dom'
import { tokens } from '../../theme/tokens'
import { Header } from '../../components/ui'

const links = [
  { to: '/player', label: 'Library', end: true },
  { to: '/player/store', label: 'Store' },
  { to: '/player/topup', label: 'Topup Center' },
  { to: '/player/wallet', label: 'Wallet' },
  { to: '/player/profile', label: 'Profile' },
  { to: '/player/social', label: 'Friends' },
  { to: '/player/rankings', label: 'Achievements' },
  { to: '/player/tickets', label: 'Support' },
]

export default function PlayerLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1 }}>
        <nav
          style={{
            width: 220,
            background: tokens.color.surface,
            borderRight: `1px solid ${tokens.color.border}`,
            padding: '24px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              style={({ isActive }) => ({
                display: 'block',
                padding: '10px 12px',
                borderRadius: tokens.radius.sm,
                color: isActive ? '#fff' : tokens.color.textMuted,
                background: isActive ? tokens.color.accent : 'transparent',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 500,
                fontSize: 14,
                transition: 'background 0.15s ease',
              })}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <main style={{ flex: 1, background: tokens.color.bg, color: tokens.color.text }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
