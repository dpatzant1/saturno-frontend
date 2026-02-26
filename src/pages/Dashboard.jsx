import { useState, useEffect } from 'react'
import { Package, Users, ShoppingCart, CreditCard, TrendingUp, TrendingDown, AlertCircle, AlertTriangle, CheckCircle2, Activity, Calendar } from 'lucide-react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts'
import {
  getDashboardStats,
  getProductosBajoStock,
  getProductosSinStock,
  getVentasDelMes,
  getProductosMasVendidos,
  getVentasPorDia,
  getProductos,
  getClientes,
  getVentas,
  getCreditos,
  getMovimientos,
  getVentasDelDia,
  getHistorialMensualVentas
} from '../services/api'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    productosActivos: 0,
    clientesActivos: 0,
    ventasMes: 0,
    creditosPendientes: 0,
    ventasDelMes: 0,
    cambioVentas: 0,
    cambioProductos: 0,
    cambioClientes: 0,
    cambioCreditos: 0,
    ventasMesAnterior: 0,
    ventasDelMesAnterior: 0,
    // Campos para ventas del día
    ventasDelDia: 0,
    montoVentasDelDia: 0,
    ventasDelDiaContado: 0,
    ventasDelDiaCredito: 0,
    montoDelDiaContado: 0,
    montoDelDiaCredito: 0
  })
  const [alertas, setAlertas] = useState({
    productosBajoStock: [],
    productosSinStock: [],
    creditosVencidos: []
  })
  const [graficos, setGraficos] = useState({
    ventasPorDia: [],
    productosMasVendidos: [],
    tiposVenta: []
  })
  const [historialMensual, setHistorialMensual] = useState([])
  const [mesesHistorial, setMesesHistorial] = useState(12)

  // Cargar datos del dashboard
  useEffect(() => {
    cargarDatosDashboard()
  }, [])

  const cargarDatosDashboard = async () => {
    try {
      setLoading(true)

      // OPTIMIZACIÓN: Cargar datos base una sola vez y reutilizarlos
      console.log('🔄 Cargando datos base del dashboard...')

      // Cargar datos fundamentales secuencialmente para evitar rate limiting
      const productosRes = await getProductos({ limit: 10000 })
      const productos = productosRes.datos || productosRes || []
      console.log('✅ Productos cargados:', productos.length)

      // Pequeña pausa para ser amigable con el rate limiter
      await new Promise(resolve => setTimeout(resolve, 100))

      const clientesRes = await getClientes({ limit: 10000 })
      const clientes = clientesRes.datos || clientesRes || []
      console.log('✅ Clientes cargados:', clientes.length)

      await new Promise(resolve => setTimeout(resolve, 100))

      const ventasRes = await getVentas({ limit: 10000 })
      const ventas = ventasRes.datos || ventasRes || []
      console.log('✅ Ventas cargadas:', ventas.length)

      await new Promise(resolve => setTimeout(resolve, 100))

      const creditosRes = await getCreditos({ limit: 10000 })
      const creditos = creditosRes.datos || creditosRes || []
      console.log('✅ Créditos cargados:', creditos.length)

      // Procesar estadísticas usando los datos ya cargados
      console.log('📊 Procesando estadísticas...')

      // Calcular estadísticas principales
      const productosActivos = productos.filter(p => p.estado).length
      const clientesActivos = clientes.filter(c => c.estado).length

      // Ventas del mes actual
      const hoy = new Date()
      const inicioMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      const ventasDelMesActual = ventas.filter(v => {
        const fechaVenta = new Date(v.fecha_venta || v.created_at)
        return fechaVenta >= inicioMesActual && v.estado === 'ACTIVA'
      })
      const totalVentasMesActual = ventasDelMesActual.reduce((sum, v) => sum + Number(v.total), 0)

      // Créditos pendientes
      const creditosPendientes = creditos.filter(c => c.estado === 'ACTIVO' || c.estado === 'VENCIDO')
      const totalCreditosPendientes = creditosPendientes.reduce((sum, c) => sum + Number(c.saldo_pendiente || 0), 0)

      // Productos con problemas de stock
      const productosBajo = productos.filter(p => p.estado && p.cantidad_stock <= (p.stock_minimo || 5))
      const productosSin = productos.filter(p => p.estado && p.cantidad_stock <= 0)

      // Procesar productos más vendidos usando la función API optimizada
      const productosMasVendidos = await getProductosMasVendidos(5, 30)
      console.log('📊 Productos más vendidos cargados:', productosMasVendidos)

      // Ventas por día (últimos 30 días)
      const ventasPorDia = procesarVentasPorDia(ventas, 30)

      console.log('✅ Procesamiento completado')

      // Cargar datos de ventas del día
      await new Promise(resolve => setTimeout(resolve, 100))

      const ventasDelDia = await getVentasDelDia()
      console.log('📊 Ventas del día cargadas:', ventasDelDia)

      // Cargar historial mensual
      await new Promise(resolve => setTimeout(resolve, 100))
      try {
        const historial = await getHistorialMensualVentas(mesesHistorial)
        setHistorialMensual(Array.isArray(historial) ? historial : [])
        console.log('📅 Historial mensual cargado:', historial?.length, 'meses')
      } catch (err) {
        console.warn('⚠️ No se pudo cargar el historial mensual:', err.message)
        setHistorialMensual([])
      }

      // Actualizar estados
      setStats({
        productosActivos,
        clientesActivos,
        ventasMes: totalVentasMesActual,
        creditosPendientes: totalCreditosPendientes,
        ventasDelMes: ventasDelMesActual.length,
        // Porcentajes de cambio (simplificados por ahora)
        cambioVentas: 0,
        cambioProductos: 0,
        cambioClientes: 0,
        cambioCreditos: 0,
        // Datos del día
        ventasDelDia: ventasDelDia.ventas_activas || 0,
        montoVentasDelDia: ventasDelDia.monto_total || 0,
        ventasDelDiaContado: ventasDelDia.ventas_contado || 0,
        ventasDelDiaCredito: ventasDelDia.ventas_credito || 0,
        montoDelDiaContado: ventasDelDia.monto_contado || 0,
        montoDelDiaCredito: ventasDelDia.monto_credito || 0
      })

      setAlertas({
        productosBajoStock: productosBajo,
        productosSinStock: productosSin,
        creditosVencidos: creditosPendientes.filter(c => c.estado === 'VENCIDO')
      })

      // Procesar datos para gráficos
      const tiposVenta = ventasDelMesActual.reduce((acc, venta) => {
        const tipo = venta.tipo_venta || 'CONTADO'
        acc[tipo] = (acc[tipo] || 0) + Number(venta.total || 0)
        return acc
      }, {})

      setGraficos({
        ventasPorDia: ventasPorDia,
        productosMasVendidos: productosMasVendidos,
        tiposVenta: [
          { name: 'Contado', value: tiposVenta.CONTADO || 0, color: '#3B82F6' },
          { name: 'Crédito', value: tiposVenta.CREDITO || 0, color: '#F59E0B' }
        ],
        estadosCreditos: [
          {
            name: 'Activos',
            value: creditosPendientes.filter(c => c.estado === 'ACTIVO').length,
            color: '#10B981'
          },
          {
            name: 'Vencidos',
            value: creditosPendientes.filter(c => c.estado === 'VENCIDO').length,
            color: '#EF4444'
          },
          {
            name: 'Pagados',
            value: creditos.filter(c => c.estado === 'PAGADO').length,
            color: '#6B7280'
          }
        ]
      })

    } catch (error) {
      console.error('❌ Error al cargar datos del dashboard:', error)
      // Mantener el dashboard funcional con datos vacíos en caso de error
      setStats({
        productosActivos: 0,
        clientesActivos: 0,
        ventasMes: 0,
        creditosPendientes: 0,
        ventasDelMes: 0,
        cambioVentas: 0,
        cambioProductos: 0,
        cambioClientes: 0,
        cambioCreditos: 0,
        // Datos del día vacíos en caso de error
        ventasDelDia: 0,
        montoVentasDelDia: 0,
        ventasDelDiaContado: 0,
        ventasDelDiaCredito: 0,
        montoDelDiaContado: 0,
        montoDelDiaCredito: 0
      })
    } finally {
      setLoading(false)
    }
  }

  // Función auxiliar para procesar ventas por día
  const procesarVentasPorDia = (ventas, dias = 30) => {
    try {
      const ventasPorDia = {}

      // Inicializar últimos X días con 0
      for (let i = dias - 1; i >= 0; i--) {
        const fecha = new Date()
        fecha.setDate(fecha.getDate() - i)
        const key = fecha.toISOString().split('T')[0] // YYYY-MM-DD
        ventasPorDia[key] = { fecha: key, total: 0, cantidad: 0 }
      }

      // Procesar ventas activas
      ventas
        .filter(venta => venta.estado === 'ACTIVA')
        .forEach(venta => {
          // Extraer solo la fecha en formato YYYY-MM-DD sin conversión de zona horaria
          const fechaVenta = venta.fecha_venta || venta.created_at
          const key = fechaVenta.split('T')[0] // Obtener solo YYYY-MM-DD

          if (ventasPorDia[key]) {
            ventasPorDia[key].total += Number(venta.total || 0)
            ventasPorDia[key].cantidad += 1
          }
        })

      return Object.values(ventasPorDia).sort((a, b) => a.fecha.localeCompare(b.fecha))
    } catch (error) {
      console.error('Error procesando ventas por día:', error)
      return []
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ'
    }).format(value || 0)
  }

  const statsCards = [
    {
      name: 'Total Productos',
      value: loading ? '...' : stats.productosActivos.toString(),
      icon: Package,
      color: 'bg-blue-500',
      change: loading ? '...' : `${stats.productosActivos} productos activos`,
      changePercent: stats.cambioProductos,
      isPositive: stats.cambioProductos >= 0,
      showPercent: false
    },
    {
      name: 'Clientes Activos',
      value: loading ? '...' : stats.clientesActivos.toString(),
      icon: Users,
      color: 'bg-green-500',
      change: loading ? '...' : `${stats.clientesActivos} clientes registrados`,
      changePercent: stats.cambioClientes,
      isPositive: stats.cambioClientes >= 0,
      showPercent: false
    },
    {
      name: 'Ventas del Día',
      value: loading ? '...' : formatCurrency(stats.montoVentasDelDia),
      icon: ShoppingCart,
      color: 'bg-indigo-500',
      change: loading ? '...' : `${stats.ventasDelDia} ventas realizadas hoy`,
      changePercent: 0,
      isPositive: true,
      showPercent: false,
      extraInfo: loading ? '' :
        `Contado: ${formatCurrency(stats.montoDelDiaContado)} (${stats.ventasDelDiaContado} ventas) · ` +
        `Crédito: ${formatCurrency(stats.montoDelDiaCredito)} (${stats.ventasDelDiaCredito} ventas)`
    },
    {
      name: 'Ventas del Mes',
      value: loading ? '...' : formatCurrency(stats.ventasMes),
      icon: ShoppingCart,
      color: 'bg-purple-500',
      change: loading ? '...' : `${stats.ventasDelMes} ventas realizadas`,
      changePercent: stats.cambioVentas,
      isPositive: stats.cambioVentas >= 0,
      showPercent: true,
      extraInfo: loading ? '' : `Mes anterior: ${formatCurrency(stats.ventasMesAnterior)} (${stats.ventasDelMesAnterior} ventas)`
    },
    {
      name: 'Créditos Pendientes',
      value: loading ? '...' : formatCurrency(stats.creditosPendientes),
      icon: CreditCard,
      color: 'bg-red-500',
      change: loading ? '...' : 'Por cobrar a clientes',
      changePercent: stats.cambioCreditos,
      isPositive: false, // Menos créditos pendientes es mejor
      showPercent: false
    },
  ]

  // Colores para gráficos
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Cargando datos...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Resumen general del sistema de carpintería</p>
        <button
          onClick={cargarDatosDashboard}
          className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Activity className="h-4 w-4 mr-2" />
          Actualizar
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} rounded-full p-3`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <div className="flex items-center text-sm">
                {stat.showPercent && stat.changePercent !== 0 ? (
                  <>
                    {stat.isPositive ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`font-medium ${stat.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {stat.changePercent > 0 ? '+' : ''}{stat.changePercent}%
                    </span>
                    <span className="text-gray-500 ml-2">vs mes anterior</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4 text-blue-500 mr-1" />
                    <span className="text-gray-600 font-medium">{stat.change}</span>
                  </>
                )}
              </div>
              {stat.extraInfo && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  {stat.extraInfo}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Alertas y Notificaciones */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Alertas y Notificaciones
        </h2>
        <div className="space-y-4">
          {/* Productos sin stock */}
          {alertas.productosSinStock.length > 0 && (
            <div className="flex items-start p-4 bg-red-50 border-l-4 border-red-400 rounded">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">
                  {alertas.productosSinStock.length} productos sin stock
                </p>
                <div className="mt-2 text-sm text-red-700">
                  {alertas.productosSinStock.slice(0, 3).map(producto => (
                    <div key={producto.id_producto} className="mb-1">
                      • {producto.nombre}
                    </div>
                  ))}
                  {alertas.productosSinStock.length > 3 && (
                    <div className="text-xs text-red-600">
                      y {alertas.productosSinStock.length - 3} más...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Productos con stock bajo */}
          {alertas.productosBajoStock.length > 0 && (
            <div className="flex items-start p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  {alertas.productosBajoStock.length} productos con stock bajo
                </p>
                <div className="mt-2 text-sm text-yellow-700">
                  {alertas.productosBajoStock.slice(0, 3).map(producto => (
                    <div key={producto.id_producto} className="mb-1">
                      • {producto.nombre}: {producto.stock_actual} unidades (mín: {producto.stock_minimo})
                    </div>
                  ))}
                  {alertas.productosBajoStock.length > 3 && (
                    <div className="text-xs text-yellow-600">
                      y {alertas.productosBajoStock.length - 3} más...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Si no hay alertas */}
          {alertas.productosSinStock.length === 0 && alertas.productosBajoStock.length === 0 && (
            <div className="flex items-center p-4 bg-green-50 border-l-4 border-green-400 rounded">
              <CheckCircle2 className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  ¡Todo está en orden!
                </p>
                <p className="text-sm text-green-700 mt-1">
                  No hay alertas de stock bajo o productos sin existencias
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por día */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventas Últimos 30 Días</h3>
          <div className="h-64">
            {graficos.ventasPorDia.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={graficos.ventasPorDia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="fecha"
                    tickFormatter={(value) => {
                      // NO usar new Date() - parsear directamente del string YYYY-MM-DD
                      const parts = value.split('-')
                      return `${parseInt(parts[2])}/${parseInt(parts[1])}`
                    }}
                  />
                  <YAxis tickFormatter={(value) => `Q${value.toLocaleString()}`} />
                  <Tooltip
                    labelFormatter={(value) => {
                      // Parsear YYYY-MM-DD directamente sin new Date()
                      const parts = value.split('-')
                      return `${parseInt(parts[2])}/${parseInt(parts[1])}/${parts[0]}`
                    }}
                    formatter={(value) => [`Q${Number(value).toLocaleString()}`, 'Ventas']}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>No hay datos de ventas</p>
              </div>
            )}
          </div>
        </div>

        {/* Productos más vendidos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Productos Más Vendidos</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={graficos.productosMasVendidos}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="nombre"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  tick={{ fontSize: 12, fill: '#374151' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  label={{ value: 'Unidades Vendidas', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value) => [`${value} unidades`, 'Vendidas']}
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '13px'
                  }}
                />
                <Bar
                  dataKey="total_vendido"
                  fill="#3B82F6"
                  radius={[8, 8, 0, 0]}
                  barSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Historial de ventas por mes */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-indigo-500" />
            Historial de Ventas por Mes
          </h3>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Mostrar:</label>
            <select
              value={mesesHistorial}
              onChange={(e) => {
                const val = Number(e.target.value)
                setMesesHistorial(val)
                getHistorialMensualVentas(val)
                  .then(data => setHistorialMensual(Array.isArray(data) ? data : []))
                  .catch(() => {})
              }}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value={6}>Últimos 6 meses</option>
              <option value={12}>Últimos 12 meses</option>
              <option value={18}>Últimos 18 meses</option>
              <option value={24}>Últimos 24 meses</option>
            </select>
          </div>
        </div>

        {historialMensual.length > 0 ? (
          <>
            {/* Resumen del historial */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-indigo-50 p-3 rounded-lg text-center">
                <p className="text-xs text-indigo-600 font-medium">Mejor mes</p>
                <p className="text-sm font-bold text-indigo-900">
                  {historialMensual.reduce((max, m) => m.total > max.total ? m : max, historialMensual[0])?.etiqueta}
                </p>
                <p className="text-xs text-indigo-700">
                  {formatCurrency(historialMensual.reduce((max, m) => m.total > max.total ? m : max, historialMensual[0])?.total)}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <p className="text-xs text-green-600 font-medium">Promedio mensual</p>
                <p className="text-sm font-bold text-green-900">
                  {formatCurrency(historialMensual.reduce((s, m) => s + m.total, 0) / historialMensual.length)}
                </p>
                <p className="text-xs text-green-700">{mesesHistorial} meses</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <p className="text-xs text-blue-600 font-medium">Total acumulado</p>
                <p className="text-sm font-bold text-blue-900">
                  {formatCurrency(historialMensual.reduce((s, m) => s + m.total, 0))}
                </p>
                <p className="text-xs text-blue-700">{historialMensual.reduce((s, m) => s + m.cantidad, 0)} ventas</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <p className="text-xs text-purple-600 font-medium">Mes actual</p>
                <p className="text-sm font-bold text-purple-900">
                  {formatCurrency(historialMensual[historialMensual.length - 1]?.total)}
                </p>
                <p className="text-xs text-purple-700">{historialMensual[historialMensual.length - 1]?.cantidad} ventas</p>
              </div>
            </div>

            {/* Gráfico de barras mensual */}
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={historialMensual} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="etiqueta"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    angle={mesesHistorial > 12 ? -30 : 0}
                    textAnchor={mesesHistorial > 12 ? 'end' : 'middle'}
                    height={mesesHistorial > 12 ? 50 : 30}
                  />
                  <YAxis
                    yAxisId="monto"
                    orientation="left"
                    tickFormatter={(v) => `Q${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                  />
                  <YAxis
                    yAxisId="cantidad"
                    orientation="right"
                    tickFormatter={(v) => `${v}`}
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'Monto Total') return [formatCurrency(value), name]
                      if (name === 'Contado') return [formatCurrency(value), name]
                      if (name === 'Crédito') return [formatCurrency(value), name]
                      return [`${value} ventas`, name]
                    }}
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px' }}
                  />
                  <Legend />
                  <Bar yAxisId="monto" dataKey="monto_contado" name="Contado" stackId="monto" fill="#3B82F6" radius={[0,0,0,0]} />
                  <Bar yAxisId="monto" dataKey="monto_credito" name="Crédito" stackId="monto" fill="#F59E0B" radius={[4,4,0,0]} />
                  <Line yAxisId="cantidad" type="monotone" dataKey="cantidad" name="N° Ventas" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Tabla de detalle compacta */}
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Mes</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Total</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Ventas</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Contado</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Crédito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...historialMensual].reverse().map((mes) => (
                    <tr key={mes.key} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-800">{mes.etiqueta}</td>
                      <td className="px-3 py-2 text-right font-semibold text-indigo-700">{formatCurrency(mes.total)}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{mes.cantidad}</td>
                      <td className="px-3 py-2 text-right text-blue-600">{formatCurrency(mes.monto_contado)} ({mes.contado})</td>
                      <td className="px-3 py-2 text-right text-amber-600">{formatCurrency(mes.monto_credito)} ({mes.credito})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-48 text-gray-400">
            <div className="text-center">
              <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>No hay datos de ventas históricas</p>
            </div>
          </div>
        )}
      </div>

      {/* Gráfico de tipos de venta */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventas por Tipo</h3>
          <div className="h-64">
            {graficos.tiposVenta.some(t => t.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={graficos.tiposVenta}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={(entry) => `${entry.name}: Q${entry.value.toLocaleString()}`}
                  >
                    {graficos.tiposVenta.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `Q${Number(value).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>No hay datos de ventas</p>
              </div>
            )}
          </div>
        </div>

        {/* Resumen rápido */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen Rápido</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
              <span className="text-sm font-medium text-blue-900">Promedio ventas/día:</span>
              <span className="text-sm font-bold text-blue-900">
                {formatCurrency(graficos.ventasPorDia.length > 0 ?
                  graficos.ventasPorDia.reduce((sum, v) => sum + v.total, 0) / graficos.ventasPorDia.length : 0
                )}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded">
              <span className="text-sm font-medium text-green-900">Inventario total:</span>
              <span className="text-sm font-bold text-green-900">{stats.productosActivos} productos</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
              <span className="text-sm font-medium text-yellow-900">Por cobrar:</span>
              <span className="text-sm font-bold text-yellow-900">{formatCurrency(stats.creditosPendientes)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
