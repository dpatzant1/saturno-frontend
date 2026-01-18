import { useState, useEffect, useRef } from 'react'
import { Search, X, FolderOpen } from 'lucide-react'

/**
 * Componente de búsqueda de categorías con autocompletado
 * Permite buscar categorías por nombre
 * Muestra sugerencias en tiempo real
 */
export default function CategorySearch({ value, onChange, categorias = [], disabled = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredCategories, setFilteredCategories] = useState([])
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

  // Filtrar categorías según el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCategories(categorias.slice(0, 20)) // Mostrar primeras 20 si no hay búsqueda
    } else {
      const searchLower = searchTerm.toLowerCase()
      const filtered = categorias.filter(categoria => {
        // Buscar en nombre
        if (categoria.nombre?.toLowerCase().includes(searchLower)) return true
        
        // Buscar en descripción si existe
        if (categoria.descripcion?.toLowerCase().includes(searchLower)) return true
        
        return false
      })
      setFilteredCategories(filtered.slice(0, 30)) // Máximo 30 resultados
    }
  }, [searchTerm, categorias])

  // Actualizar el término de búsqueda cuando se selecciona una categoría externamente
  useEffect(() => {
    if (value) {
      const categoria = categorias.find(c => c.id_categoria === value)
      if (categoria) {
        setSearchTerm(categoria.nombre)
      }
    } else {
      setSearchTerm('')
    }
  }, [value, categorias])

  const handleSelect = (categoria) => {
    setSearchTerm(categoria.nombre)
    onChange(categoria.id_categoria, categoria)
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
          placeholder="Buscar categoría por nombre..."
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
          {filteredCategories.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                {searchTerm ? 'No se encontraron categorías' : 'Escribe para buscar categorías'}
              </p>
              {categorias.length === 0 && (
                <p className="mt-1 text-xs text-red-500">
                  No hay categorías disponibles. Por favor, crea una categoría primero.
                </p>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredCategories.map((categoria) => (
                <li key={categoria.id_categoria}>
                  <button
                    type="button"
                    onClick={() => handleSelect(categoria)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {categoria.nombre}
                        </p>
                        {categoria.descripcion && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {categoria.descripcion}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <FolderOpen className="h-5 w-5 text-carpinteria-medio" />
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
