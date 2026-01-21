import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const auth = JSON.parse(localStorage.getItem('auth-storage') || '{}')
    const token = auth?.state?.token
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Variable para controlar si hay una renovación en curso
let isRefreshing = false
// Cola de peticiones que esperan al token renovado
let failedQueue = []

// Función para procesar la cola de peticiones pendientes
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  
  failedQueue = []
}

// Interceptor para manejar errores de respuesta y renovación automática de tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // Solo intentar renovar si:
    // 1. El error es 401 (no autorizado)
    // 2. No estamos ya en la página de login
    // 3. No es un intento de login fallido
    // 4. No es un intento de renovación de token fallido
    // 5. No hemos intentado renovar esta petición antes
    if (
      error.response?.status === 401 &&
      !window.location.pathname.includes('/login') &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest._retry
    ) {
      // Si ya hay una renovación en curso, esperar a que termine
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch(err => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Obtener refreshToken del localStorage
        const auth = JSON.parse(localStorage.getItem('auth-storage') || '{}')
        const refreshToken = auth?.state?.refreshToken

        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        // Llamar al endpoint de renovación
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          { refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
            }
          }
        )

        // Extraer los nuevos tokens
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.datos

        // Actualizar en localStorage
        const updatedAuth = {
          ...auth,
          state: {
            ...auth.state,
            token: newAccessToken,
            refreshToken: newRefreshToken
          }
        }
        localStorage.setItem('auth-storage', JSON.stringify(updatedAuth))

        // Actualizar header de la petición original
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        
        // Procesar cola de peticiones pendientes con el nuevo token
        processQueue(null, newAccessToken)
        
        isRefreshing = false

        // Reintentar la petición original con el nuevo token
        return api(originalRequest)
      } catch (refreshError) {
        // Si la renovación falla, limpiar y redirigir al login
        processQueue(refreshError, null)
        isRefreshing = false
        
        localStorage.removeItem('auth-storage')
        window.location.href = '/login'
        
        return Promise.reject(refreshError)
      }
    }

    // Para cualquier otro error, simplemente rechazar
    return Promise.reject(error)
  }
)

// Helper para extraer datos de la respuesta del backend
const extraerDatos = (response) => {
  // El backend devuelve: { success, mensaje, datos, metadatos }
  // Para endpoints con paginación, retorna { datos, paginacion }
  // Para endpoints sin paginación, retorna solo datos
  const backendData = response.data
  
  // IMPORTANTE: Verificar primero si tiene paginación antes que solo datos
  if (backendData?.metadatos?.paginacion) {
    return {
      datos: backendData.datos || [],
      paginacion: backendData.metadatos.paginacion
    }
  }
  
  // Si solo tiene datos (sin paginación)
  if (backendData?.datos !== undefined) {
    return backendData.datos || []
  }
  
  // Fallback para compatibilidad
  return backendData?.data || backendData || []
}

// Rate limiting removido para evitar problemas

// ============== AUTH ==============
export const login = async (nombre, password) => {
  try {
    const response = await api.post('/auth/login', { nombre, password })
    // Login devuelve la estructura completa para acceder a usuario y token
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || error.response?.data?.message || 'Error al iniciar sesión')
  }
}

export const register = async (userData) => {
  try {
    const response = await api.post('/auth/registro', userData)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || 'Error al registrar usuario')
  }
}

// ============== PRODUCTOS ==============
export const getProductos = async (params = {}) => {
  try {
    const response = await api.get('/productos', { params })
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || error.response?.data?.message || 'Error al obtener productos')
  }
}

// Nueva función para obtener lista simple de productos (sin paginación)
export const getProductosListaSimple = async () => {
  try {
    const response = await api.get('/productos/lista-simple')
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || error.response?.data?.message || 'Error al obtener lista de productos')
  }
}

export const getProducto = async (id) => {
  try {
    const response = await api.get(`/productos/${id}`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || 'Error al obtener producto')
  }
}

export const createProducto = async (productoData) => {
  try {
    console.log('Creando producto con datos:', productoData)
    const response = await api.post('/productos', productoData)
    return extraerDatos(response)
  } catch (error) {
    console.error('Error response completo:', error.response?.data)
    // Capturar mensaje de error con detalles de validación
    let errorMsg = 'Error al crear producto'
    if (error.response?.data) {
      const errorData = error.response.data
      if (errorData.details && Array.isArray(errorData.details)) {
        errorMsg = errorData.details.join('. ')
      } else if (errorData.message) {
        errorMsg = errorData.message
      } else if (errorData.mensaje) {
        errorMsg = errorData.mensaje
      }
    }
    throw new Error(errorMsg)
  }
}

export const updateProducto = async (id, productoData) => {
  try {
    console.log('Actualizando producto ID:', id)
    console.log('Datos enviados:', productoData)
    const response = await api.put(`/productos/${id}`, productoData)
    return response.data
  } catch (error) {
    console.error('Error response completo:', error.response?.data)
    console.error('Details:', error.response?.data?.details)
    console.log('Details stringified:', JSON.stringify(error.response?.data?.details, null, 2))
    // Capturar mensaje de error con detalles de validación
    let errorMsg = 'Error al actualizar producto'
    if (error.response?.data) {
      const errorData = error.response.data
      if (errorData.details && Array.isArray(errorData.details)) {
        errorMsg = errorData.details.join('. ')
      } else if (errorData.message) {
        errorMsg = errorData.message
      } else if (errorData.mensaje) {
        errorMsg = errorData.mensaje
      }
    }
    throw new Error(errorMsg)
  }
}

export const deleteProducto = async (id) => {
  try {
    const response = await api.delete(`/productos/${id}`)
    return response.data
  } catch (error) {
    // Capturar mensaje de error del backend (puede ser message o mensaje)
    const errorMsg = error.response?.data?.message || error.response?.data?.mensaje || 'Error al eliminar producto'
    throw new Error(errorMsg)
  }
}

export const getProductosPapelera = async () => {
  try {
    const response = await api.get('/productos/papelera')
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || 'Error al obtener productos en papelera')
  }
}

export const restaurarProducto = async (id) => {
  try {
    const response = await api.patch(`/productos/${id}/restaurar`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || 'Error al restaurar producto')
  }
}

export const eliminarProductoPermanentemente = async (id) => {
  try {
    const response = await api.delete(`/productos/${id}/permanente`)
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.mensaje || error.response?.data?.message || 'Error al eliminar producto permanentemente'
    throw new Error(errorMsg)
  }
}

export const vaciarPapeleraProductos = async () => {
  try {
    const response = await api.delete('/productos/papelera/vaciar')
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.mensaje || error.response?.data?.message || 'Error al vaciar papelera'
    throw new Error(errorMsg)
  }
}

// ============== CATEGORIAS ==============
export const getCategorias = async (params = {}) => {
  try {
    const response = await api.get('/categorias', { params })
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || error.response?.data?.message || 'Error al obtener categorías')
  }
}

export const createCategoria = async (categoriaData) => {
  try {
    const response = await api.post('/categorias', categoriaData)
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || error.response?.data?.message || 'Error al crear categoría')
  }
}

export const updateCategoria = async (id, categoriaData) => {
  try {
    const response = await api.put(`/categorias/${id}`, categoriaData)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || 'Error al actualizar categoría')
  }
}

export const deleteCategoria = async (id) => {
  try {
    const response = await api.delete(`/categorias/${id}`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || 'Error al eliminar categoría')
  }
}

export const getCategoriasPapelera = async () => {
  try {
    const response = await api.get('/categorias/papelera')
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || 'Error al obtener categorías en papelera')
  }
}

export const restaurarCategoria = async (id) => {
  try {
    const response = await api.patch(`/categorias/${id}/restaurar`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || 'Error al restaurar categoría')
  }
}

export const eliminarCategoriaPermanentemente = async (id) => {
  try {
    const response = await api.delete(`/categorias/${id}/permanente`)
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.mensaje || error.response?.data?.message || 'Error al eliminar categoría permanentemente'
    throw new Error(errorMsg)
  }
}

export const vaciarPapeleraCategorias = async () => {
  try {
    const response = await api.delete('/categorias/papelera/vaciar')
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.mensaje || error.response?.data?.message || 'Error al vaciar papelera'
    throw new Error(errorMsg)
  }
}

// ============== MOVIMIENTOS ==============
export const getMovimientos = async (params = {}) => {
  try {
    const response = await api.get('/movimientos', { params })
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || error.response?.data?.message || 'Error al obtener movimientos')
  }
}

export const getMovimientosPorProducto = async (idProducto, params = {}) => {
  try {
    const response = await api.get(`/movimientos/producto/${idProducto}/historial`, { params })
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || error.response?.data?.message || 'Error al obtener movimientos del producto')
  }
}

export const getMovimientosPorTipo = async (tipo, params = {}) => {
  try {
    const response = await api.get('/movimientos', { 
      params: { 
        ...params, 
        tipo_movimiento: tipo 
      } 
    })
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || error.response?.data?.message || 'Error al obtener movimientos por tipo')
  }
}

export const createMovimientoEntrada = async (data) => {
  try {
    const response = await api.post('/movimientos/entrada', data)
    return extraerDatos(response)
  } catch (error) {
    // Capturar mensaje de error con detalles de validación
    let errorMsg = 'Error al crear entrada de inventario'
    if (error.response?.data) {
      const errorData = error.response.data
      if (errorData.details && Array.isArray(errorData.details)) {
        errorMsg = errorData.details.join('. ')
      } else if (errorData.message) {
        errorMsg = errorData.message
      } else if (errorData.mensaje) {
        errorMsg = errorData.mensaje
      }
    }
    throw new Error(errorMsg)
  }
}

export const createMovimientoSalida = async (data) => {
  try {
    const response = await api.post('/movimientos/salida', data)
    return extraerDatos(response)
  } catch (error) {
    // Capturar mensaje de error con detalles de validación
    let errorMsg = 'Error al crear salida de inventario'
    if (error.response?.data) {
      const errorData = error.response.data
      if (errorData.details && Array.isArray(errorData.details)) {
        errorMsg = errorData.details.join('. ')
      } else if (errorData.message) {
        errorMsg = errorData.message
      } else if (errorData.mensaje) {
        errorMsg = errorData.mensaje
      }
    }
    throw new Error(errorMsg)
  }
}

// ============== CLIENTES ==============
export const getClientes = async (params = {}) => {
  try {
    const response = await api.get('/clientes', { params })
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || error.response?.data?.message || 'Error al obtener clientes')
  }
}

export const createCliente = async (clienteData) => {
  try {
    const response = await api.post('/clientes', clienteData)
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || error.response?.data?.message || 'Error al crear cliente')
  }
}

export const updateCliente = async (id, clienteData) => {
  try {
    const response = await api.put(`/clientes/${id}`, clienteData)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || 'Error al actualizar cliente')
  }
}

export const deleteCliente = async (id) => {
  try {
    const response = await api.delete(`/clientes/${id}`)
    return response.data
  } catch (error) {
    // Intentar extraer el mensaje de error de múltiples posibles ubicaciones
    const errorMsg = error.response?.data?.mensaje || 
                     error.response?.data?.message || 
                     error.response?.data?.error ||
                     error.message || 
                     'Error al eliminar cliente'
    throw new Error(errorMsg)
  }
}

export const getClientesPapelera = async () => {
  try {
    const response = await api.get('/clientes/papelera')
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || 'Error al obtener clientes en papelera')
  }
}

export const restaurarCliente = async (id) => {
  try {
    const response = await api.patch(`/clientes/${id}/restaurar`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || 'Error al restaurar cliente')
  }
}

export const eliminarClientePermanentemente = async (id) => {
  try {
    const response = await api.delete(`/clientes/${id}/permanente`)
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.mensaje || error.response?.data?.message || 'Error al eliminar cliente permanentemente'
    throw new Error(errorMsg)
  }
}

export const vaciarPapeleraClientes = async () => {
  try {
    const response = await api.delete('/clientes/papelera/vaciar')
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.mensaje || error.response?.data?.message || 'Error al vaciar papelera'
    throw new Error(errorMsg)
  }
}

// ============== VENTAS ==============
export const getVentas = async (params = {}) => {
  try {
    const response = await api.get('/ventas', { params })
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || error.response?.data?.message || 'Error al obtener ventas')
  }
}

export const getVentaDetalle = async (id) => {
  try {
    const response = await api.get(`/ventas/${id}`)
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || error.response?.data?.message || 'Error al obtener detalle de venta')
  }
}

export const createVentaContado = async (ventaData) => {
  try {
    const response = await api.post('/ventas/contado', ventaData)
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || error.response?.data?.message || 'Error al crear venta al contado')
  }
}

export const createVentaCredito = async (ventaData) => {
  try {
    const response = await api.post('/ventas/credito', ventaData)
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || error.response?.data?.message || 'Error al crear venta a crédito')
  }
}

export const anularVenta = async (id, motivo = '') => {
  try {
    const response = await api.post(`/ventas/${id}/anular`, { motivo })
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || error.response?.data?.message || 'Error al anular venta')
  }
}

export const getVentasPorCliente = async (idCliente) => {
  try {
    const response = await api.get(`/ventas/cliente/${idCliente}`)
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || error.response?.data?.message || 'Error al obtener ventas del cliente')
  }
}

export const getVentasPorUsuario = async (idUsuario) => {
  try {
    const response = await api.get(`/ventas/usuario/${idUsuario}`)
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || error.response?.data?.message || 'Error al obtener ventas del usuario')
  }
}

export const getReporteVentas = async (fechaDesde, fechaHasta) => {
  try {
    const response = await api.get('/ventas/reporte', { 
      params: { fecha_desde: fechaDesde, fecha_hasta: fechaHasta } 
    })
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || error.response?.data?.message || 'Error al obtener reporte de ventas')
  }
}

// ============== CREDITOS ==============
export const getCreditos = async (params = {}) => {
  try {
    const response = await api.get('/creditos', { params })
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || error.response?.data?.message || 'Error al obtener créditos')
  }
}

export const getCredito = async (id) => {
  try {
    const response = await api.get(`/creditos/${id}`)
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || error.response?.data?.message || 'Error al obtener crédito')
  }
}

export const getCreditosActivos = async () => {
  try {
    const response = await api.get('/creditos/activos')
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || error.response?.data?.message || 'Error al obtener créditos activos')
  }
}

export const getCreditosVencidos = async () => {
  try {
    const response = await api.get('/creditos/vencidos')
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || error.response?.data?.message || 'Error al obtener créditos vencidos')
  }
}

export const getCreditosPagados = async () => {
  try {
    const response = await api.get('/creditos', { params: { estado: 'PAGADO' } })
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || error.response?.data?.message || 'Error al obtener créditos pagados')
  }
}

export const getCreditosPorCliente = async (idCliente) => {
  try {
    const response = await api.get(`/creditos/cliente/${idCliente}`)
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || error.response?.data?.message || 'Error al obtener créditos del cliente')
  }
}

export const getHistorialPagos = async (idCredito) => {
  try {
    const response = await api.get(`/creditos/${idCredito}/pagos`)
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || error.response?.data?.message || 'Error al obtener historial de pagos')
  }
}

export const createPago = async (creditoId, pagoData) => {
  try {
    const response = await api.post(`/creditos/${creditoId}/pagar`, pagoData)
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || error.response?.data?.message || 'Error al registrar pago')
  }
}

// ============== ROLES ==============
export const getRoles = async () => {
  try {
    const response = await api.get('/usuarios/roles')
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || 'Error al obtener roles')
  }
}

// ============== USUARIOS ==============
export const getUsuarios = async (params = {}) => {
  try {
    const response = await api.get('/usuarios', { params })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || 'Error al obtener usuarios')
  }
}

export const createUsuario = async (usuarioData) => {
  try {
    const response = await api.post('/usuarios', usuarioData)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || 'Error al crear usuario')
  }
}

export const updateUsuario = async (id, usuarioData) => {
  try {
    const response = await api.put(`/usuarios/${id}`, usuarioData)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || 'Error al actualizar usuario')
  }
}

export const deleteUsuario = async (id) => {
  try {
    const response = await api.delete(`/usuarios/${id}`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || 'Error al eliminar usuario')
  }
}

// Función para activar un usuario
export const activarUsuario = async (id) => {
  try {
    const response = await api.patch(`/usuarios/${id}/activar`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || 'Error al activar usuario')
  }
}

// Función para desactivar un usuario (soft delete)
export const desactivarUsuario = async (id) => {
  try {
    const response = await api.delete(`/usuarios/${id}`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || 'Error al desactivar usuario')
  }
}

// ============== DASHBOARD ==============
// Función para obtener estadísticas del dashboard
export const getDashboardStats = async () => {
  try {
    // Como no hay endpoint específico, construimos las estadísticas con múltiples llamadas
    const [productos, clientes, ventas, creditos] = await Promise.all([
      getProductos(),
      getClientes(),
      getVentas(),
      getCreditos()
    ])

    // Calcular estadísticas actuales
    const productosActivos = productos.filter(p => p.estado).length
    const clientesActivos = clientes.filter(c => c.estado).length
    
    // Ventas del mes actual
    const hoy = new Date()
    const inicioMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const ventasDelMesActual = ventas.filter(v => {
      const fechaVenta = new Date(v.fecha_venta)
      return fechaVenta >= inicioMesActual && v.estado === 'ACTIVA'
    })
    const totalVentasMesActual = ventasDelMesActual.reduce((sum, v) => sum + Number(v.total), 0)

    // Ventas del mes anterior
    const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
    const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
    const ventasDelMesAnterior = ventas.filter(v => {
      const fechaVenta = new Date(v.fecha_venta)
      return fechaVenta >= inicioMesAnterior && fechaVenta <= finMesAnterior && v.estado === 'ACTIVA'
    })
    const totalVentasMesAnterior = ventasDelMesAnterior.reduce((sum, v) => sum + Number(v.total), 0)

    // Créditos pendientes
    const creditosPendientes = creditos.filter(c => c.estado === 'ACTIVO' || c.estado === 'VENCIDO')
    const totalCreditosPendientes = creditosPendientes.reduce((sum, c) => sum + Number(c.saldo_pendiente || 0), 0)

    // Calcular porcentajes de cambio
    const calcularPorcentajeCambio = (actual, anterior) => {
      if (anterior === 0) return actual > 0 ? 100 : 0
      return Math.round(((actual - anterior) / anterior) * 100)
    }

    // Estadísticas con comparación vs mes anterior
    const stats = {
      productosActivos,
      clientesActivos,
      ventasMes: totalVentasMesActual,
      creditosPendientes: totalCreditosPendientes,
      ventasDelMes: ventasDelMesActual.length,
      // Porcentajes de cambio
      cambioVentas: calcularPorcentajeCambio(totalVentasMesActual, totalVentasMesAnterior),
      cambioProductos: 0, // Los productos no cambian mes a mes significativamente
      cambioClientes: 0, // Los clientes activos tampoco cambian mes a mes
      cambioCreditos: 0, // Los créditos pendientes son acumulativos
      // Datos del mes anterior para referencia
      ventasMesAnterior: totalVentasMesAnterior,
      ventasDelMesAnterior: ventasDelMesAnterior.length
    }

    return stats
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || 'Error al obtener estadísticas del dashboard')
  }
}

// Función para obtener productos con stock bajo
export const getProductosBajoStock = async () => {
  try {
    const productos = await getProductos()
    return productos.filter(producto => {
      const stock = Number(producto.stock_actual || 0)
      const minimo = Number(producto.stock_minimo || 5)
      return stock > 0 && stock <= minimo
    })
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || 'Error al obtener productos con stock bajo')
  }
}

// Función para obtener productos sin stock
export const getProductosSinStock = async () => {
  try {
    const productos = await getProductos()
    return productos.filter(producto => Number(producto.stock_actual || 0) === 0)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || 'Error al obtener productos sin stock')
  }
}

// Función para obtener ventas del mes actual
export const getVentasDelMes = async () => {
  try {
    const ventas = await getVentas()
    const hoy = new Date()
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    
    return ventas.filter(venta => {
      const fechaVenta = new Date(venta.fecha_venta)
      return fechaVenta >= inicioMes && venta.estado === 'ACTIVA'
    })
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || 'Error al obtener ventas del mes')
  }
}

// Función para obtener ventas del día actual
export const getVentasDelDia = async () => {
  try {
    const response = await api.get('/ventas/dashboard/dia')
    return extraerDatos(response)
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || 'Error al obtener ventas del día')
  }
}

// Función para obtener productos más vendidos desde el backend
export const getProductosMasVendidos = async (limite = 5, dias = 30) => {
  try {
    console.log('🔍 Obteniendo productos más vendidos desde el backend...')
    
    // Calcular rango de fechas
    const fecha_hasta = new Date().toISOString().split('T')[0]
    const fecha_desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const response = await api.get('/ventas/productos/mas-vendidos', {
      params: {
        fecha_desde,
        fecha_hasta,
        limite
      }
    })
    
    const productos = extraerDatos(response)
    
    // Transformar formato del backend al esperado por el frontend
    const productosFormateados = (productos || []).map(p => ({
      nombre: p.nombre,
      total_vendido: p.cantidad_total || 0,
      monto_total: p.monto_total || 0,
      numero_ventas: p.numero_ventas || 0
    }))
    
    console.log('📊 Productos más vendidos:', productosFormateados)
    return productosFormateados
    
  } catch (error) {
    console.error('❌ Error en getProductosMasVendidos:', error)
    return []
  }
}

// Función para obtener datos de ventas por día (últimos 30 días)
export const getVentasPorDia = async (dias = 30) => {
  try {
    const ventas = await getVentas()
    const hoy = new Date()
    const fechaInicio = new Date(hoy.getTime() - (dias * 24 * 60 * 60 * 1000))
    
    const ventasPorDia = {}
    
    // Inicializar con todos los días
    for (let i = 0; i < dias; i++) {
      const fecha = new Date(fechaInicio.getTime() + (i * 24 * 60 * 60 * 1000))
      const fechaStr = fecha.toISOString().split('T')[0]
      ventasPorDia[fechaStr] = { fecha: fechaStr, total: 0, cantidad: 0 }
    }

    // Agregar ventas por día
    ventas
      .filter(venta => {
        const fechaVenta = new Date(venta.fecha_venta)
        return fechaVenta >= fechaInicio && venta.estado === 'ACTIVA'
      })
      .forEach(venta => {
        const fechaStr = new Date(venta.fecha_venta).toISOString().split('T')[0]
        if (ventasPorDia[fechaStr]) {
          ventasPorDia[fechaStr].total += Number(venta.total || 0)
          ventasPorDia[fechaStr].cantidad += 1
        }
      })

    return Object.values(ventasPorDia).sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
  } catch (error) {
    throw new Error(error.response?.data?.mensaje || 'Error al obtener ventas por día')
  }
}

export default api
