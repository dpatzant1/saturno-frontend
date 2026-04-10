import { useState } from 'react'
import { X, Search } from 'lucide-react'

export default function ModalProductosAlerta({ isOpen, onClose, productos, titulo, tipo }) {
  const [busqueda, setBusqueda] = useState('')

  if (!isOpen || !productos) return null

  const obtenerCategoria = (producto) => {
    if (Array.isArray(producto?.categorias)) {
      return producto.categorias[0]?.nombre || '-'
    }

    if (producto?.categorias && typeof producto.categorias === 'object') {
      return producto.categorias.nombre || '-'
    }

    return producto?.categoria || producto?.nombre_categoria || '-'
  }

  // Filtrar productos por búsqueda
  const productosFiltrados = productos.filter(p =>
    (p?.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (p?.id_producto || '').toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Encabezado */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">{titulo}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Búsqueda */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Tabla de productos */}
        <div className="overflow-y-auto flex-1">
          {productosFiltrados.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Stock Actual
                  </th>
                  {tipo === 'bajo' && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Stock Mínimo
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productosFiltrados.map((producto) => (
                  <tr key={producto.id_producto} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {producto.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                      {producto.id_producto.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span className={`font-bold ${tipo === 'sin' ? 'text-red-600' : 'text-yellow-600'}`}>
                        {producto.cantidad_stock ?? producto.stock_actual ?? 0}
                      </span>
                    </td>
                    {tipo === 'bajo' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                        {producto.stock_minimo || 5}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-left text-gray-600">
                      {obtenerCategoria(producto)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          producto.estado
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {producto.estado ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-500">
              <p>No se encontraron productos</p>
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Mostrando <strong>{productosFiltrados.length}</strong> de <strong>{productos.length}</strong> productos
          </p>
        </div>
      </div>
    </div>
  )
}
