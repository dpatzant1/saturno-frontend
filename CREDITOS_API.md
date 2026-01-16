# API de Créditos - Frontend

## 📋 Funciones Implementadas

### `getCreditos(params)`
Obtiene lista de créditos con filtros opcionales.

**Uso:**
```javascript
import { getCreditos } from '@/services/api'

// Todos los créditos
const creditos = await getCreditos()

// Con filtros
const creditosFiltrados = await getCreditos({
  id_cliente: 'uuid-del-cliente',
  estado: 'ACTIVO', // ACTIVO, VENCIDO, PAGADO
  fecha_desde: '2026-01-01',
  fecha_hasta: '2026-01-31',
  limite: 50,
  offset: 0
})
```

**Retorna:** Array de créditos con datos extraídos del backend

---

### `getCredito(id)`
Obtiene un crédito específico por su ID.

**Uso:**
```javascript
const credito = await getCredito('uuid-del-credito')
```

**Retorna:** Objeto con datos del crédito

---

### `getCreditosActivos()`
Obtiene todos los créditos en estado ACTIVO.

**Uso:**
```javascript
const activos = await getCreditosActivos()
```

**Backend:** `GET /api/creditos/activos`

---

### `getCreditosVencidos()`
Obtiene todos los créditos en estado VENCIDO.

**Uso:**
```javascript
const vencidos = await getCreditosVencidos()
```

**Backend:** `GET /api/creditos/vencidos`

---

### `getCreditosPagados()`
Obtiene todos los créditos en estado PAGADO.

**Uso:**
```javascript
const pagados = await getCreditosPagados()
```

**Backend:** `GET /api/creditos?estado=PAGADO`

---

### `getCreditosPorCliente(idCliente)`
Obtiene todos los créditos de un cliente específico.

**Uso:**
```javascript
const creditosCliente = await getCreditosPorCliente('uuid-del-cliente')
```

**Backend:** `GET /api/creditos/cliente/:id_cliente`

---

### `getHistorialPagos(idCredito)`
Obtiene el historial de pagos de un crédito.

**Uso:**
```javascript
const pagos = await getHistorialPagos('uuid-del-credito')
```

**Backend:** `GET /api/creditos/:id/pagos`

**Retorna:** Array de pagos con:
- `monto_pagado`
- `metodo_pago`
- `fecha_pago`
- `notas`
- `saldo_despues_pago`
- `usuario` (quien registró el pago)

---

### `createPago(creditoId, pagoData)`
Registra un pago para un crédito.

**Uso:**
```javascript
const pago = await createPago('uuid-del-credito', {
  monto_pagado: 500.00,
  metodo_pago: 'EFECTIVO', // EFECTIVO, TARJETA, TRANSFERENCIA
  notas: 'Pago parcial del mes de enero'
})
```

**Backend:** `POST /api/creditos/:id/pagar`

**Validaciones:**
- `monto_pagado` debe ser > 0
- `monto_pagado` no puede exceder el saldo pendiente
- El crédito se marca como PAGADO automáticamente si el saldo queda en 0

---

## 🔄 Manejo de Errores

Todas las funciones lanzan errores descriptivos:

```javascript
try {
  const creditos = await getCreditos()
} catch (error) {
  console.error(error.message) // "Error al obtener créditos"
}
```

Los mensajes de error vienen del backend y son específicos a cada caso.

---

## 📊 Estructura de Datos

### Crédito
```javascript
{
  id_credito: "uuid",
  id_cliente: "uuid",
  id_venta: "uuid",
  monto_total: 1500.00,
  saldo_pendiente: 750.00,
  estado: "ACTIVO", // ACTIVO, VENCIDO, PAGADO
  fecha_inicio: "2026-01-01",
  fecha_vencimiento: "2026-02-01",
  dias_credito: 30,
  created_at: "2026-01-01T10:00:00Z",
  
  // Relaciones
  clientes: {
    nombre: "Juan",
    apellido: "Pérez",
    telefono: "12345678",
    ...
  },
  ventas: {
    total: 1500.00,
    tipo_venta: "CREDITO",
    ...
  }
}
```

### Pago
```javascript
{
  id_pago: "uuid",
  id_credito: "uuid",
  monto_pagado: 500.00,
  metodo_pago: "EFECTIVO",
  fecha_pago: "2026-01-15T14:30:00Z",
  notas: "Pago parcial",
  saldo_despues_pago: 1000.00,
  id_usuario: "uuid",
  
  // Relación
  usuarios: {
    nombre: "Admin",
    ...
  }
}
```

---

## ✅ Integración con `extraerDatos()`

Todas las funciones usan el helper `extraerDatos()` que:
1. Extrae automáticamente `response.data.data`
2. Maneja respuestas del backend de forma consistente
3. Retorna arrays vacíos `[]` si no hay datos

---

## 🔐 Autenticación

Todas las llamadas requieren token JWT que se agrega automáticamente mediante interceptor de axios.

El token se obtiene de `localStorage` → `auth-storage` → `state.token`

---

## 📝 Notas Importantes

1. **Estados de Crédito:** ACTIVO, VENCIDO, PAGADO
2. **Métodos de Pago:** EFECTIVO, TARJETA, TRANSFERENCIA
3. Los créditos se crean automáticamente al hacer ventas a CRÉDITO
4. Solo ADMINISTRADOR puede registrar pagos
5. El backend actualiza automáticamente el estado a VENCIDO cuando pasa la fecha
6. El backend actualiza automáticamente el estado a PAGADO cuando saldo = 0

---

**Fecha de implementación:** 10 de enero de 2026  
**Versión:** 1.0
