import React, {createContext, useContext, useState, useEffect} from 'react'
import {User, Role} from '../types'
import {getCurrentUser, loginUser, registerUser} from '../api/client'

interface AuthContextType {
  user: User | null
  role: Role | null
  token: string | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, role: Role) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('assess_token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const u = await getCurrentUser()
          setUser(u)
          setRole(u.role)
        } catch {
          localStorage.removeItem('assess_token')
          setToken(null)
          setUser(null)
          setRole(null)
        }
      }
      setIsLoading(false)
    }
    initAuth()
  }, [token])

  const login = async (username: string, password: string) => {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)
    const data = await loginUser(formData)
    localStorage.setItem('assess_token', data.access_token)
    setToken(data.access_token)
    setRole(data.role)
    const u = await getCurrentUser()
    setUser(u)
  }

  const register = async (username: string, email: string, password: string, role: Role) => {
    const data = await registerUser({username, email, password, role})
    localStorage.setItem('assess_token', data.access_token)
    setToken(data.access_token)
    setRole(data.role)
    const u = await getCurrentUser()
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem('assess_token')
    setToken(null)
    setUser(null)
    setRole(null)
  }

  return (
    <AuthContext.Provider value={{user, role, token, isLoading, login, register, logout}}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
