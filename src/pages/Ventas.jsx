import { useState, useEffect } from 'react'
import { Plus, Search, Eye, X, Trash2, FileText } from 'lucide-react'
import { getVentas, getClientes, getProductos, getProductosListaSimple, createVentaContado, createVentaCredito, getVentaDetalle, anularVenta } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import Pagination from '../components/Pagination'

export default function Ventas() {
  // Auth
  const { user } = useAuthStore()
  const isAdmin = user?.rol?.nombre === 'ADMINISTRADOR'

  // Estados principales
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [ventaDetalle, setVentaDetalle] = useState(null)
  const [showAnularModal, setShowAnularModal] = useState(false)
  const [ventaAnular, setVentaAnular] = useState(null)
  const [motivoAnulacion, setMotivoAnulacion] = useState('')
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  })
  
  // Estados para notificaciones toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  
  // Estado para controlar si el modal muestra el formulario o la venta registrada
  const [ventaRegistrada, setVentaRegistrada] = useState(null)
  
  // Estados de filtros
  const [filtros, setFiltros] = useState({
    searchTerm: '',
    tipo: '', // CONTADO, CREDITO
    estado: '', // ACTIVA, ANULADA
    fechaDesde: '',
    fechaHasta: ''
  })

  // Estados para el modal de nueva venta
  const [clientes, setClientes] = useState([])
  const [clientesFiltrados, setClientesFiltrados] = useState([])
  const [searchCliente, setSearchCliente] = useState('')
  const [formVenta, setFormVenta] = useState({
    id_cliente: '',
    tipo_venta: 'CONTADO', // CONTADO o CREDITO
    metodo_pago: 'EFECTIVO', // EFECTIVO, TARJETA, TRANSFERENCIA
    dias_credito: 30
  })
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)

  // Estados para el carrito de productos
  const [carrito, setCarrito] = useState([])
  const [productos, setProductos] = useState([])
  const [productosFiltrados, setProductosFiltrados] = useState([])
  const [searchProducto, setSearchProducto] = useState('')
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [cantidadProducto, setCantidadProducto] = useState(1)
  const [precioProducto, setPrecioProducto] = useState(0)

  // Estados para descuentos
  const [descuentoTipo, setDescuentoTipo] = useState('NINGUNO') // NINGUNO, PORCENTAJE, MONTO
  const [descuentoValor, setDescuentoValor] = useState(0)

  // Función para mostrar notificación toast
  const mostrarToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' })
    }, 4000)
  }

  // Cargar ventas al montar el componente y cuando cambian filtros o paginación
  useEffect(() => {
    cargarVentas()
  }, [currentPage, pageSize, filtros])

  // Cargar clientes cuando se abre el modal
  useEffect(() => {
    if (showModal) {
      cargarClientes()
      cargarProductos()
    }
  }, [showModal])

  // Filtrar clientes por búsqueda (nombre, apellido o teléfono)
  useEffect(() => {
    if (searchCliente.trim() === '') {
      setClientesFiltrados(clientes)
    } else {
      const searchLower = searchCliente.toLowerCase()
      const filtered = clientes.filter(cliente =>
        cliente.nombre?.toLowerCase().includes(searchLower) ||
        cliente.apellido?.toLowerCase().includes(searchLower) ||
        cliente.telefono?.includes(searchCliente)
      )
      setClientesFiltrados(filtered)
    }
  }, [searchCliente, clientes])

  // Filtrar productos por búsqueda (nombre, descripción, categoría, unidad de medida)
  useEffect(() => {
    if (searchProducto.trim() === '') {
      setProductosFiltrados([])
    } else {
      const searchLower = searchProducto.toLowerCase()
      const filtered = productos.filter(producto => {
        // Buscar en nombre
        if (producto.nombre?.toLowerCase().includes(searchLower)) return true
        // Buscar en descripción
        if (producto.descripcion?.toLowerCase().includes(searchLower)) return true
        // Buscar en categoría
        if (producto.categorias?.nombre?.toLowerCase().includes(searchLower)) return true
        // Buscar en unidad de medida
        if (producto.unidad_medida?.toLowerCase().includes(searchLower)) return true
        // Buscar en código (si existe)
        if (producto.codigo?.toLowerCase().includes(searchLower)) return true
        return false
      })
      setProductosFiltrados(filtered)
    }
  }, [searchProducto, productos])

  // Función para cargar clientes (todos sin paginación)
  const cargarClientes = async () => {
    try {
      const response = await getClientes({ limit: 1000 }) // Obtener todos los clientes sin límite
      const data = response.datos || response || []
      setClientes(data)
      setClientesFiltrados(data)
    } catch (error) {
      console.error('Error al cargar clientes:', error)
      alert('Error al cargar los clientes.')
    }
  }

  // Función para cargar productos (todos sin paginación)
  const cargarProductos = async () => {
    try {
      const response = await getProductosListaSimple()
      // getProductosListaSimple retorna directamente el array
      setProductos(Array.isArray(response) ? response : (response.datos || response || []))
    } catch (error) {
      console.error('Error al cargar productos:', error)
      alert('Error al cargar los productos.')
    }
  }

  // Función para cargar ventas con manejo de errores y paginación
  const cargarVentas = async () => {
    try {
      setLoading(true)
      
      // Preparar parámetros de filtrado y paginación
      const params = {
        page: currentPage,
        limit: pageSize
      }
      if (filtros.tipo) params.tipo_venta = filtros.tipo
      if (filtros.estado) params.estado = filtros.estado
      if (filtros.fechaDesde) params.fecha_desde = filtros.fechaDesde
      if (filtros.fechaHasta) params.fecha_hasta = filtros.fechaHasta
      if (filtros.searchTerm) params.busqueda = filtros.searchTerm
      
      const response = await getVentas(params)
      setVentas(response.datos || response || [])
      setPagination(response.paginacion || {
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      })
    } catch (error) {
      console.error('Error al cargar ventas:', error)
      alert('Error al cargar las ventas. Por favor, intenta de nuevo.')
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

  // Funciones del modal
  const handleOpenModal = () => {
    setShowModal(true)
    setVentaRegistrada(null)
    setFormVenta({
      id_cliente: '',
      tipo_venta: 'CONTADO',
      metodo_pago: 'EFECTIVO',
      dias_credito: 30
    })
    setClienteSeleccionado(null)
    setSearchCliente('')
    setCarrito([])
    setProductoSeleccionado(null)
    setSearchProducto('')
    setCantidadProducto(1)
    setPrecioProducto(0)
    setDescuentoTipo('NINGUNO')
    setDescuentoValor(0)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setVentaRegistrada(null)
    setFormVenta({
      id_cliente: '',
      tipo_venta: 'CONTADO',
      metodo_pago: 'EFECTIVO',
      dias_credito: 30
    })
    setClienteSeleccionado(null)
    setSearchCliente('')
    setCarrito([])
    setProductoSeleccionado(null)
    setSearchProducto('')
    setCantidadProducto(1)
    setPrecioProducto(0)
    setDescuentoTipo('NINGUNO')
    setDescuentoValor(0)
  }

  const handleSelectCliente = (cliente) => {
    console.log('🧑 Cliente seleccionado:', cliente)
    setClienteSeleccionado(cliente)
    setFormVenta({ ...formVenta, id_cliente: cliente.id_cliente })
    console.log('✅ id_cliente guardado:', cliente.id_cliente)
    setSearchCliente('')
  }

  const handleChangeTipoVenta = (tipo) => {
    setFormVenta({ ...formVenta, tipo_venta: tipo })
  }

  // Funciones del carrito de productos
  const handleSelectProducto = (producto) => {
    setProductoSeleccionado(producto)
    setPrecioProducto(producto.precio_venta || 0)
    setCantidadProducto(1)
    setSearchProducto('')
  }

  const agregarProductoAlCarrito = () => {
    if (!productoSeleccionado) {
      mostrarToast('Por favor, selecciona un producto.', 'error')
      return
    }

    if (cantidadProducto <= 0) {
      mostrarToast('La cantidad debe ser mayor a 0.', 'error')
      return
    }

    if (cantidadProducto > productoSeleccionado.cantidad_stock) {
      mostrarToast(`Stock insuficiente. Disponible: ${productoSeleccionado.cantidad_stock}`, 'error')
      return
    }

    if (precioProducto <= 0) {
      mostrarToast('El precio debe ser mayor a 0.', 'error')
      return
    }

    // Verificar si el producto ya está en el carrito
    const productoExistente = carrito.find(item => item.id_producto === productoSeleccionado.id_producto)
    if (productoExistente) {
      mostrarToast('Este producto ya está en el carrito. Puedes editar la cantidad directamente en la tabla.', 'error')
      return
    }

    const nuevoItem = {
      id_producto: productoSeleccionado.id_producto,
      nombre: productoSeleccionado.nombre,
      codigo: productoSeleccionado.codigo,
      cantidad: cantidadProducto,
      precio_unitario: precioProducto,
      stock_disponible: productoSeleccionado.cantidad_stock,
      subtotal: cantidadProducto * precioProducto
    }

    console.log('✅ Agregando producto al carrito:', nuevoItem)
    setCarrito([...carrito, nuevoItem])
    
    // Limpiar selección
    setProductoSeleccionado(null)
    setSearchProducto('')
    setCantidadProducto(1)
    setPrecioProducto(0)
  }

  const eliminarDelCarrito = (idProducto) => {
    setCarrito(carrito.filter(item => item.id_producto !== idProducto))
  }

  const actualizarCantidadCarrito = (idProducto, nuevaCantidad) => {
    const producto = productos.find(p => p.id_producto === idProducto)
    
    if (nuevaCantidad <= 0) {
      mostrarToast('La cantidad debe ser mayor a 0.', 'error')
      return
    }

    if (nuevaCantidad > producto.cantidad_stock) {
      mostrarToast(`Stock insuficiente. Disponible: ${producto.cantidad_stock}`, 'error')
      return
    }

    setCarrito(carrito.map(item => 
      item.id_producto === idProducto 
        ? { ...item, cantidad: nuevaCantidad, subtotal: nuevaCantidad * item.precio_unitario }
        : item
    ))
  }

  const actualizarPrecioCarrito = (idProducto, nuevoPrecio) => {
    if (nuevoPrecio <= 0) {
      mostrarToast('El precio debe ser mayor a 0.', 'error')
      return
    }

    setCarrito(carrito.map(item => 
      item.id_producto === idProducto 
        ? { ...item, precio_unitario: nuevoPrecio, subtotal: item.cantidad * nuevoPrecio }
        : item
    ))
  }

  const calcularTotalVenta = () => {
    return carrito.reduce((total, item) => {
      const cantidad = parseFloat(item.cantidad) || 0
      const precio = parseFloat(item.precio_unitario) || 0
      return total + (cantidad * precio)
    }, 0)
  }

  // Función para calcular el monto del descuento
  const calcularDescuento = () => {
    const subtotal = calcularTotalVenta()
    
    if (descuentoTipo === 'NINGUNO' || descuentoValor === '' || descuentoValor === 0) {
      return 0
    }
    
    if (descuentoTipo === 'PORCENTAJE') {
      return (subtotal * parseFloat(descuentoValor)) / 100
    }
    
    if (descuentoTipo === 'MONTO') {
      return parseFloat(descuentoValor)
    }
    
    return 0
  }

  // Función para calcular el total final con descuento
  const calcularTotalConDescuento = () => {
    const subtotal = calcularTotalVenta()
    const descuento = calcularDescuento()
    return subtotal - descuento
  }

  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A'
    const date = new Date(fecha)
    const dia = String(date.getDate()).padStart(2, '0')
    const mes = String(date.getMonth() + 1).padStart(2, '0')
    const año = date.getFullYear()
    const horas = String(date.getHours()).padStart(2, '0')
    const minutos = String(date.getMinutes()).padStart(2, '0')
    return `${dia}/${mes}/${año} ${horas}:${minutos}`
  }

  // La paginación y filtrado se maneja en el servidor

  // Función para validar y enviar la venta
  const handleSubmitVenta = async () => {
    try {
      // Validación 1: Cliente seleccionado
      if (!clienteSeleccionado) {
        mostrarToast('Por favor, selecciona un cliente.', 'error')
        return
      }

      // Validación 2: Carrito no vacío
      if (carrito.length === 0) {
        mostrarToast('Debes agregar al menos un producto al carrito.', 'error')
        return
      }

      // Validación 3: Si CONTADO, validar método de pago
      if (formVenta.tipo_venta === 'CONTADO' && !formVenta.metodo_pago) {
        mostrarToast('Por favor, selecciona un método de pago.', 'error')
        return
      }

      // Validación 4: Si CREDITO, validar que cliente sea tipo CREDITO
      if (formVenta.tipo_venta === 'CREDITO' && clienteSeleccionado.tipo_cliente !== 'CREDITO') {
        mostrarToast('El cliente seleccionado no es de tipo CRÉDITO. Por favor, selecciona un cliente tipo CRÉDITO o cambia a venta al CONTADO.', 'error')
        return
      }

      // Validación 5: Si CREDITO, validar límite de crédito disponible
      if (formVenta.tipo_venta === 'CREDITO') {
        const totalVenta = calcularTotalConDescuento() // Usar total con descuento
        const creditoDisponible = clienteSeleccionado.credito_disponible || 0
        
        if (totalVenta > creditoDisponible) {
          mostrarToast(`El total de la venta (Q${totalVenta.toFixed(2)}) excede el crédito disponible del cliente (Q${creditoDisponible.toFixed(2)}).`, 'error')
          return
        }
      }

      // Validación 6: Validar descuento si aplica
      const valorDescuento = parseFloat(descuentoValor) || 0
      if (descuentoTipo === 'PORCENTAJE' && valorDescuento > 100) {
        mostrarToast('El descuento por porcentaje no puede ser mayor a 100%.', 'error')
        return
      }

      if (descuentoTipo === 'MONTO' && valorDescuento > calcularTotalVenta()) {
        mostrarToast('El descuento en monto no puede ser mayor al subtotal.', 'error')
        return
      }

      setLoading(true)

      // Preparar array de productos para el backend
      const productos = carrito.map(item => ({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario
      }))

      // Preparar descuento si aplica
      const descuento = descuentoTipo !== 'NINGUNO' && valorDescuento > 0 ? {
        tipo: descuentoTipo,
        valor: valorDescuento
      } : undefined

      // Preparar data según el tipo de venta
      let response

      if (formVenta.tipo_venta === 'CONTADO') {
        // Venta al CONTADO
        const ventaData = {
          id_cliente: formVenta.id_cliente,
          productos: productos
        }
        
        // Agregar descuento si existe
        if (descuento) {
          ventaData.descuento = descuento
        }
        
        console.log('📤 Enviando venta CONTADO:', ventaData)
        response = await createVentaContado(ventaData)
      } else {
        // Venta a CRÉDITO
        const ventaData = {
          id_cliente: formVenta.id_cliente,
          dias_credito: formVenta.dias_credito,
          productos: productos
        }
        
        // Agregar descuento si existe
        if (descuento) {
          ventaData.descuento = descuento
        }
        
        console.log('📤 Enviando venta CREDITO:', ventaData)
        response = await createVentaCredito(ventaData)
      }

      // Éxito - Mostrar toast
      mostrarToast(`¡Venta registrada exitosamente! ${formVenta.tipo_venta === 'CREDITO' ? 'Se ha creado el crédito asociado.' : ''}`, 'success')
      
      // Recargar lista de ventas
      await cargarVentas()
      
      // Cargar el detalle de la venta recién creada
      const idVentaCreada = response.venta?.id_venta || response.id_venta
      if (idVentaCreada) {
        const detalleVenta = await getVentaDetalle(idVentaCreada)
        setVentaRegistrada(detalleVenta)
      }

      // NO cerrar el modal - mantenerlo abierto para mostrar la venta registrada

    } catch (error) {
      console.error('Error al crear la venta:', error)
      const mensajeError = error.response?.data?.error || error.message || 'Error al crear la venta. Por favor, intenta de nuevo.'
      mostrarToast(`Error: ${mensajeError}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Función para ver detalle de venta
  const handleVerDetalle = async (venta) => {
    try {
      setLoading(true)
      const detalle = await getVentaDetalle(venta.id_venta)
      setVentaDetalle(detalle)
      setShowDetailModal(true)
    } catch (error) {
      console.error('Error al cargar detalle de venta:', error)
      mostrarToast('Error al cargar el detalle de la venta.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseDetailModal = () => {
    setShowDetailModal(false)
    setVentaDetalle(null)
  }

  // Función para abrir modal de anulación
  const handleOpenAnularModal = (venta) => {
    if (venta.estado !== 'ACTIVA') {
      mostrarToast('Solo se pueden anular ventas en estado ACTIVA', 'error')
      return
    }
    setVentaAnular(venta)
    setMotivoAnulacion('')
    setShowAnularModal(true)
  }

  const handleCloseAnularModal = () => {
    setShowAnularModal(false)
    setVentaAnular(null)
    setMotivoAnulacion('')
  }

  // Función para generar PDF de la venta
  const generarPDFVenta = (venta) => {
    if (!venta || !venta.detalles || venta.detalles.length === 0) {
      mostrarToast('No hay información suficiente para generar el PDF', 'error')
      return
    }

    const doc = new jsPDF()

    // Header
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('VENTA', 105, 20, { align: 'center' })

    // Empresa
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('COMERCIAL SATURNO', 150, 35)
    
    // Fecha y Cliente
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const fechaVenta = venta.fecha_venta ? new Date(venta.fecha_venta).toLocaleDateString('es-GT') : new Date().toLocaleDateString('es-GT')
    doc.text(`FECHA: ${fechaVenta}`, 20, 45)
    const nombreCliente = venta.clientes ? `${venta.clientes.nombre} ${venta.clientes.apellido || ''}`.trim() : 'N/A'
    doc.text(`CLIENTE: ${nombreCliente}`, 20, 52)

    // ID de Venta
    doc.text(`ID VENTA: #${venta.id_venta?.substring(0, 8) || 'N/A'}`, 20, 59)

    // Tipo de Venta y Método de Pago
    let lineaActual = 66
    doc.text(`TIPO: ${venta.tipo_venta || 'N/A'}`, 20, lineaActual)
    if (venta.tipo_venta === 'CONTADO' && venta.metodo_pago) {
      doc.text(`MÉTODO DE PAGO: ${venta.metodo_pago}`, 20, lineaActual + 7)
      lineaActual += 7
    }

    // Línea separadora
    doc.setLineWidth(0.5)
    doc.line(20, lineaActual + 5, 190, lineaActual + 5)

    // Tabla de productos
    const tableData = venta.detalles.map(detalle => [
      detalle.productos?.nombre || 'N/A',
      detalle.cantidad.toString().padStart(3, '0'),
      `Q${parseFloat(detalle.precio_unitario || 0).toFixed(2)}`,
      `Q${parseFloat(detalle.subtotal || 0).toFixed(2)}`
    ])

    autoTable(doc, {
      startY: lineaActual + 12,
      head: [['PRODUCTO', 'CANTIDAD', 'PRECIO', 'TOTAL']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        textColor: [0, 0, 0]
      },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    })

    // Subtotal, descuento y total
    const finalY = doc.lastAutoTable.finalY || 150
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    // Subtotal
    const subtotal = parseFloat(venta.subtotal || venta.total || 0)
    doc.text('Subtotal:', 135, finalY + 10)
    doc.text(`Q${subtotal.toFixed(2)}`, 185, finalY + 10, { align: 'right' })
    
    // Descuento (si aplica)
    let descuentoY = finalY + 10
    if (venta.descuento_tipo && venta.descuento_tipo !== 'NINGUNO' && venta.descuento_monto > 0) {
      descuentoY = finalY + 17
      const descuentoTexto = venta.descuento_tipo === 'PORCENTAJE' 
        ? `Descuento (${venta.descuento_valor}%):`
        : `Descuento:`
      doc.text(descuentoTexto, 135, descuentoY)
      doc.text(`-Q${parseFloat(venta.descuento_monto || 0).toFixed(2)}`, 185, descuentoY, { align: 'right' })
    }
    
    // Total con fondo negro
    const totalY = descuentoY + 7
    doc.setFillColor(0, 0, 0)
    doc.rect(130, totalY - 5, 60, 10, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text('Total', 135, totalY + 1)
    doc.text(`Q${parseFloat(venta.total || 0).toFixed(2)}`, 185, totalY + 1, { align: 'right' })

    // Estado de la venta
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Estado: ${venta.estado || 'N/A'}`, 20, totalY + 15)

    // Nota al pie (solo para créditos)
    if (venta.tipo_venta === 'CREDITO' && venta.credito) {
      doc.setFont('helvetica', 'italic')
      const fechaVencimiento = venta.credito.fecha_vencimiento ? new Date(venta.credito.fecha_vencimiento).toLocaleDateString('es-GT') : 'N/A'
      doc.text(`Crédito - Fecha de vencimiento: ${fechaVencimiento}`, 20, totalY + 22)
    }

    // Guardar PDF
    const nombreArchivo = `Venta_${nombreCliente.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`
    doc.save(nombreArchivo)
    mostrarToast('PDF generado exitosamente', 'success')
  }

  // Función para anular venta
  const handleAnularVenta = async () => {
    if (!motivoAnulacion.trim()) {
      mostrarToast('Por favor, ingresa el motivo de la anulación', 'error')
      return
    }

    try {
      setLoading(true)
      await anularVenta(ventaAnular.id_venta, motivoAnulacion)
      mostrarToast('Venta anulada exitosamente', 'success')
      handleCloseAnularModal()
      await cargarVentas()
    } catch (error) {
      console.error('Error al anular venta:', error)
      const mensajeError = error.response?.data?.error || error.message || 'Error al anular la venta'
      mostrarToast(`Error: ${mensajeError}`, 'error')
    } finally {
      setLoading(false)
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

      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
          <p className="text-gray-600 mt-2">Registro de ventas realizadas</p>
        </div>
        <button 
          onClick={handleOpenModal}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-carpinteria-medio text-white rounded-lg hover:bg-carpinteria-rojizo transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nueva Venta
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por cliente..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                value={filtros.searchTerm}
                onChange={(e) => setFiltros({ ...filtros, searchTerm: e.target.value })}
              />
            </div>
          </div>

          {/* Filtro por Tipo */}
          <div>
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
            >
              <option value="">Todos los tipos</option>
              <option value="CONTADO">Contado</option>
              <option value="CREDITO">Crédito</option>
            </select>
          </div>

          {/* Filtro por Estado */}
          <div>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVA">Activa</option>
              <option value="ANULADA">Anulada</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center text-gray-500">
            Cargando ventas...
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-carpinteria-oscuro">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Tipo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase">Total</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase">Estado</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ventas.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No se encontraron ventas
                    </td>
                  </tr>
                ) : (
                  ventas.map((venta) => (
                    <tr key={venta.id_venta} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatearFecha(venta.fecha_venta)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                        #{venta.id_venta?.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <p className="font-medium">
                            {venta.clientes ? `${venta.clientes.nombre} ${venta.clientes.apellido || ''}`.trim() : 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Tipo: {venta.clientes?.tipo_cliente || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          venta.tipo_venta === 'CONTADO'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {venta.tipo_venta}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                        Q{parseFloat(venta.total || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          venta.estado === 'ACTIVA'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {venta.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleVerDetalle(venta)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          {isAdmin && venta.estado === 'ACTIVA' && (
                            <button
                              onClick={() => handleOpenAnularModal(venta)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Anular venta"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Componente de Paginación */}
            {ventas.length > 0 && (
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
            )}
          </>
        )}
      </div>
      </div>

      {/* Modal de Nueva Venta */}
      {showModal && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100] animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slideIn">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                {ventaRegistrada ? '✅ Venta Registrada' : 'Nueva Venta'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contenido del Modal - Condicional */}
            {ventaRegistrada ? (
              /* Vista de Venta Registrada */
              <div className="p-6 space-y-6">
                {/* Información de la Venta */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold">Venta Exitosa</h3>
                      <p className="text-green-100 mt-1">ID: #{ventaRegistrada.id_venta?.substring(0, 8)}</p>
                    </div>
                    <div className="text-right">
                      {ventaRegistrada.descuento_tipo && ventaRegistrada.descuento_tipo !== 'NINGUNO' && ventaRegistrada.descuento_monto > 0 ? (
                        <>
                          <p className="text-green-100 text-sm">Subtotal</p>
                          <p className="text-2xl font-semibold">Q{parseFloat(ventaRegistrada.subtotal || 0).toFixed(2)}</p>
                          <p className="text-green-100 text-xs mt-1">
                            Descuento {ventaRegistrada.descuento_tipo === 'PORCENTAJE' ? `(${ventaRegistrada.descuento_valor}%)` : ''}: -Q{parseFloat(ventaRegistrada.descuento_monto || 0).toFixed(2)}
                          </p>
                          <p className="text-green-100 text-sm mt-2">Total</p>
                          <p className="text-4xl font-bold">Q{parseFloat(ventaRegistrada.total || 0).toFixed(2)}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-green-100 text-sm">Total</p>
                          <p className="text-4xl font-bold">Q{parseFloat(ventaRegistrada.total || 0).toFixed(2)}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm border-t border-green-400 pt-4">
                    <div>
                      <p className="text-green-100">Cliente</p>
                      <p className="font-semibold">
                        {ventaRegistrada.clientes ? `${ventaRegistrada.clientes.nombre} ${ventaRegistrada.clientes.apellido || ''}`.trim() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-green-100">Tipo de Venta</p>
                      <p className="font-semibold">{ventaRegistrada.tipo_venta}</p>
                    </div>
                  </div>
                </div>

                {/* Tabla de Productos */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Detalle de Productos</h3>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Producto</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Cantidad</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Precio Unit.</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {ventaRegistrada.detalles?.map((detalle, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {detalle.productos?.nombre || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-center text-sm font-semibold text-gray-800">
                              {detalle.cantidad}
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-gray-900">
                              Q{parseFloat(detalle.precio_unitario || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-semibold text-green-600">
                              Q{parseFloat(detalle.subtotal || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer con botones */}
                <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => generarPDFVenta(ventaRegistrada)}
                    className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Generar PDF
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setVentaRegistrada(null)
                        setFormVenta({
                          id_cliente: '',
                          tipo_venta: 'CONTADO',
                          metodo_pago: 'EFECTIVO',
                          dias_credito: 30
                        })
                        setClienteSeleccionado(null)
                        setSearchCliente('')
                        setCarrito([])
                        setProductoSeleccionado(null)
                        setSearchProducto('')
                        setCantidadProducto(1)
                        setPrecioProducto(0)
                        setDescuentoTipo('NINGUNO')
                        setDescuentoValor(0)
                      }}
                      className="px-6 py-3 bg-carpinteria-medio text-white rounded-lg hover:bg-carpinteria-rojizo transition-colors font-semibold"
                    >
                      Nueva Venta
                    </button>
                    <button
                      onClick={handleCloseModal}
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Vista de Formulario de Nueva Venta */
              <>
                <div className="p-6 space-y-6">
              {/* Sección: Selección de Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                {clienteSeleccionado ? (
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">{clienteSeleccionado.nombre} {clienteSeleccionado.apellido || ''}</p>
                      <p className="text-sm text-gray-600">Teléfono: {clienteSeleccionado.telefono || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Tipo: {clienteSeleccionado.tipo_cliente}</p>
                    </div>
                    <button
                      onClick={() => setClienteSeleccionado(null)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Buscar cliente por nombre o teléfono..."
                      value={searchCliente}
                      onChange={(e) => setSearchCliente(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                    />
                    {searchCliente && clientesFiltrados.length > 0 && (
                      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                        {clientesFiltrados.map((cliente) => (
                          <button
                            key={cliente.id}
                            onClick={() => handleSelectCliente(cliente)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <p className="font-medium text-gray-900">{cliente.nombre} {cliente.apellido || ''}</p>
                            <p className="text-sm text-gray-600">
                              Teléfono: {cliente.telefono || 'N/A'} | Tipo: {cliente.tipo_cliente || 'N/A'}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchCliente && clientesFiltrados.length === 0 && (
                      <p className="text-sm text-gray-500 italic">No se encontraron clientes</p>
                    )}
                  </div>
                )}
              </div>

              {/* Sección: Tipo de Venta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de Venta *
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => handleChangeTipoVenta('CONTADO')}
                    className={`flex-1 px-6 py-3 rounded-lg border-2 font-medium transition-all ${
                      formVenta.tipo_venta === 'CONTADO'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="radio"
                        checked={formVenta.tipo_venta === 'CONTADO'}
                        onChange={() => {}}
                        className="w-4 h-4"
                      />
                      <span>CONTADO</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangeTipoVenta('CREDITO')}
                    className={`flex-1 px-6 py-3 rounded-lg border-2 font-medium transition-all ${
                      formVenta.tipo_venta === 'CREDITO'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="radio"
                        checked={formVenta.tipo_venta === 'CREDITO'}
                        onChange={() => {}}
                        className="w-4 h-4"
                      />
                      <span>CRÉDITO</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Condicional: Método de Pago (solo si CONTADO) */}
              {formVenta.tipo_venta === 'CONTADO' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pago *
                  </label>
                  <select
                    value={formVenta.metodo_pago}
                    onChange={(e) => setFormVenta({ ...formVenta, metodo_pago: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                  >
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TARJETA">Tarjeta</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                  </select>
                </div>
              )}

              {/* Condicional: Días de Crédito (solo si CREDITO) */}
              {formVenta.tipo_venta === 'CREDITO' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días de Crédito
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formVenta.dias_credito}
                      onChange={(e) => {
                        const valor = e.target.value
                        setFormVenta({ ...formVenta, dias_credito: valor === '' ? '' : parseInt(valor) || '' })
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '' || parseInt(e.target.value) < 1) {
                          setFormVenta({ ...formVenta, dias_credito: 30 })
                        }
                      }}
                      onWheel={(e) => e.target.blur()}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                    />
                    <p className="mt-1 text-sm text-gray-500">Días para el vencimiento del crédito (por defecto 30 días)</p>
                  </div>

                  {/* Límite de Crédito Disponible */}
                  {clienteSeleccionado && clienteSeleccionado.tipo_cliente === 'CREDITO' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Información de Crédito del Cliente</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Límite Total:</p>
                          <p className="font-bold text-gray-900">
                            Q{clienteSeleccionado.limite_credito?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Crédito Disponible:</p>
                          <p className="font-bold text-green-600">
                            Q{clienteSeleccionado.credito_disponible?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Advertencia si el cliente NO es tipo CREDITO */}
                  {clienteSeleccionado && clienteSeleccionado.tipo_cliente !== 'CREDITO' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800 font-medium">
                        ⚠️ Este cliente NO es tipo CRÉDITO. No podrás crear una venta a crédito.
                      </p>
                      <p className="text-red-600 text-sm mt-1">
                        Por favor, selecciona un cliente tipo CRÉDITO o cambia a venta al CONTADO.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Sección: Carrito de Productos */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Productos de la Venta</h3>
                
                {/* Búsqueda y selección de productos */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agregar Producto
                  </label>
                  
                  {productoSeleccionado ? (
                    <div className="space-y-3">
                      {/* Producto seleccionado */}
                      <div className="bg-white p-3 rounded border border-gray-300">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">{productoSeleccionado.nombre}</p>
                            <p className="text-sm text-gray-600">Código: {productoSeleccionado.codigo}</p>
                          </div>
                          <button
                            onClick={() => setProductoSeleccionado(null)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Cambiar
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className={`px-2 py-1 rounded ${
                            productoSeleccionado.cantidad_stock === 0 
                              ? 'bg-red-100 text-red-800' 
                              : productoSeleccionado.cantidad_stock < (productoSeleccionado.stock_minimo || 0)
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            Stock: {productoSeleccionado.cantidad_stock}
                          </span>
                          <span className="text-gray-600">
                            Precio: Q{productoSeleccionado.precio_venta?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </div>

                      {/* Campos de cantidad y precio */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cantidad *
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={productoSeleccionado.cantidad_stock}
                            value={cantidadProducto}
                            onChange={(e) => {
                              const valor = e.target.value
                              setCantidadProducto(valor === '' ? '' : parseInt(valor) || '')
                            }}
                            onBlur={(e) => {
                              if (e.target.value === '' || parseInt(e.target.value) < 1) {
                                setCantidadProducto(1)
                              }
                            }}
                            onWheel={(e) => e.target.blur()}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Precio Unitario *
                          </label>
                          <input
                            type="number"
                            value={precioProducto}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                            title="El precio se toma automáticamente del producto registrado"
                          />
                          <p className="mt-1 text-xs text-gray-500">Precio registrado del producto</p>
                        </div>
                      </div>

                      {/* Subtotal y botón agregar */}
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-semibold text-gray-900">
                          Subtotal: Q{(cantidadProducto * precioProducto).toFixed(2)}
                        </p>
                        <button
                          onClick={agregarProductoAlCarrito}
                          className="px-4 py-2 bg-carpinteria-medio text-white rounded-lg hover:bg-carpinteria-rojizo transition-colors"
                        >
                          Agregar al Carrito
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Buscar producto por nombre o código..."
                        value={searchProducto}
                        onChange={(e) => setSearchProducto(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                      />
                      {searchProducto && productosFiltrados.length > 0 && (
                        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                          {productosFiltrados.map((producto) => (
                            <button
                              key={producto.id}
                              onClick={() => handleSelectProducto(producto)}
                              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900">{producto.nombre}</p>
                                  <p className="text-sm text-gray-600">
                                    Código: {producto.codigo} | Precio: Q{producto.precio_venta?.toFixed(2) || '0.00'}
                                  </p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded ${
                                  producto.cantidad_stock === 0 
                                    ? 'bg-red-100 text-red-800' 
                                    : producto.cantidad_stock < (producto.stock_minimo || 0)
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  Stock: {producto.cantidad_stock}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchProducto && productosFiltrados.length === 0 && (
                        <p className="text-sm text-gray-500 italic">No se encontraron productos</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Tabla del carrito */}
                {carrito.length > 0 ? (
                  <div className="overflow-x-auto">
                    <p className="text-xs text-gray-500 mb-2 italic">
                      💡 Puedes ajustar el precio unitario en la tabla si necesitas hacer descuentos por producto
                    </p>
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Producto</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Cantidad</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                            Precio Unit.
                            <span className="block text-[10px] font-normal text-gray-500 normal-case">(editable)</span>
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Subtotal</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {carrito.map((item) => (
                          <tr key={item.id_producto}>
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900">{item.nombre}</p>
                              <p className="text-xs text-gray-500">Código: {item.codigo}</p>
                              <p className="text-xs text-gray-500">Stock disponible: {item.stock_disponible}</p>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                min="1"
                                max={item.stock_disponible}
                                value={item.cantidad}
                                onChange={(e) => {
                                  const valor = e.target.value
                                  if (valor === '') {
                                    setCarrito(carrito.map(i => 
                                      i.id_producto === item.id_producto ? { ...i, cantidad: '' } : i
                                    ))
                                  } else {
                                    actualizarCantidadCarrito(item.id_producto, parseInt(valor) || 1)
                                  }
                                }}
                                onBlur={(e) => {
                                  if (e.target.value === '' || parseInt(e.target.value) < 1) {
                                    actualizarCantidadCarrito(item.id_producto, 1)
                                  }
                                }}
                                onWheel={(e) => e.target.blur()}
                                className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.precio_unitario}
                                onChange={(e) => {
                                  const valor = e.target.value
                                  if (valor === '') {
                                    setCarrito(carrito.map(i => 
                                      i.id_producto === item.id_producto ? { ...i, precio_unitario: '' } : i
                                    ))
                                  } else {
                                    actualizarPrecioCarrito(item.id_producto, parseFloat(valor) || 0)
                                  }
                                }}
                                onBlur={(e) => {
                                  if (e.target.value === '' || parseFloat(e.target.value) <= 0) {
                                    actualizarPrecioCarrito(item.id_producto, item.precio_unitario || 0)
                                  }
                                }}
                                onWheel={(e) => e.target.blur()}
                                className="w-24 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                              />
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                              Q{item.subtotal.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => eliminarDelCarrito(item.id_producto)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                title="Eliminar producto"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Descuentos */}
                    <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Descuento</h4>
                      
                      {/* Selector de tipo de descuento */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <button
                          type="button"
                          onClick={() => {
                            setDescuentoTipo('NINGUNO')
                            setDescuentoValor(0)
                          }}
                          className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                            descuentoTipo === 'NINGUNO'
                              ? 'border-gray-500 bg-gray-100 text-gray-800'
                              : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                          }`}
                        >
                          Sin Descuento
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDescuentoTipo('PORCENTAJE')
                            setDescuentoValor(0)
                          }}
                          className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                            descuentoTipo === 'PORCENTAJE'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                          }`}
                        >
                          Porcentaje %
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDescuentoTipo('MONTO')
                            setDescuentoValor(0)
                          }}
                          className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                            descuentoTipo === 'MONTO'
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                          }`}
                        >
                          Monto Fijo Q
                        </button>
                      </div>

                      {/* Input de valor de descuento */}
                      {descuentoTipo !== 'NINGUNO' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {descuentoTipo === 'PORCENTAJE' ? 'Porcentaje de descuento' : 'Monto del descuento'}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max={descuentoTipo === 'PORCENTAJE' ? '100' : calcularTotalVenta()}
                              step={descuentoTipo === 'PORCENTAJE' ? '1' : '0.01'}
                              value={descuentoValor}
                              onChange={(e) => {
                                const valor = e.target.value
                                if (valor === '') {
                                  setDescuentoValor('')
                                  return
                                }
                                const numValor = parseFloat(valor)
                                if (descuentoTipo === 'PORCENTAJE' && numValor <= 100) {
                                  setDescuentoValor(numValor)
                                } else if (descuentoTipo === 'MONTO' && numValor <= calcularTotalVenta()) {
                                  setDescuentoValor(numValor)
                                }
                              }}
                              onBlur={(e) => {
                                if (e.target.value === '' || parseFloat(e.target.value) < 0) {
                                  setDescuentoValor(0)
                                }
                              }}
                              onWheel={(e) => e.target.blur()}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio pr-12"
                              placeholder="0"
                            />
                            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                              {descuentoTipo === 'PORCENTAJE' ? '%' : 'Q'}
                            </span>
                          </div>
                          {descuentoTipo === 'PORCENTAJE' && descuentoValor > 0 && (
                            <p className="mt-1 text-sm text-blue-600">
                              Descuento: Q{calcularDescuento().toFixed(2)}
                            </p>
                          )}
                          {descuentoTipo === 'MONTO' && descuentoValor > calcularTotalVenta() && (
                            <p className="mt-1 text-sm text-red-600">
                              El descuento no puede ser mayor al subtotal
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Resumen de totales */}
                    <div className="mt-4 space-y-2">
                      {/* Subtotal */}
                      <div className="flex items-center justify-between text-gray-700 px-4">
                        <span className="font-medium">Subtotal:</span>
                        <span className="font-semibold">Q{calcularTotalVenta().toFixed(2)}</span>
                      </div>

                      {/* Descuento (si aplica) */}
                      {descuentoTipo !== 'NINGUNO' && descuentoValor > 0 && (
                        <div className="flex items-center justify-between text-red-600 px-4">
                          <span className="font-medium">
                            Descuento {descuentoTipo === 'PORCENTAJE' ? `(${descuentoValor}%)` : ''}:
                          </span>
                          <span className="font-semibold">-Q{calcularDescuento().toFixed(2)}</span>
                        </div>
                      )}

                      {/* Total Final */}
                      <div className="bg-carpinteria-oscuro text-white p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold">TOTAL A PAGAR:</span>
                          <span className="text-2xl font-bold">Q{calcularTotalConDescuento().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-500">No hay productos en el carrito</p>
                    <p className="text-sm text-gray-400 mt-1">Busca y agrega productos para crear la venta</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitVenta}
                disabled={loading || !clienteSeleccionado || carrito.length === 0}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  loading || !clienteSeleccionado || carrito.length === 0
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-carpinteria-medio text-white hover:bg-carpinteria-rojizo'
                }`}
              >
                {loading ? 'Procesando...' : 'Guardar Venta'}
              </button>
            </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Detalle de Venta */}
      {showDetailModal && ventaDetalle && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fadeIn">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-carpinteria-oscuro to-carpinteria-rojizo">
              <h2 className="text-2xl font-bold text-white">Detalle de Venta</h2>
              <button
                onClick={handleCloseDetailModal}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6">
              {/* Información de la Venta */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">ID Venta</p>
                    <p className="text-lg font-bold text-carpinteria-oscuro">#{ventaDetalle.id_venta?.substring(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Fecha</p>
                    <p className="text-lg font-semibold text-gray-800">{formatearFecha(ventaDetalle.fecha_venta)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Usuario</p>
                    <p className="text-lg font-semibold text-gray-800">{ventaDetalle.usuarios?.nombre || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Información del Cliente */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-bold text-carpinteria-oscuro mb-3">Información del Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Nombre</p>
                    <p className="text-base font-semibold text-gray-800">
                      {ventaDetalle.clientes ? `${ventaDetalle.clientes.nombre} ${ventaDetalle.clientes.apellido || ''}`.trim() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Teléfono</p>
                    <p className="text-base font-semibold text-gray-800">{ventaDetalle.clientes?.telefono || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Tipo</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      ventaDetalle.clientes?.tipo_cliente === 'CREDITO'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {ventaDetalle.clientes?.tipo_cliente || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabla de Productos */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-carpinteria-oscuro mb-3">Productos</h3>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Producto
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Cantidad
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Precio Unit.
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ventaDetalle.detalles?.map((detalle, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {detalle.productos?.nombre || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-gray-800">
                            {detalle.cantidad}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            Q{parseFloat(detalle.precio_unitario || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-carpinteria-medio">
                            Q{parseFloat(detalle.subtotal || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total y Detalles de Pago */}
              <div className="bg-gradient-to-r from-carpinteria-claro to-carpinteria-medio rounded-lg p-4">
                {/* Subtotal y Descuento */}
                {ventaDetalle.descuento_tipo && ventaDetalle.descuento_tipo !== 'NINGUNO' && ventaDetalle.descuento_monto > 0 ? (
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">Subtotal</span>
                      <span className="text-lg font-semibold text-white">
                        Q{parseFloat(ventaDetalle.subtotal || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">
                        Descuento {ventaDetalle.descuento_tipo === 'PORCENTAJE' ? `(${ventaDetalle.descuento_valor}%)` : ''}
                      </span>
                      <span className="text-lg font-semibold text-red-200">
                        -Q{parseFloat(ventaDetalle.descuento_monto || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* Total */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-white">Total de la Venta</span>
                  <span className="text-3xl font-bold text-white">
                    Q{parseFloat(ventaDetalle.total || 0).toFixed(2)}
                  </span>
                </div>

                <div className="border-t border-white/30 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-white/80 font-medium">Tipo de Venta</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${
                      ventaDetalle.tipo_venta === 'CREDITO'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {ventaDetalle.tipo_venta}
                    </span>
                  </div>

                  {ventaDetalle.tipo_venta === 'CONTADO' && ventaDetalle.metodo_pago && (
                    <div>
                      <p className="text-sm text-white/80 font-medium">Método de Pago</p>
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 bg-blue-100 text-blue-800">
                        {ventaDetalle.metodo_pago}
                      </span>
                    </div>
                  )}

                  {ventaDetalle.tipo_venta === 'CREDITO' && ventaDetalle.credito && (
                    <div>
                      <p className="text-sm text-white/80 font-medium">Crédito Asociado</p>
                      <p className="text-base font-semibold text-white mt-1">
                        ID: #{ventaDetalle.credito.id} - {ventaDetalle.credito.estado}
                      </p>
                    </div>
                  )}
                </div>

                {/* Estado de la Venta */}
                <div className="border-t border-white/30 pt-4 mt-4">
                  <p className="text-sm text-white/80 font-medium">Estado</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${
                    ventaDetalle.estado === 'ACTIVA'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {ventaDetalle.estado}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => generarPDFVenta(ventaDetalle)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FileText className="w-5 h-5 mr-2" />
                Generar PDF
              </button>
              <button
                onClick={handleCloseDetailModal}
                className="px-6 py-2 bg-carpinteria-medio text-white rounded-lg hover:bg-carpinteria-rojizo transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Anular Venta */}
      {showAnularModal && ventaAnular && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-fadeIn">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700">
              <h2 className="text-2xl font-bold text-white">⚠️ Anular Venta</h2>
              <button
                onClick={handleCloseAnularModal}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6">
              {/* Información de la Venta */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800 font-medium mb-2">
                  Estás a punto de anular la siguiente venta:
                </p>
                <div className="space-y-1 text-sm text-gray-700">
                  <p><span className="font-semibold">ID:</span> #{ventaAnular.id_venta?.substring(0, 8) || 'N/A'}</p>
                  <p><span className="font-semibold">Cliente:</span> {ventaAnular.clientes ? `${ventaAnular.clientes.nombre} ${ventaAnular.clientes.apellido || ''}`.trim() : 'N/A'}</p>
                  <p><span className="font-semibold">Total:</span> Q{parseFloat(ventaAnular.total || 0).toFixed(2)}</p>
                  <p><span className="font-semibold">Tipo:</span> {ventaAnular.tipo_venta || 'N/A'}</p>
                </div>
              </div>

              {/* Advertencia */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800 font-medium mb-1">
                  ⚠️ Advertencia
                </p>
                <p className="text-xs text-yellow-700">
                  Esta acción no se puede deshacer. El stock de los productos será devuelto automáticamente.
                  {ventaAnular.tipo_venta === 'CREDITO' && ' El crédito asociado también será anulado.'}
                </p>
              </div>

              {/* Campo Motivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de la anulación <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={motivoAnulacion}
                  onChange={(e) => setMotivoAnulacion(e.target.value)}
                  placeholder="Ingresa el motivo por el cual se anula esta venta..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Caracteres: {motivoAnulacion.length}
                </p>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleCloseAnularModal}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleAnularVenta}
                disabled={loading || !motivoAnulacion.trim()}
                className={`px-6 py-2 rounded-lg transition-colors font-semibold ${
                  loading || !motivoAnulacion.trim()
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {loading ? 'Anulando...' : 'Confirmar Anulación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
