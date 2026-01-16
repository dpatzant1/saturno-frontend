# Implementación de Descuentos en el Frontend

## 📋 Resumen
Se ha implementado completamente la funcionalidad de descuentos en el módulo de ventas del frontend. Ahora los usuarios pueden aplicar descuentos por porcentaje o monto fijo al registrar una venta.

---

## ✨ Funcionalidades Implementadas

### 1. **Estados de Descuento**
Se agregaron dos nuevos estados para manejar los descuentos:

```javascript
const [descuentoTipo, setDescuentoTipo] = useState('NINGUNO') // NINGUNO, PORCENTAJE, MONTO
const [descuentoValor, setDescuentoValor] = useState(0)
```

### 2. **Funciones de Cálculo**

#### `calcularDescuento()`
Calcula el monto del descuento basado en el tipo y valor:
- **NINGUNO**: Retorna 0
- **PORCENTAJE**: Calcula `(subtotal * valor) / 100`
- **MONTO**: Retorna el valor directamente

#### `calcularTotalConDescuento()`
Calcula el total final: `subtotal - descuento`

### 3. **UI de Descuentos en el Modal de Ventas**

Se agregó una sección completa de descuentos entre la tabla de productos y el total:

#### **Selector de Tipo de Descuento**
- 3 botones con estilos distintos:
  - **Sin Descuento** (gris)
  - **Porcentaje %** (azul)
  - **Monto Fijo Q** (verde)

#### **Input de Valor**
- Campo numérico con validaciones:
  - Porcentaje: máximo 100%
  - Monto: máximo igual al subtotal
- Muestra el símbolo correcto (% o Q)
- Feedback visual del descuento calculado

#### **Resumen de Totales**
```
Subtotal:        Q1,500.00
Descuento (10%): -Q150.00
─────────────────────────
TOTAL A PAGAR:   Q1,350.00
```

### 4. **Validaciones**

Se agregaron validaciones antes de enviar la venta:

```javascript
// Validación de porcentaje
if (descuentoTipo === 'PORCENTAJE' && descuentoValor > 100) {
  mostrarToast('El descuento por porcentaje no puede ser mayor a 100%.', 'error')
  return
}

// Validación de monto
if (descuentoTipo === 'MONTO' && descuentoValor > calcularTotalVenta()) {
  mostrarToast('El descuento en monto no puede ser mayor al subtotal.', 'error')
  return
}
```

### 5. **Integración con Backend**

El objeto de descuento se envía al backend solo si aplica:

```javascript
const descuento = descuentoTipo !== 'NINGUNO' && descuentoValor > 0 ? {
  tipo: descuentoTipo,
  valor: descuentoValor
} : undefined

// Para ventas CONTADO
const ventaData = {
  id_cliente: formVenta.id_cliente,
  productos: productos
}
if (descuento) {
  ventaData.descuento = descuento
}

// Para ventas CREDITO
const ventaData = {
  id_cliente: formVenta.id_cliente,
  dias_credito: formVenta.dias_credito,
  productos: productos
}
if (descuento) {
  ventaData.descuento = descuento
}
```

### 6. **Actualización de PDFs**

El PDF ahora muestra el desglose completo con descuentos:

```
PRODUCTO    CANTIDAD    PRECIO      TOTAL
Mesa          2        Q500.00    Q1,000.00
Silla         5        Q100.00    Q500.00
─────────────────────────────────────────

Subtotal:                        Q1,500.00
Descuento (10%):                   -Q150.00
═════════════════════════════════════════
Total                            Q1,350.00
```

**Características del PDF:**
- Muestra subtotal antes del total
- Línea de descuento con tipo y valor (si aplica)
- Total con fondo negro destacado
- Adapta el espaciado según haya o no descuento

### 7. **Vista de Venta Registrada**

Después de registrar una venta con descuento, se muestra:

```
┌────────────────────────────────────┐
│ Venta Exitosa                      │
│ ID: #abc12345                      │
│                                    │
│ Subtotal              Q1,500.00   │
│ Descuento (10%):      -Q150.00    │
│                                    │
│ Total                 Q1,350.00   │
└────────────────────────────────────┘
```

### 8. **Modal de Detalle de Venta**

El modal de detalle también muestra el desglose:

```
┌────────────────────────────────────┐
│ Total de la Venta                  │
│                                    │
│ Subtotal:            Q1,500.00    │
│ Descuento (10%):     -Q150.00     │
│ Total:               Q1,350.00    │
└────────────────────────────────────┘
```

---

## 🎨 Diseño Visual

### Colores y Estilos
- **Sin Descuento**: `border-gray-500 bg-gray-100 text-gray-800`
- **Porcentaje**: `border-blue-500 bg-blue-50 text-blue-700`
- **Monto**: `border-green-500 bg-green-50 text-green-700`
- **Descuento en resumen**: `text-red-600` (negativo)

### Responsive
- Grid de 3 columnas para los botones de tipo
- Se adapta en dispositivos móviles
- Inputs con focus ring en color carpintería

---

## 🔄 Flujo de Usuario

1. Usuario agrega productos al carrito
2. Ve el subtotal calculado
3. Selecciona tipo de descuento (opcional)
4. Ingresa el valor del descuento
5. Ve en tiempo real el descuento calculado
6. Ve el total final con descuento aplicado
7. Registra la venta
8. Ve confirmación con desglose completo
9. Puede generar PDF con información detallada

---

## ✅ Validaciones Implementadas

1. **Porcentaje no mayor a 100%**
   - Validación en input con `max="100"`
   - Validación antes de enviar

2. **Monto no mayor al subtotal**
   - Validación en input con `max={calcularTotalVenta()}`
   - Validación antes de enviar
   - Mensaje de error visual

3. **Crédito disponible con descuento**
   - Valida límite de crédito usando `calcularTotalConDescuento()`
   - Evita que se creen ventas a crédito que excedan el límite

4. **Limpieza de estados**
   - Al abrir modal: descuento NINGUNO, valor 0
   - Al cerrar modal: descuento NINGUNO, valor 0
   - Al crear nueva venta: descuento NINGUNO, valor 0

---

## 🔌 Integración con Backend

El backend espera recibir:

```json
{
  "id_cliente": "uuid",
  "tipo_venta": "CONTADO",
  "productos": [...],
  "descuento": {
    "tipo": "PORCENTAJE",
    "valor": 10
  }
}
```

El backend retorna:

```json
{
  "venta": {
    "id_venta": "uuid",
    "subtotal": 1500.00,
    "descuento_tipo": "PORCENTAJE",
    "descuento_valor": 10,
    "descuento_monto": 150.00,
    "total": 1350.00,
    ...
  }
}
```

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Sin Descuento
```
Productos: Q1,500.00
Descuento: NINGUNO
Total: Q1,500.00
```

### Ejemplo 2: Descuento por Porcentaje
```
Productos: Q1,500.00
Descuento: 10%
Monto del descuento: Q150.00
Total: Q1,350.00
```

### Ejemplo 3: Descuento por Monto Fijo
```
Productos: Q1,500.00
Descuento: Q200.00
Total: Q1,300.00
```

---

## 🚀 Archivos Modificados

- **`frontcarpinteria/src/pages/Ventas.jsx`**
  - Estados de descuento
  - Funciones de cálculo
  - UI de descuentos
  - Validaciones
  - Integración con API
  - Actualización de PDFs
  - Vista de venta registrada
  - Modal de detalle

---

## ✨ Mejoras Visuales

1. **Feedback en tiempo real**: El usuario ve el descuento calculado mientras escribe
2. **Colores diferenciados**: Cada tipo de descuento tiene su propio color
3. **Validación visual**: Mensajes de error en rojo debajo del input
4. **Totales claros**: Desglose visible de Subtotal → Descuento → Total
5. **PDFs profesionales**: Información completa y bien formateada

---

## 🎯 Estado Final

✅ Frontend completamente implementado
✅ Backend ya implementado previamente
✅ Sin errores de sintaxis
✅ Validaciones completas
✅ UI intuitiva y clara
✅ PDFs actualizados
✅ Todo nítido y profesional

---

## 📚 Documentación Relacionada

- [DESCUENTOS_API.md](../../carpinteria-backend/DESCUENTOS_API.md) - Documentación del backend
- Backend listo en: `carpinteria-backend/src/services/ventasService.js`
- Backend repository: `carpinteria-backend/src/repositories/ventasRepository.js`
