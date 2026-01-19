import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { login } from '../services/api'
import { Eye, EyeOff } from 'lucide-react'
import logo from '/LogoCSaturno.png'

export default function Login() {
  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await login(nombre, password)

      // response tiene la estructura del backend: {success, mensaje, datos: {usuario, accessToken, refreshToken}}
      if (!response.datos || !response.datos.accessToken || !response.datos.refreshToken) {
        throw new Error('Respuesta de login inválida')
      }

      // Guardar autenticación con accessToken y refreshToken
      setAuth(response.datos.usuario, response.datos.accessToken, response.datos.refreshToken)

      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-carpinteria-oscuro via-carpinteria-rojizo to-carpinteria-medio">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
        <div>
          <div className="flex justify-center">
            <img
              src={logo}
              alt="Logo Comercial Saturno"
              className="w-32 h-32 object-contain"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sistema de Gestión
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Carpintería - Panel de Administración
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="nombre" className="sr-only">
                Usuario
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white dark:text-white dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 rounded-t-md focus:outline-none focus:ring-carpinteria-medio focus:border-carpinteria-medio focus:z-10 sm:text-sm"
                placeholder="Admin"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 bg-white dark:text-white dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 rounded-b-md focus:outline-none focus:ring-carpinteria-medio focus:border-carpinteria-medio focus:z-10 sm:text-sm"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-carpinteria-medio hover:bg-carpinteria-rojizo focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-carpinteria-medio disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
