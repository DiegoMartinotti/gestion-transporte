import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ExcelImportTemplate from './common/ExcelImportTemplate';
import useNotification from '../hooks/useNotification';
import axios from 'axios';
import { format } from 'date-fns';
import logger from '../utils/logger';

// Definición de las cabeceras del Excel
const EXCEL_HEADERS = [
  { field: 'dt', label: 'DT*', required: true },
  { field: 'fecha', label: 'Fecha (DD/MM/YYYY)*', required: true },
  { field: 'origen', label: 'Origen*', required: true },
  { field: 'destino', label: 'Destino*', required: true },
  { field: 'tipoTramo', label: 'Tipo Tramo', required: false },
  { field: 'tipoUnidad', label: 'Tipo Unidad', required: false },
  { field: 'paletas', label: 'Paletas', required: false },
  { field: 'observaciones', label: 'Observaciones', required: false }
];

/**
 * Componente para importación masiva de viajes desde Excel
 * @component
 */
const ViajeBulkImporter = ({ open, onClose, cliente, onComplete, sites = [] }) => {
  const { showNotification } = useNotification();
  
  // Crear mapa de sitios para búsquedas rápidas
  const sitesMap = {};
  sites.forEach(site => {
    sitesMap[site.Site.toLowerCase()] = site;
  });

    // Función para convertir números con formato español/europeo (coma decimal) a formato válido para JavaScript
    const parseSpanishNumber = (value) => {
        if (!value) return 0;
        
        // Reemplazar coma por punto para el separador decimal
        const normalizedValue = String(value).replace(',', '.');
        return parseFloat(normalizedValue) || 0;
    };

  // Validación de cada fila del Excel
  const validateRow = (row, index) => {
    const errors = [];
    
    // Validar campos requeridos
    EXCEL_HEADERS.forEach(header => {
      if (header.required && !row[header.field]) {
        errors.push(`Fila ${index + 1}: El campo ${header.label} es requerido`);
      }
    });
    
    // Validar sitios existentes
    if (row.origen) {
      const origenEncontrado = Object.values(sitesMap).find(
        site => site.Site.toLowerCase() === row.origen.toLowerCase()
      );
      if (!origenEncontrado) {
        errors.push(`Fila ${index + 1}: Sitio de origen "${row.origen}" no encontrado`);
      }
    }
    
    if (row.destino) {
      const destinoEncontrado = Object.values(sitesMap).find(
        site => site.Site.toLowerCase() === row.destino.toLowerCase()
      );
      if (!destinoEncontrado) {
        errors.push(`Fila ${index + 1}: Sitio de destino "${row.destino}" no encontrado`);
      }
    }
    
    // Validar formato de fecha
    if (row.fecha) {
      const fechaRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      if (!fechaRegex.test(row.fecha)) {
        errors.push(`Fila ${index + 1}: Formato de fecha inválido. Use DD/MM/YYYY`);
      }
    }
    
    // Validar valores numéricos
    if (row.paletas && isNaN(parseSpanishNumber(row.paletas))) {
      errors.push(`Fila ${index + 1}: El valor de paletas debe ser un número`);
    }
    
    return errors;
  };

  // Procesar datos del Excel para enviar al servidor
  const processExcelData = async (data) => {
    try {
      // Procesar y preparar los datos
      const processedData = data.map(row => {
        // Encontrar IDs de origen y destino
        const origen = Object.values(sitesMap).find(
          site => site.Site.toLowerCase() === row.origen.toLowerCase()
        );
        
        const destino = Object.values(sitesMap).find(
          site => site.Site.toLowerCase() === row.destino.toLowerCase()
        );

            // Convertir fecha de DD/MM/YYYY a YYYY-MM-DD
        let fechaFormateada = row.fecha;
        if (row.fecha && row.fecha.includes('/')) {
          const [dia, mes, anio] = row.fecha.split('/');
                fechaFormateada = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
            }

            return {
          dt: row.dt,
                fecha: fechaFormateada,
          origen: origen?._id,
          origenNombre: row.origen,
          destino: destino?._id,
          destinoNombre: row.destino,
          tipoTramo: row.tipoTramo || 'TRMC',
          tipoUnidad: row.tipoUnidad || 'Sider',
          paletas: parseSpanishNumber(row.paletas),
          observaciones: row.observaciones || ''
            };
        });

      // Dividir en lotes para evitar problemas de tamaño
            const BATCH_SIZE = 20;
            const batches = [];
      
      for (let i = 0; i < processedData.length; i += BATCH_SIZE) {
        batches.push(processedData.slice(i, i + BATCH_SIZE));
            }

            let exitosos = 0;
            let errores = [];

            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                try {
                    // Verificación de token eliminada, manejada por cookies

                    const response = await axios.post(
                        '/api/viajes/bulk',
                        { 
                            cliente, 
                            viajes: batch
                        },
                        { 
                            headers: { 
                                // Authorization: `Bearer ${token}`, // No necesario con cookies
                                'Content-Type': 'application/json'
                            },
                            timeout: 30000
                        }
                    );

          exitosos += response.data.exitosos || 0;
          if (response.data.errores && response.data.errores.length > 0) {
                        errores = [...errores, ...response.data.errores];
                    }
                } catch (error) {
          logger.error(`Error procesando lote ${i+1}:`, error);
                    batch.forEach((viaje, index) => {
                        errores.push({
                            indice: i * BATCH_SIZE + index,
                            dt: viaje.dt,
                            error: error.message
                        });
                    });
                }
            }

      const resultMessage = `Importación completada: ${exitosos} viajes importados exitosamente, ${errores.length} con errores`;
            
            if (errores.length > 0) {
        showNotification(
          `Importación completada con ${errores.length} errores. Se importaron ${exitosos} viajes.`, 
          'warning'
        );
        console.error('Errores en importación:', errores);
            } else {
        showNotification(resultMessage, 'success');
      }
      
      if (onComplete) {
        onComplete();
      }
      
      onClose();
    } catch (error) {
      logger.error('Error en importación:', error);
      showNotification('Error al procesar la importación: ' + error.message, 'error');
    }
  };

  // Instrucciones para la plantilla
  const instructionSheets = [
    {
      name: 'Sitios',
      data: [
        ['ID', 'Nombre', 'Tipo'],
        ...sites.map(site => [
          site._id,
          site.Site,
          site.Tipo || ''
        ])
      ],
      columnWidths: [{ wch: 24 }, { wch: 40 }, { wch: 15 }]
    },
    {
      name: 'Instrucciones',
      data: [
        ['INSTRUCCIONES PARA IMPORTACIÓN DE VIAJES'],
        [''],
        ['1. Complete los datos en la hoja "Datos"'],
        ['2. Los campos marcados con asterisco (*) son obligatorios'],
        ['3. Utilice los nombres exactos de los sitios como aparecen en la hoja "Sitios"'],
        ['4. Las fechas deben estar en formato DD/MM/YYYY'],
        ['5. Si las paletas tienen decimales, utilice punto (.) como separador'],
        [''],
        ['VALORES TÍPICOS:'],
        ['- Tipo Tramo: TRMC (Tramo Completo) o TRMI (Tramo Intermedio)'],
        ['- Tipo Unidad: Sider, Bitren, Carreta, Cisterna, Otro']
      ],
      columnWidths: [{ wch: 80 }]
    },
    {
      name: 'Formatos',
      data: [
        ['CAMPO', 'FORMATO', 'DESCRIPCIÓN'],
        ['DT*', 'Texto', 'Número de documento de transporte'],
        ['Fecha*', 'DD/MM/YYYY', 'Fecha del viaje en formato día/mes/año'],
        ['Origen*', 'Texto', 'Nombre exacto del sitio de origen como aparece en la hoja "Sitios"'],
        ['Destino*', 'Texto', 'Nombre exacto del sitio de destino como aparece en la hoja "Sitios"'],
        ['Tipo Tramo', 'TRMC/TRMI', 'Tipo de tramo (TRMC: Completo, TRMI: Intermedio)'],
        ['Tipo Unidad', 'Texto', 'Tipo de vehículo utilizado (Sider, Bitren, etc.)'],
        ['Paletas', 'Numérico', 'Cantidad de paletas transportadas'],
        ['Observaciones', 'Texto', 'Notas adicionales sobre el viaje']
      ],
      columnWidths: [{ wch: 15 }, { wch: 20 }, { wch: 65 }]
    }
  ];

  // Generar datos de ejemplo para la plantilla
  const exampleData = [
    {
      dt: 'DT001234',
      fecha: '22/03/2024',
      origen: sites.length > 0 ? sites[0].Site : 'Origen Ejemplo',
      destino: sites.length > 1 ? sites[1].Site : 'Destino Ejemplo',
      tipoTramo: 'TRMC',
      tipoUnidad: 'Sider',
      paletas: '24',
      observaciones: 'Viaje de ejemplo'
    },
    {
      dt: 'DT005678',
      fecha: '23/03/2024',
      origen: sites.length > 1 ? sites[1].Site : 'Origen Ejemplo 2',
      destino: sites.length > 2 ? sites[2].Site : (sites.length > 0 ? sites[0].Site : 'Destino Ejemplo 2'),
      tipoTramo: 'TRMI',
      tipoUnidad: 'Bitren',
      paletas: '36',
      observaciones: 'Segundo ejemplo'
    }
  ];

    return (
    <ExcelImportTemplate
      title="Importación de Viajes mediante Excel"
            open={open} 
      onClose={onClose}
      onComplete={onComplete}
      excelHeaders={EXCEL_HEADERS}
      processDataCallback={processExcelData}
      templateFileName="Plantilla_Importacion_Viajes.xlsx"
      validateRow={validateRow}
      instructionSheets={instructionSheets}
      exampleData={exampleData}
    />
  );
};

ViajeBulkImporter.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  cliente: PropTypes.string.isRequired,
  onComplete: PropTypes.func,
  sites: PropTypes.array
};

ViajeBulkImporter.defaultProps = {
  sites: []
};

export default ViajeBulkImporter; 