import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function TypeRoute({ require }: { require: 'isPlayer' | 'isStaff' }) {
  const { accountType, loading } = useAuth()
  if (loading) return <p style={{ textAlign: 'center', marginTop: 80 }}>Loading...</p>
  if (!accountType?.[require]) return <Navigate to="/" replace />
  return <Outlet />
}
