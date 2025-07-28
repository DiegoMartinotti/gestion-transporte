import React from 'react';
import { BaseValidator, ValidationRule, useValidation, BaseValidatorProps, BusinessRuleBaseValidator, BusinessRuleValidationRule } from './BaseValidator';

/**
 * GUÍA DE USO DEL BASEVALIDATOR
 * 
 * Este archivo contiene ejemplos actualizados de cómo implementar validadores
 * usando la arquitectura unificada BaseValidator tras la migración completa.
 * 
 * ARQUITECTURA BASEVALIDATOR - PATRONES DE IMPLEMENTACIÓN
 * 
 * Tras la migración completa, todos los validadores del sistema siguen estos patrones:
 * 
 * 1. VALIDADOR SIMPLE (SimpleViajeValidator)
 *    - Extiende BaseValidator<T>
 *    - Implementa getValidationRules(): ValidationRule<T>[]
 *    - Usa métodos helper: isRequired, isValidDate, isValidArray, etc.
 * 
 * 2. VALIDADOR DE REGLAS DE NEGOCIO (BusinessRuleValidator)
 *    - Extiende BusinessRuleBaseValidator 
 *    - Implementa BusinessRuleValidationRule[] con validationFn
 *    - Maneja múltiples entidades y configuración dinámica
 * 
 * 3. VALIDADOR AVANZADO (DocumentValidatorGeneric)
 *    - Configuración avanzada con múltiples modos
 *    - Soporte para diferentes vistas y contextos
 *    - Validación compleja con dependencias
 * 
 * 4. HOOK DE VALIDACIÓN (useValidation)
 *    - Gestiona estado de validación automática/manual
 *    - Proporciona validationSummary con scores y categorización
 *    - Callbacks para integración con formularios
 */

// ==================== EJEMPLO 1: VALIDADOR SIMPLE ====================
// Ejemplo básico de datos a validar
interface ViajeData {
  cliente?: any;
  tramo?: any;
  fecha?: Date;
  palets?: number;
  vehiculos?: any[];
  personal?: any[];
}

// Implementación de validador simple
class SimpleViajeValidator extends BaseValidator<ViajeData> {
  getValidationRules(): ValidationRule<ViajeData>[] {
    return [
      {
        id: 'cliente-required',
        category: 'Datos Básicos',
        name: 'Cliente Requerido',
        description: 'El viaje debe tener un cliente asignado',
        severity: 'error',
        required: true,
        validator: (data) => ({
          passed: this.isRequired(data.cliente),
          message: data.cliente ? 'Cliente asignado correctamente' : 'Debe seleccionar un cliente',
          suggestion: !data.cliente ? 'Seleccione un cliente de la lista' : undefined
        })
      },
      {
        id: 'fecha-required',
        category: 'Datos Básicos',
        name: 'Fecha Requerida',
        description: 'El viaje debe tener una fecha programada',
        severity: 'error',
        required: true,
        validator: (data) => ({
          passed: this.isValidDate(data.fecha),
          message: data.fecha ? 'Fecha asignada correctamente' : 'Debe establecer una fecha para el viaje',
          suggestion: !data.fecha ? 'Seleccione la fecha programada del viaje' : undefined
        })
      },
      {
        id: 'vehiculos-required',
        category: 'Recursos',
        name: 'Vehículos Asignados',
        description: 'El viaje debe tener al menos un vehículo asignado',
        severity: 'error',
        required: true,
        validator: (data) => ({
          passed: this.isValidArray(data.vehiculos),
          message: data.vehiculos && data.vehiculos.length > 0
            ? `${data.vehiculos.length} vehículo(s) asignado(s)`
            : 'Debe asignar al menos un vehículo',
          suggestion: !data.vehiculos || data.vehiculos.length === 0 ? 'Seleccione los vehículos que realizarán el viaje' : undefined
        })
      },
      {
        id: 'personal-recommended',
        category: 'Recursos',
        name: 'Personal Asignado',
        description: 'Se recomienda asignar personal al viaje',
        severity: 'warning',
        required: false,
        validator: (data) => ({
          passed: this.isValidArray(data.personal),
          message: data.personal && data.personal.length > 0
            ? `${data.personal.length} persona(s) asignada(s)`
            : 'Se recomienda asignar personal al viaje',
          suggestion: !data.personal || data.personal.length === 0 ? 'Asigne al menos un chofer al viaje' : undefined
        })
      }
    ];
  }
}

// ==================== EJEMPLO 2: VALIDADOR DE REGLAS DE NEGOCIO ====================
// Ejemplo de validador multi-entidad para reglas de negocio
class ExampleBusinessRuleValidator extends BusinessRuleBaseValidator {
  getBusinessRules(): BusinessRuleValidationRule[] {
    return [
      {
        id: 'vehiculos-activos',
        category: 'Integridad',
        name: 'Vehículos Activos',
        description: 'Todos los vehículos deben estar activos',
        severity: 'error',
        required: true,
        entityType: 'vehiculos',
        enabled: true,
        validationFn: (vehiculo: any) => ({
          passed: vehiculo.activo === true,
          message: vehiculo.activo ? 'Vehículo activo' : `Vehículo ${vehiculo.placa} está inactivo`,
          details: { vehiculoId: vehiculo._id, placa: vehiculo.placa }
        }),
        validator: () => ({ passed: true, message: 'OK' }) // Implementado en validationFn
      },
      {
        id: 'personal-certificado',
        category: 'Cumplimiento',
        name: 'Personal Certificado',
        description: 'Todo el personal debe tener certificaciones vigentes',
        severity: 'warning',
        required: false,
        entityType: 'personal',
        enabled: true,
        validationFn: (persona: any) => ({
          passed: persona.certificaciones && persona.certificaciones.length > 0,
          message: persona.certificaciones?.length > 0 
            ? `${persona.nombre} tiene ${persona.certificaciones.length} certificaciones`
            : `${persona.nombre} no tiene certificaciones registradas`,
          details: { personalId: persona._id, certificaciones: persona.certificaciones?.length || 0 }
        }),
        validator: () => ({ passed: true, message: 'OK' })
      }
    ];
  }
}

// ==================== EJEMPLO 3: VALIDADOR CON CONFIGURACIÓN AVANZADA ====================
// Ejemplo de validador con múltiples vistas y configuración dinámica
interface DocumentoValidacion {
  id: string;
  tipo: 'viaje' | 'personal' | 'vehiculo';
  entidad: any;
  fecha: Date;
  estado: 'pendiente' | 'validado' | 'rechazado';
}

class AdvancedDocumentValidator extends BaseValidator<DocumentoValidacion[]> {
  private config: {
    strict: boolean;
    allowPending: boolean;
    maxDaysOld: number;
  };

  constructor(config = { strict: false, allowPending: true, maxDaysOld: 30 }) {
    super();
    this.config = config;
  }

  getValidationRules(): ValidationRule<DocumentoValidacion[]>[] {
    return [
      {
        id: 'documentos-required',
        category: 'Existencia',
        name: 'Documentos Requeridos',
        description: 'Debe haber al menos un documento',
        severity: 'error',
        required: true,
        validator: (documentos) => ({
          passed: this.isValidArray(documentos),
          message: documentos && documentos.length > 0
            ? `${documentos.length} documento(s) encontrado(s)`
            : 'No hay documentos para validar',
          suggestion: !documentos || documentos.length === 0 ? 'Agregue documentos al sistema' : undefined
        })
      },
      {
        id: 'documentos-validados',
        category: 'Estado',
        name: 'Documentos Validados',
        description: this.config.strict ? 'Todos los documentos deben estar validados' : 'Se recomienda validar documentos',
        severity: this.config.strict ? 'error' : 'warning',
        required: this.config.strict,
        validator: (documentos) => {
          if (!documentos || documentos.length === 0) {
            return { passed: false, message: 'No hay documentos' };
          }
          
          const validados = documentos.filter(d => d.estado === 'validado');
          const passed = this.config.strict 
            ? validados.length === documentos.length
            : validados.length > 0;
            
          return {
            passed,
            message: `${validados.length}/${documentos.length} documentos validados`,
            suggestion: !passed ? 'Valide los documentos pendientes' : undefined
          };
        }
      },
      {
        id: 'documentos-recientes',
        category: 'Vigencia',
        name: 'Documentos Recientes',
        description: `Documentos no deben ser más antiguos de ${this.config.maxDaysOld} días`,
        severity: 'warning',
        required: false,
        validator: (documentos) => {
          if (!documentos || documentos.length === 0) {
            return { passed: true, message: 'Sin documentos que validar' };
          }
          
          const ahora = new Date();
          const antiguos = documentos.filter(d => {
            const diasDiff = Math.floor((ahora.getTime() - d.fecha.getTime()) / (1000 * 60 * 60 * 24));
            return diasDiff > this.config.maxDaysOld;
          });
          
          return {
            passed: antiguos.length === 0,
            message: antiguos.length === 0 
              ? 'Todos los documentos son recientes'
              : `${antiguos.length} documento(s) antiguos detectados`,
            suggestion: antiguos.length > 0 ? 'Considere actualizar los documentos antiguos' : undefined
          };
        }
      }
    ];
  }
}

// ==================== COMPONENTES DE EJEMPLO ====================

// Componente básico usando validador simple
export const SimpleValidatorExample: React.FC<BaseValidatorProps<ViajeData>> = ({
  data,
  onValidationChange,
  autoValidate = true,
  showDetails = true,
  readonly = false
}) => {
  const validator = new SimpleViajeValidator();
  const {
    validationResults,
    validationSummary,
    validationRules,
    runValidation
  } = useValidation(validator, data, autoValidate, onValidationChange);

  return (
    <div>
      <h3>🔧 Validador Simple - BaseValidator</h3>
      <p><em>Ejemplo básico de validación de datos de viaje</em></p>
      
      {/* Resumen de validación mejorado */}
      <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '16px' }}>
        <h4>📊 Resumen de Validación</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          <div><strong>Score:</strong> {validationSummary.score.toFixed(0)}%</div>
          <div><strong>Errores:</strong> <span style={{color: validationSummary.errors.length > 0 ? 'red' : 'green'}}>{validationSummary.errors.length}</span></div>
          <div><strong>Advertencias:</strong> <span style={{color: validationSummary.warnings.length > 0 ? 'orange' : 'green'}}>{validationSummary.warnings.length}</span></div>
          <div><strong>Puede guardar:</strong> <span style={{color: validationSummary.canSave ? 'green' : 'red'}}>{validationSummary.canSave ? '✅' : '❌'}</span></div>
          <div><strong>Puede enviar:</strong> <span style={{color: validationSummary.canSubmit ? 'green' : 'red'}}>{validationSummary.canSubmit ? '✅' : '❌'}</span></div>
        </div>
      </div>

      {/* Errores */}
      {validationSummary.errors.length > 0 && (
        <div style={{ color: 'red', marginBottom: '16px' }}>
          <h4>🚨 Errores Críticos:</h4>
          <ul>
            {validationSummary.errors.map((error, index) => (
              <li key={index} style={{ marginBottom: '8px' }}>
                <strong>{error.message}</strong>
                {error.suggestion && (
                  <div style={{ color: '#666', fontStyle: 'italic', marginTop: '4px' }}>
                    💡 {error.suggestion}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Advertencias */}
      {validationSummary.warnings.length > 0 && (
        <div style={{ color: 'orange', marginBottom: '16px' }}>
          <h4>⚠️ Advertencias:</h4>
          <ul>
            {validationSummary.warnings.map((warning, index) => (
              <li key={index} style={{ marginBottom: '8px' }}>
                <strong>{warning.message}</strong>
                {warning.suggestion && (
                  <div style={{ color: '#666', fontStyle: 'italic', marginTop: '4px' }}>
                    💡 {warning.suggestion}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Información adicional */}
      {validationSummary.infos.length > 0 && (
        <div style={{ color: 'blue', marginBottom: '16px' }}>
          <h4>ℹ️ Información:</h4>
          <ul>
            {validationSummary.infos.map((info, index) => (
              <li key={index}>{info.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Controles */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
        {!autoValidate && (
          <button 
            onClick={runValidation}
            style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            🔄 Validar Manualmente
          </button>
        )}
        <div style={{ fontSize: '12px', color: '#666', alignSelf: 'center' }}>
          {autoValidate ? '🔄 Validación automática activa' : '⏸️ Validación manual'}
        </div>
      </div>
    </div>
  );
};

// Componente para mostrar cómo usar validador de reglas de negocio
export const BusinessRuleValidatorExample: React.FC<{ 
  data: Record<string, any[]>;
  onValidationChange?: (results: any) => void;
}> = ({ data, onValidationChange }) => {
  const validator = new ExampleBusinessRuleValidator();
  const {
    validationResults,
    validationSummary,
    runValidation
  } = useValidation(validator, data, true, onValidationChange);

  return (
    <div>
      <h3>🏢 Validador de Reglas de Negocio</h3>
      <p><em>Ejemplo de validación multi-entidad usando BusinessRuleBaseValidator</em></p>
      
      <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h4>Entidades a Validar:</h4>
        <ul>
          {Object.entries(data).map(([entityType, entities]) => (
            <li key={entityType}>
              <strong>{entityType}:</strong> {entities.length} registros
            </li>
          ))}
        </ul>
        
        <div style={{ marginTop: '16px' }}>
          <strong>Resultado:</strong> {validationSummary.score.toFixed(0)}% de cumplimiento
        </div>
      </div>
    </div>
  );
};

// Componente para mostrar validador con configuración avanzada
export const AdvancedValidatorExample: React.FC<{
  documentos: DocumentoValidacion[];
  config?: { strict: boolean; allowPending: boolean; maxDaysOld: number };
}> = ({ documentos, config }) => {
  const validator = new AdvancedDocumentValidator(config);
  const {
    validationResults,
    validationSummary,
    runValidation
  } = useValidation(validator, documentos, true);

  return (
    <div>
      <h3>⚙️ Validador con Configuración Avanzada</h3>
      <p><em>Ejemplo de validador configurable con múltiples modos</em></p>
      
      <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h4>Configuración Actual:</h4>
        <ul>
          <li><strong>Modo estricto:</strong> {config?.strict ? '✅ Activado' : '❌ Desactivado'}</li>
          <li><strong>Permitir pendientes:</strong> {config?.allowPending ? '✅ Sí' : '❌ No'}</li>
          <li><strong>Días máximos:</strong> {config?.maxDaysOld || 30} días</li>
        </ul>
        
        <div style={{ marginTop: '16px' }}>
          <strong>Documentos procesados:</strong> {documentos.length}<br/>
          <strong>Score de validación:</strong> {validationSummary.score.toFixed(0)}%
        </div>
      </div>
    </div>
  );
};

// ==================== EXPORTACIONES ====================

// Componente principal que muestra todos los ejemplos
export const BaseValidatorExamples: React.FC = () => {
  // Datos de ejemplo
  const viajeData: ViajeData = {
    cliente: { id: 1, nombre: 'Cliente Test' },
    tramo: { id: 1, origen: 'Madrid', destino: 'Barcelona' },
    fecha: new Date(),
    palets: 10,
    vehiculos: [{ id: 1, placa: 'ABC-123' }],
    personal: []
  };

  const businessData = {
    vehiculos: [
      { _id: '1', placa: 'ABC-123', activo: true },
      { _id: '2', placa: 'DEF-456', activo: false }
    ],
    personal: [
      { _id: '1', nombre: 'Juan Pérez', certificaciones: ['B', 'C'] },
      { _id: '2', nombre: 'María García', certificaciones: [] }
    ]
  };

  const documentos: DocumentoValidacion[] = [
    { id: '1', tipo: 'viaje', entidad: viajeData, fecha: new Date(), estado: 'validado' },
    { id: '2', tipo: 'vehiculo', entidad: {}, fecha: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), estado: 'pendiente' }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>📋 Guía de Uso del BaseValidator</h1>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '40px' }}>
        Ejemplos actualizados tras la migración completa a BaseValidator. 
        Todos los validadores del sistema (FormulaValidator, ViajeValidator, BusinessRuleValidator, 
        CrossEntityValidator, DocumentValidatorGeneric) ahora extienden BaseValidator.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {/* Ejemplo 1: Validador Simple */}
        <section style={{ border: '2px solid #e9ecef', borderRadius: '12px', padding: '24px' }}>
          <SimpleValidatorExample 
            data={viajeData}
            onValidationChange={(results) => console.log('Validación simple:', results)}
          />
        </section>

        {/* Ejemplo 2: Validador de Reglas de Negocio */}
        <section style={{ border: '2px solid #e9ecef', borderRadius: '12px', padding: '24px' }}>
          <BusinessRuleValidatorExample 
            data={businessData}
            onValidationChange={(results) => console.log('Reglas de negocio:', results)}
          />
        </section>

        {/* Ejemplo 3: Validador Avanzado - Modo Normal */}
        <section style={{ border: '2px solid #e9ecef', borderRadius: '12px', padding: '24px' }}>
          <AdvancedValidatorExample 
            documentos={documentos}
            config={{ strict: false, allowPending: true, maxDaysOld: 30 }}
          />
        </section>

        {/* Ejemplo 4: Validador Avanzado - Modo Estricto */}
        <section style={{ border: '2px solid #e9ecef', borderRadius: '12px', padding: '24px' }}>
          <AdvancedValidatorExample 
            documentos={documentos}
            config={{ strict: true, allowPending: false, maxDaysOld: 15 }}
          />
        </section>
      </div>

      {/* Información adicional */}
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>🎯 Arquitectura Unificada BaseValidator</h3>
        <p><strong>Validadores migrados exitosamente:</strong></p>
        <ul>
          <li>✅ <strong>FormulaValidator</strong> - Validación de fórmulas matemáticas</li>
          <li>✅ <strong>CrossEntityValidator</strong> - Validación cross-entity</li>
          <li>✅ <strong>BusinessRuleValidator</strong> - Reglas de negocio multi-entidad</li>
          <li>✅ <strong>ViajeValidator</strong> - Validación compleja de viajes (12 reglas)</li>
          <li>✅ <strong>DocumentValidatorGeneric</strong> - Validador genérico con múltiples vistas</li>
        </ul>
        
        <p><strong>Beneficios de la unificación:</strong></p>
        <ul>
          <li>🔧 <strong>API consistente:</strong> Todos los validadores usan la misma interfaz</li>
          <li>🎨 <strong>Reutilización de código:</strong> Métodos helper centralizados</li>
          <li>📊 <strong>Reporting unificado:</strong> Mismo formato de resultados</li>
          <li>🔒 <strong>Type Safety:</strong> TypeScript garantiza tipado correcto</li>
          <li>🧪 <strong>Testabilidad:</strong> Fácil testing y mocking</li>
        </ul>
      </div>
    </div>
  );
};

// Exportaciones individuales para uso específico
export { SimpleViajeValidator, ExampleBusinessRuleValidator, AdvancedDocumentValidator };
export default BaseValidatorExamples;