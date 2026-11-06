import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import authApi from '../api/auth.api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('borrowbox_user')
    try {
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('borrowbox_token'))
  const [loading, setLoading] = useState(true)
  const [demoUsers, setDemoUsers] = useState([])

  // Load demo users roster on app startup
  useEffect(() => {
    authApi
      .getDemoUsers()
      .then((res) => {
        if (res?.data) {
          setDemoUsers(res.data)
        }
      })
      .catch((err) => {
        console.warn('Failed to pre-fetch demo users:', err.message)
      })
  }, [])

  // Verify stored session on mount
  const verifySession = useCallback(async () => {
    const storedToken = localStorage.getItem('borrowbox_token')
    if (!storedToken) {
      setLoading(false)
      return
    }

    try {
      const res = await authApi.getMe()
      if (res?.data) {
        setUser(res.data)
        localStorage.setItem('borrowbox_user', JSON.stringify(res.data))
      }
    } catch {
      // Token invalid or expired
      localStorage.removeItem('borrowbox_token')
      localStorage.removeItem('borrowbox_user')
      setUser(null)
      setToken(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    verifySession()

    const handleAuthChange = () => {
      setUser(null)
      setToken(null)
    }
    window.addEventListener('borrowbox_auth_changed', handleAuthChange)
    return () => window.removeEventListener('borrowbox_auth_changed', handleAuthChange)
  }, [verifySession])

  const setAuthSession = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('borrowbox_token', authToken)
    localStorage.setItem('borrowbox_user', JSON.stringify(userData))
  }

  const demoLogin = async (email) => {
    const res = await authApi.demoLogin(email)
    if (res?.data) {
      setAuthSession(res.data.user, res.data.token)
    }
    return res?.data
  }

  const login = async (email, password) => {
    const res = await authApi.login(email, password)
    if (res?.data) {
      setAuthSession(res.data.user, res.data.token)
    }
    return res?.data
  }

  const register = async (userData) => {
    const res = await authApi.register(userData)
    if (res?.data) {
      setAuthSession(res.data.user, res.data.token)
    }
    return res?.data
  }

  const logout = () => {
    localStorage.removeItem('borrowbox_token')
    localStorage.removeItem('borrowbox_user')
    setUser(null)
    setToken(null)
  }

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe()
      if (res?.data) {
        setUser(res.data)
        localStorage.setItem('borrowbox_user', JSON.stringify(res.data))
      }
    } catch {
      // Ignored
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        demoUsers,
        demoLogin,
        login,
        register,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

