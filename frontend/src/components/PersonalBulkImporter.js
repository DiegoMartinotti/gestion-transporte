import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import ExcelImportTemplate from './common/ExcelImportTemplate';
import useNotification from '../hooks/useNotification';
import axios from 'axios';
import { format } from 'date-fns';
import validationUtils from '../utils/validationUtils';

const API_URL = process.env.REACT_APP_API_URL;

// Definición de las columnas del Excel
const EXCEL_HEADERS = [
  { field: 'nombre', label: 'Nombre*', required: true },
  { field: 'apellido', label: 'Apellido*', required: true },
  { field: 'dni', label: 'DNI*', required: true },
  { field: 'telefono', label: 'Teléfono', required: false },
  { field: 'email', label: 'Email', required: false },
  { field: 'direccion', label: 'Dirección', required: false },
  { field: 'fechaNacimiento', label: 'Fecha de Nacimiento (DD/MM/AAAA)', required: false },
  { field: 'empresaId', label: 'ID de Empresa*', required: true },
  { field: 'cargo', label: 'Cargo', required: false },
  { field: 'licenciaConducir', label: 'Licencia de Conducir', required: false },
  { field: 'activo', label: 'Activo (SI/NO)*', required: true },
  { field: 'observaciones', label: 'Observaciones', required: false }
];

/**
 * Componente optimizado para importación masiva de personal desde Excel
 * @component
 */
const PersonalBulkImporter = ({ open, onClose, onComplete, empresas }) => {
  const { showNotification } = useNotification();
  const [importProgress, setImportProgress] = useState(0);
  
  // Crear un mapa de empresas para búsquedas rápidas
  const empresasMap = useMemo(() => {
    const map = {};
    if (Array.isArray(empresas)) {
      empresas.forEach(empresa => {
        map[empresa._id] = empresa;
      });
    }
    return map;
  }, [empresas]);
  
  // Definir esquema de validación usando las utilidades
  const validationSchema = useMemo(() => ({
    nombre: {
      label: 'Nombre',
      validators: [
        (value, fieldName, rowIndex) => validationUtils.isRequired(value, fieldName, rowIndex)
      ]
    },
    apellido: {
      label: 'Apellido',
      validators: [
        (value, fieldName, rowIndex) => validationUtils.isRequired(value, fieldName, rowIndex)
      ]
    },
    dni: {
      label: 'DNI',
      validators: [
        (value, fieldName, rowIndex) => validationUtils.isRequired(value, fieldName, rowIndex),
        (value, fieldName, rowIndex) => validationUtils.isDNI(value, fieldName, rowIndex)
      ]
    },
    email: {
      label: 'Email',
      validators: [
        (value, fieldName, rowIndex) => validationUtils.isEmail(value, fieldName, rowIndex, { allowEmpty: true })
      ]
    },
    fechaNacimiento: {
      label: 'Fecha de Nacimiento',
      validators: [
        (value, fieldName, rowIndex) => validationUtils.isDate(value, fieldName, rowIndex, { 
          allowEmpty: true,
          maxDate: new Date() // No permitir fechas futuras
        })
      ]
    },
    empresaId: {
      label: 'ID de Empresa',
      validators: [
        (value, fieldName, rowIndex) => validationUtils.isRequired(value, fieldName, rowIndex),
        (value, fieldName, rowIndex) => {
          if (!empresasMap[value]) {
            return `Fila ${rowIndex + 1}: La empresa con ID "${value}" no existe`;
          }
          return null;
        }
      ]
    },
    activo: {
      label: 'Activo',
      validators: [
        (value, fieldName, rowIndex) => validationUtils.isRequired(value, fieldName, rowIndex),
        (value, fieldName, rowIndex) => validationUtils.isBooleanText(value, fieldName, rowIndex)
      ]
    }
  }), [empresasMap]);
  
  // Validación de cada fila del Excel
  const validateRow = (row, index) => {
    return validationUtils.validateSchema(row, index, validationSchema);
  };

  // Procesar datos del Excel para enviar al servidor
  const processExcelData = async (data) => {
    try {
      // Procesar y preparar los datos
      const processedData = data.map(row => {
        // Convertir activo a booleano usando la utilidad
        const activo = validationUtils.parseBooleanText(row.activo);
        
        // Convertir fecha de nacimiento usando la utilidad
        const fechaNacimiento = validationUtils.parseDate(row.fechaNacimiento);
        
        return {
          nombre: row.nombre,
          apellido: row.apellido,
          dni: row.dni,
          telefono: row.telefono || '',
          email: row.email || '',
          direccion: row.direccion || '',
          fechaNacimiento: fechaNacimiento ? fechaNacimiento.toISOString() : null,
          empresaId: row.empresaId,
          cargo: row.cargo || '',
          licenciaConducir: row.licenciaConducir || '',
          activo: activo,
          observaciones: row.observaciones || ''
        };
      });
      
      // Enviar datos al servidor con control de progreso
      const response = await axios.post(`${API_URL}/api/personal/bulk`, processedData, {
        onUploadProgress: progressEvent => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setImportProgress(percentCompleted);
        }
      });
      
      if (response.data && response.data.success) {
        showNotification(`${response.data.insertados} registros de personal importados correctamente`, 'success');
        
        if (response.data.errores && response.data.errores.length > 0) {
          console.error('Algunos registros no pudieron ser importados:', response.data.errores);
          showNotification(`${response.data.errores.length} registros no pudieron importarse. Revise la consola para más detalles.`, 'warning');
        }
        
        if (onComplete) {
          onComplete();
        }
        
        onClose();
      } else {
        showNotification('Error al importar personal', 'error');
      }
    } catch (error) {
      console.error('Error en la importación de personal:', error);
      showNotification('Error al procesar la importación', 'error');
    }
  };

  // Instrucciones para la plantilla - memoizado para evitar recálculos
  const instructionSheets = useMemo(() => [
    {
      name: 'Empresas',
      data: [
        ['ID', 'Nombre', 'Tipo'],
        ...(Array.isArray(empresas) ? empresas.map(empresa => [
          empresa._id,
          empresa.nombre,
          empresa.esTransportista ? 'Transportista' : 'Cliente/Proveedor'
        ]) : [])
      ],
      columnWidths: [{ wch: 24 }, { wch: 40 }, { wch: 20 }]
    },
    {
      name: 'Instrucciones',
      data: [
        ['INSTRUCCIONES PARA IMPORTACIÓN DE PERSONAL'],
        [''],
        ['1. Complete los datos en la hoja "Datos"'],
        ['2. Los campos marcados con asterisco (*) son obligatorios'],
        ['3. El DNI debe tener 7 u 8 dígitos numéricos, sin puntos'],
        ['4. Las fechas deben estar en formato DD/MM/AAAA'],
        ['5. El campo "Activo" acepta: SI/NO, TRUE/FALSE, 1/0'],
        ['6. Consulte la hoja "Empresas" para los IDs válidos de empresas'],
        ['7. Los campos no obligatorios pueden dejarse en blanco']
      ],
      columnWidths: [{ wch: 80 }]
    },
    {
      name: 'Formatos',
      data: [
        ['CAMPO', 'FORMATO', 'DESCRIPCIÓN'],
        ['Nombre*', 'Texto', 'Nombre del empleado. Campo obligatorio.'],
        ['Apellido*', 'Texto', 'Apellido del empleado. Campo obligatorio.'],
        ['DNI*', 'Numérico (7-8 dígitos)', 'Documento Nacional de Identidad. Solo números, sin puntos. Campo obligatorio.'],
        ['Teléfono', 'Texto', 'Número de teléfono del empleado. Preferentemente con código de área.'],
        ['Email', 'Texto (formato email)', 'Correo electrónico del empleado. Debe tener formato válido (ejemplo@dominio.com).'],
        ['Dirección', 'Texto', 'Dirección completa del empleado.'],
        ['Fecha de Nacimiento', 'DD/MM/AAAA', 'Fecha de nacimiento en formato día/mes/año. Ejemplo: 15/05/1985.'],
        ['ID de Empresa*', 'Texto (ID MongoDB)', 'Identificador único de la empresa a la que pertenece el empleado. Ver hoja "Empresas". Campo obligatorio.'],
        ['Cargo', 'Texto', 'Cargo o puesto del empleado. Valores recomendados: Conductor, Administrativo, Mecánico, Supervisor, Otro.'],
        ['Licencia de Conducir', 'Texto', 'Número o categoría de licencia de conducir del empleado.'],
        ['Activo (SI/NO)*', 'Texto (SI/NO)', 'Estado del empleado. Valores aceptados: SI, NO, TRUE, FALSE, 1, 0. Campo obligatorio.'],
        ['Observaciones', 'Texto', 'Notas adicionales sobre el empleado.']
      ],
      columnWidths: [{ wch: 25 }, { wch: 25 }, { wch: 80 }]
    }
  ], [empresas]);

  // Generar datos de ejemplo para la plantilla
  const exampleData = useMemo(() => {
    const primeraEmpresa = Array.isArray(empresas) && empresas.length > 0 ? empresas[0]._id : 'ID_EMPRESA';
    const segundaEmpresa = Array.isArray(empresas) && empresas.length > 1 ? empresas[1]._id : primeraEmpresa;
    
    return [
      {
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '30123456',
        telefono: '1155667788',
        email: 'juan.perez@ejemplo.com',
        direccion: 'Av. Ejemplo 123',
        fechaNacimiento: '15/05/1985',
        empresaId: primeraEmpresa,
        cargo: 'Chofer',
        licenciaConducir: 'B1',
        activo: 'SI',
        observaciones: 'Ejemplo de observación'
      },
      {
        nombre: 'María',
        apellido: 'García',
        dni: '28765432',
        telefono: '1198765432',
        email: 'maria.garcia@ejemplo.com',
        direccion: 'Calle Ejemplo 456',
        fechaNacimiento: '22/07/1982',
        empresaId: segundaEmpresa,
        cargo: 'Administrativo',
        licenciaConducir: '',
        activo: 'SI',
        observaciones: 'Segundo ejemplo'
      }
    ];
  }, [empresas]);

  return (
    <ExcelImportTemplate
      title="Importación de Personal mediante Excel"
      open={open}
      onClose={onClose}
      onComplete={onComplete}
      excelHeaders={EXCEL_HEADERS}
      processDataCallback={processExcelData}
      templateFileName="Plantilla_Importacion_Personal.xlsx"
      validateRow={validateRow}
      instructionSheets={instructionSheets}
      exampleData={exampleData}
    />
  );
};

PersonalBulkImporter.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onComplete: PropTypes.func,
  empresas: PropTypes.array
};

PersonalBulkImporter.defaultProps = {
  empresas: []
};

export default PersonalBulkImporter; 