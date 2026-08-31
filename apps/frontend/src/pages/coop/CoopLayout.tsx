import { Outlet, Link, useLocation } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import type { MenuProps } from 'antd'
import { Header } from '../../components/ui'

const { Sider, Content } = Layout

const items: MenuProps['items'] = [
  { key: '/coop', label: <Link to="/coop">Chat</Link> },
  { key: '/coop/planner', label: <Link to="/coop/planner">Planner & Calendar</Link> },
  { key: '/coop/workspace', label: <Link to="/coop/workspace">Workspace</Link> },
  { key: '/coop/tasks', label: <Link to="/coop/tasks">Tasks</Link> },
]

export default function CoopLayout() {
  const location = useLocation()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Layout style={{ flex: 1 }}>
        <Sider width={220} theme="dark">
          <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={items} />
        </Sider>
        <Content style={{ padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </div>
  )
}
