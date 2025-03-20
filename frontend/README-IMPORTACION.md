# Sistema de Importación Excel

## Descripción General

Este sistema proporciona una solución optimizada para la importación masiva de datos desde archivos Excel en la aplicación frontend. Está diseñado para manejar grandes cantidades de datos de manera eficiente, con validaciones robustas y una experiencia de usuario mejorada.

## Características Principales

- **Procesamiento de alto rendimiento:** Utiliza Web Workers para procesar datos sin bloquear el hilo principal.
- **Validaciones avanzadas:** Sistema extensible de validaciones reutilizables.
- **Manejo detallado de errores:** Información precisa sobre filas y columnas con errores.
- **Feedback visual:** Barra de progreso y mensajes de estado durante la importación.
- **Plantillas con ejemplos:** Generación de plantillas Excel con datos de ejemplo y hojas de instrucciones.
- **Procesamiento por lotes:** Maneja archivos grandes dividiéndolos en lotes para mejor rendimiento.

## Componentes del Sistema

### 1. ExcelImportTemplate

Componente base reutilizable para mostrar un diálogo de importación de datos Excel.

**Ubicación:** `frontend/src/components/common/ExcelImportTemplate.js`

**Características:**
- Diálogo modal con opciones para descargar plantilla y subir archivo
- Validación de extensión y tamaño de archivo
- Procesamiento asíncrono con Web Workers
- Indicador de progreso detallado
- Manejo y visualización de errores
- Soporte para plantillas con múltiples hojas y datos de ejemplo

**Props:**
- `title`: Título del diálogo
- `open`: Estado de apertura del diálogo
- `onClose`: Función para cerrar el diálogo
- `onComplete`: Función a ejecutar al completar el proceso
- `excelHeaders`: Definición de columnas para el Excel
- `processDataCallback`: Función para procesar los datos validados
- `generateTemplateCallback`: Función personalizada para generar la plantilla
- `templateFileName`: Nombre del archivo de plantilla
- `validateRow`: Función para validar cada fila
- `instructionSheets`: Hojas adicionales para instrucciones
- `additionalContent`: Contenido adicional para el diálogo
- `exampleData`: Datos de ejemplo para la plantilla

### 2. Utilidades de Validación

Conjunto de funciones reutilizables para validar datos durante la importación.

**Ubicación:** `frontend/src/utils/validationUtils.js`

**Funciones Disponibles:**
- `isRequired`: Valida que un campo sea obligatorio
- `isNumber`: Valida que un valor sea numérico (con opciones min/max)
- `isDate`: Valida fechas en formato DD/MM/AAAA
- `isValidOption`: Valida que un valor esté dentro de un conjunto de opciones
- `isEmail`: Valida formatos de correo electrónico
- `isCUIT`: Valida CUIT argentino con dígito verificador
- `isDNI`: Valida DNI argentino
- `isBooleanText`: Valida valores booleanos en texto (SI/NO, TRUE/FALSE, 1/0)
- `validateSchema`: Valida un objeto completo contra un esquema de validación
- `validateAll`: Ejecuta múltiples validaciones y recopila todos los errores
- `parseDate`: Convierte fechas en formato texto a objetos Date
- `parseBooleanText`: Convierte valores booleanos en texto a tipo boolean

### 3. Web Worker para Procesamiento Excel

Worker dedicado para procesar datos Excel en segundo plano.

**Ubicación:** `frontend/src/workers/excelWorker.js`

**Características:**
- Procesamiento por lotes para evitar bloqueos
- Validación asíncrona de datos
- Transformación de datos
- Informe de progreso detallado
- Manejo robusto de errores

## Implementaciones Específicas

El sistema incluye importadores específicos para diferentes entidades:

1. **PersonalBulkImporter:** Importación de personal
2. **ClienteBulkImporter:** Importación de clientes
3. **SiteBulkImporter:** Importación de sitios
4. **ViajeBulkImporter:** Importación de viajes
5. **TramoBulkImporter:** Importación de tramos

## Flujo de Trabajo

1. **Inicio:** El usuario abre el diálogo de importación
2. **Descarga de Plantilla:** Genera y descarga una plantilla Excel con:
   - Encabezados para todos los campos requeridos
   - Datos de ejemplo
   - Hojas de instrucciones adicionales
3. **Carga de Archivo:** El usuario sube el archivo completado
4. **Validación:** El sistema valida el formato y contenido:
   - Para archivos pequeños: validación síncrona
   - Para archivos grandes: validación en Web Worker
5. **Procesamiento:** Los datos válidos se procesan y envían al servidor
6. **Respuesta:** Se muestra un mensaje de éxito o errores detallados

## Mejores Prácticas para Implementaciones

### Creación de un Nuevo Importador

1. **Crear el componente importador extendiendo `ExcelImportTemplate`:**

```javascript
import React, { useMemo } from 'react';
import ExcelImportTemplate from '../common/ExcelImportTemplate';
import validationUtils from '../../utils/validationUtils';

const MiNuevoImportador = ({ open, onClose, onComplete }) => {
  // Definir cabeceras
  const EXCEL_HEADERS = [
    { field: 'campo1', label: 'Campo 1*', required: true },
    { field: 'campo2', label: 'Campo 2', required: false },
  ];
  
  // Definir esquema de validación
  const validationSchema = useMemo(() => ({
    campo1: {
      label: 'Campo 1',
      validators: [
        (value, fieldName, rowIndex) => validationUtils.isRequired(value, fieldName, rowIndex)
      ]
    }
  }), []);
  
  // Validación usando el esquema
  const validateRow = (row, index) => {
    return validationUtils.validateSchema(row, index, validationSchema);
  };
  
  // Procesar datos
  const processExcelData = async (data) => {
    // Implementar lógica de procesamiento
  };
  
  return (
    <ExcelImportTemplate
      title="Mi Importación"
      open={open}
      onClose={onClose}
      onComplete={onComplete}
      excelHeaders={EXCEL_HEADERS}
      processDataCallback={processExcelData}
      validateRow={validateRow}
      // Otras propiedades...
    />
  );
};

export default MiNuevoImportador;
```

2. **Definir validaciones usando el esquema:**

```javascript
const validationSchema = {
  campo1: {
    label: 'Nombre del Campo',
    validators: [
      // Array de funciones de validación
      (value, fieldName, rowIndex) => validationUtils.isRequired(value, fieldName, rowIndex),
      (value, fieldName, rowIndex) => validationUtils.isNumber(value, fieldName, rowIndex, { min: 0 })
    ]
  }
};
```

3. **Crear hojas de instrucciones:**

```javascript
const instructionSheets = [
  {
    name: 'Instrucciones',
    data: [
      ['INSTRUCCIONES PARA IMPORTACIÓN'],
      ['1. Complete los datos en la hoja "Datos"'],
      ['2. Los campos marcados con * son obligatorios']
    ],
    columnWidths: [{ wch: 80 }]
  }
];
```

## Consideraciones de Rendimiento

- Para archivos con más de 1000 filas, considere aumentar el tamaño del lote en el Web Worker
- Monitoree el uso de memoria en el navegador durante importaciones grandes
- Considere implementar límites razonables en el tamaño de archivo (actualmente 10MB)

## Ejemplo de Uso en un Componente Padre

```javascript
import React, { useState } from 'react';
import Button from '@mui/material/Button';
import MiImportador from './MiImportador';

const ComponentePadre = () => {
  const [open, setOpen] = useState(false);
  
  const handleImportComplete = () => {
    // Actualizar datos o estado tras importación exitosa
  };
  
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Importar Datos
      </Button>
      
      <MiImportador
        open={open}
        onClose={() => setOpen(false)}
        onComplete={handleImportComplete}
      />
    </>
  );
};
```

## Solución de Problemas

### Errores Comunes

1. **"El archivo no contiene hojas de cálculo"**
   - Asegúrese de que el archivo Excel tenga al menos una hoja

2. **"Formato de archivo Excel inválido"**
   - Verifique que el archivo sea un Excel válido (.xlsx, .xls)
   - Intente guardar el archivo nuevamente en un formato más reciente

3. **"Error en Web Worker"**
   - Si ocurren problemas con el Web Worker, el sistema recurrirá automáticamente a procesamiento síncrono

### Rendimiento

Si hay problemas de rendimiento durante la importación:

1. Reduzca la cantidad de datos del archivo
2. Simplifique las validaciones
3. Aumente el tamaño del lote en el Web Worker:
   ```javascript
   workerRef.current.postMessage({
     action: 'validate',
     data: jsonData,
     validateRowFn: validateRow ? validateRow.toString() : null,
     batchSize: 100 // Aumentar tamaño de lote
   });
   ```

## Contribución y Mejoras Futuras

- Agregar soporte para formateo condicional en las plantillas Excel
- Implementar exportación de datos con el mismo componente
- Mejorar la validación de las relaciones entre entidades
- Añadir soporte para archivos CSV y otros formatos 