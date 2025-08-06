# Sistema de Optimización de Base de Datos

## Descripción

Suite completa de herramientas para análisis, optimización y mantenimiento de índices en la base de datos MongoDB del Sistema de Gestión de Transporte.

## Archivos del Sistema

### Scripts Principales

| Archivo | Descripción | Uso |
|---------|-------------|-----|
| `database-optimization-suite.js` | **Script principal** - Orquesta todo el proceso | `node database-optimization-suite.js [opciones]` |
| `analyze-indexes.js` | Análisis detallado del estado actual | Solo análisis, sin modificaciones |
| `validate-before-optimization.js` | Validación previa de seguridad | Verifica que el sistema esté listo |
| `optimize-database-indexes.js` | Implementa las optimizaciones | Crea/elimina índices según recomendaciones |
| `rollback-index-optimization.js` | Rollback de emergencia | Revierte cambios en caso de problemas |
| `database-index-analysis-report.js` | Reporte detallado de recomendaciones | Genera análisis completo |

### Scripts de Soporte

| Archivo | Descripción |
|---------|-------------|
| `test-db-connection.js` | Prueba de conectividad |
| `README-DATABASE-OPTIMIZATION.md` | Esta documentación |

## Uso Rápido

### 1. Proceso Completo (Recomendado)
```bash
# Ejecuta: análisis → validación → optimización → verificación
node database-optimization-suite.js --all
```

### 2. Pasos Individuales
```bash
# Solo análisis
node database-optimization-suite.js --analyze

# Solo validación
node database-optimization-suite.js --validate

# Solo optimización (requiere validación previa exitosa)
node database-optimization-suite.js --optimize

# Solo verificación post-optimización
node database-optimization-suite.js --verify
```

### 3. Rollback de Emergencia
```bash
# Crear backup preventivo
node rollback-index-optimization.js --backup-only

# Rollback completo (requiere confirmación)
node rollback-index-optimization.js --confirm
```

## Estado Actual de la Base de Datos

### Colecciones y Documentos
- **clientes**: 2 documentos, 2 índices
- **sites**: 58 documentos, 5 índices
- **tramos**: 279 documentos, 3 índices
- **viajes**: 23 documentos, 7 índices
- **vehiculos**: 27 documentos, 6 índices
- **empresas**: 2 documentos, 4 índices
- **personals**: 24 documentos, 6 índices

### Tamaño Total
- **Datos**: 0.25 MB
- **Índices**: 1.74 MB
- **Total**: 424 documentos, 52 índices

## Optimizaciones Implementadas

### 1. Sites
- ✅ `idx_sites_cliente_activo_nombre`: `{ cliente: 1, activo: 1, nombre: 1 }`
- ✅ `idx_sites_activo_location`: `{ activo: 1, location: '2dsphere' }`

### 2. Tramos
- ✅ `idx_tramos_activo_cliente_ruta`: `{ activo: 1, cliente: 1, origen: 1, destino: 1 }`
- ✅ `idx_tramos_tarifas_vigentes`: `{ activo: 1, 'tarifasHistoricas.vigente': 1, 'tarifasHistoricas.tipo': 1 }`

### 3. Viajes
- ✅ `idx_viajes_dashboard`: `{ cliente: 1, estado: 1, fecha: -1 }`
- ✅ `idx_viajes_ruta_fecha`: `{ origen: 1, destino: 1, fecha: -1 }`
- 🗑️ Eliminados: `origen_1`, `destino_1` (redundantes)

### 4. Vehículos
- ✅ `idx_vehiculos_activo_empresa`: `{ activo: 1, empresa: 1, dominio: 1 }`
- ✅ `idx_vehiculos_alertas_seguro`: `{ activo: 1, 'documentacion.seguro.vencimiento': 1 }`
- ✅ `idx_vehiculos_alertas_vtv`: `{ activo: 1, 'documentacion.vtv.vencimiento': 1 }`

### 5. Personal
- ✅ `idx_personal_activo_empresa_cargo`: `{ activo: 1, empresa: 1, cargo: 1 }`
- ✅ `idx_personal_alertas_licencia`: `{ activo: 1, 'documentacion.licenciaConducir.vencimiento': 1 }`

### 6. Clientes
- ✅ `idx_clientes_activo_nombre`: `{ activo: 1, nombre: 1 }`

## Impacto Esperado

### Mejoras de Rendimiento
- 📈 **60-80% reducción** en tiempo de consultas frecuentes
- 🚀 **Mejora significativa** en dashboard y reportes
- 🗺️ **Optimización** de queries geoespaciales
- ⚡ **Reducción de CPU** en operaciones de búsqueda

### Casos de Uso Optimizados
1. **Búsquedas de sites activos por cliente**
2. **Consultas del dashboard por estado y fecha**
3. **Filtros geoespaciales con sites activos**
4. **Alertas de vencimientos de documentación**
5. **Listados de personal por empresa y cargo**

## Seguridad y Rollback

### Backup Automático
- Se crea automáticamente antes de cualquier modificación
- Archivo: `scripts/index-backup.json`
- Incluye toda la información necesaria para rollback completo

### Procedimiento de Rollback
```bash
# Verificar backup existente
ls -la scripts/index-backup.json

# Ejecutar rollback (requiere confirmación)
node rollback-index-optimization.js --confirm
```

### Validaciones de Seguridad
- ✅ Conectividad a base de datos
- ✅ Salud de colecciones críticas
- ✅ Espacio disponible
- ✅ Estado de replicación
- ✅ Conexiones activas

## Monitoreo Post-Optimización

### Métricas a Observar
1. **Tiempo de respuesta** de queries frecuentes
2. **Uso de CPU** del servidor MongoDB
3. **Logs de aplicación** para errores relacionados
4. **Rendimiento del dashboard** web

### Queries de Prueba
```javascript
// Sites activos por cliente
db.sites.find({ cliente: ObjectId("..."), activo: true }).explain("executionStats")

// Viajes por estado y fecha
db.viajes.find({ cliente: ObjectId("..."), estado: "completado" }).sort({ fecha: -1 }).explain("executionStats")

// Alertas de vencimientos
db.vehiculos.find({ activo: true, "documentacion.seguro.vencimiento": { $lt: new Date() } }).explain("executionStats")
```

## Mantenimiento Continuo

### Frecuencia Recomendada
- **Análisis completo**: Mensual
- **Validación de salud**: Semanal
- **Monitoreo de rendimiento**: Diario

### Procedimiento de Mantenimiento
```bash
# 1. Análisis mensual
node database-optimization-suite.js --analyze

# 2. Backup preventivo
node rollback-index-optimization.js --backup-only

# 3. Validación de salud
node database-optimization-suite.js --validate
```

## Troubleshooting

### Problemas Comunes

#### Error de Conexión
```bash
# Verificar variables de entorno
echo $MONGODB_URI
echo $DB_PASSWORD

# Probar conexión directa
node scripts/test-db-connection.js
```

#### Índice Ya Existe
- El script detecta automáticamente índices existentes
- No intenta crear duplicados
- Logs muestran estado de cada operación

#### Rollback Fallido
```bash
# Verificar backup
cat scripts/index-backup.json

# Rollback manual por colección
node -e "
const rollback = require('./rollback-index-optimization.js');
// Implementar rollback selectivo si es necesario
"
```

### Logs y Debugging

#### Habilitar Logs Detallados
```bash
# Variable de entorno para logs verbosos
DEBUG=mongoose:* node database-optimization-suite.js --analyze
```

#### Verificar Estado MongoDB
```bash
# Desde mongo shell o Compass
db.runCommand({ serverStatus: 1 })
db.stats()
```

## Contacto y Soporte

Para problemas críticos o dudas técnicas:
1. Revisar logs detallados en consola
2. Verificar estado de la base de datos
3. Consultar documentación de MongoDB
4. Contactar administrador de sistemas

---

**⚠️ IMPORTANTE**: Siempre ejecutar en horario de baja actividad para sistemas de producción. Crear backups antes de modificaciones importantes.