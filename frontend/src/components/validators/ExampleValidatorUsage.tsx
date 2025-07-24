import React from 'react';
import { BaseValidator, ValidationRule, useValidation, BaseValidatorProps } from './BaseValidator';

// Ejemplo de datos a validar
interface ViajeData {
  cliente?: any;
  tramo?: any;
  fecha?: Date;
  palets?: number;
  vehiculos?: any[];
  personal?: any[];
}

// Implementación concreta del validador
class ViajeValidatorImpl extends BaseValidator<ViajeData> {
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
        id: 'palets-required',
        category: 'Datos Básicos',
        name: 'Cantidad de Palets',
        description: 'Debe especificar la cantidad de palets a transportar',
        severity: 'error',
        required: true,
        validator: (data) => ({
          passed: this.isValidNumber(data.palets) && data.palets! > 0,
          message: data.palets && data.palets > 0 
            ? `${data.palets} palets especificados` 
            : 'Debe especificar una cantidad válida de palets',
          suggestion: !data.palets || data.palets <= 0 ? 'Ingrese la cantidad de palets a transportar (mayor a 0)' : undefined
        })
      },
      {
        id: 'vehiculos-required',
        category: 'Vehículos',
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
        id: 'personal-required',
        category: 'Personal',
        name: 'Personal Asignado',
        description: 'El viaje debe tener personal asignado',
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

// Componente que usa el validador
export const ExampleValidatorComponent: React.FC<BaseValidatorProps<ViajeData>> = ({
  data,
  onValidationChange,
  autoValidate = true,
  showDetails = true,
  readonly = false
}) => {
  // Crear instancia del validador
  const validator = new ViajeValidatorImpl();

  // Usar el hook de validación
  const {
    validationResults,
    validationSummary,
    validationRules,
    runValidation
  } = useValidation(validator, data, autoValidate, onValidationChange);

  return (
    <div>
      <h3>Ejemplo de Uso del BaseValidator</h3>
      
      {/* Resumen de validación */}
      <div>
        <p>Score: {validationSummary.score.toFixed(0)}%</p>
        <p>Errores: {validationSummary.errors.length}</p>
        <p>Advertencias: {validationSummary.warnings.length}</p>
        <p>Puede guardar: {validationSummary.canSave ? 'Sí' : 'No'}</p>
        <p>Puede enviar: {validationSummary.canSubmit ? 'Sí' : 'No'}</p>
      </div>

      {/* Mostrar errores */}
      {validationSummary.errors.length > 0 && (
        <div style={{ color: 'red' }}>
          <h4>Errores:</h4>
          <ul>
            {validationSummary.errors.map((error, index) => (
              <li key={index}>
                {error.message}
                {error.suggestion && <span> - {error.suggestion}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mostrar advertencias */}
      {validationSummary.warnings.length > 0 && (
        <div style={{ color: 'orange' }}>
          <h4>Advertencias:</h4>
          <ul>
            {validationSummary.warnings.map((warning, index) => (
              <li key={index}>
                {warning.message}
                {warning.suggestion && <span> - {warning.suggestion}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Botón de re-validación manual */}
      {!autoValidate && (
        <button onClick={runValidation}>
          Validar Manualmente
        </button>
      )}
    </div>
  );
};

export default ExampleValidatorComponent;