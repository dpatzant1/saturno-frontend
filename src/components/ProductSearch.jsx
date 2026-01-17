import { useState, useEffect, useRef } from 'react'
import { Search, X, Package } from 'lucide-react'

/**
 * Componente de búsqueda de productos con autocompletado
 * Permite buscar productos por nombre con sugerencias en tiempo real
 */
export default function ProductSearch({ value, onChange, productos = [], disabled = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredProducts, setFilteredProducts] = useState([])
  const containerRef = useRef(null)

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtrar productos según el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(productos.slice(0, 10)) // Mostrar primeros 10 si no hay búsqueda
    } else {
      const filtered = productos.filter(producto =>
        producto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredProducts(filtered.slice(0, 20)) // Máximo 20 resultados
    }
  }, [searchTerm, productos])

  // Actualizar el término de búsqueda cuando se selecciona un producto externamente
  useEffect(() => {
    if (value) {
      const producto = productos.find(p => p.id_producto === value)
      if (producto) {
        setSearchTerm(producto.nombre)
      }
    } else {
      setSearchTerm('')
    }
  }, [value, productos])

  const handleSelect = (producto) => {
    setSearchTerm(producto.nombre)
    onChange(producto.id_producto, producto)
    setIsOpen(false)
  }

  const handleClear = () => {
    setSearchTerm('')
    onChange('', null)
    setIsOpen(false)
  }

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    setIsOpen(true)
    
    // Si se borra el campo, limpiar la selección
    if (!newValue.trim()) {
      onChange('', null)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Input de búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-carpinteria-medio disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Buscar producto por nombre..."
          autoComplete="off"
        />
        {searchTerm && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Dropdown de resultados */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                {searchTerm ? 'No se encontraron productos' : 'Escribe para buscar productos'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredProducts.map((producto) => (
                <li key={producto.id_producto}>
                  <button
                    type="button"
                    onClick={() => handleSelect(producto)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {producto.nombre}
                        </p>
                        {producto.categorias?.nombre && (
                          <p className="text-xs text-gray-500 mt-1">
                            {producto.categorias.nombre}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0 text-right">
                        <p className="text-sm font-semibold text-carpinteria-oscuro">
                          Q{parseFloat(producto.precio_venta || 0).toFixed(2)}
                        </p>
                        <p className={`text-xs mt-1 ${
                          producto.cantidad_stock <= producto.stock_minimo 
                            ? 'text-red-600 font-semibold' 
                            : 'text-gray-500'
                        }`}>
                          Stock: {producto.cantidad_stock} {producto.unidad_medida}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
