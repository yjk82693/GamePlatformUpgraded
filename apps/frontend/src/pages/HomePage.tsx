import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { tokens } from '../theme/tokens'
import { Button } from '../components/ui'

export default function HomePage() {
  const { logout, accountType, loading } = useAuth()

  if (loading) return <p style={{ textAlign: 'center', marginTop: 80, color: tokens.color.textMuted }}>Loading...</p>

  const linkStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '12px 20px',
    borderRadius: tokens.radius.md,
    background: tokens.color.surface,
    border: `1px solid ${tokens.color.border}`,
    color: tokens.color.text,
    textDecoration: 'none',
    fontWeight: 600,
  }

  const isStaff = accountType?.isStaff
  const isPlayer = accountType?.isPlayer

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <h1 style={{ fontFamily: tokens.font.display, fontSize: 22, marginBottom: 32 }}>Game Platform</h1>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {isStaff && <Link to="/distributor" style={linkStyle}>Game Management</Link>}
          {isStaff && <Link to="/coop" style={linkStyle}>Workspace</Link>}
          {!isStaff && isPlayer && <Link to="/player" style={linkStyle}>Player</Link>}
        </div>
        {!isStaff && !isPlayer && (
          <p style={{ color: tokens.color.textMuted, marginTop: 24 }}>
            This account isn't set up as a player or staff member yet.
          </p>
        )}
        <div style={{ marginTop: 48 }}>
          <Button variant="ghost" onClick={logout}>Log out</Button>
        </div>
      </div>
    </div>
  )
}
