import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  ArrowUpDown, 
  Users, 
  ShoppingCart, 
  CreditCard,
  UserCog,
  FileText,
  X
} from 'lucide-react'
import logo from '/LogoCSaturno.png'

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Productos', icon: Package, path: '/productos' },
  { name: 'Categorías', icon: FolderTree, path: '/categorias' },
  { name: 'Movimientos', icon: ArrowUpDown, path: '/movimientos' },
  { name: 'Clientes', icon: Users, path: '/clientes' },
  { name: 'Ventas', icon: ShoppingCart, path: '/ventas' },
  { name: 'Cotizaciones', icon: FileText, path: '/cotizaciones' },
  { name: 'Créditos', icon: CreditCard, path: '/creditos' },
  { name: 'Usuarios', icon: UserCog, path: '/usuarios' },
]

export default function Sidebar({ isOpen, setIsOpen, isCollapsed }) {
  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          bg-carpinteria-oscuro text-white
          transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          w-64
        `}
      >
        {/* Header del Sidebar */}
        <div className={`flex items-center border-b border-carpinteria-rojizo p-4 ${isCollapsed ? 'lg:justify-center' : 'justify-between'}`}>
          <div className={`flex items-center ${isCollapsed ? 'lg:justify-center lg:w-full' : 'justify-center flex-1'}`}>
            <img 
              src={logo} 
              alt="Logo Comercial Saturno" 
              className={`object-contain transition-all duration-300 ${isCollapsed ? 'lg:h-8' : 'h-12'}`} 
            />
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white absolute right-4"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center rounded-lg transition-colors group relative ${
                      isCollapsed ? 'lg:justify-center lg:px-3' : 'px-4'
                    } py-3 ${
                      isActive
                        ? 'bg-carpinteria-medio text-white'
                        : 'text-gray-300 hover:bg-carpinteria-rojizo hover:text-white'
                    }`
                  }
                  title={isCollapsed ? item.name : ''}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                  <span className={`font-medium transition-all duration-300 ${isCollapsed ? 'lg:hidden' : ''}`}>
                    {item.name}
                  </span>
                  
                  {/* Tooltip para modo colapsado */}
                  {isCollapsed && (
                    <span className="hidden lg:block absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {item.name}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer del Sidebar */}
        <div className={`p-4 border-t border-carpinteria-rojizo ${isCollapsed ? 'lg:hidden' : ''}`}>
          <p className="text-sm text-gray-400 text-center">
            © 2026 Carpintería
          </p>
        </div>
      </aside>
    </>
  )
}
