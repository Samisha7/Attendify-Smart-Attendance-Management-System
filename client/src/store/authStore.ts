import { create } from 'zustand'
import api from '../lib/api'

export interface User {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  loadUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token })
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true })
    try {
      const { data } = await api.post('/auth/register', { name, email, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token })
    } finally {
      set({ isLoading: false })
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  },

  loadUser: async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const { data } = await api.get('/auth/me')
      set({ user: data, token })
      localStorage.setItem('user', JSON.stringify(data))
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      set({ user: null, token: null })
    }
  },
}))
