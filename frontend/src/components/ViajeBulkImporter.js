import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ExcelImportTemplate from './common/ExcelImportTemplate';
import useNotification from '../hooks/useNotification';
import axios from 'axios';
import { format } from 'date-fns';
import logger from '../utils/logger';

// Definición de las cabeceras del Excel actualizadas
const EXCEL_HEADERS = [
  { field: 'dt', label: 'DT*', required: true },
  { field: 'fecha', label: 'Fecha (DD/MM/YYYY)*', required: true },
  { field: 'origen', label: 'Origen*', required: true },
  { field: 'destino', label: 'Destino*', required: true },
  { field: 'chofer', label: 'Chofer (Legajo/DNI)*', required: true }, // Identificador único del chofer
  { field: 'vehiculo', label: 'Vehículos (Patente1,Patente2,...)*', required: true }, // Cadena de patentes
  { field: 'paletas', label: 'Paletas', required: false } // Paletas es opcional, default 0 en backend
];

/**
 * Componente para importación masiva de viajes desde Excel
 * @component
 */
const ViajeBulkImporter = ({ 
  open, 
  onClose, 
  cliente, 
  onComplete, 
  sites = [],
  personal = [], // Nueva prop para choferes
  vehiculos = [] // Nueva prop para vehículos
}) => {
  const { showNotification } = useNotification();
  
  // Funciones auxiliares para manejar diferentes estructuras de datos
  const getSiteId = (site) => site._id || site.id || '';
  
  // Nueva función para obtener el Código del cliente
  const getSiteCodigo = (site) => site.Codigo || '';
  
  const getSiteName = (site) => {
    // La imagen muestra que el nombre del sitio está bajo la propiedad "Site"
    if (site.Site) return site.Site;
    // Alternativas por si la estructura es diferente
    return site.nombre || site.name || '';
  };
  
  const getSiteLocality = (site) => {
    // La imagen muestra que la localidad está bajo "Localidad"
    if (site.Localidad) return site.Localidad;
    // Alternativas
    return site.localidad || '';
  };
  
  const getSiteAddress = (site) => {
    // La imagen muestra que la dirección está como "-" o vacía
    if (site.Direccion) return site.Direccion || '-';
    // Alternativas
    return site.direccion || site.address || '-';
  };
  
  const getSiteProvince = (site) => {
    // La imagen muestra que hay una columna Provincia
    if (site.Provincia) return site.Provincia;
    return site.provincia || '';
  };
  
  // Registro detallado para verificar los sitios recibidos
  logger.debug(`ViajeBulkImporter recibió ${sites.length} sitios para el cliente: ${cliente}`);
  
  // Imprimir los 3 primeros sitios para depuración (evitar log demasiado largo)
  if (sites.length > 0) {
    logger.debug('Primeros sitios recibidos:');
    sites.slice(0, 3).forEach((site, index) => {
      logger.debug(`Sitio ${index + 1}:`, site);
    });
  } else {
    logger.warn('No se recibieron sitios para el cliente seleccionado');
  }
  
  // Crear mapa de sitios para búsquedas rápidas
  const sitesMap = {};
  sites.forEach((site, index) => {
    const nombreSite = getSiteName(site);
    if (nombreSite) {
      sitesMap[nombreSite.toLowerCase()] = site;
    }
  });
  
  // Mostrar cuántos sitios se mapearon correctamente
  logger.debug(`Se mapearon ${Object.keys(sitesMap).length} sitios para validación y procesamiento`);
  
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
      // Tratamiento especial para 'paletas' que no es estrictamente requerido (tiene default 0)
      if (header.required && !row[header.field] && header.field !== 'paletas') {
        errors.push(`Fila ${index + 1}: El campo ${header.label} es requerido`);
      }
    });
    
    // Validar sitios existentes
    if (row.origen) {
      const origenEncontrado = Object.values(sitesMap).find(
        site => {
          const siteName = getSiteName(site).toLowerCase();
          return siteName === row.origen.toLowerCase();
        }
      );
      if (!origenEncontrado) {
        errors.push(`Fila ${index + 1}: Sitio de origen "${row.origen}" no encontrado`);
      }
    }
    
    if (row.destino) {
      const destinoEncontrado = Object.values(sitesMap).find(
        site => {
          const siteName = getSiteName(site).toLowerCase();
          return siteName === row.destino.toLowerCase();
        }
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
    
    // Validar formato de Vehículos (cadena no vacía)
    if (row.vehiculo && typeof row.vehiculo === 'string' && row.vehiculo.trim() === '') {
      errors.push(`Fila ${index + 1}: El campo Vehículos no puede estar vacío.`);
    } else if (row.vehiculo) {
      // Opcional: validar que sean patentes separadas por coma
      const patentes = String(row.vehiculo).split(',').map(p => p.trim()).filter(p => p !== '');
      if (patentes.length === 0) {
          errors.push(`Fila ${index + 1}: Debe ingresar al menos una patente válida en Vehículos.`);
      }
      // Podría añadirse validación de formato de patente si es necesario
    }

    // Validar valores numéricos para paletas si se proporciona
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
        const origenSite = Object.values(sitesMap).find(
          site => getSiteName(site).toLowerCase() === String(row.origen || '').toLowerCase()
        );
        
        const destinoSite = Object.values(sitesMap).find(
          site => getSiteName(site).toLowerCase() === String(row.destino || '').toLowerCase()
        );

        // Convertir fecha de DD/MM/YYYY a YYYY-MM-DD
        let fechaFormateada = row.fecha;
        if (row.fecha && String(row.fecha).includes('/')) {
          const parts = String(row.fecha).split('/');
          if (parts.length === 3) {
            const [dia, mes, anio] = parts;
            // Validar partes antes de formatear
             if (dia && mes && anio && dia.length <= 2 && mes.length <= 2 && anio.length === 4) {
               try {
                 // Usar Date para validar y formatear de manera robusta
                 const dateObj = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia));
                 // Comprobar si la fecha resultante es válida y coincide con la entrada
                 if (!isNaN(dateObj.getTime()) && 
                     dateObj.getFullYear() === parseInt(anio) &&
                     dateObj.getMonth() === parseInt(mes) - 1 &&
                     dateObj.getDate() === parseInt(dia)) {
                   fechaFormateada = format(dateObj, 'yyyy-MM-dd');
                 } else {
                   // Si la fecha no es válida, mantener el formato original para que el backend lo rechace
                   logger.warn(`Fecha inválida detectada: ${row.fecha}`);
                 }
               } catch (e) {
                 logger.warn(`Error parseando fecha: ${row.fecha}`, e);
               }
             }
          }
        }

        // Enviar datos crudos al backend para que resuelva IDs y lógica compleja
        return {
          dt: row.dt,
          fecha: fechaFormateada, // Formato YYYY-MM-DD o original si es inválido
          origen: origenSite?._id, // Enviar ID si se encuentra
          origenNombre: row.origen, // Enviar nombre original para referencia en errores
          destino: destinoSite?._id, // Enviar ID si se encuentra
          destinoNombre: row.destino, // Enviar nombre original para referencia en errores
          chofer: row.chofer, // Enviar identificador (Legajo/DNI)
          vehiculo: row.vehiculo, // Enviar cadena de patentes
          paletas: parseSpanishNumber(row.paletas), // Enviar número
          // tipoTramo y tipoUnidad serán determinados por el backend
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

  // --- Hojas de Instrucción y Datos Auxiliares ---

  // Hoja con la lista de Sitios disponibles
  const sitesSheet = {
    name: 'Sitios',
    data: [
      ['Código', 'Nombre', 'Localidad', 'Provincia', 'Dirección'],
      ...sites.map(site => [
        getSiteCodigo(site),
        getSiteName(site),
        getSiteLocality(site),
        getSiteProvince(site),
        getSiteAddress(site)
      ])
    ],
    columnWidths: [{ wch: 15 }, { wch: 30 }, { wch: 25 }, { wch: 25 }, { wch: 40 }]
  };

  // Hoja con la lista de Choferes disponibles
  const choferesSheet = {
    name: 'Choferes',
    data: [
      ['Legajo', 'DNI', 'Nombre', 'Apellido'],
      // Mapear la prop 'personal' para obtener los datos
      ...personal.map(p => [
        p.legajo || '-', // Mostrar legajo o guion si no existe
        p.dni || '-',    // Mostrar DNI o guion si no existe
        p.nombre,
        p.apellido
      ])
    ],
    columnWidths: [{ wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 25 }]
  };

  // Hoja con la lista de Vehículos disponibles
  const vehiculosSheet = {
    name: 'Vehiculos',
    data: [
      ['Patente', 'Tipo'],
      // Mapear la prop 'vehiculos' para obtener los datos
      ...vehiculos.map(v => [
        v.patente,
        v.tipo // Asumiendo que el modelo Vehiculo tiene un campo 'tipo'
      ])
    ],
    columnWidths: [{ wch: 15 }, { wch: 15 }]
  };
  
  // Hoja de Instrucciones Generales
  const instruccionesSheet = {
      name: 'Instrucciones',
      data: [
        ['INSTRUCCIONES PARA IMPORTACIÓN DE VIAJES'],
        [''],
        ['1. Complete los datos en la hoja "Datos"'],
        ['2. Los campos marcados con asterisco (*) son obligatorios'],
        ['3. Utilice los nombres exactos de los sitios como aparecen en la hoja "Sitios"'],
        ['4. Las fechas deben estar en formato DD/MM/YYYY'],
        ['5. Ingrese el Legajo o DNI del Chofer (ver hoja "Choferes")'],
        ['6. En la columna Vehículos, ingrese las patentes (ver hoja "Vehiculos") separadas por comas (ej: "AA123BB,AC456DD")'],
        ['7. Debe ingresar al menos una patente en la columna Vehículos'],
        ['8. Si las paletas tienen decimales, utilice coma (,) como separador (ej: 10,5)'],
        [''],
        ['NOTAS:'],
        ['- El Tipo de Tramo y Tipo de Unidad se determinarán automáticamente por el sistema.'],
        ['- La Tarifa y el Peaje se calcularán automáticamente según el tramo y la configuración del cliente.']
      ],
      columnWidths: [{ wch: 85 }] // Ajustar ancho si es necesario
    };

  // Hoja de Formatos de Campo
  const formatosSheet = {
      name: 'Formatos',
      data: [
        ['CAMPO', 'FORMATO', 'DESCRIPCIÓN'],
        ['DT*', 'Texto', 'Número de documento de transporte'],
        ['Fecha*', 'DD/MM/YYYY', 'Fecha del viaje en formato día/mes/año'],
        ['Origen*', 'Texto', 'Nombre exacto del sitio de origen (ver hoja "Sitios")'],
        ['Destino*', 'Texto', 'Nombre exacto del sitio de destino (ver hoja "Sitios")'],
        ['Chofer*', 'Texto', 'Legajo o DNI único del chofer asignado (ver hoja "Choferes")'],
        ['Vehículos*', 'Texto', 'Patentes separadas por comas (ver hoja "Vehiculos"). Al menos una.'],
        ['Paletas', 'Numérico', 'Cantidad de paletas transportadas (usar coma para decimales)']
      ],
      columnWidths: [{ wch: 15 }, { wch: 35 }, { wch: 65 }]
    };

  // Ensamblar todas las hojas para la plantilla
  const instructionSheets = [
    instruccionesSheet,
    formatosSheet,
    sitesSheet,
    choferesSheet, 
    vehiculosSheet 
  ];

  // Generar datos de ejemplo para la plantilla
  const exampleData = [
    {
      dt: 'DT001234',
      fecha: '22/03/2024',
      origen: sites.length > 0 ? getSiteName(sites[0]) : 'Origen Ejemplo',
      destino: sites.length > 1 ? getSiteName(sites[1]) : 'Destino Ejemplo',
      chofer: '12345678', // Ejemplo de DNI/Legajo
      vehiculo: 'AA123BB,AB456CD', // Ejemplo de patentes
      paletas: '24',
    },
    {
      dt: 'DT005678',
      fecha: '23/03/2024',
      origen: sites.length > 1 ? getSiteName(sites[1]) : 'Origen Ejemplo 2',
      destino: sites.length > 0 ? getSiteName(sites[0]) : 'Destino Ejemplo 2',
      chofer: '87654321', // Ejemplo de DNI/Legajo
      vehiculo: 'AC789EF', // Ejemplo de una sola patente
      paletas: '33,5' // Ejemplo con decimales
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
  sites: PropTypes.array,
  personal: PropTypes.arrayOf(PropTypes.shape({ // Nueva propType para personal
    _id: PropTypes.string, // Asumiendo que se pasa el ID
    legajo: PropTypes.string,
    dni: PropTypes.string,
    nombre: PropTypes.string,
    apellido: PropTypes.string,
    activo: PropTypes.bool
  })),
  vehiculos: PropTypes.arrayOf(PropTypes.shape({ // Nueva propType para vehiculos
     _id: PropTypes.string, // Asumiendo que se pasa el ID
     patente: PropTypes.string,
     tipo: PropTypes.string // Ej: Sider, Bitren
  }))
};

ViajeBulkImporter.defaultProps = {
  sites: [],
  personal: [], // Valor por defecto para personal
  vehiculos: [] // Valor por defecto para vehiculos
};

export default ViajeBulkImporter; 