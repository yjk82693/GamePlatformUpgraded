import { NavLink, Outlet } from 'react-router-dom'
import { tokens } from '../../theme/tokens'

const links = [
  { to: '/player/profile', label: 'Library', end: true },
  { to: '/player/profile/wallet', label: 'Wallet' },
  { to: '/player/profile/info', label: 'Profile Info' },
  { to: '/player/profile/friends', label: 'Friends' },
  { to: '/player/profile/achievements', label: 'Achievements' },
  { to: '/player/profile/support', label: 'Support' },
]

export default function ProfileSection() {
  return (
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
  )
}
