import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/coop', label: 'Chat', end: true },
  { to: '/coop/planner', label: 'Planner & Calendar' },
  { to: '/coop/workspace', label: 'Workspace' },
  { to: '/coop/tasks', label: 'Tasks' },
]

export default function CoopLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <nav style={{ width: 200, borderRight: '1px solid #ddd', padding: 16 }}>
        <h3>Co-op</h3>
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
