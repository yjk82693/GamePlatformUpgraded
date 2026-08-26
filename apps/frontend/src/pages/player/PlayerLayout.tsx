import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/player', label: 'Shop', end: true },
  { to: '/player/wallet', label: 'Wallet' },
  { to: '/player/profile', label: 'Profile' },
  { to: '/player/social', label: 'Friends' },
  { to: '/player/rankings', label: 'Rankings' },
  { to: '/player/tickets', label: 'Support' },
]

export default function PlayerLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <nav style={{ width: 200, borderRight: '1px solid #ddd', padding: 16 }}>
        <h3>Player</h3>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} style={{ display: 'block', margin: '8px 0' }}>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <main style={{ flex: 1, padding: 24 }}>
        <Outlet />
      </main>
    </div>
  )
}
