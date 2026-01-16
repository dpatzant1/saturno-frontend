# 🗺️ ROADMAP FRONTEND - Sistema de Gestión Carpintería

## 📊 Información del Proyecto
- **Framework**: React 18.3 + Vite
- **Estado**: En Desarrollo
- **Fecha Inicio Roadmap**: 8 de enero de 2026
- **Progreso General**: 203/217 tareas completadas (93.5%)

---

## 🎯 FASE 0: CORRECCIONES CRÍTICAS (URGENTE)
**Objetivo**: Corregir errores críticos que violan reglas de negocio  
**Dependencias**: Ninguna  
**Tiempo estimado**: 1 hora  
**Progreso**: 10/10 tareas ✅

### 0.1 Corrección de Productos - Campo Stock ✅
- [x] Eliminar campo `cantidad_stock` del formulario de CREAR producto
- [x] Eliminar campo `cantidad_stock` del formulario de EDITAR producto
- [x] Cambiar campo stock a SOLO LECTURA en la tabla de productos
- [x] Agregar mensaje informativo: "El stock se actualiza automáticamente mediante movimientos de inventario"
- [x] Probar que no se envíe cantidad_stock al API en crear/editar

### 0.2 Corrección de API - Endpoints de Ventas ✅
- [x] Eliminar función `createVenta()` genérica
- [x] Crear función `createVentaContado(ventaData)` → POST `/ventas/contado`
- [x] Crear función `createVentaCredito(ventaData)` → POST `/ventas/credito`
- [x] Crear función `anularVenta(id, motivo)` → POST `/ventas/:id/anular`
- [x] Crear función `getVentaDetalle(id)` → GET `/ventas/:id`

---

## 🎯 FASE 1: MÓDULO DE VENTAS (CORE DEL SISTEMA)
**Objetivo**: Implementar sistema completo de ventas al contado y a crédito  
**Dependencias**: FASE 0 completada  
**Tiempo estimado**: 6-8 horas  
**Progreso**: 56/56 tareas (100.0%) ✅

### 1.1 Funciones API de Ventas ✅
- [x] Mejorar `getVentas(params)` para usar `extraerDatos()`
- [x] Crear función `getVentasPorCliente(idCliente)`
- [x] Crear función `getVentasPorUsuario(idUsuario)`
- [x] Crear función `getVentasDelMes()`
- [x] Probar todas las funciones con datos reales

### 1.2 Estado y Hooks del Componente Ventas ✅
- [x] Crear estado `ventas` (lista de ventas)
- [x] Crear estado `loading` (carga de datos)
- [x] Crear estado `showModal` (control de modal)
- [x] Crear estado `showDetailModal` (detalle de venta)
- [x] Crear estado `filtros` (búsqueda y filtros)
- [x] Crear hook `useEffect` para cargar ventas al montar
- [x] Crear función `cargarVentas()` con manejo de errores

### 1.3 Modal de Nueva Venta - Estructura ✅
- [x] Crear componente modal con overlay y animaciones
- [x] Agregar sección de selección de cliente (dropdown con búsqueda)
- [x] Agregar radio buttons para tipo de venta (CONTADO/CREDITO)
- [x] Agregar condicional: mostrar método pago solo si CONTADO
- [x] Agregar condicional: mostrar días crédito solo si CREDITO
- [x] Mostrar límite de crédito disponible del cliente

### 1.4 Modal de Nueva Venta - Carrito de Productos ✅
- [x] Crear estado `carrito` (productos agregados)
- [x] Crear sección de búsqueda/selección de productos
- [x] Agregar campo cantidad con validación de stock
- [x] Agregar campo precio unitario (editable)
- [x] Mostrar stock disponible del producto seleccionado
- [x] Crear función `agregarProductoAlCarrito()`
- [x] Crear tabla de productos en el carrito
- [x] Agregar botón eliminar producto del carrito
- [x] Calcular subtotal por producto automáticamente
- [x] Calcular total general de la venta

### 1.5 Modal de Nueva Venta - Validaciones y Envío ✅
- [x] Validar que se haya seleccionado un cliente
- [x] Validar que el carrito tenga al menos 1 producto
- [x] Si CONTADO: validar que se seleccionó método de pago
- [x] Si CREDITO: validar que cliente sea tipo CREDITO
- [x] Si CREDITO: validar que total no exceda crédito disponible
- [x] Crear función `handleSubmitVenta()` con manejo de errores
- [x] Llamar a `createVentaContado()` o `createVentaCredito()` según tipo
- [x] Mostrar mensaje de éxito y recargar lista
- [x] Limpiar formulario y cerrar modal

### 1.6 Listado de Ventas ✅
- [x] Crear tabla con columnas: Fecha, Nro/ID, Cliente, Tipo, Total, Estado
- [x] Formatear fecha como DD/MM/YYYY HH:mm
- [x] Mostrar tipo de venta con badge de color (CONTADO: azul, CREDITO: naranja)
- [x] Mostrar estado con badge (ACTIVA: verde, ANULADA: rojo)
- [x] Formatear total como moneda con 2 decimales
- [x] Agregar columna de acciones (Ver, Anular, Imprimir)
- [x] Implementar búsqueda en tiempo real
- [x] Agregar filtros por tipo de venta
- [x] Agregar filtros por estado
- [x] Implementar paginación si hay muchas ventas

### 1.7 Modal de Detalle de Venta ✅
- [x] Crear modal de detalle con información completa
- [x] Mostrar datos de la venta (ID, fecha, usuario)
- [x] Mostrar datos del cliente
- [x] Crear tabla de productos vendidos (nombre, cantidad, precio, subtotal)
- [x] Mostrar total de la venta
- [x] Mostrar método de pago (si CONTADO)
- [x] Si CREDITO: mostrar link al crédito asociado
- [x] Agregar botón para cerrar modal

### 1.8 Funcionalidad de Anular Venta (Solo ADMIN) ✅
- [x] Agregar botón "Anular" solo para rol ADMINISTRADOR
- [x] Crear modal de confirmación con campo de motivo
- [x] Validar que la venta esté en estado ACTIVA
- [x] Llamar a `anularVenta(id, motivo)`
- [x] Mostrar mensaje de éxito y recargar lista
- [x] Actualizar vista mostrando venta como ANULADA

---

## 🎯 FASE 2: MÓDULO DE CRÉDITOS Y PAGOS
**Objetivo**: Sistema completo de gestión de créditos y registro de pagos  
**Dependencias**: FASE 1 completada  
**Tiempo estimado**: 4-5 horas  
**Progreso**: 53/53 tareas (100.0%) ✅

### 2.1 Funciones API de Créditos ✅
- [x] Mejorar `getCreditos(params)` para usar `extraerDatos()`
- [x] Crear función `getCreditosActivos()`
- [x] Crear función `getCreditosVencidos()`
- [x] Crear función `getCreditosPagados()`
- [x] Crear función `getCreditosPorCliente(idCliente)`
- [x] Crear función `getHistorialPagos(idCredito)`
- [x] Probar todas las funciones

### 2.2 Estado y Hooks del Componente Créditos ✅
- [x] Crear estado `creditos` (lista)
- [x] Crear estado `loading`
- [x] Crear estado `showPagoModal` (modal de pago)
- [x] Crear estado `showDetailModal` (modal de detalle)
- [x] Crear estado `creditoSeleccionado`
- [x] Crear estado `filtros` (estado, cliente, fechas)
- [x] Crear hook `useEffect` para cargar créditos
- [x] Crear función `cargarCreditos()` con filtros

### 2.3 Listado de Créditos ✅
- [x] Crear tabla con columnas: Cliente, Monto Total, Saldo, Estado, Vencimiento, Acciones
- [x] Mostrar cliente con nombre completo
- [x] Formatear montos con 2 decimales y símbolo de moneda
- [x] Calcular y mostrar monto pagado (monto_total - saldo_pendiente)
- [x] Mostrar estado con badges de colores:
  - Verde: PAGADO
  - Amarillo: ACTIVO
  - Rojo: VENCIDO
- [x] Formatear fecha de vencimiento
- [x] Resaltar en rojo créditos vencidos
- [x] Agregar columna de acciones (Ver Detalle, Registrar Pago, Ver Pagos)
- [x] Deshabilitar "Registrar Pago" si estado es PAGADO

### 2.4 Filtros de Créditos ✅
- [x] Agregar filtro por estado (dropdown: Todos, ACTIVO, VENCIDO, PAGADO)
- [x] Agregar filtro por cliente (dropdown con búsqueda)
- [x] Agregar filtro por rango de fechas (desde - hasta)
- [x] Agregar botón "Limpiar filtros"
- [x] Implementar búsqueda en tiempo real por cliente
- [x] Aplicar filtros al llamar `cargarCreditos()`

### 2.5 Modal de Registrar Pago ✅
- [x] Crear modal con overlay
- [x] Mostrar información del crédito (solo lectura):
  - Cliente
  - Monto total
  - Saldo pendiente
  - Estado
- [x] Agregar campo "Monto a pagar" (input numérico)
- [x] Validar: monto > 0
- [x] Validar: monto <= saldo_pendiente
- [x] Agregar select "Método de pago" (EFECTIVO/TARJETA/TRANSFERENCIA)
- [x] Agregar textarea "Notas" (opcional)
- [x] Calcular y mostrar "Nuevo saldo" en tiempo real
- [x] Mostrar mensaje si el pago liquidará el crédito
- [x] Crear función `handleRegistrarPago()`
- [x] Llamar a `createPago(creditoId, pagoData)`
- [x] Mostrar mensaje de éxito
- [x] Recargar lista de créditos
- [x] Limpiar y cerrar modal

### 2.6 Modal de Detalle de Crédito ✅
- [x] Crear modal de detalle completo
- [x] Mostrar información del crédito
- [x] Mostrar datos del cliente con límite total y disponible
- [x] Mostrar monto total, saldo pendiente, monto pagado
- [x] Mostrar fechas de inicio y vencimiento
- [x] Mostrar estado con badge
- [x] Agregar link a la venta asociada
- [x] Crear tabla de historial de pagos:
  - Fecha/hora
  - Monto pagado
  - Método de pago
  - Notas
  - Saldo después del pago
  - Usuario que registró
- [x] Ordenar historial por fecha DESC (más reciente primero)
- [x] Agregar botón "Cerrar"

---

## 🎯 FASE 3: MÓDULO DE MOVIMIENTOS DE INVENTARIO
**Objetivo**: Visualización y gestión de movimientos (ENTRADA/SALIDA)  
**Dependencias**: Ninguna (pero mejor después de Ventas)  
**Tiempo estimado**: 3-4 horas  
**Progreso**: 38/38 tareas (100.0%) ✅

### 3.1 Funciones API de Movimientos ✅
- [x] Mejorar `getMovimientos(params)` para usar `extraerDatos()`
- [x] Crear función `getMovimientosPorProducto(idProducto)`
- [x] Crear función `getMovimientosPorTipo(tipo)`
- [x] Crear función `createMovimientoEntrada(data)` → POST `/movimientos/entrada`
- [x] Crear función `createMovimientoSalida(data)` → POST `/movimientos/salida`
- [x] Probar funciones

### 3.2 Estado y Hooks del Componente Movimientos ✅
- [x] Crear estado `movimientos` (lista)
- [x] Crear estado `loading`
- [x] Crear estado `showModal` (modal crear movimiento)
- [x] Crear estado `filtros` (tipo, producto, usuario, fechas)
- [x] Crear hook `useEffect` para cargar movimientos
- [x] Crear función `cargarMovimientos()` con filtros

### 3.3 Listado de Movimientos ✅
- [x] Crear tabla: Fecha/Hora, Tipo, Producto, Cantidad, Usuario, Observaciones, Venta
- [x] Formatear fecha como DD/MM/YYYY HH:mm
- [x] Mostrar tipo con badges de colores:
  - Verde: ENTRADA
  - Rojo: SALIDA
  - Azul: VENTA
  - Naranja: ANULACION_VENTA
- [x] Mostrar cantidad con signo (+ para entrada, - para salida)
- [x] Mostrar nombre del usuario que registró
- [x] Si hay venta asociada: mostrar link a la venta
- [x] Implementar búsqueda en tiempo real
- [x] Ordenar por fecha DESC (más reciente primero)

### 3.4 Filtros de Movimientos ✅
- [x] Agregar filtro por tipo (dropdown: Todos, ENTRADA, SALIDA, VENTA, ANULACION_VENTA)
- [x] Agregar filtro por producto (dropdown con búsqueda)
- [x] Agregar filtro por usuario (dropdown)
- [x] Agregar filtro por rango de fechas
- [x] Agregar botón "Limpiar filtros"
- [x] Aplicar filtros al cargar movimientos

### 3.5 Modal de Nuevo Movimiento (Solo ADMIN) ✅
- [x] Validar que el usuario sea ADMINISTRADOR antes de mostrar botón
- [x] Crear modal de nuevo movimiento
- [x] Agregar radio buttons para tipo (solo ENTRADA o SALIDA)
- [x] Agregar mensaje: "Los movimientos tipo VENTA se generan automáticamente"
- [x] Agregar select de producto (con búsqueda)
- [x] Mostrar stock actual del producto seleccionado
- [x] Agregar campo cantidad (numérico > 0)
- [x] Agregar textarea de observaciones (requerido)
- [x] Validar todos los campos
- [x] Crear función `handleSubmitMovimiento()`
- [x] Llamar a `createMovimientoEntrada()` o `createMovimientoSalida()`
- [x] Mostrar mensaje de éxito
- [x] Recargar lista de movimientos
- [x] Limpiar y cerrar modal

---

## 🎯 FASE 4: MÓDULO DE USUARIOS
**Objetivo**: Gestión completa de usuarios del sistema  
**Dependencias**: Ninguna  
**Tiempo estimado**: 2-3 horas  
**Progreso**: 43/43 tareas (100.0%) ✅

### 4.1 Estado y Hooks del Componente Usuarios ✅
- [x] Crear estado `usuarios` (lista)
- [x] Crear estado `loading`
- [x] Crear estado `showModal` (modal crear/editar)
- [x] Crear estado `editingUsuario`
- [x] Crear estado `formData` (campos del formulario)
- [x] Crear hook `useEffect` para cargar usuarios
- [x] Crear función `cargarUsuarios()`

### 4.2 Listado de Usuarios ✅
- [x] Crear tabla: Nombre, Correo, Rol, Estado, Fecha Creación, Acciones
- [x] Mostrar rol con badge (ADMINISTRADOR: rojo, VENDEDOR: azul)
- [x] Mostrar estado con badge (Activo: verde, Inactivo: gris)
- [x] Formatear fecha de creación
- [x] Agregar acciones: Editar, Cambiar Estado, Eliminar
- [x] Implementar búsqueda por nombre o correo

### 4.3 Modal de Crear/Editar Usuario ✅
- [x] Crear modal reutilizable para crear y editar
- [x] Agregar campo "Nombre" (input text, requerido)
- [x] Agregar campo "Correo" (input email, opcional)
- [x] Agregar campo "Contraseña" (input password):
  - Requerido en CREAR
  - Opcional en EDITAR (solo si se quiere cambiar)
- [x] Agregar select "Rol" (ADMINISTRADOR/VENDEDOR)
- [x] Agregar checkbox "Estado Activo"
- [x] Crear función `handleSubmit()`
- [x] Llamar a `createUsuario()` o `updateUsuario()`
- [x] Validar campos antes de enviar
- [x] Mostrar mensajes de error/éxito
- [x] Recargar lista y cerrar modal

### 4.4 Funcionalidad de Eliminar Usuario ✅
- [x] Agregar botón "Eliminar" (solo ADMIN)
- [x] Mostrar confirmación antes de eliminar
- [x] Llamar a `deleteUsuario(id)`
- [x] Manejar errores (ej: no se puede eliminar a sí mismo)
- [x] Mostrar mensaje y recargar lista

### 4.5 Validación de Permisos ✅
- [x] Verificar que solo ADMINISTRADOR pueda acceder a esta página
- [x] Si VENDEDOR intenta acceder, mostrar mensaje y redirigir
- [x] Validar en el componente Layout o con Route protegida

### 4.6 Corrección de Esquema Base de Datos ✅
- [x] Quitar campo `correo` de la tabla usuarios (no existe en la BD)
- [x] Quitar campo `correo` del formulario de crear/editar usuario
- [x] Corregir colSpan de la tabla (6 → 5 columnas)
- [x] Corregir relaciones de roles en el backend (`roles!id_rol`)
- [x] Procesar estructura de datos para mostrar `rol.nombre`
- [x] Verificar que roles se muestren correctamente en la tabla
- [x] Crear endpoint `/usuarios/roles` para obtener roles disponibles
- [x] Corregir función `getRoles()` en frontend para usar endpoint correcto
- [x] Validar que selector de roles cargue correctamente en modal editar

### 4.7 Mejoras de UX y Notificaciones ✅
- [x] Corregir overlay del modal quitando margin-top innecesario
- [x] Implementar sistema de notificaciones toast como en módulo de ventas
- [x] Reemplazar alerts nativos por notificaciones toast elegantes
- [x] Agregar iconos de éxito/error en las notificaciones
- [x] Configurar auto-hide de notificaciones (4 segundos)
- [x] Reemplazar window.confirm por modales de confirmación personalizados
- [x] Crear modal de confirmación elegante con título y mensaje
- [x] Mantener confirmaciones críticas pero con interfaz profesional

---

## 🎯 FASE 5: DASHBOARD CON DATOS REALES
**Objetivo**: Mostrar estadísticas, alertas y gráficos dinámicos  
**Dependencias**: FASE 1 y 2 completadas  
**Tiempo estimado**: 3-4 horas  
**Progreso**: 20/20 tareas (100.0%) ✅

### 5.1 Funciones API para Dashboard ✅
- [x] Crear función `getDashboardStats()` → GET `/dashboard/stats`
- [x] Crear función `getProductosBajoStock()` → GET `/productos/bajo-stock`
- [x] Crear función `getProductosSinStock()` → GET `/productos/sin-stock`
- [x] Crear función `getVentasDelMes()`
- [x] Crear función `getProductosMasVendidos(limite = 5)`
- [x] Probar todas las funciones

### 5.2 Estadísticas en Cards ✅
- [x] Cargar total de productos activos del API
- [x] Cargar total de clientes activos del API
- [x] Cargar ventas del mes actual (suma de totales)
- [x] Cargar créditos pendientes (suma de saldos ACTIVO + VENCIDO)
- [x] Calcular porcentaje de cambio vs mes anterior
- [x] Actualizar valores en los 4 cards del dashboard
- [x] Mostrar loading mientras carga

### 5.3 Sección de Alertas Dinámicas ✅
- [x] Cargar productos con stock bajo
- [x] Mostrar alerta amarilla si hay productos bajo stock mínimo
- [x] Listar productos con stock actual y stock mínimo
- [x] Cargar productos sin stock
- [x] Mostrar alerta roja si hay productos sin stock
- [x] Cargar créditos vencidos
- [x] Mostrar alerta roja con lista de clientes y montos
- [x] Cargar créditos próximos a vencer (< 7 días)
- [x] Mostrar alerta naranja con próximos vencimientos
- [x] Si no hay alertas, mostrar mensaje de "Todo bien"

### 5.4 Gráficos (Opcional pero recomendado) ✅
- [x] Instalar librería de gráficos (ej: recharts, chart.js)
- [x] Crear gráfico de líneas: Ventas últimos 30 días
- [x] Crear gráfico de barras: Top 5 productos más vendidos
- [x] Crear gráfico de pie: Ventas CONTADO vs CREDITO
- [x] Crear gráfico de pie: Estados de créditos (ACTIVO/VENCIDO/PAGADO)
- [x] Agregar tooltips informativos
- [x] Hacer gráficos responsive

---

## 🎯 FASE 6: MEJORAS DE UX Y SEGURIDAD
**Objetivo**: Pulir experiencia de usuario y fortalecer seguridad  
**Dependencias**: Todas las fases anteriores  
**Tiempo estimado**: 3-4 horas  
**Progreso**: 0/21 tareas

### 6.1 Sistema de Permisos en UI
- [ ] Crear hook personalizado `useAuth()` en `hooks/useAuth.js`
- [ ] Hook debe retornar: `isAdmin`, `isVendedor`, `canDelete`, `canCreateMovement`, etc.
- [ ] Implementar en componente Productos (ocultar crear/editar stock para VENDEDOR)
- [ ] Implementar en componente Movimientos (ocultar botón crear para VENDEDOR)
- [ ] Implementar en componente Ventas (mostrar/ocultar anular según rol)
- [ ] Implementar en componente Usuarios (solo ADMIN)
- [ ] Probar con usuario VENDEDOR que no vea acciones prohibidas

### 6.2 Componentes de Carga
- [ ] Crear componente `Loading.jsx` (spinner reutilizable)
- [ ] Agregar loading en Productos mientras carga
- [ ] Agregar loading en Categorías mientras carga
- [ ] Agregar loading en Clientes mientras carga
- [ ] Agregar loading en Ventas mientras carga
- [ ] Agregar loading en Créditos mientras carga
- [ ] Agregar loading en Movimientos mientras carga
- [ ] Agregar loading en Dashboard mientras carga estadísticas

### 6.3 Validaciones Mejoradas
- [ ] Validar stock disponible antes de agregar al carrito de venta
- [ ] Validar límite de crédito antes de permitir venta a crédito
- [ ] Mostrar mensajes de error más descriptivos
- [ ] Agregar validación de campos en tiempo real (onChange)
- [ ] Validar formato de números (decimales, negativos)
- [ ] Validar fechas futuras donde corresponda

### 6.4 Mensajes de Confirmación
- [ ] Agregar confirmación antes de eliminar producto
- [ ] Agregar confirmación antes de eliminar categoría
- [ ] Agregar confirmación antes de eliminar cliente
- [ ] Agregar confirmación antes de anular venta
- [ ] Agregar confirmación antes de eliminar usuario
- [ ] Usar modal de confirmación personalizado (mejor que alert)

### 6.5 Exportación de Reportes (Opcional)
- [ ] Agregar botón "Exportar a Excel" en Ventas
- [ ] Agregar botón "Exportar a PDF" en Créditos
- [ ] Agregar botón "Exportar a Excel" en Movimientos
- [ ] Implementar función de exportación con librería (xlsx, jspdf)
- [ ] Incluir filtros aplicados en la exportación

---

## 📊 RESUMEN DE PROGRESO POR FASE

| Fase | Descripción | Tareas | Completadas | Progreso | Prioridad |
|------|-------------|--------|-------------|----------|-----------|
| **FASE 0** | Correcciones Críticas | 10 | 10 | 100% ✅ | 🔴 CRÍTICA |
| **FASE 1** | Módulo de Ventas | 56 | 56 | 100.0% ✅ | 🔴 ALTA |
| **FASE 2** | Módulo de Créditos | 53 | 53 | 100.0% ✅ | 🔴 ALTA |
| **FASE 3** | Módulo de Movimientos | 38 | 38 | 100.0% ✅ | 🟡 MEDIA |
| **FASE 4** | Módulo de Usuarios | 26 | 26 | 100.0% ✅ | 🟡 MEDIA |
| **FASE 5** | Dashboard Real | 20 | 20 | 100.0% ✅ | 🟡 MEDIA |
| **FASE 6** | Mejoras UX | 21 | 0 | 0% | 🟢 BAJA |
| **TOTAL** | **6 FASES** | **224** | **207** | **92.4%** | - |

---

## 📝 NOTAS IMPORTANTES

### Reglas de Negocio Críticas a Recordar:
1. ❌ **NUNCA** permitir editar el stock directamente en productos
2. ✅ Stock solo se modifica a través de movimientos de inventario
3. ✅ Ventas a crédito solo para clientes tipo CREDITO
4. ✅ Validar límite de crédito disponible antes de crear venta
5. ✅ VENTA y ANULACION_VENTA se generan automáticamente
6. ✅ Solo ADMINISTRADOR puede crear movimientos manuales
7. ✅ Solo ADMINISTRADOR puede anular ventas

### Estructura de Datos del Backend:
```javascript
// Venta al CONTADO
{
  id_cliente: UUID,
  metodo_pago: "EFECTIVO|TARJETA|TRANSFERENCIA",
  productos: [
    {
      id_producto: UUID,
      cantidad: number,
      precio_unitario: number
    }
  ]
}

// Venta a CRÉDITO
{
  id_cliente: UUID, // Debe ser tipo CREDITO
  dias_credito: number, // Opcional
  productos: [...]
}

// Pago de Crédito
{
  monto_pagado: number,
  metodo_pago: "EFECTIVO|TARJETA|TRANSFERENCIA",
  notas: string (opcional)
}

// Movimiento de Inventario
{
  tipo_movimiento: "ENTRADA|SALIDA",
  id_producto: UUID,
  cantidad: number,
  observaciones: string
}
```

### Endpoints del Backend:
```
POST /api/ventas/contado
POST /api/ventas/credito
POST /api/ventas/:id/anular
GET  /api/ventas
GET  /api/ventas/:id

GET  /api/creditos
GET  /api/creditos/:id
POST /api/creditos/:id/pagos

GET  /api/movimientos
POST /api/movimientos/entrada
POST /api/movimientos/salida

GET  /api/usuarios
POST /api/usuarios
PUT  /api/usuarios/:id
DELETE /api/usuarios/:id
```

---

## 🚀 INSTRUCCIONES DE USO DEL ROADMAP

1. **Orden de Ejecución**: Seguir el orden de las fases (0 → 1 → 2 → 3 → 4 → 5 → 6)
2. **Marcar Progreso**: Cambiar `[ ]` a `[x]` cuando se complete una tarea
3. **Testing**: Probar cada funcionalidad antes de marcar como completa
4. **Commits**: Hacer commit al terminar cada subfase (ej: 1.1, 1.2, etc.)
5. **Dependencias**: No saltar de fase sin completar las dependencias
6. **Prioridad**: FASE 0 y FASE 1 son críticas, el resto puede ajustarse

---

## 📅 CRONOGRAMA ESTIMADO

- **Semana 1**: FASE 0 + FASE 1 (Correcciones + Ventas)
- **Semana 2**: FASE 2 + FASE 3 (Créditos + Movimientos)
- **Semana 3**: FASE 4 + FASE 5 (Usuarios + Dashboard)
- **Semana 4**: FASE 6 (Mejoras y testing general)

**Tiempo total estimado**: 18-23 horas de desarrollo

---

## ✅ CRITERIOS DE COMPLETITUD

Una fase se considera **COMPLETA** cuando:
- ✅ Todas las tareas están marcadas
- ✅ El código funciona sin errores
- ✅ Se probó con datos reales del backend
- ✅ Los mensajes de error/éxito funcionan correctamente
- ✅ La UI es responsive y se ve bien
- ✅ Se respetan las reglas de negocio
- ✅ Se validaron los permisos de usuario

---

**Última actualización**: 8 de enero de 2026  
**Responsable**: Equipo de Desarrollo Frontend  
**Estado**: 🚧 En Progreso
