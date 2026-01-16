import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, X, RotateCcw, Archive, AlertCircle } from 'lucide-react'
import { getCategorias, createCategoria, updateCategoria, deleteCategoria, getCategoriasPapelera, restaurarCategoria, eliminarCategoriaPermanentemente } from '../services/api'
import { useAuthStore } from '../store/authStore'
import Pagination from '../components/Pagination'

export default function Categorias() {
  // Auth store para verificar rol
  const { user } = useAuthStore()
  const isAdmin = user?.rol?.nombre === 'ADMINISTRADOR'
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState(null)
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
    nombre: '',
    descripcion: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    cargarCategorias()
  }, [currentPage, pageSize, searchTerm, viendoPapelera])

  const cargarCategorias = async () => {
    try {
      setLoading(true)
      setError('')
      
      if (viendoPapelera) {
        // Cargar categorías en papelera
        const response = await getCategoriasPapelera()
        setCategorias(Array.isArray(response) ? response : [])
        setPagination({
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        })
      } else {
        // Cargar categorías activas
        const response = await getCategorias({ 
          page: currentPage, 
          limit: pageSize,
          busqueda: searchTerm || undefined
        })
        setCategorias(response.datos || response || [])
        setPagination(response.paginacion || {
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        })
      }
    } catch (err) {
      console.error('Error al cargar categorías:', err)
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
    setCurrentPage(1)
  }

  const handleOpenModal = (categoria = null) => {
    if (categoria) {
      setEditingCategoria(categoria)
      setFormData({
        nombre: categoria.nombre || '',
        descripcion: categoria.descripcion || ''
      })
    } else {
      setEditingCategoria(null)
      setFormData({
        nombre: '',
        descripcion: ''
      })
    }
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCategoria(null)
    setFormData({
      nombre: '',
      descripcion: ''
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
      if (editingCategoria) {
        await updateCategoria(editingCategoria.id, formData)
        setSuccess('Categoría actualizada exitosamente')
      } else {
        await createCategoria(formData)
        setSuccess('Categoría creada exitosamente')
      }
      
      setTimeout(() => {
        handleCloseModal()
        cargarCategorias()
      }, 1500)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de mover esta categoría a papelera?')) return

    try {
      await deleteCategoria(id)
      setSuccess('Categoría movida a papelera exitosamente')
      cargarCategorias()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleRestaurar = async (id) => {
    setConfirmTitle('Restaurar Categoría')
    setConfirmMessage('¿Estás seguro de restaurar esta categoría?')
    setConfirmAction(() => async () => {
      try {
        setShowConfirmDialog(false)
        setLoading(true)
        await restaurarCategoria(id)
        setSuccess('Categoría restaurada exitosamente')
        await cargarCategorias()
        setTimeout(() => setSuccess(''), 3000)
      } catch (err) {
        setError(err.message)
        setTimeout(() => setError(''), 3000)
      } finally {
        setLoading(false)
      }
    })
    setShowConfirmDialog(true)
  }

  const handleEliminarPermanentemente = async (id) => {
    setConfirmTitle('⚠️ Eliminar Permanentemente')
    setConfirmMessage('¿Estás seguro de eliminar PERMANENTEMENTE esta categoría? Esta acción NO se puede deshacer.')
    setConfirmAction(() => async () => {
      try {
        setShowConfirmDialog(false)
        setLoading(true)
        await eliminarCategoriaPermanentemente(id)
        setSuccess('Categoría eliminada permanentemente')
        await cargarCategorias()
        setTimeout(() => setSuccess(''), 3000)
      } catch (err) {
        setError(err.message)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setTimeout(() => setError(''), 5000)
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
            {viendoPapelera ? 'Categorías en Papelera' : 'Categorías'}
          </h1>
          <p className="text-gray-600 mt-2">
            {viendoPapelera ? 'Categorías eliminadas que pueden ser restauradas' : 'Gestión de categorías de productos'}
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
                    Ver Categorías Activas
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
                  Nueva Categoría
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

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar categorías..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-carpinteria-oscuro">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categorias.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                  {loading ? 'Cargando...' : 'No hay categorías registradas'}
                </td>
              </tr>
            ) : (
              categorias.map((categoria) => (
                <tr key={categoria.id_categoria} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {categoria.id_categoria?.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {categoria.nombre}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {categoria.descripcion || 'Sin descripción'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {viendoPapelera ? (
                      // Botones en papelera
                      isAdmin && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleRestaurar(categoria.id_categoria)}
                            className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Restaurar
                          </button>
                          <button 
                            onClick={() => handleEliminarPermanentemente(categoria.id_categoria)}
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
                            onClick={() => handleOpenModal(categoria)}
                            className="text-carpinteria-medio hover:text-carpinteria-rojizo mr-3"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(categoria.id_categoria)}
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
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
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
                  placeholder="Ej: Madera"
                />
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
                  placeholder="Descripción de la categoría"
                />
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
                  {editingCategoria ? 'Actualizar' : 'Crear'} Categoría
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
