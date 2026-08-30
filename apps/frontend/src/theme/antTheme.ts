import { theme } from 'antd'
import { tokens } from './tokens'

export const antTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: tokens.color.accent,
    colorBgBase: tokens.color.bg,
    colorBgContainer: tokens.color.surface,
    borderRadius: 8,
    fontFamily: tokens.font.body,
  },
}
