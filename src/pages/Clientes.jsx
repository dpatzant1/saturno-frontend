import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, X, RotateCcw, Archive, AlertCircle } from 'lucide-react'
import { getClientes, createCliente, updateCliente, deleteCliente, getClientesPapelera, restaurarCliente, eliminarClientePermanentemente } from '../services/api'
import { useAuthStore } from '../store/authStore'
import Pagination from '../components/Pagination'

export default function Clientes() {
  // Auth store para verificar rol
  const { user } = useAuthStore()
  const isAdmin = user?.rol?.nombre === 'ADMINISTRADOR'
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCliente, setEditingCliente] = useState(null)
  const [viendoPapelera, setViendoPapelera] = useState(false)
  
  // Estado para modal de confirmación
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
    apellido: '',
    correo: '',
    telefono: '',
    direccion: '',
    tipo_cliente: 'CONTADO',
    limite_credito: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    cargarClientes()
  }, [currentPage, pageSize, searchTerm, viendoPapelera])

  const cargarClientes = async () => {
    try {
      setLoading(true)
      
      if (viendoPapelera) {
        // Cargar clientes en papelera
        const response = await getClientesPapelera()
        setClientes(Array.isArray(response) ? response : [])
        setPagination({
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        })
      } else {
        // Cargar clientes activos
        const response = await getClientes({ 
          page: currentPage, 
          limit: pageSize,
          busqueda: searchTerm || undefined
        })
        setClientes(response.datos || response || [])
        setPagination(response.paginacion || {
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        })
      }
    } catch (err) {
      console.error('Error al cargar clientes:', err)
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

  const handleOpenModal = (cliente = null) => {
    if (cliente) {
      setEditingCliente(cliente)
      setFormData({
        nombre: cliente.nombre || '',
        apellido: cliente.apellido || '',
        correo: cliente.correo || '',
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || '',
        tipo_cliente: cliente.tipo_cliente || 'CONTADO',
        limite_credito: cliente.limite_credito || ''
      })
    } else {
      setEditingCliente(null)
      setFormData({
        nombre: '',
        apellido: '',
        correo: '',
        telefono: '',
        direccion: '',
        tipo_cliente: 'CONTADO',
        limite_credito: ''
      })
    }
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCliente(null)
    setFormData({
      nombre: '',
      apellido: '',
      correo: '',
      telefono: '',
      direccion: '',
      tipo_cliente: 'CONTADO',
      limite_credito: ''
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
      const dataToSend = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim() || null,
        correo: formData.correo.trim() || null,
        telefono: formData.telefono.trim() || null,
        direccion: formData.direccion.trim() || null,
        tipo_cliente: formData.tipo_cliente
      }

      // Solo incluir limite_credito si el tipo es CREDITO
      if (formData.tipo_cliente === 'CREDITO') {
        if (!formData.limite_credito || parseFloat(formData.limite_credito) <= 0) {
          setError('El límite de crédito es requerido y debe ser mayor a 0 para clientes de tipo CRÉDITO')
          return
        }
        dataToSend.limite_credito = parseFloat(formData.limite_credito)
      }

      console.log('Datos a enviar:', dataToSend)

      if (editingCliente) {
        await updateCliente(editingCliente.id_cliente, dataToSend)
        setSuccess('Cliente actualizado exitosamente')
      } else {
        await createCliente(dataToSend)
        setSuccess('Cliente creado exitosamente')
      }
      
      setTimeout(() => {
        handleCloseModal()
        cargarClientes()
      }, 1500)
    } catch (err) {
      console.error('Error al guardar cliente:', err)
      setError(err.message)
    }
  }

  const handleDelete = async (id) => {
    setConfirmTitle('Eliminar Cliente')
    setConfirmMessage('¿Estás seguro de mover este cliente a papelera?')
    setConfirmAction(() => async () => {
      try {
        setShowConfirmDialog(false)
        setLoading(true)
        await deleteCliente(id)
        setSuccess('Cliente movido a papelera exitosamente')
        await cargarClientes()
        setTimeout(() => setSuccess(''), 3000)
      } catch (err) {
        setError(err.message)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setTimeout(() => setError(''), 8000)
      } finally {
        setLoading(false)
      }
    })
    setShowConfirmDialog(true)
  }

  const handleRestaurar = async (id) => {
    setConfirmTitle('Restaurar Cliente')
    setConfirmMessage('¿Estás seguro de restaurar este cliente?')
    setConfirmAction(() => async () => {
      try {
        setShowConfirmDialog(false)
        setLoading(true)
        await restaurarCliente(id)
        setSuccess('Cliente restaurado exitosamente')
        await cargarClientes()
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
    setConfirmMessage('¿Estás seguro de eliminar PERMANENTEMENTE este cliente? Esta acción NO se puede deshacer.')
    setConfirmAction(() => async () => {
      try {
        setShowConfirmDialog(false)
        setLoading(true)
        await eliminarClientePermanentemente(id)
        setSuccess('Cliente eliminado permanentemente')
        await cargarClientes()
        setTimeout(() => setSuccess(''), 3000)
      } catch (err) {
        setError(err.message)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setTimeout(() => setError(''), 8000)
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
            {viendoPapelera ? 'Clientes en Papelera' : 'Clientes'}
          </h1>
          <p className="text-gray-600 mt-2">
            {viendoPapelera ? 'Clientes eliminados que pueden ser restaurados' : 'Gestión de clientes'}
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          {isAdmin && (
            <button 
              onClick={() => setViendoPapelera(!viendoPapelera)}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {viendoPapelera ? (
                <>
                  <Archive className="w-5 h-5 mr-2" />
                  Ver Clientes Activos
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5 mr-2" />
                  Ver Papelera
                </>
              )}
            </button>
          )}
          {!viendoPapelera && (
            <button 
              onClick={() => handleOpenModal()}
              className="inline-flex items-center px-4 py-2 bg-carpinteria-medio text-white rounded-lg hover:bg-carpinteria-rojizo transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nuevo Cliente
            </button>
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
            placeholder="Buscar clientes..."
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
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Teléfono</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Dirección</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clientes.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  {loading ? 'Cargando...' : 'No hay clientes registrados'}
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr key={cliente.id_cliente} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {cliente.nombre} {cliente.apellido || ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cliente.correo || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      cliente.tipo_cliente === 'CREDITO' 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {cliente.tipo_cliente}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cliente.telefono || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {cliente.direccion || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {viendoPapelera ? (
                      // Botones en papelera
                      isAdmin && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleRestaurar(cliente.id_cliente)}
                            className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Restaurar
                          </button>
                          <button 
                            onClick={() => handleEliminarPermanentemente(cliente.id_cliente)}
                            className="inline-flex items-center px-3 py-1 bg-red-700 text-white rounded hover:bg-red-800 transition-colors"
                            title="Eliminar permanentemente (no se puede deshacer)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    ) : (
                      // Botones normales
                      <>
                        <button 
                          onClick={() => handleOpenModal(cliente)}
                          className="text-carpinteria-medio hover:text-carpinteria-rojizo mr-3"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        {isAdmin && (
                          <button 
                            onClick={() => handleDelete(cliente.id_cliente)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
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
                  placeholder="Ej: Juan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido
                </label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                  placeholder="Ej: Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                  placeholder="ejemplo@correo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                  placeholder="123-456-7890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <textarea
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                  placeholder="Dirección completa del cliente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Cliente *
                </label>
                <select
                  name="tipo_cliente"
                  value={formData.tipo_cliente}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                >
                  <option value="CONTADO">Contado</option>
                  <option value="CREDITO">Crédito</option>
                </select>
              </div>

              {formData.tipo_cliente === 'CREDITO' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Límite de Crédito *
                  </label>
                  <input
                    type="number"
                    name="limite_credito"
                    value={formData.limite_credito}
                    onChange={handleInputChange}
                    required={formData.tipo_cliente === 'CREDITO'}
                    step="0.01"
                    min="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Monto máximo de crédito permitido para este cliente
                  </p>
                </div>
              )}
              </div>

              <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50 flex-shrink-0">
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
                  {editingCliente ? 'Actualizar' : 'Crear'} Cliente
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
