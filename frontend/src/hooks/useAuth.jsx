import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getMe } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('srm_token')
    if (!token) { setLoading(false); return }
    try {
      const u = await getMe()
      setUser(u)
    } catch {
      localStorage.removeItem('srm_token')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  const loginUser = (token, userData) => {
    localStorage.setItem('srm_token', token)
    setUser(userData)
  }

  const logoutUser = () => {
    localStorage.removeItem('srm_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
