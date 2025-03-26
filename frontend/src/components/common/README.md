# Componentes Comunes

Este directorio contiene componentes reutilizables para toda la aplicación.

## ExcelImportTemplate

`ExcelImportTemplate` es un componente base optimizado para la importación de datos mediante hojas de cálculo Excel. Proporciona una interfaz estandarizada para todos los importadores de la aplicación.

### Características principales

- Descarga de plantillas Excel con formato uniforme
- Validación de datos configurables
- Procesamiento asíncrono con Web Workers para archivos grandes
- Barra de progreso durante la importación
- Mensajes de error claros y detallados
- Hojas de instrucciones y ayuda configurables
- Soporte para datos de ejemplo

### Uso básico

```jsx
import ExcelImportTemplate from '../common/ExcelImportTemplate';

const MyImporter = () => {
  const [open, setOpen] = useState(false);
  
  // Definición de columnas del Excel
  const excelHeaders = [
    { field: 'nombre', label: 'Nombre', required: true },
    { field: 'email', label: 'Correo Electrónico', required: true },
    { field: 'telefono', label: 'Teléfono', required: false }
  ];
  
  // Función para procesar los datos
  const processData = async (validRows) => {
    try {
      // Lógica para guardar los datos
      await apiService.guardarDatos(validRows);
      // Mostrar notificación de éxito
      return true;
    } catch (error) {
      throw new Error(`Error al guardar datos: ${error.message}`);
    }
  };
  
  // Función personalizada para validar cada fila
  const validateRow = (row, index) => {
    const errors = [];
    
    // Validaciones personalizadas
    if (row.email && !row.email.includes('@')) {
      errors.push(`Fila ${index + 1}: El correo electrónico no es válido`);
    }
    
    return errors;
  };
  
  return (
    <>
      <Button onClick={() => setOpen(true)}>Importar Datos</Button>
      
      <ExcelImportTemplate
        title="Importar Contactos"
        open={open}
        onClose={() => setOpen(false)}
        excelHeaders={excelHeaders}
        processDataCallback={processData}
        validateRow={validateRow}
        templateFileName="Plantilla_Contactos.xlsx"
      />
    </>
  );
};
```

### Props

| Prop | Tipo | Requerido | Descripción |
|------|------|----------|-------------|
| `title` | string | No | Título del diálogo (Default: 'Importación mediante Excel') |
| `open` | boolean | Sí | Estado de apertura del diálogo |
| `onClose` | function | Sí | Función para cerrar el diálogo |
| `onComplete` | function | No | Función a ejecutar al completar el proceso |
| `excelHeaders` | array | Sí | Definición de columnas para el Excel |
| `processDataCallback` | function | Sí | Función para procesar los datos del Excel |
| `generateTemplateCallback` | function | No | Función personalizada para generar la plantilla |
| `templateFileName` | string | No | Nombre del archivo de plantilla (Default: 'Plantilla_Importacion.xlsx') |
| `validateRow` | function | No | Función para validar cada fila |
| `instructionSheets` | array | No | Hojas adicionales para instrucciones |
| `additionalContent` | node | No | Contenido adicional para mostrar en el diálogo |
| `exampleData` | array | No | Datos de ejemplo para incluir en la plantilla |

### Estructura de excelHeaders

```js
const excelHeaders = [
  { 
    field: 'codigo', // Nombre del campo en el objeto de datos
    label: 'Código', // Etiqueta visible en el encabezado del Excel
    required: true   // Si el campo es obligatorio
  },
  // Más encabezados...
];
```

### Hojas de instrucciones

```js
const instructionSheets = [
  {
    name: 'Instrucciones', // Nombre de la hoja
    data: [
      ['Instrucciones de uso:'],
      ['1. Complete todos los campos obligatorios marcados con (*)'],
      ['2. Respete el formato de cada columna'],
      // Más filas...
    ],
    columnWidths: [{ wch: 100 }] // Ancho de columnas
  },
  {
    name: 'Catálogo',
    data: [
      ['Código', 'Descripción'],
      ['001', 'Producto A'],
      ['002', 'Producto B'],
      // Más datos de referencia...
    ],
    columnWidths: [{ wch: 10 }, { wch: 50 }]
  }
];
```

## DataTable

Componente de tabla de datos con funcionalidades avanzadas como paginación, ordenamiento y filtrado.

## BulkUpload

Componente para la carga masiva de datos (obsoleto, usar ExcelImportTemplate en su lugar).

## Notification

Componente para mostrar notificaciones al usuario con diferentes niveles de severidad. 