import { ConfigProvider } from 'antd'
import { Outlet } from 'react-router-dom'
import { antTheme } from '../../theme/antTheme'

export function StaffThemeProvider() {
  return (
    <ConfigProvider theme={antTheme}>
      <Outlet />
    </ConfigProvider>
  )
}
