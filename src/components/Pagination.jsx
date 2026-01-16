import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Componente de Paginación Reutilizable
 * 
 * @param {Object} props
 * @param {number} props.currentPage - Página actual
 * @param {number} props.totalPages - Total de páginas
 * @param {number} props.pageSize - Registros por página
 * @param {number} props.totalItems - Total de registros
 * @param {Function} props.onPageChange - Callback cuando cambia la página
 * @param {Function} props.onPageSizeChange - Callback cuando cambia el tamaño de página
 * @param {boolean} props.hasNextPage - Si hay página siguiente
 * @param {boolean} props.hasPrevPage - Si hay página anterior
 */
const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
  hasNextPage = false,
  hasPrevPage = false
}) => {
  const pageSizeOptions = [10, 20, 30, 40, 50];
  
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const handlePrevious = () => {
    if (hasPrevPage && currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (hasNextPage && currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    onPageSizeChange(newSize);
    // Resetear a la primera página cuando cambia el tamaño
    onPageChange(1);
  };

  const handleGoToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
    }
  };

  // Generar array de números de página para mostrar
  const getPageNumbers = () => {
    const delta = 2; // Cuántas páginas mostrar a cada lado de la actual
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Información y selector de tamaño */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{startItem}</span> a{' '}
            <span className="font-medium">{endItem}</span> de{' '}
            <span className="font-medium">{totalItems}</span> registros
          </div>
          
          <div className="flex items-center gap-2">
            <label htmlFor="pageSize" className="text-sm text-gray-700">
              Mostrar:
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={handlePageSizeChange}
              className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Controles de navegación */}
        <div className="flex items-center gap-2">
          {/* Botón anterior */}
          <button
            onClick={handlePrevious}
            disabled={!hasPrevPage}
            className={`relative inline-flex items-center px-3 py-2 rounded-md text-sm font-medium
              ${hasPrevPage
                ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              }`}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="ml-1">Anterior</span>
          </button>

          {/* Números de página */}
          <div className="hidden sm:flex gap-1">
            {getPageNumbers().map((pageNum, index) => {
              if (pageNum === '...') {
                return (
                  <span
                    key={`dots-${index}`}
                    className="px-3 py-2 text-gray-700"
                  >
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handleGoToPage(pageNum)}
                  className={`px-3 py-2 rounded-md text-sm font-medium
                    ${currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Indicador de página en móvil */}
          <div className="sm:hidden text-sm text-gray-700">
            Página {currentPage} de {totalPages}
          </div>

          {/* Botón siguiente */}
          <button
            onClick={handleNext}
            disabled={!hasNextPage}
            className={`relative inline-flex items-center px-3 py-2 rounded-md text-sm font-medium
              ${hasNextPage
                ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              }`}
          >
            <span className="mr-1">Siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
