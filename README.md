# Frontend - Sistema de Gestión de Carpintería

Sistema de gestión de inventario y ventas para una carpintería, desarrollado con React, Vite y TailwindCSS.

## 🎨 Paleta de Colores

El diseño utiliza una paleta de colores cálidos inspirados en la carpintería:

- **Oscuro**: `#4A3728` - Marrón oscuro (sidebar, encabezados)
- **Rojizo**: `#7A1F1C` - Marrón rojizo (hover, botones secundarios)
- **Medio**: `#C28E2A` - Dorado medio (botones principales, resaltados)
- **Claro**: `#D4B25E` - Dorado claro (acentos, logos)

## 🚀 Tecnologías

- **React 18** - Biblioteca de UI
- **Vite** - Build tool y dev server
- **TailwindCSS** - Framework CSS utility-first
- **React Router DOM** - Navegación
- **Zustand** - Estado global
- **Axios** - Cliente HTTP
- **Lucide React** - Iconos

## 📦 Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Iniciar servidor de desarrollo:**
```bash
npm run dev
```

El frontend estará disponible en: http://localhost:5173

## 🏗️ Estructura del Proyecto

```
frontcarpinteria/
├── src/
│   ├── components/      # Componentes reutilizables
│   │   ├── Layout.jsx   # Layout principal
│   │   ├── Sidebar.jsx  # Barra lateral de navegación
│   │   └── Header.jsx   # Encabezado con usuario
│   ├── pages/           # Páginas de la aplicación
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Productos.jsx
│   │   ├── Categorias.jsx
│   │   ├── Movimientos.jsx
│   │   ├── Clientes.jsx
│   │   ├── Ventas.jsx
│   │   ├── Creditos.jsx
│   │   └── Usuarios.jsx
│   ├── services/        # Servicios API
│   │   └── api.js       # Cliente Axios configurado
│   ├── store/           # Estado global (Zustand)
│   │   └── authStore.js # Store de autenticación
│   ├── App.jsx          # Configuración de rutas
│   ├── main.jsx         # Punto de entrada
│   └── index.css        # Estilos globales
├── index.html
├── vite.config.js       # Configuración de Vite
├── tailwind.config.js   # Configuración de Tailwind
├── postcss.config.js    # Configuración de PostCSS
└── package.json
```

## 🔌 Conexión con Backend

El frontend está configurado para conectarse con el backend en `http://localhost:3000/api`.

### Proxy configurado en Vite:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  }
}
```

## 📱 Módulos del Sistema

### 1. Dashboard
- Resumen general del sistema
- Estadísticas de productos, clientes, ventas y créditos
- Alertas y notificaciones

### 2. Productos
- Listado de productos del inventario
- Crear, editar y eliminar productos
- Búsqueda y filtrado

### 3. Categorías
- Gestión de categorías de productos
- Operaciones CRUD completas

### 4. Movimientos
- Historial de entradas y salidas de inventario
- Filtros por tipo, fecha, producto

### 5. Clientes
- Gestión de clientes
- Información de contacto y direcciones

### 6. Ventas
- Registro de ventas realizadas
- Detalle de productos vendidos
- Estados de pago

### 7. Créditos
- Gestión de créditos a clientes
- Control de pagos y vencimientos
- Alertas de créditos por vencer

### 8. Usuarios
- Administración de usuarios del sistema
- Roles y permisos

## 🎨 Características de Diseño

### Sidebar Responsive
- Barra lateral colapsable
- Navegación con iconos intuitivos
- Estados activos visuales
- Responsive (se oculta en móvil)

### Header
- Información del usuario actual
- Botón de cerrar sesión
- Toggle del sidebar

### Colores de la Marca
- Uso consistente de la paleta en toda la aplicación
- Estados hover y active bien definidos
- Contraste adecuado para accesibilidad

## 🔐 Autenticación

El sistema utiliza JWT para autenticación:

1. Login en `/login`
2. Token almacenado en localStorage vía Zustand
3. Interceptor Axios agrega token a todas las peticiones
4. Redirección automática al login si el token expira

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview
```

## 🌐 Rutas de la Aplicación

- `/login` - Página de inicio de sesión
- `/dashboard` - Panel principal
- `/productos` - Gestión de productos
- `/categorias` - Gestión de categorías
- `/movimientos` - Historial de movimientos
- `/clientes` - Gestión de clientes
- `/ventas` - Registro de ventas
- `/creditos` - Gestión de créditos
- `/usuarios` - Administración de usuarios

## 🔧 Configuración

### Variables de Entorno (opcional)
Puedes crear un archivo `.env` para configurar:

```env
VITE_API_URL=http://localhost:3000/api
```

## 🚦 Requisitos Previos

- Node.js 16+ 
- Backend corriendo en http://localhost:3000
- npm o yarn

## 👥 Credenciales de Prueba

Consulta con el backend las credenciales de usuarios de prueba.

## 📄 Licencia

ISC
