import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import ExcelImportTemplate from '../common/ExcelImportTemplate';
import useNotification from '../../hooks/useNotification';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Definición de las cabeceras del Excel
const EXCEL_HEADERS = [
  { field: 'nombre', label: 'Nombre*', required: true },
  { field: 'razonSocial', label: 'Razón Social*', required: true },
  { field: 'cuit', label: 'CUIT*', required: true },
  { field: 'telefono', label: 'Teléfono', required: false },
  { field: 'email', label: 'Email', required: false },
  { field: 'direccion', label: 'Dirección', required: false },
  { field: 'localidad', label: 'Localidad', required: false },
  { field: 'provincia', label: 'Provincia', required: false },
  { field: 'codigo', label: 'Código Interno', required: false },
  { field: 'esTransportista', label: 'Es Transportista (true/false)', required: false }
];

/**
 * Componente para importación masiva de empresas desde Excel
 * @component
 */
const EmpresaBulkImporter = ({ open, onClose, onComplete }) => {
  const { showNotification } = useNotification();
  
  // Validación de cada fila del Excel
  const validateRow = (row, index) => {
    const errors = [];
    
    // Validar campos requeridos
    EXCEL_HEADERS.forEach(header => {
      if (header.required && !row[header.field]) {
        errors.push(`Fila ${index + 1}: El campo ${header.label} es requerido`);
      }
    });
    
    // Validar formato de CUIT
    if (row.cuit) {
      const cuitRegex = /^\d{2}-\d{8}-\d{1}$/;
      if (!cuitRegex.test(row.cuit)) {
        errors.push(`Fila ${index + 1}: El CUIT debe tener formato XX-XXXXXXXX-X`);
      }
    }
    
    // Validar formato de email
    if (row.email) {
      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(row.email)) {
        errors.push(`Fila ${index + 1}: El email tiene un formato inválido`);
      }
    }
    
    // Validar esTransportista como booleano
    if (row.esTransportista && typeof row.esTransportista === 'string') {
      const valor = row.esTransportista.toLowerCase();
      if (valor !== 'true' && valor !== 'false' && valor !== 'verdadero' && valor !== 'falso' && valor !== 'sí' && valor !== 'si' && valor !== 'no') {
        errors.push(`Fila ${index + 1}: El campo 'Es Transportista' debe ser true o false`);
      }
    }
    
    return errors;
  };

  // Procesar datos del Excel para enviar al servidor
  const processExcelData = async (data) => {
    try {
      // Procesar y preparar los datos
      const processedData = data.map(row => {
        // Convertir esTransportista a booleano
        let esTransportista = false;
        if (row.esTransportista) {
          const valor = row.esTransportista.toString().toLowerCase();
          esTransportista = valor === 'true' || valor === 'verdadero' || valor === 'sí' || valor === 'si';
        }
        
        return {
          nombre: row.nombre,
          razonSocial: row.razonSocial,
          cuit: row.cuit,
          telefono: row.telefono || '',
          email: row.email || '',
          direccion: row.direccion || '',
          localidad: row.localidad || '',
          provincia: row.provincia || '',
          codigo: row.codigo || '',
          esTransportista: esTransportista
        };
      });
      
      // Enviar datos al servidor
      const response = await axios.post(`${API_URL}/api/empresas/bulk`, processedData);
      
      if (response.data && response.data.success) {
        showNotification(`${response.data.insertados} empresas importadas correctamente`, 'success');
        
        if (response.data.errores && response.data.errores.length > 0) {
          console.error('Algunos registros no pudieron ser importados:', response.data.errores);
          showNotification(`${response.data.errores.length} registros no pudieron importarse. Revise la consola para más detalles.`, 'warning');
        }
        
        if (onComplete) {
          onComplete();
        }
        
        onClose();
      } else {
        showNotification('Error al importar empresas', 'error');
      }
    } catch (error) {
      console.error('Error en la importación de empresas:', error);
      showNotification('Error al procesar la importación', 'error');
    }
  };

  // Instrucciones para la plantilla
  const instructionSheets = [
    {
      name: 'Instrucciones',
      data: [
        ['INSTRUCCIONES PARA IMPORTACIÓN DE EMPRESAS'],
        [''],
        ['1. Complete los datos en la hoja "Datos"'],
        ['2. Los campos marcados con asterisco (*) son obligatorios'],
        ['3. El CUIT debe tener el formato XX-XXXXXXXX-X'],
        ['4. El campo "Es Transportista" puede contener: true/false, verdadero/falso, sí/no'],
        ['5. Si no completa el campo "Es Transportista", se asumirá como "false"'],
      ],
      columnWidths: [{ wch: 80 }]
    }
  ];

  // Generar datos de ejemplo para la plantilla
  const exampleData = [
    {
      nombre: 'Transportes Ejemplo S.A.',
      razonSocial: 'Transportes Ejemplo Sociedad Anónima',
      cuit: '30-12345678-9',
      telefono: '+54 11 4321-5678',
      email: 'contacto@transportesejemplo.com.ar',
      direccion: 'Av. Corrientes 1234',
      localidad: 'CABA',
      provincia: 'Buenos Aires',
      codigo: 'TE001',
      esTransportista: 'true'
    },
    {
      nombre: 'Distribuidora XYZ',
      razonSocial: 'Distribuidora XYZ S.R.L.',
      cuit: '33-87654321-0',
      telefono: '+54 351 678-9012',
      email: 'info@distribuidoraxyz.com.ar',
      direccion: 'Ruta 9 Km 690',
      localidad: 'Córdoba',
      provincia: 'Córdoba',
      codigo: 'DXYZ',
      esTransportista: 'false'
    }
  ];

  return (
    <ExcelImportTemplate
      title="Importación de Empresas mediante Excel"
      open={open}
      onClose={onClose}
      onComplete={onComplete}
      excelHeaders={EXCEL_HEADERS}
      processDataCallback={processExcelData}
      templateFileName="Plantilla_Importacion_Empresas.xlsx"
      validateRow={validateRow}
      instructionSheets={instructionSheets}
      exampleData={exampleData}
    />
  );
};

EmpresaBulkImporter.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onComplete: PropTypes.func
};

export default EmpresaBulkImporter; 