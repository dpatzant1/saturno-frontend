import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, Search, ToggleLeft, ToggleRight, X } from 'lucide-react'
import { getUsuarios, updateUsuario, createUsuario, getRoles, deleteUsuario, activarUsuario, desactivarUsuario } from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function Usuarios() {
  // Auth y navegación
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = user?.rol?.nombre === 'ADMINISTRADOR'
  
  // Estados principales
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    password: '',
    id_rol: '',
    estado: true
  })
  
  // Estado para notificaciones toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  
  // Estados para modales de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmMessage, setConfirmMessage] = useState('')
  const [confirmTitle, setConfirmTitle] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Función para mostrar notificación toast
  const mostrarToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' })
    }, 4000)
  }

  // Función para mostrar confirmación personalizada
  const mostrarConfirmacion = (title, message, action) => {
    setConfirmTitle(title)
    setConfirmMessage(message)
    setConfirmAction(() => action)
    setShowConfirmModal(true)
  }

  const handleConfirmar = () => {
    if (confirmAction) {
      confirmAction()
    }
    setShowConfirmModal(false)
    setConfirmAction(null)
  }

  const handleCancelarConfirmacion = () => {
    setShowConfirmModal(false)
    setConfirmAction(null)
  }

  // Validación de permisos al cargar el componente
  useEffect(() => {
    // Verificar que el usuario esté autenticado y tenga rol
    if (!user) {
      alert('Debe iniciar sesión para acceder a esta página')
      navigate('/login')
      return
    }
    // VENDEDOR puede acceder para editar su perfil
    // ADMINISTRADOR tiene acceso completo
  }, [user, navigate])

  // Hook para cargar usuarios al montar el componente
  useEffect(() => {
    // Solo cargar lista de usuarios y roles si es ADMINISTRADOR
    if (isAdmin) {
      cargarUsuarios()
      cargarRoles()
    }
  }, [isAdmin])

  // Función para cargar usuarios
  const cargarUsuarios = async () => {
    try {
      setLoading(true)
      const response = await getUsuarios()
      setUsuarios(response.datos || response.data || response || [])
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
      mostrarToast('Error al cargar usuarios: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Función para cargar roles
  const cargarRoles = async () => {
    try {
      const data = await getRoles()
      // Asegurar que data sea un array
      const rolesArray = Array.isArray(data) ? data : (data?.data || [])
      setRoles(rolesArray)
    } catch (error) {
      console.error('Error al cargar roles:', error)
      mostrarToast('Error al cargar roles: ' + error.message, 'error')
    }
  }

  // Función para cambiar el estado de un usuario
  const handleCambiarEstado = async (usuario) => {
    const accion = usuario.estado ? 'desactivar' : 'activar'
    mostrarConfirmacion(
      'Cambiar Estado de Usuario',
      `¿Está seguro de ${accion} al usuario ${usuario.nombre}?`,
      async () => {
        try {
          if (usuario.estado) {
            // Si está activo, desactivar
            await desactivarUsuario(usuario.id_usuario)
            mostrarToast('Usuario desactivado exitosamente')
          } else {
            // Si está inactivo, activar
            await activarUsuario(usuario.id_usuario)
            mostrarToast('Usuario activado exitosamente')
          }
          cargarUsuarios()
        } catch (error) {
          console.error('Error al cambiar estado:', error)
          mostrarToast('Error al cambiar estado del usuario: ' + error.message, 'error')
        }
      }
    )
  }

  // Función para abrir modal de nuevo usuario
  const handleNuevoUsuario = () => {
    setEditingUsuario(null)
    setFormData({
      nombre: '',
      password: '',
      id_rol: '',
      estado: true
    })
    setShowModal(true)
  }

  // Función para abrir modal de editar usuario
  const handleEditarUsuario = (usuario) => {
    setEditingUsuario(usuario)
    setFormData({
      nombre: usuario.nombre || '',
      password: '', // No mostramos la contraseña actual
      id_rol: usuario.id_rol || '',
      estado: usuario.estado
    })
    setShowModal(true)
  }

  // Función para que vendedor edite su propio perfil
  const handleEditarMiPerfil = () => {
    setEditingUsuario(user)
    setFormData({
      nombre: user.nombre,
      password: '',
      id_rol: user.id_rol,
      estado: user.estado
    })
    setShowModal(true)
  }

  // Función para manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Función para validar y enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validaciones
    if (!formData.nombre.trim()) {
      mostrarToast('El nombre es requerido', 'error')
      return
    }

    if (!editingUsuario && !formData.password.trim()) {
      mostrarToast('La contraseña es requerida al crear un usuario', 'error')
      return
    }

    if (!formData.id_rol) {
      mostrarToast('Debe seleccionar un rol', 'error')
      return
    }

    try {
      // Preparar datos a enviar
      const dataToSend = {
        nombre: formData.nombre.trim(),
        id_rol: formData.id_rol,
        estado: formData.estado
      }

      // Agregar password solo si está definida (crear) o si se está cambiando (editar)
      if (formData.password && formData.password.trim()) {
        dataToSend.password = formData.password
      }

      if (editingUsuario) {
        // Actualizar usuario existente
        await updateUsuario(editingUsuario.id_usuario, dataToSend)
        mostrarToast('Usuario actualizado exitosamente')
      } else {
        // Crear nuevo usuario
        await createUsuario(dataToSend)
        mostrarToast('Usuario creado exitosamente')
      }

      // Recargar lista y cerrar modal
      cargarUsuarios()
      setShowModal(false)
      setFormData({
        nombre: '',
        password: '',
        id_rol: '',
        estado: true
      })
      setEditingUsuario(null)
    } catch (error) {
      console.error('Error al guardar usuario:', error)
      mostrarToast('Error al guardar usuario: ' + error.message, 'error')
    }
  }

  // Función para eliminar usuario (solo ADMIN)
  const handleEliminarUsuario = async (usuario) => {
    // Verificar que el usuario actual sea administrador
    if (!isAdmin) {
      mostrarToast('Solo los administradores pueden eliminar usuarios', 'error')
      return
    }

    // Verificar que no se intente eliminar a sí mismo
    if (user && user.id_usuario === usuario.id_usuario) {
      mostrarToast('No puedes eliminar tu propio usuario', 'error')
      return
    }

    // Mostrar confirmación personalizada
    mostrarConfirmacion(
      'Eliminar Usuario',
      `¿Está seguro de eliminar al usuario "${usuario.nombre}"?\n\nEsta acción no se puede deshacer.`,
      async () => {
        try {
          await deleteUsuario(usuario.id_usuario)
          mostrarToast('Usuario eliminado exitosamente')
          cargarUsuarios() // Recargar la lista
        } catch (error) {
          console.error('Error al eliminar usuario:', error)
          mostrarToast('Error al eliminar usuario: ' + error.message, 'error')
        }
      }
    )
  }

  // Filtrar usuarios por término de búsqueda (solo nombre)
  const usuariosFiltrados = usuarios.filter(usuario => {
    const searchLower = searchTerm.toLowerCase()
    return usuario.nombre?.toLowerCase().includes(searchLower)
  })

  // Función para renderizar el modal de edición
  const renderModal = () => {
    const esEdicionPerfil = !isAdmin && editingUsuario?.id_usuario === user?.id_usuario
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto m-4">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">
              {esEdicionPerfil ? 'Editar Mi Perfil' : editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Campo Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                placeholder="Nombre del usuario"
                required
              />
            </div>

            {/* Campo Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña {!editingUsuario && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                placeholder={editingUsuario ? "Nueva contraseña (opcional)" : "Contraseña"}
                required={!editingUsuario}
              />
            </div>

            {/* Campo Rol - Solo para ADMIN */}
            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol <span className="text-red-500">*</span>
                </label>
                <select
                  name="id_rol"
                  value={formData.id_rol}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                  required
                >
                  <option value="">Seleccionar rol...</option>
                  {roles.map(rol => (
                    <option key={rol.id_rol} value={rol.id_rol}>
                      {rol.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Checkbox Estado Activo - Solo para ADMIN */}
            {isAdmin && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="estado"
                  id="estado"
                  checked={formData.estado}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-carpinteria-medio border-gray-300 rounded focus:ring-carpinteria-medio"
                />
                <label htmlFor="estado" className="ml-2 text-sm font-medium text-gray-700">
                  Usuario activo
                </label>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-carpinteria-medio text-white rounded-lg hover:bg-carpinteria-rojizo transition-colors"
              >
                {editingUsuario ? 'Actualizar' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // Protección adicional en el render
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-gray-500 text-lg">Verificando permisos...</div>
        </div>
      </div>
    )
  }

  // Si es VENDEDOR, mostrar solo vista de editar su perfil
  if (!isAdmin) {
    return (
      <>
        {/* Notificación Toast */}
        {toast.show && (
          <div className={`fixed top-4 right-4 z-[9999] px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
              <p className="text-gray-600 mt-2">Información de tu cuenta</p>
            </div>
            <button
              onClick={handleEditarMiPerfil}
              className="inline-flex items-center px-4 py-2 bg-carpinteria-medio text-white rounded-lg hover:bg-carpinteria-rojizo transition-colors"
            >
              <Edit className="w-5 h-5 mr-2" />
              Editar Perfil
            </button>
          </div>

          {/* Tarjeta de Perfil */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-carpinteria-oscuro to-carpinteria-medio p-6">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
                  <svg className="w-12 h-12 text-carpinteria-medio" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="text-white">
                  <h2 className="text-2xl font-bold">{user.nombre}</h2>
                  <p className="text-gray-200">{user.rol?.nombre || 'Vendedor'}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario</label>
                  <div className="text-lg text-gray-900">{user.nombre}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                    {user.rol?.nombre || 'VENDEDOR'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    user.estado ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.estado ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Creación</label>
                  <div className="text-lg text-gray-900">
                    {user.fecha_creacion ? new Date(user.fecha_creacion).toLocaleDateString('es-ES') : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showModal && renderModal()}
      </>
    )
  }

  // Vista para ADMINISTRADOR
  return (
    <>
      {/* Notificación Toast */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-[9999] px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600 mt-2">Gestión de usuarios del sistema</p>
        </div>
        <button 
          onClick={handleNuevoUsuario}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-carpinteria-medio text-white rounded-lg hover:bg-carpinteria-rojizo transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-carpinteria-oscuro">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Fecha Creación</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  Cargando usuarios...
                </td>
              </tr>
            ) : usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                </td>
              </tr>
            ) : (
              usuariosFiltrados.map((usuario) => (
                <tr key={usuario.id_usuario}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {usuario.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      usuario.rol?.nombre === 'ADMINISTRADOR' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {usuario.rol?.nombre || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      usuario.estado 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {usuario.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(usuario.fecha_creacion).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleCambiarEstado(usuario)}
                        className={`${
                          usuario.estado 
                            ? 'text-yellow-600 hover:text-yellow-800' 
                            : 'text-green-600 hover:text-green-800'
                        }`}
                        title={usuario.estado ? 'Desactivar usuario' : 'Activar usuario'}
                      >
                        {usuario.estado ? (
                          <ToggleRight className="w-5 h-5" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>
                      <button 
                        onClick={() => handleEditarUsuario(usuario)}
                        className="text-carpinteria-medio hover:text-carpinteria-rojizo"
                        title="Editar usuario"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      {/* Botón Eliminar - Solo ADMIN */}
                      {isAdmin && (
                        <button 
                          onClick={() => handleEliminarUsuario(usuario)}
                          className="text-red-600 hover:text-red-800"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* Modal de Crear/Editar Usuario */}
      {showModal && renderModal()}

      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{confirmTitle}</h3>
              <p className="text-gray-600 mb-6 whitespace-pre-line">{confirmMessage}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelarConfirmacion}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmar}
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
