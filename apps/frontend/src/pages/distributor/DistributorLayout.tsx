import { Outlet, Link, useLocation } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import type { MenuProps } from 'antd'
import { Header } from '../../components/ui'

const { Sider, Content } = Layout

const items: MenuProps['items'] = [
  { key: '/distributor', label: <Link to="/distributor">Catalog</Link> },
  { key: '/distributor/members', label: <Link to="/distributor/members">Members & Roles</Link> },
  { key: '/distributor/appops', label: <Link to="/distributor/appops">App Operations</Link> },
  { key: '/distributor/payments', label: <Link to="/distributor/payments">Payments</Link> },
  { key: '/distributor/stats', label: <Link to="/distributor/stats">Statistics</Link> },
  { key: '/distributor/config', label: <Link to="/distributor/config">Leaderboard / Terms / Redeem</Link> },
  { key: '/distributor/tickets', label: <Link to="/distributor/tickets">Support</Link> },
  { key: '/distributor/logs', label: <Link to="/distributor/logs">Logs</Link> },
]

export default function DistributorLayout() {
  const location = useLocation()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Layout style={{ flex: 1 }}>
        <Sider width={240} theme="dark">
          <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={items} />
        </Sider>
        <Content style={{ padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </div>
  )
}
