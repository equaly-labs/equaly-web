'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import NextImage from 'next/image'
import { API_URL } from '@/config'

interface User {
  _id: string
  name: string
  phone: string
  upiId?: string
  profilePhotoUrl?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (userData: User, token: string) => void
  logout: () => void
  isLoading: boolean
  showSplash: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSplash, setShowSplash] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('equaly_token')
    localStorage.removeItem('equaly_user')
    router.replace('/login')
  }, [router])

  const refreshProfile = useCallback(async () => {
    const savedToken = localStorage.getItem('equaly_token')
    if (!savedToken) return

    try {
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `${savedToken}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        localStorage.setItem('equaly_user', JSON.stringify(userData))
      } else if (response.status === 401) {
        logout()
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    }
  }, [logout])

  useEffect(() => {
    const splashShown = typeof window !== 'undefined' && sessionStorage.getItem('equaly_splash_shown')
    if (splashShown) {
      setShowSplash(false)
    } else {
      const timer = setTimeout(() => {
        setShowSplash(false)
        if (typeof window !== 'undefined') sessionStorage.setItem('equaly_splash_shown', 'true')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('equaly_token')
      const savedUser = localStorage.getItem('equaly_user')

      if (savedToken) {
        setToken(savedToken)
        if (savedUser) {
          setUser(JSON.parse(savedUser))
        }
        await refreshProfile()
      }
      setIsLoading(false)
    }
    initAuth()
  }, [refreshProfile])

  useEffect(() => {
    if (isLoading || showSplash) return

    const publicPaths = ['/login', '/register']
    const isPublicPath = publicPaths.includes(pathname)

    if (user && isPublicPath) {
      router.replace('/')
    } else if (!user && !isPublicPath) {
      router.replace('/login')
    }
  }, [user, pathname, isLoading, showSplash, router])

  const login = (userData: User, token: string) => {
    setUser(userData)
    setToken(token)
    localStorage.setItem('equaly_token', token)
    localStorage.setItem('equaly_user', JSON.stringify(userData))
    router.replace('/')
  }

  // Strict Permission Engine
  const publicPaths = ['/login', '/register']
  const isPublicPath = publicPaths.includes(pathname)

  // Decide whether to show content
  const shouldRenderContent = !isLoading && !showSplash && (
    (user && !isPublicPath) || (!user && isPublicPath)
  )

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, showSplash, refreshProfile }}>
      {(showSplash || isLoading) ? (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[200] animate-in fade-in duration-700">
          <div className="relative group overflow-visible">
            <div className="absolute inset-0 bg-white/5 blur-[80px] rounded-full scale-150 animate-pulse"></div>
            <div className="relative h-20 w-20 bg-white/[0.03] border border-white/10 rounded-[1rem] flex items-center justify-center shadow-[0_0_100px_rgba(255,255,255,0.05)]">
              <NextImage src="/icon.png" alt="Splash Icon" width={70} height={70} className="object-contain" priority />
            </div>
          </div>
          <div className="mt-10 text-center animate-in slide-in-from-bottom-8 duration-1000 delay-300">
            <h1 className="text-2xl font-black text-white tracking-[0.3em] ml-[0.3em] last:mr-0 uppercase leading-none">EQUALY</h1>
            <p className="mt-6 text-[9px] font-black text-white/20 uppercase tracking-[0.4em] ml-[0.4em] flex items-center justify-center gap-3">
              Initialize secure session
              <span className="h-2 w-2 border-[1.5px] border-white/10 border-t-white/60 rounded-full animate-spin"></span>
            </p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
