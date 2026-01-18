import { useState, useEffect } from 'react'
import { Plus, Trash2, FileText, Search, X } from 'lucide-react'
import { getClientes, getProductos, getProductosListaSimple } from '../services/api'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function Cotizaciones() {
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [cantidad, setCantidad] = useState(1)
  const [productosAgregados, setProductosAgregados] = useState([])
  const [searchCliente, setSearchCliente] = useState('')
  const [searchProducto, setSearchProducto] = useState('')
  const [clientesFiltrados, setClientesFiltrados] = useState([])
  const [productosFiltrados, setProductosFiltrados] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  // Filtrar clientes cuando cambia la búsqueda
  useEffect(() => {
    if (searchCliente.trim() === '') {
      setClientesFiltrados([])
    } else {
      const filtered = clientes.filter(c =>
        c.nombre?.toLowerCase().includes(searchCliente.toLowerCase()) ||
        c.apellido?.toLowerCase().includes(searchCliente.toLowerCase())
      )
      setClientesFiltrados(filtered)
    }
  }, [searchCliente, clientes])

  // Filtrar productos cuando cambia la búsqueda (nombre, descripción, categoría, unidad de medida)
  useEffect(() => {
    if (searchProducto.trim() === '') {
      setProductosFiltrados([])
    } else {
      const searchLower = searchProducto.toLowerCase()
      const filtered = productos.filter(p => {
        // Buscar en nombre
        if (p.nombre?.toLowerCase().includes(searchLower)) return true
        // Buscar en descripción
        if (p.descripcion?.toLowerCase().includes(searchLower)) return true
        // Buscar en categoría
        if (p.categorias?.nombre?.toLowerCase().includes(searchLower)) return true
        // Buscar en unidad de medida
        if (p.unidad_medida?.toLowerCase().includes(searchLower)) return true
        // Buscar en código (si existe)
        if (p.codigo?.toLowerCase().includes(searchLower)) return true
        return false
      })
      setProductosFiltrados(filtered)
    }
  }, [searchProducto, productos])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [clientesResponse, productosResponse] = await Promise.all([
        getClientes(),
        getProductosListaSimple()
      ])
      setClientes(clientesResponse.datos || clientesResponse || [])
      // getProductosListaSimple retorna directamente el array
      setProductos(Array.isArray(productosResponse) ? productosResponse : (productosResponse.datos || productosResponse || []))
    } catch (err) {
      console.error('Error al cargar datos:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const agregarProducto = () => {
    if (!productoSeleccionado || cantidad <= 0) {
      setError('Selecciona un producto y una cantidad válida')
      return
    }

    const productoExistente = productosAgregados.find(p => p.id_producto === productoSeleccionado.id_producto)
    
    if (productoExistente) {
      setProductosAgregados(productosAgregados.map(p => 
        p.id_producto === productoSeleccionado.id_producto
          ? { ...p, cantidad: p.cantidad + parseInt(cantidad), total: parseFloat(productoSeleccionado.precio_venta) * (p.cantidad + parseInt(cantidad)) }
          : p
      ))
    } else {
      setProductosAgregados([...productosAgregados, {
        id_producto: productoSeleccionado.id_producto,
        nombre: productoSeleccionado.nombre,
        precio: parseFloat(productoSeleccionado.precio_venta),
        cantidad: parseInt(cantidad),
        total: parseFloat(productoSeleccionado.precio_venta) * parseInt(cantidad)
      }])
    }

    setProductoSeleccionado(null)
    setCantidad(1)
    setSearchProducto('')
    setError('')
    setSuccess('Producto agregado a la cotización')
    setTimeout(() => setSuccess(''), 2000)
  }

  const eliminarProducto = (id) => {
    setProductosAgregados(productosAgregados.filter(p => p.id_producto !== id))
  }

  const calcularTotal = () => {
    return productosAgregados.reduce((sum, p) => sum + p.total, 0)
  }

  const generarPDF = () => {
    if (!clienteSeleccionado) {
      setError('Selecciona un cliente para la cotización')
      return
    }

    if (productosAgregados.length === 0) {
      setError('Agrega al menos un producto a la cotización')
      return
    }

    const cliente = clienteSeleccionado
    const doc = new jsPDF()

    // Header
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('COTIZACIÓN', 105, 20, { align: 'center' })

    // Empresa
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('COMERCIAL SATURNO', 150, 35)
    
    // Fecha y Cliente
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`FECHA: ${new Date().toLocaleDateString('es-GT')}`, 20, 45)
    doc.text(`CLIENTE: ${cliente.nombre} ${cliente.apellido || ''}`, 20, 52)

    // Línea separadora
    doc.setLineWidth(0.5)
    doc.line(20, 58, 190, 58)

    // Tabla de productos
    const tableData = productosAgregados.map(p => [
      p.nombre,
      p.cantidad.toString().padStart(3, '0'),
      `Q${p.precio.toFixed(2)}`,
      `Q${p.total.toFixed(2)}`
    ])

    autoTable(doc, {
      startY: 65,
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

    // Total
    const finalY = doc.lastAutoTable.finalY || 150
    doc.setFillColor(0, 0, 0)
    doc.rect(130, finalY + 5, 60, 10, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text('Total', 135, finalY + 11)
    doc.text(`Q${calcularTotal().toFixed(2)}`, 185, finalY + 11, { align: 'right' })

    // Nota al pie
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text('Cotización válida por 15 días*', 20, finalY + 30)

    // Guardar PDF
    const nombreArchivo = `Cotizacion_${cliente.nombre}_${new Date().getTime()}.pdf`
    doc.save(nombreArchivo)

    setSuccess('PDF generado exitosamente')
    setTimeout(() => setSuccess(''), 3000)
  }

  const limpiarCotizacion = () => {
    setProductosAgregados([])
    setClienteSeleccionado(null)
    setSearchCliente('')
    setProductoSeleccionado(null)
    setSearchProducto('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cotizaciones</h1>
          <p className="text-gray-600 mt-2">Genera cotizaciones para clientes</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button 
            onClick={limpiarCotizacion}
            className="inline-flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <X className="w-5 h-5 mr-2" />
            Limpiar
          </button>
          <button 
            onClick={generarPDF}
            disabled={productosAgregados.length === 0}
            className="inline-flex items-center px-4 py-2 bg-carpinteria-medio text-white rounded-lg hover:bg-carpinteria-rojizo transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-5 h-5 mr-2" />
            Generar PDF
          </button>
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

      {/* Selección de Cliente */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Seleccionar Cliente</h2>
        {clienteSeleccionado ? (
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900">
                {clienteSeleccionado.nombre} {clienteSeleccionado.apellido || ''}
              </p>
              <p className="text-sm text-gray-600">
                Teléfono: {clienteSeleccionado.telefono || 'N/A'}
              </p>
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar cliente por nombre..."
                value={searchCliente}
                onChange={(e) => setSearchCliente(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
              />
            </div>
            {searchCliente && clientesFiltrados.length > 0 && (
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                {clientesFiltrados.map((cliente) => (
                  <button
                    key={cliente.id_cliente}
                    onClick={() => {
                      setClienteSeleccionado(cliente)
                      setSearchCliente('')
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <p className="font-medium text-gray-900">
                      {cliente.nombre} {cliente.apellido || ''}
                    </p>
                    <p className="text-sm text-gray-600">
                      Teléfono: {cliente.telefono || 'N/A'}
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

      {/* Agregar Productos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Agregar Productos</h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Producto</label>
            {productoSeleccionado ? (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg mb-2">
                <div>
                  <p className="font-medium text-gray-900">{productoSeleccionado.nombre}</p>
                  <p className="text-sm text-gray-600">Precio: Q{parseFloat(productoSeleccionado.precio_venta).toFixed(2)}</p>
                </div>
                <button
                  onClick={() => setProductoSeleccionado(null)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={searchProducto}
                    onChange={(e) => setSearchProducto(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
                  />
                </div>
                {searchProducto && productosFiltrados.length > 0 && (
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                    {productosFiltrados.map((producto) => (
                      <button
                        key={producto.id_producto}
                        onClick={() => {
                          setProductoSeleccionado(producto)
                          setSearchProducto('')
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <p className="font-medium text-gray-900">{producto.nombre}</p>
                        <p className="text-sm text-gray-600">
                          Precio: Q{parseFloat(producto.precio_venta).toFixed(2)} | Stock: {producto.stock}
                        </p>
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
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
            <input
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio"
              placeholder="1"
            />
          </div>
          <div className="md:col-span-3 flex items-end">
            <button
              onClick={agregarProducto}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-carpinteria-medio text-white rounded-lg hover:bg-carpinteria-rojizo transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Agregar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Productos Agregados */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Productos en Cotización</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-carpinteria-oscuro">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Producto</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase">Cantidad</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase">Precio</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase">Total</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productosAgregados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No hay productos agregados a la cotización
                  </td>
                </tr>
              ) : (
                productosAgregados.map((producto) => (
                  <tr key={producto.id_producto} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{producto.nombre}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-center">{producto.cantidad}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">Q{producto.precio.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">Q{producto.total.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => eliminarProducto(producto.id_producto)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {productosAgregados.length > 0 && (
              <tfoot>
                <tr className="bg-gray-100">
                  <td colSpan="3" className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                    TOTAL:
                  </td>
                  <td className="px-6 py-4 text-right text-lg font-bold text-carpinteria-rojizo">
                    Q{calcularTotal().toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
