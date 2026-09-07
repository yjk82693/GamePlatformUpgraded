import { Outlet } from 'react-router-dom'
import { Header } from '../../components/ui'

export default function PlayerLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Outlet />
    </div>
  )
}
