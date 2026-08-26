import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { getToken, setToken as saveToken, apiFetch } from '../lib/api'

interface AccountType {
  isPlayer: boolean
  isStaff: boolean
}

interface AuthContextValue {
  token: string | null
  accountType: AccountType | null
  loading: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken())
  const [accountType, setAccountType] = useState<AccountType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setAccountType(null)
      setLoading(false)
      return
    }
    setLoading(true)
    apiFetch('/auth/me')
      .then((data) => setAccountType({ isPlayer: data.isPlayer, isStaff: data.isStaff }))
      .catch(() => setAccountType(null))
      .finally(() => setLoading(false))
  }, [token])

  function login(newToken: string) {
    saveToken(newToken)
    setTokenState(newToken)
  }

  function logout() {
    saveToken(null)
    setTokenState(null)
    setAccountType(null)
  }

  return (
    <AuthContext.Provider value={{ token, accountType, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
