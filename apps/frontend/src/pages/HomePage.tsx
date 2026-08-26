import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function HomePage() {
  const { logout, accountType, loading } = useAuth()

  if (loading) return <p style={{ textAlign: 'center', marginTop: 80 }}>Loading...</p>

  return (
    <div style={{ maxWidth: 480, margin: '80px auto', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>Game Platform</h1>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 24 }}>
        {accountType?.isPlayer && <Link to="/player">Player</Link>}
        {accountType?.isStaff && <Link to="/distributor">Distributor</Link>}
        {accountType?.isStaff && <Link to="/coop">Co-op</Link>}
      </div>
      {!accountType?.isPlayer && !accountType?.isStaff && (
        <p style={{ color: '#888', marginTop: 24 }}>
          This account isn't set up as a player or staff member yet.
        </p>
      )}
      <button onClick={logout} style={{ marginTop: 40 }}>Log out</button>
    </div>
  )
}
