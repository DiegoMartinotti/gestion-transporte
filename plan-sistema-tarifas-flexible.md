# Plan de Implementación: Sistema de Tarifas Flexible

## 1. [ ] Análisis y Preparación de Datos Existentes

### Objetivo

Mapear y documentar todas las configuraciones de tarifas actuales para garantizar una migración sin pérdida de datos.

### Acciones Detalladas

- **Auditoría de datos**: Ejecutar queries en MongoDB para identificar:
  - Todos los métodos de cálculo únicos en uso
  - Clientes con fórmulas personalizadas (formulaPaletSider/Bitren)
  - Tarifas históricas con configuraciones especiales
  - Casos edge o anomalías en los datos

- **Documentación**: Crear un archivo `migration-analysis.md` con:
  - Estadísticas de uso por método de cálculo
  - Lista de fórmulas personalizadas activas
  - Identificación de patrones de uso por cliente

## 2. [ ] Diseño del Modelo de Configuración de Cálculo

### Objetivo

Crear un nuevo modelo que permita definir cómo se calculan las tarifas de manera flexible y con vigencia temporal.

### Modelo Propuesto

```typescript
// backend/models/ConfiguracionCalculo.ts
interface IConfiguracionCalculo {
  clienteId: ObjectId;
  nombre: string; // "Cálculo por Km estándar", "Fórmula escalonada", etc.
  modalidadCalculo: string; // "PorKm", "PorPallet", "Fijo", "Formula_Escalonada"
  metodoBase: 'Kilometro' | 'Palet' | 'Fijo' | 'Personalizado';
  formula?: string; // Fórmula matemática si aplica
  parametros?: {
    // Parámetros específicos del método
    rangosPallet?: Array<{ desde: number; hasta: number; valor: number }>;
    multiplicadores?: Record<string, number>;
    variables?: string[]; // Variables que necesita la fórmula
  };
  descripcion?: string;
  activo: boolean;
  vigenciaDesde: Date;
  vigenciaHasta?: Date;
}
```

### Integración con FormulasPersonalizadasCliente

- Evaluar si mantener ambos modelos o unificarlos
- FormulasPersonalizadasCliente podría ser un caso específico de ConfiguracionCalculo
- Migrar datos existentes al nuevo modelo

## 3. [ ] Actualización del Modelo Tramo

### Objetivo

Extender el modelo de tarifas históricas para soportar múltiples modalidades de cálculo simultáneas.

### Cambios en ITarifaHistorica

```typescript
interface ITarifaHistorica {
  _id: Types.ObjectId;
  tipo: 'TRMC' | 'TRMI';
  modalidadCalculo: string; // Nueva: identificador único de la modalidad
  metodoCalculo: 'Kilometro' | 'Palet' | 'Fijo' | 'Personalizado';
  configuracionCalculoId?: Types.ObjectId; // Referencia opcional
  valor: number;
  valorPeaje: number;
  descripcion?: string; // Para diferenciar entre modalidades
  prioridad?: number; // Para ordenar opciones cuando hay múltiples
  vigenciaDesde: Date;
  vigenciaHasta: Date;
}
```

### Validaciones

- Permitir múltiples tarifas con mismo tipo y período si tienen diferente modalidadCalculo
- Validar que no existan modalidades duplicadas en el mismo período
- Mantener compatibilidad con registros existentes (modalidadCalculo = metodoCalculo por defecto)

## 4. [ ] Creación del Servicio de Cálculo de Tarifas

### Objetivo

Extraer y centralizar toda la lógica de cálculo en un servicio reutilizable y extensible.

### Estructura del Servicio

```typescript
// backend/services/tarifaCalculatorService.ts
class TarifaCalculatorService {
  // Registro de calculadores disponibles
  private calculadores: Map<string, ICalculadorTarifa>;

  // Método principal
  async calcularTarifa(viaje: IViaje, tarifaSeleccionada: ITarifaHistorica): Promise<number>;

  // Obtener opciones de cálculo disponibles
  async obtenerOpcionesTarifa(
    tramoId: ObjectId,
    fecha: Date,
    tipo: string
  ): Promise<ITarifaHistorica[]>;

  // Registrar calculadores personalizados
  registrarCalculador(modalidad: string, calculador: ICalculadorTarifa): void;
}

// Interface para calculadores
interface ICalculadorTarifa {
  validar(parametros: any): boolean;
  calcular(parametros: CalculoParams): Promise<number>;
  obtenerVariablesRequeridas(): string[];
}
```

### Calculadores Base

- `CalculadorKilometro`: Lógica actual de cálculo por km
- `CalculadorPalet`: Incluye soporte para fórmulas MathJS
- `CalculadorFijo`: Valor fijo
- `CalculadorPersonalizado`: Base para extensiones

## 5. [ ] Refactorización del Modelo Viaje

### Objetivo

Modificar el proceso de cálculo de tarifas para usar el nuevo sistema flexible.

### Cambios Principales

#### Nuevo Campo en IViaje

```typescript
interface IViaje {
  // ... campos existentes ...
  tarifaSeleccionada?: {
    tarifaHistoricaId: ObjectId;
    modalidadCalculo: string;
    descripcion: string;
  };
}
```

#### Refactorización del Pre-Save Hook

- Extraer lógica de cálculo al TarifaCalculatorService
- Si hay múltiples opciones de tarifa, marcar el viaje para selección manual
- Mantener compatibilidad con viajes existentes

## 6. [ ] Actualización de la API y Controllers

### Objetivo

Exponer endpoints para gestionar las nuevas funcionalidades.

### Nuevos Endpoints

#### Gestión de Configuraciones

```
GET /api/configuraciones-calculo/:clienteId
POST /api/configuraciones-calculo
PUT /api/configuraciones-calculo/:id
```

#### Selección de Tarifas

```
GET /api/viajes/:id/opciones-tarifa
PUT /api/viajes/:id/seleccionar-tarifa
```

#### Validación de Fórmulas

```
POST /api/configuraciones-calculo/validar-formula
```

### Modificación de Controllers Existentes

- `viajeController`: Agregar lógica para manejar selección de tarifa
- `tramoController`: Soportar múltiples modalidades en tarifas

## 7. [ ] Desarrollo de UI para Gestión de Modalidades

### Objetivo

Crear interfaces de usuario para gestionar las nuevas funcionalidades.

### Componentes Necesarios

#### Gestión de Configuraciones de Cálculo

- Lista de configuraciones por cliente
- Formulario de creación/edición con:
  - Editor de fórmulas con validación
  - Definición de parámetros
  - Gestión de vigencias

#### Selección de Modalidad en Viajes

- Modal/dropdown para seleccionar entre opciones disponibles
- Visualización de cálculo estimado por modalidad
- Historial de selecciones previas

#### Reportes y Análisis

- Dashboard de uso por modalidad
- Comparativa de tarifas entre modalidades
- Alertas de configuraciones próximas a vencer

## 8. [ ] Sistema de Migración de Datos

### Objetivo

Migrar los datos existentes al nuevo modelo sin interrupción del servicio.

### Script de Migración

```javascript
// backend/migrations/001-modalidades-calculo.js
async function migrate() {
  // 1. Crear configuraciones base para métodos existentes
  // 2. Actualizar tarifas históricas con modalidadCalculo
  // 3. Migrar fórmulas de clientes a ConfiguracionCalculo
  // 4. Validar integridad de datos
  // 5. Crear índices necesarios
}
```

### Proceso de Migración

1. **Fase 1**: Crear configuraciones para métodos estándar (Km, Palet, Fijo)
2. **Fase 2**: Migrar fórmulas personalizadas desde modelo Cliente
3. **Fase 3**: Actualizar tarifas históricas agregando modalidadCalculo
4. **Fase 4**: Validación y rollback si es necesario

## 9. [ ] Testing y Validación

### Objetivo

Garantizar que el nuevo sistema funcione correctamente y mantenga compatibilidad.

### Plan de Testing

#### Tests Unitarios

- Cada calculador de tarifa
- Validaciones del modelo
- Servicio de cálculo

#### Tests de Integración

- Creación de viajes con diferentes modalidades
- Migración de datos
- API endpoints

#### Tests de Regresión

- Verificar que viajes existentes mantengan sus tarifas
- Comparar cálculos antes/después de migración

### Validación con Datos Reales

- Ejecutar cálculos paralelos (sistema viejo vs nuevo)
- Generar reporte de diferencias
- Validar con usuarios clave

## 10. [ ] Documentación y Capacitación

### Objetivo

Asegurar que el equipo y usuarios comprendan el nuevo sistema.

### Documentación Técnica

- Guía de arquitectura del nuevo sistema
- API documentation actualizada
- Guías de extensión para nuevos métodos

### Documentación de Usuario

- Manual de configuración de modalidades
- Guía de selección de tarifas
- FAQs y troubleshooting

### Capacitación

- Sesiones con usuarios clave
- Videos tutoriales
- Ambiente de prueba para práctica

## 11. [ ] Despliegue y Monitoreo

### Objetivo

Implementar el sistema en producción con mínimo impacto.

### Estrategia de Despliegue

1. **Feature flags**: Activar gradualmente por cliente
2. **Canary deployment**: Probar con clientes piloto
3. **Rollback plan**: Procedimiento de reversión documentado

### Monitoreo Post-Despliegue

- Logs de uso de nuevas modalidades
- Métricas de performance de cálculos
- Alertas de errores o anomalías
- Dashboard de adopción

### Soporte Post-Implementación

- Canal dedicado para reportes
- Procedimiento de escalación
- Actualizaciones basadas en feedback
