import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, X, RotateCcw, Archive, AlertCircle } from 'lucide-react'
import { getProductos, createProducto, updateProducto, deleteProducto, getCategorias, getProductosPapelera, restaurarProducto, eliminarProductoPermanentemente } from '../services/api'
import { useAuthStore } from '../store/authStore'
import Pagination from '../components/Pagination'
import CategorySearch from '../components/CategorySearch'

export default function Productos() {
  // Auth store para verificar rol
  const { user } = useAuthStore()
  const isAdmin = user?.rol?.nombre === 'ADMINISTRADOR'
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProducto, setEditingProducto] = useState(null)
  const [viendoPapelera, setViendoPapelera] = useState(false)
  
  // Estados para modal de confirmación
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmMessage, setConfirmMessage] = useState('')
  const [confirmTitle, setConfirmTitle] = useState('')
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  })
  
  const [formData, setFormData] = useState({
    id_categoria: '',
    nombre: '',
    descripcion: '',
    precio_venta: '',
    unidad_medida: 'unidad',
    stock_minimo: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [currentPage, pageSize, searchTerm, viendoPapelera])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      
      if (viendoPapelera) {
        // Cargar productos en papelera
        const productosRes = await getProductosPapelera()
        setProductos(Array.isArray(productosRes) ? productosRes : [])
        setPagination({
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        })
      } else {
        // Cargar productos activos
        const [productosRes, categoriasRes] = await Promise.all([
          getProductos({ 
            page: currentPage, 
            limit: pageSize,
            busqueda: searchTerm || undefined
          }),
          getCategorias({ limit: 1000 }) // Obtener todas las categorías sin límite
        ])
        
        setProductos(productosRes.datos || productosRes || [])
        setPagination(productosRes.paginacion || {
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        })
        setCategorias(categoriasRes.datos || categoriasRes || [])
      }
      
      // Cargar categorías si aún no se han cargado
      if (categorias.length === 0) {
        const categoriasRes = await getCategorias({ limit: 1000 }) // Obtener todas las categorías
        setCategorias(categoriasRes.datos || categoriasRes || [])
      }
    } catch (err) {
      console.error('Error al cargar datos:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize)
    setCurrentPage(1) // Resetear a la primera página
  }

  const handleOpenModal = (producto = null) => {
    if (producto) {
      setEditingProducto(producto)
      setFormData({
        id_categoria: producto.id_categoria || '',
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        precio_venta: producto.precio_venta || '',
        unidad_medida: producto.unidad_medida || 'unidad',
        stock_minimo: producto.stock_minimo || ''
      })
    } else {
      setEditingProducto(null)
      setFormData({
        id_categoria: '',
        nombre: '',
        descripcion: '',
        precio_venta: '',
        unidad_medida: 'unidad',
        stock_minimo: ''
      })
    }
    console.log('Abriendo modal. Categorías disponibles:', categorias)
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProducto(null)
    setFormData({
      id_categoria: '',
      nombre: '',
      descripcion: '',
      precio_venta: '',
      unidad_medida: 'unidad',
      stock_minimo: ''
    })
    setError('')
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      // Validar que se haya seleccionado una categoría
      if (!formData.id_categoria) {
        setError('Por favor selecciona una categoría')
        return
      }

      // Validar que los campos numéricos sean válidos
      const dataToSend = {
        id_categoria: formData.id_categoria,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        precio_venta: parseFloat(formData.precio_venta),
        unidad_medida: formData.unidad_medida,
        stock_minimo: formData.stock_minimo ? parseInt(formData.stock_minimo) : 0
      }

      console.log('=== ENVIANDO PRODUCTO ===')
      console.log('FormData original:', formData)
      console.log('Datos transformados:', dataToSend)
      console.log('Categoría seleccionada:', formData.id_categoria)
      console.log('Categorías disponibles:', categorias)

      if (editingProducto) {
        const response = await updateProducto(editingProducto.id_producto, dataToSend)
        console.log('Respuesta actualizar:', response)
        setSuccess('Producto actualizado exitosamente')
      } else {
        const response = await createProducto(dataToSend)
        console.log('Respuesta crear:', response)
        setSuccess('Producto creado exitosamente')
      }
      
      setTimeout(() => {
        handleCloseModal()
        cargarDatos()
      }, 1500)
    } catch (err) {
      console.error('Error completo:', err)
      console.error('Error message:', err.message)
      console.error('Error response:', err.response)
      setError(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de mover este producto a papelera?')) return

    try {
      setError('')
      setSuccess('')
      setLoading(true)
      await deleteProducto(id)
      setSuccess('Producto movido a papelera exitosamente')
      // Recargar inmediatamente
      await cargarDatos()
    } catch (err) {
      console.error('Error al eliminar:', err)
      setError(err.message)
      // Scroll hacia arriba para que el usuario vea el mensaje de error
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setLoading(false)
    }
  }

  const handleRestaurar = async (id) => {
    setConfirmTitle('Restaurar Producto')
    setConfirmMessage('¿Estás seguro de restaurar este producto?')
    setConfirmAction(() => async () => {
      try {
        setShowConfirmDialog(false)
        setError('')
        setSuccess('')
        setLoading(true)
        await restaurarProducto(id)
        setSuccess('Producto restaurado exitosamente')
        await cargarDatos()
      } catch (err) {
        console.error('Error al restaurar:', err)
        setError(err.message)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } finally {
        setLoading(false)
      }
    })
    setShowConfirmDialog(true)
  }

  const handleEliminarPermanentemente = async (id) => {
    setConfirmTitle('⚠️ Eliminar Permanentemente')
    setConfirmMessage('¿Estás seguro de eliminar PERMANENTEMENTE este producto? Esta acción NO se puede deshacer y el producto se eliminará de forma definitiva.')
    setConfirmAction(() => async () => {
      try {
        setShowConfirmDialog(false)
        setError('')
        setSuccess('')
        setLoading(true)
        await eliminarProductoPermanentemente(id)
        setSuccess('Producto eliminado permanentemente')
        await cargarDatos()
      } catch (err) {
        console.error('Error al eliminar permanentemente:', err)
        setError(err.message)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } finally {
        setLoading(false)
      }
    })
    setShowConfirmDialog(true)
  }

  return (
    <>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {viendoPapelera ? 'Productos en Papelera' : 'Productos'}
          </h1>
          <p className="text-gray-600 mt-2">
            {viendoPapelera ? 'Productos eliminados que pueden ser restaurados' : 'Gestión de productos del inventario'}
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          {isAdmin && (
            <>
              <button 
                onClick={() => setViendoPapelera(!viendoPapelera)}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                {viendoPapelera ? (
                  <>
                    <Archive className="w-5 h-5 mr-2" />
                    Ver Productos Activos
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5 mr-2" />
                    Ver Papelera
                  </>
                )}
              </button>
              {!viendoPapelera && (
                <button 
                  onClick={() => handleOpenModal()}
                  className="inline-flex items-center px-4 py-2 bg-carpinteria-medio text-white rounded-lg hover:bg-carpinteria-rojizo transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Nuevo Producto
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          {success}
        </div>
      )}

      {/* Mensaje informativo sobre el stock */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Nota importante:</strong> El stock se actualiza automáticamente mediante movimientos de inventario. No se puede editar directamente.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar productos..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-carpinteria-oscuro">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Cantidad en Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    {loading ? 'Cargando...' : 'No hay productos registrados'}
                  </td>
                </tr>
              ) : (
                productos.map((producto) => (
                  <tr key={producto.id_producto} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {producto.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {producto.categorias?.nombre || 'Sin categoría'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (producto.cantidad_stock || 0) === 0 
                          ? 'bg-red-100 text-red-800'
                          : (producto.cantidad_stock || 0) < (producto.stock_minimo || 0)
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {producto.cantidad_stock || 0} {producto.unidad_medida || 'unidad'}(s)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Q{parseFloat(producto.precio_venta || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {viendoPapelera ? (
                        // Botones en papelera: Restaurar y Eliminar Permanentemente
                        isAdmin && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleRestaurar(producto.id_producto)}
                              className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Restaurar
                            </button>
                            <button 
                              onClick={() => handleEliminarPermanentemente(producto.id_producto)}
                              className="inline-flex items-center px-3 py-1 bg-red-700 text-white rounded hover:bg-red-800 transition-colors"
                              title="Eliminar permanentemente (no se puede deshacer)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      ) : (
                        // Botones de editar/eliminar en vista normal
                        isAdmin ? (
                          <>
                            <button 
                              onClick={() => handleOpenModal(producto)}
                              className="text-carpinteria-medio hover:text-carpinteria-rojizo mr-3"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(producto.id_producto)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500 italic">Solo lectura</span>
                        )
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
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
      </div>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  {success}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                  placeholder="Ej: Madera de roble"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <CategorySearch
                  value={formData.id_categoria}
                  onChange={(id) => {
                    setFormData(prev => ({ ...prev, id_categoria: id }))
                  }}
                  categorias={categorias}
                  disabled={false}
                />
                {categorias.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    No hay categorías disponibles. Por favor, crea una categoría primero.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                  placeholder="Descripción del producto"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Venta *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Q</span>
                    <input
                      type="number"
                      name="precio_venta"
                      value={formData.precio_venta}
                      onChange={handleInputChange}
                      required
                      step="0.01"
                      min="0"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidad Medida *
                  </label>
                  <select
                    name="unidad_medida"
                    value={formData.unidad_medida}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                  >
                    <option value="unidad">Unidad</option>
                    <option value="metro">Metro</option>
                    <option value="kilogramo">Kilogramo</option>
                    <option value="litro">Litro</option>
                    <option value="caja">Caja</option>
                    <option value="paquete">Paquete</option>
                  </select>
                </div>

                {editingProducto && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Actual (Solo Lectura)
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                      {editingProducto.cantidad_stock || 0} {editingProducto.unidad_medida || 'unidad'}(s)
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      ℹ️ El stock se actualiza mediante movimientos de inventario
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    name="stock_minimo"
                    value={formData.stock_minimo}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Alerta cuando llegue a este nivel
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-carpinteria-medio text-white rounded-lg hover:bg-carpinteria-rojizo"
                >
                  {editingProducto ? 'Actualizar' : 'Crear'} Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {confirmTitle}
                  </h3>
                </div>
              </div>
              <p className="text-gray-600 mb-6 ml-16">
                {confirmMessage}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (confirmAction) confirmAction()
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
