// Helpers para ImportWizard
import { ImportError, ImportResult } from './ImportWizardTypes';

// Simular validación de datos
export const simulateValidation = (
  data: Array<Record<string, unknown>>
): Promise<ImportError[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const errors: ImportError[] = [];

      // Simular algunos errores de validación
      if (data.length > 0) {
        // Error en fila 2
        errors.push({
          row: 2,
          field: 'email',
          value: 'invalid-email',
          error: 'Email inválido',
          severity: 'error',
        });

        // Warning en fila 3
        errors.push({
          row: 3,
          field: 'telefono',
          value: '123',
          error: 'Teléfono muy corto',
          severity: 'warning',
        });
      }

      resolve(errors);
    }, 2000);
  });
};

// Simular importación de datos
export const simulateImport = (
  entityType: string,
  data: Array<Record<string, unknown>>,
  validationErrors: ImportError[]
): Promise<ImportResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const result: ImportResult = {
        entityType,
        total: data.length,
        success: data.length - validationErrors.filter((e) => e.severity === 'error').length,
        failed: validationErrors.filter((e) => e.severity === 'error').length,
        errors: validationErrors,
        timestamp: new Date(),
      };

      resolve(result);
    }, 3000);
  });
};

// Generar datos mock para testing
export const generateMockData = (): Array<Record<string, unknown>> => {
  return [
    { nombre: 'Cliente 1', email: 'cliente1@email.com', ruc: '20123456789' },
    { nombre: 'Cliente 2', email: 'invalid-email', ruc: '20987654321' },
    { nombre: 'Cliente 3', email: 'cliente3@email.com', telefono: '123' },
  ];
};
