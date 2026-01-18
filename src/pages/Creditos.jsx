import { useState, useEffect } from 'react'
import { Search, DollarSign, Eye, CreditCard, FileText, X, Download } from 'lucide-react'
import { getCreditos, getCredito, getClientes, createPago, getHistorialPagos } from '../services/api'
import Pagination from '../components/Pagination'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function Creditos() {
  // Estados principales
  const [creditos, setCreditos] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  })
  
  // Estados para modales
  const [showPagoModal, setShowPagoModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [creditoSeleccionado, setCreditoSeleccionado] = useState(null)
  const [historialPagos, setHistorialPagos] = useState([])
  const [loadingHistorial, setLoadingHistorial] = useState(false)
  const [pagoRegistrado, setPagoRegistrado] = useState(null) // Para mostrar pago registrado y botón PDF
  
  // Estado para toast notifications
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    estado: '', // '', 'ACTIVO', 'VENCIDO', 'PAGADO'
    id_cliente: '',
    fecha_desde: '',
    fecha_hasta: '',
    searchTerm: ''
  })

  // Estado para formulario de pago
  const [formPago, setFormPago] = useState({
    monto_pagado: '',
    metodo_pago: 'EFECTIVO',
    notas: ''
  })

  const [procesandoPago, setProcesandoPago] = useState(false)

  // Función para mostrar toast
  const mostrarToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' })
    }, 4000)
  }

  // Hook para cargar créditos al montar el componente
  useEffect(() => {
    cargarCreditos()
  }, [currentPage, pageSize, filtros])

  // Hook inicial para cargar clientes
  useEffect(() => {
    cargarClientes()
  }, [])

  // Función para cargar lista de clientes
  const cargarClientes = async () => {
    try {
      const response = await getClientes()
      // Si tiene paginación, extraer datos
      const todosClientes = response.datos || response || []
      // Filtrar solo clientes tipo CREDITO
      const clientesCredito = todosClientes.filter(cliente => cliente.tipo_cliente === 'CREDITO')
      setClientes(clientesCredito)
    } catch (error) {
      console.error('Error al cargar clientes:', error)
      setClientes([])
    }
  }

  // Función para cargar créditos con filtros y paginación
  const cargarCreditos = async () => {
    try {
      setLoading(true)
      
      // Preparar parámetros de filtro
      const params = {
        page: currentPage,
        limit: pageSize
      }
      if (filtros.estado) params.estado = filtros.estado
      if (filtros.id_cliente) params.id_cliente = filtros.id_cliente
      if (filtros.fecha_desde) params.fecha_desde = filtros.fecha_desde
      if (filtros.fecha_hasta) params.fecha_hasta = filtros.fecha_hasta

      const response = await getCreditos(params)
      setCreditos(response.datos || response || [])
      setPagination(response.paginacion || {
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      })
    } catch (error) {
      console.error('Error al cargar créditos:', error)
      setCreditos([])
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

  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A'
    const date = new Date(fecha)
    const dia = String(date.getDate()).padStart(2, '0')
    const mes = String(date.getMonth() + 1).padStart(2, '0')
    const año = date.getFullYear()
    return `${dia}/${mes}/${año}`
  }

  // Función para formatear fecha y hora
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

  // Función para obtener badge de estado
  const getBadgeEstado = (estado) => {
    const badges = {
      PAGADO: 'bg-green-100 text-green-800',
      ACTIVO: 'bg-yellow-100 text-yellow-800',
      VENCIDO: 'bg-red-100 text-red-800',
      ANULADO: 'bg-gray-100 text-gray-800'
    }
    return badges[estado] || 'bg-gray-100 text-gray-800'
  }

  // Función para abrir modal de pago
  const handleOpenPagoModal = (credito) => {
    setCreditoSeleccionado(credito)
    setPagoRegistrado(null) // Limpiar pago registrado anterior
    setFormPago({
      monto_pagado: '',
      metodo_pago: 'EFECTIVO',
      notas: ''
    })
    setShowPagoModal(true)
  }

  // Función para abrir modal de detalle
  const handleOpenDetailModal = async (credito) => {
    setShowDetailModal(true)
    setLoadingHistorial(true)
    
    try {
      // Recargar crédito completo con todos los datos del cliente
      const creditoCompleto = await getCredito(credito.id_credito)
      setCreditoSeleccionado(creditoCompleto)
      
      // Cargar historial de pagos
      const resultado = await getHistorialPagos(credito.id_credito)
      // El backend retorna { pagos: [...], total_pagos: N, total_pagado: X }
      const historial = resultado.pagos || resultado || []
      
      // Calcular saldo_despues_pago para cada pago si no existe
      let saldoActual = parseFloat(creditoCompleto.monto_total)
      const historialConSaldo = historial.map(pago => {
        const montoPagado = parseFloat(pago.monto_pagado)
        saldoActual -= montoPagado
        return {
          ...pago,
          saldo_despues_pago: pago.saldo_despues_pago !== null && pago.saldo_despues_pago !== undefined 
            ? pago.saldo_despues_pago 
            : saldoActual
        }
      })
      
      // Ordenar por fecha DESC (más reciente primero)
      const historialOrdenado = historialConSaldo.sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago))
      setHistorialPagos(historialOrdenado)
    } catch (error) {
      console.error('Error al cargar datos del crédito:', error)
      mostrarToast('Error al cargar los detalles del crédito', 'error')
      setCreditoSeleccionado(credito) // Fallback al crédito básico
      setHistorialPagos([])
    } finally {
      setLoadingHistorial(false)
    }
  }

  // Función para generar PDF del comprobante de pago
  const generarPDFComprobante = (credito, pagoRealizado, historial) => {
    if (!credito || !historial || historial.length === 0) {
      mostrarToast('No hay información suficiente para generar el PDF', 'error')
      return
    }

    const doc = new jsPDF()

    // Header
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('COMPROBANTE DE PAGO', 105, 20, { align: 'center' })

    // Empresa
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('COMERCIAL SATURNO', 150, 35)
    
    // Fecha y Cliente
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const fechaPago = new Date().toLocaleDateString('es-GT')
    doc.text(`FECHA: ${fechaPago}`, 20, 45)
    const nombreCliente = credito.clientes ? `${credito.clientes.nombre} ${credito.clientes.apellido || ''}`.trim() : 'N/A'
    doc.text(`CLIENTE: ${nombreCliente}`, 20, 52)

    // ID de Crédito
    doc.text(`ID CRÉDITO: #${credito.id_credito?.substring(0, 8) || 'N/A'}`, 20, 59)

    // Información del pago
    let lineaActual = 66
    doc.text(`MONTO PAGADO: Q${parseFloat(pagoRealizado.monto_pagado).toFixed(2)}`, 20, lineaActual)
    doc.text(`MÉTODO DE PAGO: ${pagoRealizado.metodo_pago}`, 20, lineaActual + 7)
    lineaActual += 7

    // Línea separadora
    doc.setLineWidth(0.5)
    doc.line(20, lineaActual + 5, 190, lineaActual + 5)

    // Tabla de historial de pagos
    const tableData = historial.map((pago, index) => [
      formatearFechaHora(pago.fecha_pago),
      `Q${parseFloat(pago.monto_pagado).toFixed(2)}`,
      pago.metodo_pago,
      `Q${parseFloat(pago.saldo_despues_pago || 0).toFixed(2)}`
    ])

    autoTable(doc, {
      startY: lineaActual + 12,
      head: [['FECHA/HORA', 'MONTO', 'MÉTODO', 'SALDO DESPUÉS']],
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
        1: { halign: 'right' },
        2: { halign: 'center' },
        3: { halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    })

    // Resumen del crédito
    const finalY = doc.lastAutoTable.finalY || 150
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    // Monto Total
    doc.text('Monto Total:', 135, finalY + 10)
    doc.text(`Q${parseFloat(credito.monto_total).toFixed(2)}`, 185, finalY + 10, { align: 'right' })
    
    // Total Pagado
    doc.text('Total Pagado:', 135, finalY + 17)
    doc.text(`Q${parseFloat(credito.total_pagado || 0).toFixed(2)}`, 185, finalY + 17, { align: 'right' })
    
    // Saldo Pendiente con fondo negro
    const totalY = finalY + 24
    doc.setFillColor(0, 0, 0)
    doc.rect(130, totalY - 5, 60, 10, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text('Saldo Pendiente', 135, totalY + 1)
    doc.text(`Q${parseFloat(credito.saldo_pendiente).toFixed(2)}`, 185, totalY + 1, { align: 'right' })

    // Estado del crédito
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Estado: ${credito.estado || 'N/A'}`, 20, totalY + 15)

    // Nota al pie
    if (credito.fecha_vencimiento) {
      doc.setFont('helvetica', 'italic')
      const fechaVencimiento = new Date(credito.fecha_vencimiento).toLocaleDateString('es-GT')
      doc.text(`Fecha de vencimiento: ${fechaVencimiento}`, 20, totalY + 22)
    }

    // Guardar PDF
    const nombreArchivo = `Comprobante_Pago_${nombreCliente.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`
    doc.save(nombreArchivo)
    mostrarToast('PDF generado exitosamente', 'success')
  }

  const handleRegistrarPago = async () => {
    // Validaciones
    const monto = parseFloat(formPago.monto_pagado)
    
    if (!monto || monto <= 0) {
      mostrarToast('El monto debe ser mayor a 0', 'error')
      return
    }

    if (monto > creditoSeleccionado.saldo_pendiente) {
      mostrarToast('El monto no puede ser mayor al saldo pendiente', 'error')
      return
    }

    if (!formPago.metodo_pago) {
      mostrarToast('Debe seleccionar un método de pago', 'error')
      return
    }

    try {
      setProcesandoPago(true)
      
      const pagoData = {
        monto_pagado: monto,
        metodo_pago: formPago.metodo_pago,
        notas: formPago.notas || null
      }

      await createPago(creditoSeleccionado.id_credito, pagoData)
      
      mostrarToast('Pago registrado exitosamente', 'success')
      
      // Cargar crédito actualizado y historial
      const creditoActualizado = await getCredito(creditoSeleccionado.id_credito)
      const resultado = await getHistorialPagos(creditoSeleccionado.id_credito)
      const historial = resultado.pagos || resultado || []
      
      // Calcular saldo después del pago
      let saldoActual = parseFloat(creditoActualizado.monto_total)
      const historialConSaldo = historial.map(pago => {
        const montoPagado = parseFloat(pago.monto_pagado)
        saldoActual -= montoPagado
        return {
          ...pago,
          saldo_despues_pago: pago.saldo_despues_pago !== null && pago.saldo_despues_pago !== undefined 
            ? pago.saldo_despues_pago 
            : saldoActual
        }
      })
      
      // Establecer estado de pago registrado con toda la información necesaria
      setPagoRegistrado({
        pago: pagoData,
        credito: creditoActualizado,
        historial: historialConSaldo.sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago))
      })
      
      // Recargar lista de créditos
      cargarCreditos()
      
    } catch (error) {
      console.error('Error al registrar pago:', error)
      mostrarToast(error.response?.data?.mensaje || error.message || 'Error al registrar el pago', 'error')
    } finally {
      setProcesandoPago(false)
    }
  }

  // Función para limpiar todos los filtros
  const limpiarFiltros = () => {
    setFiltros({
      estado: '',
      id_cliente: '',
      fecha_desde: '',
      fecha_hasta: '',
      searchTerm: ''
    })
  }

  // Aplicar filtros cuando cambien (excepto searchTerm que es en tiempo real)
  useEffect(() => {
    cargarCreditos()
  }, [filtros.estado, filtros.id_cliente, filtros.fecha_desde, filtros.fecha_hasta])

  // Filtrar créditos localmente por searchTerm para búsqueda en tiempo real
  const creditosFiltrados = creditos.filter(credito => {
    if (!filtros.searchTerm) return true
    const nombreCompleto = `${credito.clientes?.nombre || ''} ${credito.clientes?.apellido || ''}`.toLowerCase()
    const telefono = credito.clientes?.telefono || ''
    const searchLower = filtros.searchTerm.toLowerCase()
    return nombreCompleto.includes(searchLower) || telefono.includes(searchLower)
  })

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Créditos</h1>
          <p className="text-gray-600 mt-2">Gestión de créditos a clientes</p>
        </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="space-y-4">
          {/* Búsqueda en tiempo real */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar créditos por cliente..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
              value={filtros.searchTerm}
              onChange={(e) => setFiltros({ ...filtros, searchTerm: e.target.value })}
            />
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Filtro por Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                value={filtros.estado}
                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="ACTIVO">ACTIVO</option>
                <option value="VENCIDO">VENCIDO</option>
                <option value="PAGADO">PAGADO</option>
                <option value="ANULADO">ANULADO</option>
              </select>
            </div>

            {/* Filtro por Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                value={filtros.id_cliente}
                onChange={(e) => setFiltros({ ...filtros, id_cliente: e.target.value })}
              >
                <option value="">Todos los clientes</option>
                {clientes.map(cliente => (
                  <option key={cliente.id_cliente} value={cliente.id_cliente}>
                    {cliente.nombre} {cliente.apellido}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Fecha Desde */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                value={filtros.fecha_desde}
                onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })}
              />
            </div>

            {/* Filtro Fecha Hasta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hasta
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                value={filtros.fecha_hasta}
                onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })}
              />
            </div>
          </div>

          {/* Botón Limpiar Filtros */}
          {(filtros.estado || filtros.id_cliente || filtros.fecha_desde || filtros.fecha_hasta || filtros.searchTerm) && (
            <div className="flex justify-end">
              <button
                onClick={limpiarFiltros}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mensaje de carga */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-carpinteria-medio"></div>
            <span className="ml-3 text-gray-600">Cargando créditos...</span>
          </div>
        </div>
      )}

      {/* Tabla de créditos */}
      {!loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-carpinteria-oscuro">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Monto Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Saldo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Vencimiento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {creditosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    {filtros.searchTerm ? 'No se encontraron créditos que coincidan con la búsqueda' : 'No hay créditos registrados'}
                  </td>
                </tr>
              ) : (
                creditosFiltrados.map((credito) => {
                  const nombreCompleto = `${credito.clientes?.nombre || ''} ${credito.clientes?.apellido || ''}`.trim()
                  const montoPagado = credito.monto_total - credito.saldo_pendiente
                  const esVencido = credito.estado === 'VENCIDO'
                  
                  return (
                    <tr 
                      key={credito.id_credito} 
                      className={`hover:bg-gray-50 transition-colors ${esVencido ? 'bg-red-50' : ''}`}
                    >
                      {/* Cliente */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900">{nombreCompleto || 'N/A'}</p>
                          <p className="text-sm text-gray-500">
                            {credito.clientes?.telefono || 'Sin teléfono'}
                          </p>
                        </div>
                      </td>

                      {/* Monto Total */}
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-semibold">
                        Q{parseFloat(credito.monto_total || 0).toFixed(2)}
                      </td>

                      {/* Saldo Pendiente */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-semibold text-gray-900">
                            Q{parseFloat(credito.saldo_pendiente || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Pagado: Q{montoPagado.toFixed(2)}
                          </p>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getBadgeEstado(credito.estado)}`}>
                          {credito.estado}
                        </span>
                      </td>

                      {/* Fecha de Vencimiento */}
                      <td className={`px-6 py-4 whitespace-nowrap ${esVencido ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                        {formatearFecha(credito.fecha_vencimiento)}
                        {esVencido && (
                          <p className="text-xs text-red-500 mt-1">¡Vencido!</p>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          {/* Ver Detalle */}
                          <button
                            onClick={() => handleOpenDetailModal(credito)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="w-5 h-5" />
                          </button>

                          {/* Registrar Pago */}
                          <button
                            onClick={() => handleOpenPagoModal(credito)}
                            disabled={credito.estado === 'PAGADO' || credito.estado === 'ANULADO'}
                            className={`transition-colors ${
                              credito.estado === 'PAGADO' || credito.estado === 'ANULADO'
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-green-600 hover:text-green-800'
                            }`}
                            title={
                              credito.estado === 'PAGADO' 
                                ? 'Crédito pagado' 
                                : credito.estado === 'ANULADO'
                                ? 'Crédito anulado'
                                : 'Registrar pago'
                            }
                          >
                            <CreditCard className="w-5 h-5" />
                          </button>

                          {/* Ver Historial de Pagos */}
                          <button
                            onClick={() => handleOpenDetailModal(credito)}
                            className="text-purple-600 hover:text-purple-800 transition-colors"
                            title="Ver historial de pagos"
                          >
                            <FileText className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
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

      {/* Modal de Registrar Pago */}
      {showPagoModal && creditoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 m-0">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-carpinteria-oscuro text-white px-6 py-4 rounded-t-lg">
              <h2 className="text-xl font-bold">
                {pagoRegistrado ? 'Pago Registrado Exitosamente' : 'Registrar Pago'}
              </h2>
            </div>

            {/* Body */}
            <div className="p-6">
              {!pagoRegistrado ? (
                <>
                  {/* Información del Crédito (Solo Lectura) */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Información del Crédito</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Cliente</p>
                        <p className="font-medium text-gray-900">
                          {creditoSeleccionado.clientes?.nombre} {creditoSeleccionado.clientes?.apellido}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Estado</p>
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getBadgeEstado(creditoSeleccionado.estado)}`}>
                          {creditoSeleccionado.estado}
                        </span>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Monto Total</p>
                        <p className="font-semibold text-gray-900">
                          Q{parseFloat(creditoSeleccionado.monto_total).toFixed(2)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Saldo Pendiente</p>
                        <p className="font-semibold text-red-600">
                          Q{parseFloat(creditoSeleccionado.saldo_pendiente).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Formulario de Pago */}
                  <div className="space-y-4">
                    {/* Monto a Pagar */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monto a Pagar <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={creditoSeleccionado.saldo_pendiente}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                        placeholder="0.00"
                        value={formPago.monto_pagado}
                        onChange={(e) => setFormPago({ ...formPago, monto_pagado: e.target.value })}
                        onWheel={(e) => e.target.blur()}
                      />
                      {formPago.monto_pagado && parseFloat(formPago.monto_pagado) > creditoSeleccionado.saldo_pendiente && (
                        <p className="text-red-500 text-sm mt-1">
                          El monto no puede ser mayor al saldo pendiente
                        </p>
                      )}
                    </div>

                    {/* Método de Pago */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Método de Pago <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                        value={formPago.metodo_pago}
                        onChange={(e) => setFormPago({ ...formPago, metodo_pago: e.target.value })}
                      >
                        <option value="EFECTIVO">EFECTIVO</option>
                        <option value="TARJETA">TARJETA</option>
                        <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                      </select>
                    </div>

                    {/* Notas */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notas (opcional)
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                        rows="3"
                        placeholder="Observaciones adicionales..."
                        value={formPago.notas}
                        onChange={(e) => setFormPago({ ...formPago, notas: e.target.value })}
                      />
                    </div>

                    {/* Cálculo de Nuevo Saldo */}
                    {formPago.monto_pagado && parseFloat(formPago.monto_pagado) > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-700">Saldo Actual:</span>
                          <span className="font-semibold text-gray-900">
                            Q{parseFloat(creditoSeleccionado.saldo_pendiente).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-700">Monto a Pagar:</span>
                          <span className="font-semibold text-green-600">
                            -Q{parseFloat(formPago.monto_pagado).toFixed(2)}
                          </span>
                        </div>
                        <div className="border-t border-blue-300 pt-2 mt-2">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-900">Nuevo Saldo:</span>
                            <span className="font-bold text-lg text-carpinteria-oscuro">
                              Q{(creditoSeleccionado.saldo_pendiente - parseFloat(formPago.monto_pagado)).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Mensaje si liquidará el crédito */}
                        {parseFloat(formPago.monto_pagado) >= creditoSeleccionado.saldo_pendiente && (
                          <div className="mt-3 bg-green-100 border border-green-300 rounded p-3">
                            <p className="text-green-800 font-semibold flex items-center gap-2">
                              <span className="text-2xl">✅</span>
                              Este pago liquidará completamente el crédito
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Vista de Pago Registrado */}
                  <div className="space-y-0">
                    {/* Mensaje de Éxito */}
                    <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 text-center">
                      <div className="text-6xl mb-4">✅</div>
                      <h3 className="text-2xl font-bold text-green-800 mb-2">¡Pago Registrado!</h3>
                      <p className="text-green-700">El pago se ha registrado correctamente</p>
                    </div>

                    {/* Detalles del Pago */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Detalles del Pago</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Monto Pagado:</span>
                          <span className="font-bold text-green-600">Q{parseFloat(pagoRegistrado.pago.monto_pagado).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Método de Pago:</span>
                          <span className="font-medium">{pagoRegistrado.pago.metodo_pago}</span>
                        </div>
                        {pagoRegistrado.pago.notas && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Notas:</span>
                            <span className="font-medium">{pagoRegistrado.pago.notas}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Estado del Crédito Actualizado */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Estado Actualizado del Crédito</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Monto Total:</span>
                          <span className="font-medium">Q{parseFloat(pagoRegistrado.credito.monto_total).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Pagado:</span>
                          <span className="font-medium text-green-600">Q{parseFloat(pagoRegistrado.credito.total_pagado || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="text-gray-900 font-bold">Saldo Pendiente:</span>
                          <span className="font-bold text-lg text-red-600">Q{parseFloat(pagoRegistrado.credito.saldo_pendiente).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Estado:</span>
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getBadgeEstado(pagoRegistrado.credito.estado)}`}>
                            {pagoRegistrado.credito.estado}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
              {!pagoRegistrado ? (
                <>
                  <button
                    onClick={() => {
                      setShowPagoModal(false)
                      setCreditoSeleccionado(null)
                      setPagoRegistrado(null)
                      setFormPago({
                        monto_pagado: '',
                        metodo_pago: 'EFECTIVO',
                        notas: ''
                      })
                    }}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={procesandoPago}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleRegistrarPago}
                    disabled={procesandoPago || !formPago.monto_pagado || parseFloat(formPago.monto_pagado) <= 0}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      procesandoPago || !formPago.monto_pagado || parseFloat(formPago.monto_pagado) <= 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {procesandoPago ? 'Procesando...' : 'Registrar Pago'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      generarPDFComprobante(pagoRegistrado.credito, pagoRegistrado.pago, pagoRegistrado.historial)
                      mostrarToast('Comprobante PDF generado', 'success')
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Descargar Comprobante PDF
                  </button>
                  <button
                    onClick={() => {
                      setShowPagoModal(false)
                      setCreditoSeleccionado(null)
                      setPagoRegistrado(null)
                      setFormPago({
                        monto_pagado: '',
                        metodo_pago: 'EFECTIVO',
                        notas: ''
                      })
                    }}
                    className="px-4 py-2 text-white bg-carpinteria-oscuro rounded-lg hover:bg-carpinteria-claro transition-colors"
                  >
                    Cerrar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Crédito */}
      {showDetailModal && creditoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 m-0">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-carpinteria-oscuro text-white px-6 py-4 rounded-t-lg">
              <h2 className="text-xl font-bold">Detalle del Crédito</h2>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* Información del Cliente */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Datos del Cliente</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nombre</p>
                    <p className="font-medium text-gray-900">
                      {creditoSeleccionado.clientes?.nombre} {creditoSeleccionado.clientes?.apellido}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-medium text-gray-900">
                      {creditoSeleccionado.clientes?.telefono || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Límite de Crédito</p>
                    <p className="font-medium text-gray-900">
                      Q{parseFloat(creditoSeleccionado.clientes?.limite_credito || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Crédito Disponible</p>
                    <p className="font-medium text-green-600">
                      Q{parseFloat(creditoSeleccionado.clientes?.credito_disponible || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información del Crédito */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Estado</p>
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getBadgeEstado(creditoSeleccionado.estado)}`}>
                    {creditoSeleccionado.estado}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Monto Total</p>
                  <p className="text-lg font-bold text-gray-900">
                    Q{parseFloat(creditoSeleccionado.monto_total).toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Saldo Pendiente</p>
                  <p className="text-lg font-bold text-red-600">
                    Q{parseFloat(creditoSeleccionado.saldo_pendiente).toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Monto Pagado</p>
                  <p className="text-lg font-bold text-green-600">
                    Q{(creditoSeleccionado.monto_total - creditoSeleccionado.saldo_pendiente).toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Fecha de Inicio</p>
                  <p className="font-medium text-gray-900">
                    {formatearFecha(creditoSeleccionado.fecha_credito)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Fecha de Vencimiento</p>
                  <p className={`font-medium ${creditoSeleccionado.estado === 'VENCIDO' ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatearFecha(creditoSeleccionado.fecha_vencimiento)}
                  </p>
                </div>
              </div>

              {/* Venta Asociada */}
              {creditoSeleccionado.id_venta && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Venta Asociada</p>
                  <a 
                    href={`#/ventas?id=${creditoSeleccionado.id_venta}`}
                    className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    Ver Venta #{creditoSeleccionado.id_venta.slice(0, 8)}
                  </a>
                </div>
              )}

              {/* Historial de Pagos */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Historial de Pagos</h3>
                
                {loadingHistorial ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-carpinteria-medio"></div>
                    <span className="ml-3 text-gray-600">Cargando historial...</span>
                  </div>
                ) : historialPagos.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-gray-500">No hay pagos registrados aún</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                            Fecha/Hora
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                            Monto Pagado
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                            Método
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                            Saldo Después
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                            Usuario
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                            Notas
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {historialPagos.map((pago, index) => (
                          <tr key={pago.id_pago || index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {formatearFechaHora(pago.fecha_pago)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="font-semibold text-green-600">
                                Q{parseFloat(pago.monto_pagado).toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                {pago.metodo_pago}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              Q{parseFloat(pago.saldo_despues_pago || 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {pago.usuarios?.nombre || 'Sistema'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {pago.observaciones || pago.notas || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-between">
              <button
                onClick={() => {
                  if (creditoSeleccionado && historialPagos.length > 0) {
                    const ultimoPago = historialPagos[0]
                    generarPDFComprobante(
                      creditoSeleccionado,
                      {
                        monto_pagado: ultimoPago.monto_pagado,
                        metodo_pago: ultimoPago.metodo_pago,
                        notas: ultimoPago.observaciones || ultimoPago.notas
                      },
                      historialPagos
                    )
                  }
                }}
                disabled={!creditoSeleccionado || historialPagos.length === 0}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                <span>Descargar Comprobante PDF</span>
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setCreditoSeleccionado(null)
                  setHistorialPagos([])
                }}
                className="px-4 py-2 text-white bg-carpinteria-oscuro rounded-lg hover:bg-carpinteria-claro transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
          <div className={`px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 ${
            toast.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </>
  )
}
