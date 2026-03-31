# PlastiFlow — Especificaciones Completas de Aplicación
**Versión:** 1.0  
**Fecha:** Marzo 2026  
**Plataforma objetivo:** Web (navegador, responsive)  
**Idioma de la interfaz:** Español (México)

---

## 1. RESUMEN EJECUTIVO

PlastiFlow es una aplicación web de gestión de producción diseñada para fábricas de inyección de plásticos. Permite al usuario planificar órdenes de producción, administrar máquinas, moldes, clientes y materiales, visualizar estadísticas clave y gestionar perfiles portables exportables e importables. La filosofía de diseño prioriza la simplicidad de uso, la navegación intuitiva y los cálculos automáticos que minimizan el error humano.

---

## 2. ARQUITECTURA GENERAL

### 2.1 Tipo de Aplicación
- **Frontend-only** en la primera versión (sin backend propio)
- Todos los datos se almacenan en el navegador (localStorage / IndexedDB)
- Exportación e importación de perfiles en archivo `.plastiflow` (JSON estructurado)
- Arquitectura preparada para migración futura a nube (Supabase)

### 2.2 Stack Tecnológico Recomendado
- **Framework:** React + TypeScript
- **Estilos:** Tailwind CSS
- **Gráficas:** Recharts o Chart.js
- **Almacenamiento local:** IndexedDB (via Dexie.js)
- **Exportación:** JSON serializado + descarga de archivo
- **Nube (futuro):** Supabase (auth + base de datos)

### 2.3 Modularidad
Cada módulo es independiente y se puede acceder desde el menú principal. Los módulos son:
1. Dashboard (inicio)
2. Máquinas
3. Moldes
4. Clientes
5. Materiales
6. Órdenes de Producción
7. Estadísticas
8. Configuración y Perfiles

---

## 3. SISTEMA DE PERFILES

### 3.1 Definición
Un **perfil** es un contenedor completo que encapsula todos los datos de una fábrica específica: sus máquinas, moldes, clientes, materiales, órdenes y configuraciones. Un usuario puede tener múltiples perfiles.

### 3.2 Funciones del Sistema de Perfiles
- **Crear perfil nuevo** — nombre, logo opcional, descripción
- **Cambiar de perfil activo** — selector visible desde cualquier pantalla
- **Duplicar perfil** — copia completa para hacer variantes o respaldos
- **Exportar perfil** — genera archivo `.plastiflow` (JSON) descargable
- **Importar perfil** — carga un archivo `.plastiflow` y lo agrega a la lista
- **Eliminar perfil** — con confirmación obligatoria
- **Perfil de recuperación** — opción de marcar un perfil como "respaldo", con fecha de último guardado

### 3.3 Estructura del Archivo de Perfil (`.plastiflow`)
```json
{
  "version": "1.0",
  "perfil": {
    "id": "uuid",
    "nombre": "Fábrica Ejemplo S.A.",
    "fechaCreacion": "2026-01-01",
    "ultimaModificacion": "2026-03-01"
  },
  "maquinas": [...],
  "moldes": [...],
  "clientes": [...],
  "materiales": [...],
  "ordenes": [...],
  "configuracion": {...}
}
```

### 3.4 Preparación para Nube (Supabase — Fase 2)
- Botón "Conectar a la nube" en configuración
- Autenticación con correo/contraseña vía Supabase Auth
- Sincronización automática del perfil activo
- Acceso desde cualquier dispositivo con la misma cuenta
- Posibilidad de compartir un perfil de solo lectura con un enlace

---

## 4. MÓDULO: DASHBOARD (INICIO)

### 4.1 Propósito
Pantalla de inicio con navegación clara hacia todos los módulos. No es un panel de métricas complejo — es una hub de navegación limpia con indicadores de estado rápidos.

### 4.2 Elementos del Dashboard
- **Header:** Nombre del perfil activo + selector de perfil
- **Tarjetas de módulos:** Acceso rápido a Máquinas, Moldes, Clientes, Materiales, Órdenes, Estadísticas
- **Panel de alertas activas:** Lista compacta de alertas pendientes (ver módulo de alertas)
- **Resumen rápido:**
  - Número de órdenes activas
  - Órdenes con entrega en los próximos 7 días
  - Máquinas activas vs. total
  - Alertas críticas sin atender

### 4.3 Diseño Visual
- Layout de tarjetas/grid para navegación
- Colores neutros con acentos de color (no apagados)
- Modo oscuro y modo claro (toggle en header)
- Sin información redundante — cada dato aparece una sola vez

---

## 5. MÓDULO: MÁQUINAS

### 5.1 Listado de Máquinas
- Tabla/grid con todas las máquinas del perfil
- Columnas visibles: Identificador, Nombre, Estado, Operador, Tonelaje
- Filtro por estado (activa / en mantenimiento / inactiva)
- Botón "Nueva Máquina"

### 5.2 Datos por Máquina
| Campo | Tipo | Descripción |
|---|---|---|
| Nombre | Texto | Nombre descriptivo de la máquina |
| Identificador | Texto libre | Código personalizado (ej. M-01, INY-3) |
| Tonelaje / Fuerza de cierre | Número + unidad (ton) | Capacidad de la máquina |
| Tamaño máximo de molde | Número (mm o cm) | Dimensión máxima admisible |
| Operador asignado | Texto | Nombre del operador responsable |
| Horas de operación acumuladas | Número (hrs) | Actualizable manualmente |
| Estado actual | Selector | Activa / En mantenimiento / Inactiva |
| Notas | Texto largo | Observaciones adicionales |

### 5.3 Vista de Detalle de Máquina
- Todos los datos del formulario
- Lista de órdenes de producción asociadas (activas e historial)
- Moldes compatibles (calculado automáticamente por dimensiones)

---

## 6. MÓDULO: MOLDES

### 6.1 Listado de Moldes
- Tabla/grid con todos los moldes del perfil
- Columnas visibles: Identificador, Nombre, Producto, Estado, Material compatible
- Botón "Nuevo Molde"

### 6.2 Datos por Molde
| Campo | Tipo | Descripción |
|---|---|---|
| Nombre | Texto | Nombre descriptivo del molde |
| Identificador | Texto libre | Código personalizado (ej. MOL-07) |
| Número de cavidades | Número entero | Piezas producidas por disparo |
| Dimensiones del molde | Ancho x Alto x Profundidad (mm) | Para validar compatibilidad con máquinas |
| Producto(s) que produce | Texto / lista | Nombre del producto o piezas que genera |
| Material compatible | Selector múltiple | Vinculado al catálogo de materiales |
| Tiempo de ciclo promedio | Número (segundos) | Duración por disparo |
| Peso por disparo | Número (gramos) | Peso total de material por ciclo |
| Notas | Texto largo | Observaciones adicionales |

### 6.3 Cálculos Automáticos del Molde
Con los datos anteriores, la app calcula:
- **Piezas por hora:** `(3600 / tiempo_de_ciclo) × número_de_cavidades`
- **Material por hora (kg):** `(3600 / tiempo_de_ciclo) × peso_por_disparo / 1000`
- **Material por hora con merma:** `material_por_hora × (1 + merma_del_material / 100)`

---

## 7. MÓDULO: MATERIALES

### 7.1 Catálogo de Materiales
- Lista de materiales usados en la fábrica
- Cada material es reutilizable y referenciable en moldes y órdenes

### 7.2 Datos por Material
| Campo | Tipo | Descripción |
|---|---|---|
| Nombre | Texto | Ej. PP, HDPE, ABS, PVC |
| Identificador | Texto libre | Código interno |
| Merma estándar | Número (%) | Porcentaje de desperdicio típico del material |
| Inventario actual | Número (kg) | Stock disponible actualmente |
| Punto de reorden | Número (kg) | Cantidad mínima antes de generar alerta |
| Notas | Texto | Proveedor, características, etc. |

### 7.3 Función de la Merma
La merma se aplica automáticamente en todos los cálculos de consumo de material de las órdenes de producción. La fórmula es:
```
Material real necesario = Material teórico × (1 + merma% / 100)
```

---

## 8. MÓDULO: CLIENTES

### 8.1 Listado de Clientes
- Tabla simple con todos los clientes del perfil
- Botón "Nuevo Cliente"

### 8.2 Datos por Cliente
| Campo | Tipo | Descripción |
|---|---|---|
| Nombre / Empresa | Texto | Nombre del cliente o razón social |
| Identificador | Texto libre | Código interno opcional |
| Notas | Texto largo | Cualquier observación relevante |

### 8.3 Vista de Detalle de Cliente
- Listado de todas las órdenes asociadas al cliente
- Historial de pedidos completados
- Órdenes activas pendientes

---

## 9. MÓDULO: ÓRDENES DE PRODUCCIÓN

### 9.1 Listado de Órdenes
- Vista principal con todas las órdenes
- Filtros por: Estado, Prioridad, Cliente, Máquina, Fechas
- Indicador visual de estado por color (ver estados)
- Botón "Nueva Orden"

### 9.2 Datos de una Orden de Producción
| Campo | Tipo | Descripción |
|---|---|---|
| Folio / ID | Auto-generado | Identificador único correlativo |
| Cliente | Selector | Vinculado al módulo de clientes |
| Producto / Descripción | Texto | Nombre del producto a fabricar |
| Cantidad requerida | Número (piezas) | Total de piezas a producir |
| Molde asignado | Selector | Vinculado al módulo de moldes |
| Máquina asignada | Selector | Vinculado al módulo de máquinas |
| Material requerido | Selector | Vinculado al catálogo de materiales |
| Fecha de inicio | Fecha | Cuándo comienza la producción |
| Fecha de entrega | Fecha | Fecha límite de entrega al cliente |
| Prioridad | Selector | Alta / Media / Baja |
| Tipo de orden | Selector | Recurrente / Único |
| Frecuencia (si es recurrente) | Selector | Semanal / Quincenal / Mensual / Personalizado |
| Estado | Selector | Pendiente / En producción / Listo / Entregado |
| Notas internas | Texto largo | Comentarios del equipo |

### 9.3 Cálculos Automáticos de la Orden
Al asignar molde, máquina, material y cantidad, la app calcula automáticamente:

| Cálculo | Fórmula |
|---|---|
| Tiempo estimado de producción | `cantidad / (piezas_por_hora_del_molde)` → resultado en horas |
| Material neto requerido | `(cantidad / cavidades) × peso_por_disparo / 1000` → kg |
| Material con merma | `material_neto × (1 + merma% / 100)` → kg |
| Fecha estimada de finalización | `fecha_inicio + tiempo_estimado` |
| Holgura vs. fecha de entrega | `fecha_entrega − fecha_estimada_de_finalización` → días de margen |
| Estado de la proyección | Verde (holgura > 2 días) / Amarillo (0–2 días) / Rojo (proyección excede la entrega) |

### 9.4 Estados de una Orden
| Estado | Color | Descripción |
|---|---|---|
| Pendiente | Gris | Orden registrada, aún no iniciada |
| En producción | Azul | Actualmente fabricándose |
| Listo | Verde | Producción terminada, por entregar |
| Entregado | Verde oscuro | Entregado al cliente |
| Con riesgo | Naranja/Rojo | Proyección indica que no llegará a tiempo |

---

## 10. MÓDULO: ALERTAS

### 10.1 Tipos de Alertas
La app genera alertas automáticas basadas en los datos registrados.

#### Alerta 1 — Entrega Próxima
- **Trigger:** Una orden tiene fecha de entrega en los próximos N días (configurable, default: 3 días)
- **Mensaje:** "La orden #[folio] para [cliente] vence en [N] días"
- **Prioridad:** Alta si es < 1 día, Media si es 1–3 días

#### Alerta 2 — Proyección Ajustada
- **Trigger:** La fecha estimada de finalización calculada automáticamente está demasiado cerca o excede la fecha de entrega
- **Niveles:**
  - Naranja: margen < 2 días
  - Rojo: la proyección supera la fecha de entrega
- **Mensaje:** "La orden #[folio] podría no estar lista a tiempo. Margen: [X] días / Retraso estimado: [X] días"

#### Alerta 3 — Inventario Bajo en Pedido Recurrente
- **Trigger:** Una orden marcada como "Recurrente" tiene un material cuyo inventario actual está por debajo del punto de reorden definido en el catálogo de materiales
- **Mensaje:** "El material [nombre] está por debajo del mínimo ([actual]kg / mínimo [punto_reorden]kg). Afecta la orden recurrente #[folio]"

### 10.2 Panel de Alertas
- Visible desde el Dashboard con contador de alertas activas
- Lista completa accesible en sección "Alertas" o ícono en el header
- Las alertas se pueden marcar como "vistas" (no desaparecen, solo se marcan)
- Filtro por tipo de alerta y por módulo origen

---

## 11. MÓDULO: ESTADÍSTICAS Y REPORTES

### 11.1 Reporte: Producción por Máquina
- Horas activas por máquina en un rango de fechas
- Número de órdenes completadas por máquina
- Indicador de eficiencia: horas produciendo vs. horas disponibles (calculado por órdenes completadas)

### 11.2 Reporte: Producción por Producto / Molde
- Total de piezas producidas por molde en un periodo
- Promedio de tiempo de ciclo real vs. estimado (si se registra avance manual)
- Órdenes completadas vs. en proceso por molde

### 11.3 Reporte: Consumo de Material por Periodo
- Kilogramos consumidos por material en un rango de fechas
- Desglose por orden
- Comparación consumo teórico vs. consumo con merma
- Alertas históricas de inventario bajo

### 11.4 Reporte: Proyección de Carga de Trabajo
- Vista de próximas 4 semanas con órdenes planificadas
- Visualización tipo timeline/Gantt simplificado
- Indicador de conflictos: si dos órdenes usan la misma máquina en el mismo periodo
- Horas comprometidas por máquina en el periodo siguiente

### 11.5 Filtros Globales de Estadísticas
- Rango de fechas personalizable
- Filtro por cliente, máquina, molde, material
- Exportar reporte como CSV o imagen (PNG)

---

## 12. MÓDULO: CONFIGURACIÓN

### 12.1 Configuración General del Perfil
- Nombre del perfil
- Modo visual: oscuro / claro
- Zona horaria
- Moneda (para futuros costos — preparado pero no implementado en v1)

### 12.2 Configuración de Alertas
- Días de anticipación para alerta de entrega próxima (default: 3)
- Toggle para activar/desactivar cada tipo de alerta individualmente

### 12.3 Gestión de Perfiles
- Listado de todos los perfiles guardados localmente
- Crear, duplicar, exportar, importar, eliminar perfiles
- Botón "Exportar todo" — genera un ZIP con todos los perfiles
- Sección "Conectar a la nube" (placeholder en v1, funcional en v2)

---

## 13. NAVEGACIÓN Y UX

### 13.1 Estructura de Navegación
```
Header
├── Logo / Nombre del perfil
├── Selector de perfil activo
├── Ícono de alertas (con contador)
└── Toggle modo oscuro/claro

Sidebar o menú principal
├── Dashboard
├── Órdenes de Producción
├── Máquinas
├── Moldes
├── Materiales
├── Clientes
├── Estadísticas
└── Configuración
```

### 13.2 Principios de UX
- Cada módulo tiene una vista de lista y una vista de detalle/formulario
- Los formularios tienen validación en tiempo real
- Los cálculos automáticos se muestran en tiempo real mientras se llena la orden
- Ningún dato crítico se elimina sin confirmación de dos pasos
- Los campos vinculados (molde → máquina compatible) muestran sugerencias o filtros automáticos
- El estado de las órdenes se puede cambiar con un click desde la lista (sin entrar al detalle)

### 13.3 Indicadores Visuales
- Chips de color para el estado de cada orden
- Barra de progreso de holgura en la vista de detalle de órdenes
- Íconos de alerta en filas de la tabla cuando hay alertas activas asociadas
- Modo de color: colores neutros con acentos funcionales (azul, verde, naranja, rojo) — no decorativos

---

## 14. REGLAS DE NEGOCIO Y CÁLCULOS CLAVE

### 14.1 Compatibilidad Máquina-Molde
Un molde es compatible con una máquina si:
- `dimensión_máxima_del_molde ≤ tamaño_máximo_de_molde_de_la_máquina`
- No hay restricción de tonelaje implementada en v1 (campo informativo)

### 14.2 Piezas por Hora
```
piezas_por_hora = floor(3600 / tiempo_ciclo_segundos) × número_de_cavidades
```

### 14.3 Tiempo Estimado de Producción
```
horas_necesarias = cantidad_piezas / piezas_por_hora
```

### 14.4 Material Requerido (con merma)
```
disparos_necesarios = ceil(cantidad_piezas / número_de_cavidades)
material_neto_kg = disparos_necesarios × peso_por_disparo_g / 1000
material_real_kg = material_neto_kg × (1 + merma% / 100)
```

### 14.5 Proyección de Entrega
```
fecha_estimada_fin = fecha_inicio + ceil(horas_necesarias) horas laborales
margen_días = fecha_entrega − fecha_estimada_fin
```
- Si `margen_días > 2` → Verde ✅
- Si `0 ≤ margen_días ≤ 2` → Amarillo ⚠️
- Si `margen_días < 0` → Rojo 🔴 + generar alerta automática

---

## 15. FASES DE DESARROLLO

### Fase 1 — MVP (versión inicial)
- [ ] Sistema de perfiles locales (crear, exportar, importar)
- [ ] CRUD completo: Máquinas, Moldes, Materiales, Clientes
- [ ] CRUD de Órdenes de Producción con cálculos automáticos
- [ ] Sistema de alertas (los 3 tipos)
- [ ] Dashboard con navegación y panel de alertas
- [ ] Modo oscuro / claro

### Fase 2 — Estadísticas y Reportes
- [ ] Los 4 reportes definidos
- [ ] Exportación de reportes (CSV / PNG)
- [ ] Vista de proyección de carga (Gantt simplificado)

### Fase 3 — Nube
- [ ] Integración con Supabase
- [ ] Autenticación (correo/contraseña)
- [ ] Sincronización de perfiles
- [ ] Compartir perfil de solo lectura

---

## 16. CONSIDERACIONES TÉCNICAS PARA EL EQUIPO DE DESARROLLO

- **No usar `<form>` HTML nativo** — usar manejadores React (onClick, onChange)
- **Persistencia:** Usar IndexedDB (Dexie.js) para datos locales; localStorage solo para preferencias de UI
- **IDs:** Usar UUID v4 para todos los registros
- **Fechas:** Almacenar en formato ISO 8601 (`YYYY-MM-DD`); mostrar en formato local `DD/MM/YYYY`
- **Números:** Usar punto decimal internamente; mostrar con separadores de miles en la UI
- **Exportación de perfiles:** Serializar a JSON, ofrecer descarga con `Blob` y `URL.createObjectURL`
- **Importación:** Validar estructura del archivo antes de cargar; mostrar errores amigables
- **Cálculos:** Centralizar todas las fórmulas en un módulo `/utils/calculos.ts` para facilitar mantenimiento
- **Alertas:** Calcular en tiempo real al cargar la app y al modificar cualquier orden o inventario
- **Responsive:** La app debe funcionar en escritorio y tablet; móvil es secundario en v1

---

*Documento generado con PlastiFlow Spec Builder — Marzo 2026*
