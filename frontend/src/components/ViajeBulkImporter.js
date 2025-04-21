import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import ExcelImportTemplate from './common/ExcelImportTemplate'; // Para la carga inicial
import CorrectionActionWidget from './common/CorrectionActionWidget'; // *** Importar el nuevo componente ***
import useNotification from '../hooks/useNotification';
import axios from 'axios';
import { format } from 'date-fns';
import logger from '../utils/logger';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Link,
  Alert,
  Collapse,
  Grid,
  Paper,
  Divider,
  TextField, // Para input file (o usar input nativo)
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'; // Asumiendo Material UI
import { Download, UploadFile, CheckCircle, Error, CloudUpload } from '@mui/icons-material';
import { saveAs } from 'file-saver'; // Para descargar archivos

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
  const [importId, setImportId] = useState(null);
  const [importStatus, setImportStatus] = useState('idle'); // idle, uploading, processing_initial, pending_correction, processing_template_Site, processing_template_Personal, ..., retrying, completed, failed
  const [initialResult, setInitialResult] = useState(null);
  const [retryResult, setRetryResult] = useState(null);
  const [templateFiles, setTemplateFiles] = useState({
    Site: null,
    Personal: null,
    Vehiculo: null,
    Tramo: null,
  });
  const [templateProcessingStatus, setTemplateProcessingStatus] = useState({}); // { Site: { status: 'success', message: 'OK'}, Personal: { status: 'error', message: '...' } }
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Limpiar estado al cerrar o cambiar cliente
  useEffect(() => {
    if (!open) {
      setImportId(null);
      setImportStatus('idle');
      setInitialResult(null);
      setRetryResult(null);
      setTemplateFiles({ Site: null, Personal: null, Vehiculo: null, Tramo: null });
      setTemplateProcessingStatus({});
      setIsLoading(false);
      setError(null);
    }
  }, [open]);


  // Funciones auxiliares para manejar diferentes estructuras de datos (mantener las existentes)
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

  // Procesar datos del Excel INICIAL para enviar al servidor
  const processInitialExcelData = async (data) => {
    setIsLoading(true);
    setError(null);
    setImportStatus('processing_initial');
    setInitialResult(null); // Limpiar resultados previos
    setRetryResult(null);
    setTemplateFiles({ Site: null, Personal: null, Vehiculo: null, Tramo: null });
    setTemplateProcessingStatus({});

    try {
      // 1. Procesamiento Frontend (igual que antes)
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

      // 2. Enviar TODOS los datos procesados al nuevo endpoint de inicio
      logger.debug(`Enviando ${processedData.length} viajes al endpoint /iniciar`);
      const response = await axios.post(
        '/api/viajes/bulk/iniciar', // Nuevo endpoint
        {
          cliente: cliente, // Asegúrate que 'cliente' sea el ID
          viajes: processedData
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 180000 // Aumentar timeout a 3 minutos (180000 ms)
        }
      );

      logger.info('Respuesta de importación inicial:', response.data);

      // 3. Procesar la respuesta detallada
      if (response.data && response.data.success) {
        setImportId(response.data.importId);
        setInitialResult({
          successCount: response.data.successCount,
          pendingCount: response.data.pendingCount,
          criticalFailCount: response.data.criticalFailCount,
          correctionNeeded: response.data.correctionNeeded,
          criticalFailures: response.data.criticalFailures
        });

        if (response.data.status === 'completed') {
          setImportStatus('completed');
          showNotification(`Importación inicial completada: ${response.data.successCount} viajes importados exitosamente.`, 'success');
          if (onComplete) onComplete();
           // Mantener modal abierto para mostrar resultado? O cerrar? Por ahora mantenemos.
           // onClose();
        } else if (response.data.status === 'pending_correction') {
          setImportStatus('pending_correction');
          showNotification(`Importación inicial parcial: ${response.data.successCount} éxitos, ${response.data.criticalFailCount} fallos críticos y ${response.data.pendingCount} pendientes de corrección.`, 'warning');
        } else {
           // Estado inesperado
           setError(`Estado inesperado recibido del servidor: ${response.data.status}`);
           setImportStatus('failed');
        }
      } else {
        throw new Error(response.data?.message || 'Error desconocido en la importación inicial.');
      }

    } catch (err) {
      logger.error('Error en la importación inicial:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Error al procesar la importación inicial.';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      setImportStatus('failed');
      // No cerrar automáticamente en caso de error para que el usuario vea el mensaje
      // onClose();
    } finally {
      setIsLoading(false);
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

  // --- Nuevas Funciones para Etapa 2 ---

  const handleTemplateFileChange = (event, templateType) => {
    const file = event.target.files[0];
    if (file) {
      setTemplateFiles(prev => ({ ...prev, [templateType]: file }));
      // Limpiar estado de procesamiento previo para este tipo
      setTemplateProcessingStatus(prev => ({ ...prev, [templateType]: undefined }));
    }
  };

  const handleDownloadTemplate = async (templateType) => {
     if (!importId) return;
     setIsLoading(true);
     setError(null);
     try {
        const response = await axios.get(
            `/api/viajes/bulk/template/${importId}/${templateType}`,
            { responseType: 'blob' } // Importante para recibir el archivo
        );
        const suggestedFileName = `Plantilla_Correccion_${templateType}_${importId}.xlsx`;
        saveAs(response.data, suggestedFileName); // Usar file-saver
        showNotification(`Plantilla para ${templateType} descargada.`, 'success');
     } catch (err) {
        logger.error(`Error descargando plantilla ${templateType}:`, err);
        const errorMsg = err.response?.data?.message || err.message || `Error al descargar plantilla ${templateType}.`;
        setError(errorMsg);
        showNotification(errorMsg, 'error');
     } finally {
        setIsLoading(false);
     }
  };

 const handleProcessTemplate = async (templateType) => {
    if (!importId || !templateFiles[templateType]) return;

    setIsLoading(true);
    setError(null);
    setTemplateProcessingStatus(prev => ({ ...prev, [templateType]: { status: 'processing', message: 'Procesando...' } }));

    const formData = new FormData();
    formData.append('templateFile', templateFiles[templateType]);

    try {
      const response = await axios.post(
        `/api/viajes/bulk/process-template/${importId}/${templateType}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000 // Timeout más largo para procesamiento de archivos
        }
      );

      logger.info(`Respuesta procesamiento plantilla ${templateType}:`, response.data);

      if (response.data && response.data.success) {
         setTemplateProcessingStatus(prev => ({
             ...prev,
             [templateType]: { status: 'success', message: response.data.message || `Plantilla ${templateType} procesada.` }
         }));
         showNotification(response.data.message || `Plantilla ${templateType} procesada con éxito.`, 'success');
         // Opcional: mostrar detalles del resultado (response.data.result)
      } else {
        throw new Error(response.data?.message || `Error procesando plantilla ${templateType}.`);
      }

    } catch (err) {
      logger.error(`Error procesando plantilla ${templateType}:`, err);
      const errorMsg = err.response?.data?.message || err.message || `Error al procesar plantilla ${templateType}.`;
      setError(errorMsg); // Mostrar error general también
      setTemplateProcessingStatus(prev => ({
          ...prev,
          [templateType]: { status: 'error', message: errorMsg }
      }));
      showNotification(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

 const handleRetryImport = async () => {
    if (!importId) return;

    setIsLoading(true);
    setError(null);
    setImportStatus('retrying');
    setRetryResult(null);

    try {
        const response = await axios.post(`/api/viajes/bulk/retry/${importId}`);
        logger.info('Respuesta reintento importación:', response.data);

        if (response.data && response.data.success) {
            setRetryResult(response.data.result); // { exitosos: X, errores: Y, fallosDetallados: [...] }
            setImportStatus('completed');
            const successMsg = `Reintento completado: ${response.data.result?.exitosos || 0} viajes adicionales importados.`;
            const errorMsg = response.data.result?.errores > 0
                ? `${response.data.result.errores} viajes no pudieron importarse definitivamente.`
                : '';
            showNotification(`${successMsg} ${errorMsg}`.trim(), response.data.result?.errores > 0 ? 'warning' : 'success');
             if (onComplete) onComplete(); // Notificar finalización general
        } else {
             throw new Error(response.data?.message || 'Error en el reintento de importación.');
        }

    } catch (err) {
        logger.error('Error en reintento de importación:', err);
        const errorMsg = err.response?.data?.message || err.message || 'Error al reintentar la importación.';
        setError(errorMsg);
        showNotification(errorMsg, 'error');
        setImportStatus('failed'); // O volver a 'pending_correction'? Quizás 'failed' es mejor.
    } finally {
        setIsLoading(false);
    }
 };

 const handleDownloadFallback = async () => {
     if (!importId) return;
     setIsLoading(true);
     setError(null);
     try {
        const response = await axios.get(
            `/api/viajes/bulk/fallback/${importId}`,
            { responseType: 'blob' }
        );
        const suggestedFileName = `Viajes_Fallidos_Importacion_${importId}.xlsx`;
        saveAs(response.data, suggestedFileName);
        showNotification('Archivo con viajes fallidos descargado.', 'success');
     } catch (err) {
        logger.error('Error descargando fallback:', err);
        // Intentar leer mensaje de error si es JSON
        let errorMsg = 'Error al descargar el archivo de viajes fallidos.';
        if (err.response && err.response.data instanceof Blob && err.response.data.type === "application/json") {
            try {
                 const errorJson = JSON.parse(await err.response.data.text());
                 errorMsg = errorJson.message || errorMsg;
            } catch (parseError) {
                 // Mantener mensaje genérico si no se puede parsear
            }
        } else {
             errorMsg = err.response?.data?.message || err.message || errorMsg;
        }
        setError(errorMsg);
        showNotification(errorMsg, 'error');
     } finally {
        setIsLoading(false);
     }
 };

 // --- Renderizado Condicional ---

 if (importStatus === 'idle' || importStatus === 'uploading' || importStatus === 'processing_initial') {
    // Mostrar el template de carga inicial
    return (
      <ExcelImportTemplate
        title="Importación de Viajes mediante Excel (Etapa 1)"
        open={open}
        onClose={onClose}
        // onComplete no se usa directamente aquí, se maneja internamente
        excelHeaders={EXCEL_HEADERS}
        processDataCallback={processInitialExcelData} // Usar la nueva función
        templateFileName="Plantilla_Importacion_Viajes.xlsx"
        validationContext={sites}
        instructionSheets={instructionSheets}
        exampleData={exampleData}
        isProcessing={isLoading || importStatus === 'processing_initial'} // Mostrar indicador de carga
      />
    );
 }

 // Mostrar resultados y opciones de corrección/reintento en un Dialog o Modal propio
 // (ExcelImportTemplate no es adecuado para este UI complejo)
 return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Resultado Importación de Viajes</DialogTitle>
        <DialogContent>
            {isLoading && <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Resumen Inicial */}
            {initialResult && (
                <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>Resumen Etapa 1</Typography>
                    <Typography>Viajes procesados inicialmente: { (initialResult.successCount || 0) + (initialResult.pendingCount || 0) + (initialResult.criticalFailCount || 0) }</Typography>
                    <Typography color="success.main">Importados exitosamente: {initialResult.successCount || 0}</Typography>
                    {initialResult.pendingCount > 0 && (
                        <Typography color="warning.main">
                            Pendientes de corrección: {initialResult.pendingCount}
                        </Typography>
                    )}
                    <Typography color={(initialResult.criticalFailCount || 0) > 0 ? 'error.main' : 'text.secondary'}>
                        Fallaron (Errores Críticos): {initialResult.criticalFailCount || 0}
                    </Typography>
                </Paper>
            )}

            {/* Sección de Correcciones */}
            {importStatus === 'pending_correction' && initialResult && initialResult.pendingCount > 0 && (
                <Box>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Acciones de Corrección Requeridas</Typography>
                    <Grid container spacing={2}>
                        {initialResult.correctionNeeded && Object.entries(initialResult.correctionNeeded).map(([type, details]) => {
                            if (details.count > 0) {
                                // Lógica mejorada para determinar templateType y isCorrectable
                                let templateType = null;
                                let isCorrectable = false;
                                let errorLabel = `Fallos (${type}): ${details.count}`; // Label por defecto

                                switch (type) {
                                    case 'missingSites':
                                        templateType = 'Site';
                                        isCorrectable = true;
                                        errorLabel = `Sitios Faltantes`; // Label sin count, se pasa aparte
                                        break;
                                    case 'missingPersonal':
                                        templateType = 'Personal';
                                        isCorrectable = true;
                                        errorLabel = `Personal Faltante/Inactivo`;
                                        break;
                                    case 'missingVehiculos':
                                        templateType = 'Vehiculo'; 
                                        isCorrectable = true;
                                        errorLabel = `Vehículos Faltantes`;
                                        break;
                                    case 'missingTramos':
                                        templateType = 'Tramo';
                                        isCorrectable = true;
                                        errorLabel = `Tramos/Tarifas Faltantes`;
                                        break;
                                    case 'duplicateDt':
                                        errorLabel = `DTs Duplicados`;
                                        break;
                                    case 'invalidData':
                                        errorLabel = `Datos Inválidos`;
                                        break;
                                    default:
                                        break;
                                }

                                // const processingInfo = templateType ? templateProcessingStatus[templateType] : null;

                                return (
                                    <Grid item xs={12} sm={6} key={type}>
                                        {isCorrectable && templateType ? (
                                            // *** Usar el nuevo Widget ***
                                            <CorrectionActionWidget
                                                templateType={templateType}
                                                label={errorLabel} // Pasar label sin count
                                                count={details.count} // Pasar count
                                                onDownload={handleDownloadTemplate}
                                                onFileChange={handleTemplateFileChange}
                                                onProcess={handleProcessTemplate}
                                                selectedFile={templateFiles[templateType]}
                                                processingStatus={templateProcessingStatus[templateType]}
                                                isLoading={isLoading}
                                            />
                                        ) : (
                                            // Mostrar info para errores no corregibles por plantilla
                                        <Paper elevation={1} sx={{ p: 2 }}>
                                            <Typography variant="subtitle1" gutterBottom>
                                                    {errorLabel}: {details.count}
                                                        </Typography>
                                                 <Typography variant="body2" color="text.secondary">
                                                     {type === 'duplicateDt' ? 'Estos viajes no se pueden reintentar. Descargue el archivo fallback.' :
                                                      type === 'invalidData' ? 'Corrija estos datos en el archivo original y vuelva a importar.' :
                                                      'Este tipo de error requiere revisión manual.'}
                                                 </Typography>
                                            </Paper>
                                            )}
                                    </Grid>
                                );
                            }
                            return null;
                        })}
                    </Grid>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                         <Button
                             variant="contained"
                             color="primary"
                             onClick={handleRetryImport}
                             disabled={isLoading || importStatus !== 'pending_correction'}
                         >
                             Reintentar Importación de Viajes Fallidos
                         </Button>
                         <Button
                             variant="outlined"
                             color="warning"
                             startIcon={<Download />}
                             onClick={handleDownloadFallback}
                             disabled={isLoading}
                         >
                             Descargar Viajes Fallidos (Fallback)
                         </Button>
                    </Box>
                </Box>
            )}

             {/* Resultado Reintento */}
             {importStatus === 'completed' && retryResult && (
                 <Paper elevation={2} sx={{ p: 2, mt: 2, backgroundColor: 'success.light' }}>
                     <Typography variant="h6" gutterBottom>Resultado Reintento (Etapa 2)</Typography>
                     <Typography>Viajes adicionales importados: {retryResult.exitosos}</Typography>
                     <Typography color={retryResult.errores > 0 ? 'error.main' : 'inherit'}>
                         Fallaron definitivamente: {retryResult.errores}
                     </Typography>
                     {retryResult.errores > 0 && (
                         <Button
                             variant="outlined"
                             color="warning"
                             startIcon={<Download />}
                             onClick={handleDownloadFallback}
                             disabled={isLoading}
                             sx={{ mt: 1 }}
                         >
                             Descargar {retryResult.errores} Viajes Fallidos
                         </Button>
                     )}
                 </Paper>
             )}

             {/* Mensaje Final Éxito (sin fallos pendientes) */}
              {importStatus === 'completed' && (!retryResult || retryResult.errores === 0) && initialResult && (initialResult.criticalFailCount || 0) === 0 && (initialResult.pendingCount || 0) === 0 && (
                 <Alert severity="success" sx={{ mt: 2 }}>
                     ¡Importación completada exitosamente! Todos los viajes ({initialResult.successCount || 0}) fueron importados.
                 </Alert>
              )}
              {importStatus === 'completed' && retryResult && retryResult.errores === 0 && initialResult && ((initialResult.criticalFailCount || 0) > 0 || (initialResult.pendingCount || 0) > 0) && (
                 <Alert severity="success" sx={{ mt: 2 }}>
                     ¡Importación completada! {initialResult.successCount || 0} viajes importados inicialmente y {retryResult.exitosos || 0} tras correcciones.
                 </Alert>
              )}


        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
    </Dialog>
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