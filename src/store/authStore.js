import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      
      setAuth: (user, token, refreshToken) => {
        set({ 
          user, 
          token,
          refreshToken,
          isAuthenticated: true 
        })
      },
      
      // Nuevo método para actualizar solo el token (usado en renovación automática)
      updateToken: (token, refreshToken) => {
        set({ token, refreshToken })
      },
      
      logout: () => {
        set({ 
          user: null, 
          token: null,
          refreshToken: null,
          isAuthenticated: false 
        })
        localStorage.removeItem('auth-storage')
      },
      
      // Método helper para verificar si está autenticado
      checkAuth: () => {
        const state = get()
        return state.isAuthenticated && state.token !== null
      }
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
    }
  )
)
