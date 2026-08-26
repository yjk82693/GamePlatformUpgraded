import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/distributor', label: 'Catalog', end: true },
  { to: '/distributor/members', label: 'Members & Roles' },
  { to: '/distributor/appops', label: 'App Operations' },
  { to: '/distributor/payments', label: 'Payments' },
  { to: '/distributor/stats', label: 'Statistics' },
  { to: '/distributor/config', label: 'Leaderboard/Terms/Redeem' },
  { to: '/distributor/tickets', label: 'Support' },
  { to: '/distributor/logs', label: 'Logs' },
]

export default function DistributorLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <nav style={{ width: 220, borderRight: '1px solid #ddd', padding: 16 }}>
        <h3>Distributor</h3>
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
