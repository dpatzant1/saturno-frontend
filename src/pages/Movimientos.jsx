import { useState, useEffect } from 'react'
import { Search, Filter, X, RotateCcw, Plus, AlertCircle } from 'lucide-react'
import { getMovimientos, getProductos, getUsuarios, createMovimientoEntrada, createMovimientoSalida } from '../services/api'
import { useAuthStore } from '../store/authStore'
import Pagination from '../components/Pagination'

export default function Movimientos() {
  // Auth store para verificar rol
  const { user } = useAuthStore()
  
  // El rol es un objeto, necesitamos acceder a rol.nombre
  const isAdmin = user?.rol?.nombre === 'ADMINISTRADOR'
  
  // Estados principales
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  })
  
  // Estados para dropdowns
  const [productos, setProductos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  
  // Estados del formulario de nuevo movimiento
  const [formData, setFormData] = useState({
    tipo_movimiento: 'ENTRADA',
    id_producto: '',
    cantidad: '',
    observaciones: ''
  })
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  
  // Estados para notificaciones toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  
  // Función para mostrar notificación toast
  const mostrarToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' })
    }, 4000)
  }
  
  // Estados de filtros
  const [filtros, setFiltros] = useState({
    tipo: '', // '', 'ENTRADA', 'SALIDA', 'VENTA', 'ANULACION_VENTA'
    id_producto: '',
    id_usuario: '',
    fecha_desde: '',
    fecha_hasta: '',
    searchTerm: ''
  })

  // Hook para cargar movimientos al montar el componente
  useEffect(() => {
    cargarMovimientos()
  }, [currentPage, pageSize, filtros])

  // Hook inicial para cargar productos y usuarios (usuarios solo para admin)
  useEffect(() => {
    cargarProductos()
    if (isAdmin) {
      cargarUsuarios()
    }
  }, [isAdmin])

  // Cargar productos para el dropdown
  const cargarProductos = async () => {
    try {
      const response = await getProductos()
      setProductos(response.datos || response || [])
    } catch (error) {
      console.error('Error al cargar productos:', error)
    }
  }

  // Cargar usuarios para el dropdown
  const cargarUsuarios = async () => {
    try {
      const response = await getUsuarios()
      // Asegurar que sea un array
      const usuariosArray = response.datos || response.data || response || []
      setUsuarios(Array.isArray(usuariosArray) ? usuariosArray : [])
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
      setUsuarios([]) // Asegurar que siempre sea un array vacío en caso de error
    }
  }

  // Función para cargar movimientos con filtros y paginación
  const cargarMovimientos = async () => {
    try {
      setLoading(true)
      
      // Preparar parámetros de filtro (solo los que tienen valor)
      const params = {
        page: currentPage,
        limit: pageSize
      }
      if (filtros.tipo) params.tipo_movimiento = filtros.tipo
      if (filtros.id_producto) params.id_producto = filtros.id_producto
      if (filtros.id_usuario) params.id_usuario = filtros.id_usuario
      if (filtros.fecha_desde) params.fecha_desde = filtros.fecha_desde
      if (filtros.fecha_hasta) params.fecha_hasta = filtros.fecha_hasta

      const response = await getMovimientos(params)
      setMovimientos(response.datos || response || [])
      setPagination(response.paginacion || {
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      })
    } catch (error) {
      console.error('Error al cargar movimientos:', error)
      alert('Error al cargar los movimientos. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }

  // Función para formatear fecha como DD/MM/YYYY HH:mm
  const formatearFechaHora = (fecha) => {
    if (!fecha) return 'N/A'
    const date = new Date(fecha)
    const dia = String(date.getDate()).padStart(2, '0')
    const mes = String(date.getMonth() + 1).padStart(2, '0')
    const año = date.getFullYear()
    const horas = String(date.getHours()).padStart(2, '0')
    const minutos = String(date.getMinutes()).padStart(2, '0')
    return `${dia}/${mes}/${año} ${horas}:${minutos}`
  }

  // Función para obtener badge de tipo de movimiento
  const getBadgeTipo = (tipo) => {
    const badges = {
      ENTRADA: 'bg-green-100 text-green-800',
      SALIDA: 'bg-red-100 text-red-800',
      VENTA: 'bg-blue-100 text-blue-800',
      ANULACION_VENTA: 'bg-orange-100 text-orange-800'
    }
    return badges[tipo] || 'bg-gray-100 text-gray-800'
  }

  // Función para obtener signo de cantidad
  const getCantidadConSigno = (tipo, cantidad) => {
    if (tipo === 'ENTRADA' || tipo === 'ANULACION_VENTA') {
      return `+${cantidad}`
    } else {
      return `-${cantidad}`
    }
  }

  // Filtrar movimientos por búsqueda en tiempo real
  const movimientosFiltrados = movimientos.filter(mov => {
    if (!filtros.searchTerm) return true
    
    const termino = filtros.searchTerm.toLowerCase()
    const nombreProducto = mov.productos?.nombre?.toLowerCase() || ''
    const motivo = mov.motivo?.toLowerCase() || ''
    const tipo = mov.tipo_movimiento?.toLowerCase() || ''
    
    return nombreProducto.includes(termino) || 
           motivo.includes(termino) || 
           tipo.includes(termino)
  })

  // Función para aplicar filtros
  const handleAplicarFiltros = () => {
    cargarMovimientos()
    setShowFilters(false)
  }

  // Función para limpiar filtros
  const handleLimpiarFiltros = () => {
    setFiltros({
      tipo: '',
      id_producto: '',
      id_usuario: '',
      fecha_desde: '',
      fecha_hasta: '',
      searchTerm: ''
    })
  }

  // Hook para recargar cuando se limpian filtros
  useEffect(() => {
    // Solo recargar si todos los filtros están vacíos (después de limpiar)
    const todosFiltrosVacios = !filtros.tipo && !filtros.id_producto && !filtros.id_usuario && 
                               !filtros.fecha_desde && !filtros.fecha_hasta && !filtros.searchTerm
    
    if (todosFiltrosVacios && movimientos.length > 0) {
      cargarMovimientos()
    }
  }, [filtros.tipo, filtros.id_producto, filtros.id_usuario, filtros.fecha_desde, filtros.fecha_hasta])

  // Función para manejar cambios en el formulario
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Si cambia el producto, actualizar el producto seleccionado
    if (field === 'id_producto') {
      const producto = productos.find(p => p.id_producto === value)
      setProductoSeleccionado(producto || null)
    }
  }

  // Función para limpiar el formulario
  const limpiarFormulario = () => {
    setFormData({
      tipo_movimiento: 'ENTRADA',
      id_producto: '',
      cantidad: '',
      observaciones: ''
    })
    setProductoSeleccionado(null)
  }

  // Función para validar el formulario
  const validarFormulario = () => {
    if (!formData.id_producto) {
      mostrarToast('Debes seleccionar un producto', 'error')
      return false
    }
    if (!formData.cantidad || formData.cantidad <= 0) {
      mostrarToast('La cantidad debe ser mayor a 0', 'error')
      return false
    }
    if (!formData.observaciones || formData.observaciones.trim() === '') {
      mostrarToast('Las observaciones son requeridas', 'error')
      return false
    }
    return true
  }

  // Función para enviar el formulario
  const handleSubmitMovimiento = async (e) => {
    e.preventDefault()
    
    if (!validarFormulario()) return
    
    try {
      setSubmitting(true)
      
      const datosMovimiento = {
        id_producto: formData.id_producto,
        cantidad: parseInt(formData.cantidad),
        motivo: formData.observaciones.trim() // Backend espera 'motivo', no 'observaciones'
      }
      
      // Llamar a la función correcta según el tipo
      if (formData.tipo_movimiento === 'ENTRADA') {
        await createMovimientoEntrada(datosMovimiento)
      } else {
        await createMovimientoSalida(datosMovimiento)
      }
      
      mostrarToast(`Movimiento de ${formData.tipo_movimiento} registrado exitosamente`, 'success')
      
      // Recargar lista y cerrar modal
      await cargarMovimientos()
      limpiarFormulario()
      setShowModal(false)
      
    } catch (error) {
      console.error('Error al crear movimiento:', error)
      mostrarToast(error.response?.data?.mensaje || 'Error al registrar el movimiento. Por favor, intenta de nuevo.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Notificación Toast */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-[9999] px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 animate-slideIn ${
          toast.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {toast.type === 'success' ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <p className="font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Movimientos de Inventario</h1>
          <p className="text-gray-600 mt-2">Historial de entradas y salidas</p>
        </div>
        {/* Botón de Nuevo Movimiento (solo ADMIN) */}
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 bg-carpinteria-medio text-white rounded-lg hover:bg-carpinteria-oscuro transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Movimiento
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar movimientos..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
              value={filtros.searchTerm}
              onChange={(e) => setFiltros({ ...filtros, searchTerm: e.target.value })}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
              showFilters 
                ? 'bg-carpinteria-medio text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-5 h-5 mr-2" />
            Filtrar
          </button>
        </div>

        {/* Panel de Filtros Expandible */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro por Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Movimiento
              </label>
              <select
                value={filtros.tipo}
                onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
              >
                <option value="">Todos</option>
                <option value="ENTRADA">ENTRADA</option>
                <option value="SALIDA">SALIDA</option>
              </select>
            </div>

            {/* Filtro por Producto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Producto
              </label>
              <select
                value={filtros.id_producto}
                onChange={(e) => setFiltros({ ...filtros, id_producto: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
              >
                <option value="">Todos los productos</option>
                {productos.map((producto) => (
                  <option key={producto.id_producto} value={producto.id_producto}>
                    {producto.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Usuario - Solo para administradores */}
            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario
                </label>
                <select
                  value={filtros.id_usuario}
                  onChange={(e) => setFiltros({ ...filtros, id_usuario: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                >
                  <option value="">Todos los usuarios</option>
                  {usuarios.map((usuario) => (
                    <option key={usuario.id_usuario} value={usuario.id_usuario}>
                      {usuario.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filtro por Fecha Desde */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                value={filtros.fecha_desde}
                onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
              />
            </div>

            {/* Filtro por Fecha Hasta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={filtros.fecha_hasta}
                onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
              />
            </div>

            {/* Botones de Acción */}
            <div className="lg:col-span-2 flex items-end space-x-2">
              <button
                onClick={handleAplicarFiltros}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-carpinteria-medio text-white rounded-lg hover:bg-carpinteria-oscuro transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                Aplicar Filtros
              </button>
              <button
                onClick={handleLimpiarFiltros}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Limpiar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Nuevo Movimiento */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ margin: 0 }}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Nuevo Movimiento</h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  limpiarFormulario()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <form onSubmit={handleSubmitMovimiento} className="p-6 space-y-6">
              {/* Mensaje Informativo */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">
                    Los movimientos tipo VENTA y ANULACIÓN VENTA se generan automáticamente
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Solo puedes crear movimientos manuales de ENTRADA o SALIDA
                  </p>
                </div>
              </div>

              {/* Tipo de Movimiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de Movimiento *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="tipo_movimiento"
                      value="ENTRADA"
                      checked={formData.tipo_movimiento === 'ENTRADA'}
                      onChange={(e) => handleFormChange('tipo_movimiento', e.target.value)}
                      className="w-4 h-4 text-carpinteria-medio focus:ring-carpinteria-medio border-gray-300"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        ENTRADA
                      </span>
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="tipo_movimiento"
                      value="SALIDA"
                      checked={formData.tipo_movimiento === 'SALIDA'}
                      onChange={(e) => handleFormChange('tipo_movimiento', e.target.value)}
                      className="w-4 h-4 text-carpinteria-medio focus:ring-carpinteria-medio border-gray-300"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        SALIDA
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Selección de Producto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Producto *
                </label>
                <select
                  value={formData.id_producto}
                  onChange={(e) => handleFormChange('id_producto', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                  required
                >
                  <option value="">Selecciona un producto</option>
                  {productos.map((producto) => (
                    <option key={producto.id_producto} value={producto.id_producto}>
                      {producto.nombre} - {producto.categorias?.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mostrar Stock Actual */}
              {productoSeleccionado && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Producto seleccionado</p>
                      <p className="text-sm font-medium text-gray-900">{productoSeleccionado.nombre}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Stock actual</p>
                      <p className="text-sm font-bold text-carpinteria-oscuro">
                        {productoSeleccionado.cantidad_stock} {productoSeleccionado.unidad_medida}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Campo Cantidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.cantidad}
                  onChange={(e) => handleFormChange('cantidad', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                  placeholder="Ingresa la cantidad"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Debe ser un número mayor a 0
                </p>
              </div>

              {/* Campo Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones *
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => handleFormChange('observaciones', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                  rows="3"
                  placeholder="Describe el motivo del movimiento..."
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Campo obligatorio: explica el motivo del movimiento
                </p>
              </div>

              {/* Botones de Acción */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    limpiarFormulario()
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-carpinteria-medio text-white rounded-lg hover:bg-carpinteria-oscuro transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Guardando...' : 'Registrar Movimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-carpinteria-medio"></div>
            <p className="mt-2 text-gray-500">Cargando movimientos...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-carpinteria-oscuro">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Fecha/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Motivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Referencia
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movimientosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      {filtros.searchTerm ? 'No se encontraron resultados' : 'No hay movimientos registrados'}
                    </td>
                  </tr>
                ) : (
                  movimientosFiltrados.map((mov) => (
                    <tr key={mov.id_movimiento} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatearFechaHora(mov.fecha_movimiento)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeTipo(mov.tipo_movimiento)}`}>
                          {mov.tipo_movimiento}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-medium">{mov.productos?.nombre || 'N/A'}</div>
                        {mov.productos?.categorias?.nombre && (
                          <div className="text-xs text-gray-500">{mov.productos.categorias.nombre}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`text-sm font-semibold ${
                          mov.tipo_movimiento === 'ENTRADA' || mov.tipo_movimiento === 'ANULACION_VENTA' 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {getCantidadConSigno(mov.tipo_movimiento, mov.cantidad)}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          {mov.productos?.unidad_medida || ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {mov.motivo || 'Sin motivo'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {mov.referencia || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Componente de Paginación */}
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              pageSize={pageSize}
              totalItems={pagination.total}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              hasNextPage={pagination.hasNextPage}
              hasPrevPage={pagination.hasPrevPage}
            />
          </div>
        )}
      </div>
    </div>
    </>
  )
}
