import { useState, useEffect } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { isAuthenticated, token, user } = useAuthStore()
  
  // Verificar tanto isAuthenticated como token para mayor seguridad
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />
  }

  const handleToggleSidebar = () => {
    // En móvil, simplemente abrir/cerrar
    if (window.innerWidth < 1024) {
      setSidebarOpen(!sidebarOpen)
    } else {
      // En desktop, colapsar/expandir
      setIsCollapsed(!isCollapsed)
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen}
        isCollapsed={isCollapsed}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={handleToggleSidebar} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
