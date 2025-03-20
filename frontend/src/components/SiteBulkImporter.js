import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import ExcelImportTemplate from './common/ExcelImportTemplate';
import useNotification from '../hooks/useNotification';
import axios from 'axios';
import logger from '../utils/logger';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Definición de las cabeceras del Excel
const EXCEL_HEADERS = [
  { field: 'site', label: 'Site*', required: true },
  { field: 'coordenadas', label: 'Coordenadas (lat,lng)*', required: true },
  { field: 'direccion', label: 'Dirección', required: false },
  { field: 'localidad', label: 'Localidad', required: false },
  { field: 'provincia', label: 'Provincia', required: false },
  { field: 'tipo', label: 'Tipo', required: false }
];

/**
 * Componente optimizado para importación masiva de sites desde Excel
 * @component
 */
const SiteBulkImporter = ({ open, onClose, cliente, onComplete }) => {
  const { showNotification } = useNotification();
  
  // Función para obtener dirección a partir de coordenadas
  const obtenerDireccion = useCallback(async (lat, lng) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/proxy/geocode`, {
        params: { lat, lng },
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const { address } = response.data;
      return {
        direccion: address.road ? `${address.road} ${address.house_number || ''}`.trim() : '',
        localidad: address.city || address.town || address.village || '',
        provincia: address.state || ''
      };
    } catch (error) {
      logger.error('Error en geocodificación:', error);
      return { direccion: '', localidad: '', provincia: '' };
    }
  }, []);

  // Validación de cada fila del Excel
  const validateRow = (row, index) => {
    const errors = [];
    
    // Validar campos requeridos
    EXCEL_HEADERS.forEach(header => {
      if (header.required && !row[header.field]) {
        errors.push(`Fila ${index + 1}: El campo ${header.label} es requerido`);
      }
    });
    
    // Validar formato de coordenadas (lat,lng)
    if (row.coordenadas) {
      const coords = row.coordenadas.split(',');
      if (coords.length !== 2) {
        errors.push(`Fila ${index + 1}: El formato de coordenadas debe ser "latitud,longitud"`);
      } else {
        const [lat, lng] = coords.map(n => parseFloat(n.trim()));
        if (isNaN(lat) || isNaN(lng)) {
          errors.push(`Fila ${index + 1}: Las coordenadas deben ser números válidos`);
        }
        if (lat < -90 || lat > 90) {
          errors.push(`Fila ${index + 1}: La latitud debe estar entre -90 y 90`);
        }
        if (lng < -180 || lng > 180) {
          errors.push(`Fila ${index + 1}: La longitud debe estar entre -180 y 180`);
        }
      }
    }
    
    return errors;
  };

  // Procesar datos del Excel para enviar al servidor
  const processExcelData = async (data) => {
    try {
      // Procesar y preparar los datos
      const processedSites = [];
      
      for (const row of data) {
        try {
          const [lat, lng] = row.coordenadas.split(',').map(n => parseFloat(n.trim()));
          
          // Si no tiene dirección/localidad/provincia, intentar obtenerlas
          let direccion = row.direccion || '';
          let localidad = row.localidad || '';
          let provincia = row.provincia || '';
          
          if (!direccion || !localidad || !provincia) {
            const geocodeData = await obtenerDireccion(lat, lng);
            direccion = row.direccion || geocodeData.direccion;
            localidad = row.localidad || geocodeData.localidad;
            provincia = row.provincia || geocodeData.provincia;
          }
          
          processedSites.push({
            site: row.site,
            cliente,
            coordenadas: { lat, lng },
            direccion,
            localidad,
            provincia,
            tipo: row.tipo || 'CLIENTE'
          });
        } catch (err) {
          logger.error(`Error procesando site ${row.site}:`, err);
        }
      }
      
      if (processedSites.length === 0) {
        throw new Error('No hay sites válidos para importar');
      }
      
      // Enviar datos al servidor
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/sites/bulk`,
        { sites: processedSites },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const exitosos = response.data.insertados || 0;
      const errores = response.data.errores || [];
      
      if (errores.length > 0) {
        showNotification(
          `Importación completada con ${errores.length} errores. Se importaron ${exitosos} sites.`, 
          'warning'
        );
        console.error('Errores en importación:', errores);
      } else {
        showNotification(`${exitosos} sites importados correctamente`, 'success');
      }
      
      if (onComplete) {
        onComplete();
      }
      
      onClose();
    } catch (error) {
      logger.error('Error en importación de sites:', error);
      showNotification('Error al procesar la importación: ' + error.message, 'error');
    }
  };

  // Instrucciones para la plantilla
  const instructionSheets = [
    {
      name: 'Instrucciones',
      data: [
        ['INSTRUCCIONES PARA IMPORTACIÓN DE SITES'],
        [''],
        ['1. Complete los datos en la hoja "Datos"'],
        ['2. Los campos marcados con asterisco (*) son obligatorios'],
        ['3. El formato de coordenadas debe ser "latitud,longitud" (ejemplo: -34.603722,-58.381592)'],
        ['4. Si no proporciona dirección, localidad o provincia, el sistema intentará obtenerlas automáticamente'],
        ['5. El campo "Tipo" puede ser: CLIENTE, PLANTA, DEPÓSITO, PUERTO (por defecto se usará CLIENTE)']
      ],
      columnWidths: [{ wch: 80 }]
    },
    {
      name: 'Formatos',
      data: [
        ['CAMPO', 'FORMATO', 'DESCRIPCIÓN'],
        ['Site*', 'Texto', 'Nombre del sitio (debe ser único)'],
        ['Coordenadas*', 'lat,lng', 'Coordenadas geográficas en formato decimal (latitud,longitud)'],
        ['Dirección', 'Texto', 'Dirección física del sitio (se autocompletará si está vacío)'],
        ['Localidad', 'Texto', 'Localidad o ciudad (se autocompletará si está vacío)'],
        ['Provincia', 'Texto', 'Provincia o estado (se autocompletará si está vacío)'],
        ['Tipo', 'Texto', 'Tipo de sitio: CLIENTE, PLANTA, DEPÓSITO, PUERTO, etc.']
      ],
      columnWidths: [{ wch: 15 }, { wch: 20 }, { wch: 65 }]
    }
  ];

  // Generar datos de ejemplo para la plantilla
  const exampleData = [
    {
      site: 'Planta Centro',
      coordenadas: '-34.603722,-58.381592',
      direccion: 'Av. Corrientes 456',
      localidad: 'CABA',
      provincia: 'Buenos Aires',
      tipo: 'PLANTA'
    },
    {
      site: 'Depósito Norte',
      coordenadas: '-34.550722,-58.463592',
      direccion: 'Av. General Paz 1500',
      localidad: 'Vicente López',
      provincia: 'Buenos Aires',
      tipo: 'DEPÓSITO'
    }
  ];

  return (
    <ExcelImportTemplate
      title="Importación de Sites mediante Excel"
      open={open}
      onClose={onClose}
      onComplete={onComplete}
      excelHeaders={EXCEL_HEADERS}
      processDataCallback={processExcelData}
      templateFileName="Plantilla_Importacion_Sites.xlsx"
      validateRow={validateRow}
      instructionSheets={instructionSheets}
      exampleData={exampleData}
    />
  );
};

SiteBulkImporter.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  cliente: PropTypes.string.isRequired,
  onComplete: PropTypes.func
};

export default SiteBulkImporter;
