# BaseValidator - Arquitectura Unificada de Validadores

Sistema unificado de validación que proporciona una API consistente y reutilizable para todas las validaciones del sistema. Tras la migración completa, todos los validadores (FormulaValidator, ViajeValidator, BusinessRuleValidator, CrossEntityValidator, DocumentValidatorGeneric) extienden BaseValidator.

## Arquitectura del Sistema

### 1. Clase Base: BaseValidator<T>

```typescript
abstract class BaseValidator<T = any> {
  // Método abstract que debe ser implementado
  abstract getValidationRules(): ValidationRule<T>[];
  
  // Métodos helper disponibles
  protected isRequired(value: any): boolean;
  protected isValidDate(value: any): boolean;
  protected isValidNumber(value: any): boolean;
  protected isValidArray(value: any): boolean;
  protected isValidEmail(value: string): boolean;
  protected isValidPhone(value: string): boolean;
  protected isInRange(value: number, min: number, max: number): boolean;
  protected isValidLength(value: string, min: number, max: number): boolean;
}
```

### 2. Interfaces Estándar

```typescript
interface ValidationRule<T = any> {
  id: string;                    // Identificador único
  category: string;              // Categoría para agrupación
  name: string;                  // Nombre descriptivo
  description: string;           // Descripción detallada
  severity: 'error' | 'warning' | 'info';  // Nivel de severidad
  required: boolean;             // Si es obligatoria para poder guardar
  validator: (data: T) => ValidationResult;  // Función de validación
}

interface ValidationResult {
  passed: boolean;               // Si la validación pasó
  message: string;               // Mensaje para mostrar al usuario
  details?: string[];            // Detalles adicionales opcionales
  suggestion?: string;           // Sugerencia de corrección
}

interface ValidationSummary {
  isValid: boolean;              // Si todas las validaciones requeridas pasaron
  totalRules: number;            // Total de reglas evaluadas
  passedRules: number;           // Reglas que pasaron
  errors: ValidationResult[];    // Lista de errores
  warnings: ValidationResult[]; // Lista de advertencias
  infos: ValidationResult[];     // Lista de información
  score: number;                 // Puntuación 0-100
  canSave: boolean;              // Si se puede guardar (sin errores críticos)
  canSubmit: boolean;            // Si se puede enviar/aprobar
}
```

### 3. Hook de Validación: useValidation

```typescript
const useValidation = <T>(
  validator: BaseValidator<T>,
  data: T,
  autoValidate: boolean = true,
  onValidationChange?: (results: ValidationSummary) => void
) => ({
  validationResults: ValidationResult[];
  validationSummary: ValidationSummary;
  validationRules: ValidationRule<T>[];
  runValidation: () => void;
});
```

## Tipos de Validadores

### 1. Validador Simple

Para validaciones básicas de entidades individuales.

```typescript
class SimpleEntityValidator extends BaseValidator<EntityData> {
  getValidationRules(): ValidationRule<EntityData>[] {
    return [
      {
        id: 'name-required',
        category: 'Datos Básicos',
        name: 'Nombre Requerido',
        description: 'La entidad debe tener un nombre',
        severity: 'error',
        required: true,
        validator: (data) => ({
          passed: this.isRequired(data.name),
          message: data.name ? 'Nombre válido' : 'Debe ingresar un nombre',
          suggestion: !data.name ? 'Ingrese el nombre de la entidad' : undefined
        })
      }
    ];
  }
}
```

### 2. Validador de Reglas de Negocio

Para validaciones complejas multi-entidad.

```typescript
class BusinessRuleValidator extends BusinessRuleBaseValidator {
  getValidationRules(): BusinessRuleValidationRule[] {
    return [
      {
        id: 'entity-consistency',
        category: 'Integridad',
        name: 'Consistencia de Entidades',
        description: 'Las entidades deben ser consistentes',
        severity: 'error',
        required: true,
        entityType: 'target_entity',
        enabled: true,
        validationFn: (record: any) => ({
          passed: record.isValid,
          message: record.isValid ? 'Consistente' : 'Inconsistente',
          details: { recordId: record.id }
        }),
        validator: () => ({ passed: true, message: 'OK' })
      }
    ];
  }
}
```

### 3. Validador Configurable

Para validaciones con configuración avanzada.

```typescript
class ConfigurableValidator extends BaseValidator<DataType[]> {
  private config: ValidationConfig;

  constructor(config: ValidationConfig) {
    super();
    this.config = config;
  }

  getValidationRules(): ValidationRule<DataType[]>[] {
    return [
      {
        id: 'configurable-rule',
        category: 'Configuración',
        name: 'Regla Configurable',
        description: `Validación con parámetro: ${this.config.parameter}`,
        severity: this.config.strict ? 'error' : 'warning',
        required: this.config.strict,
        validator: (data) => {
          // Lógica que usa this.config
          return {
            passed: data.length >= this.config.minItems,
            message: `${data.length} elementos (mínimo: ${this.config.minItems})`
          };
        }
      }
    ];
  }
}
```

## Validadores Migrados

### ✅ FormulaValidator
- **Propósito**: Validación de fórmulas matemáticas
- **Tipo**: Simple
- **Características**: Validación de sintaxis MathJS, variables válidas

### ✅ CrossEntityValidator  
- **Propósito**: Validación de relaciones entre entidades
- **Tipo**: Multi-entidad
- **Características**: Verifica integridad referencial, dependencias

### ✅ BusinessRuleValidator
- **Propósito**: Reglas de negocio configurables
- **Tipo**: Business Rules
- **Características**: Configuración dinámica, múltiples entidades

### ✅ ViajeValidator
- **Propósito**: Validación compleja de viajes (12 reglas)
- **Tipo**: Simple con lógica compleja
- **Características**: Compatibilidad cliente-tramo, documentación, fechas

### ✅ DocumentValidatorGeneric
- **Propósito**: Validador genérico con múltiples vistas
- **Tipo**: Configurable avanzado
- **Características**: Múltiples modos, configuración por vista, caching

## Patrones de Implementación

### 1. Validador Básico

```typescript
// 1. Definir interfaz de datos
interface MyData {
  field1: string;
  field2: number;
}

// 2. Crear validador
class MyValidator extends BaseValidator<MyData> {
  getValidationRules(): ValidationRule<MyData>[] {
    return [
      {
        id: 'field1-required',
        category: 'Required Fields',
        name: 'Field 1 Required',
        description: 'Field 1 must be provided',
        severity: 'error',
        required: true,
        validator: (data) => ({
          passed: this.isRequired(data.field1),
          message: data.field1 ? 'Valid' : 'Field 1 is required'
        })
      }
    ];
  }
}

// 3. Usar en componente
const MyComponent: React.FC = () => {
  const [data, setData] = useState<MyData>({ field1: '', field2: 0 });
  const validator = new MyValidator();
  
  const { validationSummary, runValidation } = useValidation(
    validator, 
    data, 
    true, // auto-validate
    (results) => console.log('Validation changed:', results)
  );

  return (
    <div>
      <p>Errors: {validationSummary.errors.length}</p>
      <p>Can Save: {validationSummary.canSave ? 'Yes' : 'No'}</p>
    </div>
  );
};
```

### 2. Validador con Configuración

```typescript
interface Config {
  strict: boolean;
  maxLength: number;
}

class ConfigurableValidator extends BaseValidator<string> {
  constructor(private config: Config) {
    super();
  }

  getValidationRules(): ValidationRule<string>[] {
    return [
      {
        id: 'length-check',
        category: 'Format',
        name: 'Length Validation',
        description: `Text must be under ${this.config.maxLength} characters`,
        severity: this.config.strict ? 'error' : 'warning',
        required: this.config.strict,
        validator: (data) => ({
          passed: data.length <= this.config.maxLength,
          message: `${data.length}/${this.config.maxLength} characters`,
          suggestion: data.length > this.config.maxLength 
            ? 'Reduce the text length' : undefined
        })
      }
    ];
  }
}

// Uso
const strictValidator = new ConfigurableValidator({ strict: true, maxLength: 100 });
const lenientValidator = new ConfigurableValidator({ strict: false, maxLength: 200 });
```

### 3. Integración con Formularios

```typescript
const FormWithValidation: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(initialData);
  const validator = new FormValidator();
  
  const { validationSummary } = useValidation(validator, formData, true);

  const handleSubmit = () => {
    if (validationSummary.canSubmit) {
      // Enviar datos
      submitForm(formData);
    } else {
      // Mostrar errores
      showErrors(validationSummary.errors);
    }
  };

  return (
    <form>
      {/* Campos del formulario */}
      
      {/* Mostrar errores */}
      {validationSummary.errors.map(error => (
        <Alert key={error.message} color="red">
          {error.message}
          {error.suggestion && <p><strong>Sugerencia:</strong> {error.suggestion}</p>}
        </Alert>
      ))}
      
      {/* Mostrar advertencias */}
      {validationSummary.warnings.map(warning => (
        <Alert key={warning.message} color="yellow">
          {warning.message}
        </Alert>
      ))}

      <Button 
        onClick={handleSubmit} 
        disabled={!validationSummary.canSave}
      >
        Guardar {validationSummary.canSave ? '✅' : '❌'}
      </Button>
    </form>
  );
};
```

## Métodos Helper Disponibles

```typescript
// Validaciones básicas
this.isRequired(value)           // ✅ Valor no nulo/undefined/vacío
this.isValidDate(value)          // ✅ Fecha válida
this.isValidNumber(value)        // ✅ Número válido
this.isValidArray(value)         // ✅ Array no vacío
this.isValidEmail(email)         // ✅ Email válido
this.isValidPhone(phone)         // ✅ Teléfono válido

// Validaciones de rango
this.isInRange(number, min, max) // ✅ Número en rango
this.isValidLength(str, min, max) // ✅ String con longitud válida
```

## Configuración de Severidad

### Error (🚨)
- **Propósito**: Problemas críticos que impiden guardar
- **Comportamiento**: `canSave = false`, `canSubmit = false`
- **UI**: Color rojo, icono de error

### Warning (⚠️)
- **Propósito**: Problemas no críticos, recomendaciones
- **Comportamiento**: `canSave = true`, `canSubmit = false` (si no hay errores)
- **UI**: Color naranja/amarillo, icono de advertencia

### Info (ℹ️)
- **Propósito**: Información adicional, confirmaciones
- **Comportamiento**: No afecta `canSave` ni `canSubmit`
- **UI**: Color azul, icono de información

## Mejores Prácticas

### ✅ Recomendado

```typescript
// ✅ Usar nombres descriptivos para IDs
id: 'cliente-tramo-compatibility'

// ✅ Proporcionar sugerencias útiles
suggestion: 'Seleccione un tramo que pertenezca al cliente elegido'

// ✅ Categorizar reglas lógicamente
category: 'Datos Básicos' | 'Compatibilidad' | 'Recursos'

// ✅ Usar métodos helper
this.isRequired(data.field) // En lugar de !!data.field

// ✅ Manejar casos edge
if (!data) return { passed: false, message: 'No data provided' };

// ✅ Mensajes claros y accionables
message: 'Debe seleccionar al menos un vehículo'
```

### ❌ Evitar

```typescript
// ❌ IDs genéricos
id: 'rule1', id: 'validation'

// ❌ Mensajes vagos
message: 'Error' // ¿Qué error?

// ❌ Validaciones duplicadas
// Usar helper en lugar de lógica repetida

// ❌ Categorías inconsistentes
category: 'Basic', 'basics', 'BASIC' // Usar 'Datos Básicos'

// ❌ Severidad incorrecta
severity: 'error' // Para validaciones opcionales
```

## Testing

```typescript
describe('MyValidator', () => {
  let validator: MyValidator;
  
  beforeEach(() => {
    validator = new MyValidator();
  });

  it('should pass validation with valid data', () => {
    const validData = { field1: 'valid', field2: 10 };
    const rules = validator.getValidationRules();
    
    rules.forEach(rule => {
      const result = rule.validator(validData);
      expect(result.passed).toBe(true);
    });
  });

  it('should fail validation with invalid data', () => {
    const invalidData = { field1: '', field2: -1 };
    const rules = validator.getValidationRules();
    
    const results = rules.map(rule => rule.validator(invalidData));
    const hasErrors = results.some(r => !r.passed);
    expect(hasErrors).toBe(true);
  });
});
```

## Migración desde Validadores Anteriores

### Antes (Código Duplicado)

```typescript
// ❌ Validador individual sin BaseValidator
class OldValidator {
  validate(data: any) {
    const errors: string[] = [];
    
    if (!data.name) {
      errors.push('Name is required');
    }
    
    if (!data.email || !data.email.includes('@')) {
      errors.push('Valid email is required');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

### Después (BaseValidator)

```typescript
// ✅ Validador unificado con BaseValidator
class NewValidator extends BaseValidator<DataType> {
  getValidationRules(): ValidationRule<DataType>[] {
    return [
      {
        id: 'name-required',
        category: 'Datos Básicos',
        name: 'Nombre Requerido',
        description: 'El nombre es obligatorio',
        severity: 'error',
        required: true,
        validator: (data) => ({
          passed: this.isRequired(data.name),
          message: data.name ? 'Nombre válido' : 'Debe ingresar un nombre'
        })
      },
      {
        id: 'email-valid',
        category: 'Datos Básicos', 
        name: 'Email Válido',
        description: 'Debe ser un email válido',
        severity: 'error',
        required: true,
        validator: (data) => ({
          passed: this.isValidEmail(data.email),
          message: this.isValidEmail(data.email) ? 'Email válido' : 'Debe ingresar un email válido'
        })
      }
    ];
  }
}
```

## Beneficios de la Unificación

- 🔧 **API Consistente**: Todos los validadores usan la misma interfaz
- 🎨 **Reutilización**: Métodos helper centralizados eliminan duplicación
- 📊 **Reporting Unificado**: Mismo formato de resultados y scoring
- 🔒 **Type Safety**: TypeScript garantiza tipado correcto
- 🧪 **Testabilidad**: Fácil testing y mocking
- 📈 **Escalabilidad**: Fácil agregar nuevos validadores
- 🎯 **Mantenibilidad**: Cambios centralizados se propagan automáticamente

## Ejemplo Completo

Ver `ExampleValidatorUsage.tsx` para ejemplos completos de:
- Validador simple
- Validador de reglas de negocio  
- Validador con configuración avanzada
- Integración con componentes React
- Diferentes modos de operación

## Arquitectura Final

```
BaseValidator<T>
├── SimpleValidator (FormulaValidator, ViajeValidator)
├── BusinessRuleBaseValidator (BusinessRuleValidator)
└── ConfigurableValidator (DocumentValidatorGeneric, CrossEntityValidator)

useValidation Hook
├── Auto-validation
├── Manual validation
├── Callback support
└── Summary generation
```

La arquitectura unificada proporciona una base sólida y extensible para todas las validaciones del sistema, eliminando duplicación y asegurando consistencia en toda la aplicación.