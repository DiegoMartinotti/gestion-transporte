import React, { useState, useMemo } from 'react';
import { 
  Box, 
  FormControlLabel, 
  Switch
} from '@mui/material';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import ExcelImportTemplate from '../common/ExcelImportTemplate';
import tramoService from '../../services/tramoService';
import useNotification from '../../hooks/useNotification';
import logger from '../../utils/logger';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.locale('es');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

// Definición de las cabeceras del Excel
const EXCEL_HEADERS = [
  { field: 'origen', label: 'Origen*', required: true },
  { field: 'destino', label: 'Destino*', required: true },
  { field: 'tipo', label: 'Tipo*', required: true },
  { field: 'metodoCalculo', label: 'Método de Cálculo*', required: true },
  { field: 'valor', label: 'Valor*', required: true },
  { field: 'valorPeaje', label: 'Valor Peaje', required: false },
  { field: 'vigenciaDesde', label: 'Vigencia Desde (DD/MM/YYYY)', required: false },
  { field: 'vigenciaHasta', label: 'Vigencia Hasta (DD/MM/YYYY)', required: false }
];

/**
 * Componente optimizado para importación masiva de tramos desde Excel
 * @component
 */
const TramoBulkImporter = ({ open, onClose, cliente, onComplete, sites = [] }) => {
  const [reutilizarDistancias, setReutilizarDistancias] = useState(true);
  const [actualizarExistentes, setActualizarExistentes] = useState(false);
  const { showNotification } = useNotification();
  
  // Crear mapas de sitios para búsquedas rápidas usando useMemo para mejorar rendimiento
  const siteMaps = useMemo(() => {
    // Mapa principal por nombre normalizado
    const normalizedMap = {};
    // Mapa secundario por código
    const codeMap = {};
    // Mapa exacto (versión original)
    const exactMap = {};
    
    // Función auxiliar interna para normalizar texto
    const normalizeText = (text) => {
      if (!text || typeof text !== 'string') return '';
      const trimmed = text.trim().toLowerCase();
      return trimmed.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };
    
    sites.forEach(site => {
      if (site && typeof site.Site === 'string') {
        // Guardar en mapa exacto (caso original)
        exactMap[site.Site.toLowerCase()] = site;
        
        // Guardar en mapa normalizado (sin acentos, espacios extra, etc)
        const normalizedName = normalizeText(site.Site);
        normalizedMap[normalizedName] = site;
        
        // Guardar por código si existe
        if (site.codigo) {
          codeMap[site.codigo.toLowerCase()] = site;
        }
      }
    });
    
    return { normalizedMap, codeMap, exactMap };
  }, [sites]);
  
  // Validación de cada fila del Excel
  const validateRow = (row, index, excelHeaders, validationContext) => {
    // Funciones auxiliares (movidas al inicio)
    const normalizeText = (text) => {
      if (!text || typeof text !== 'string') return '';
      const trimmed = text.trim().toLowerCase();
      return trimmed.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };
    const findSiteInContext = (siteName, context) => {
      if (!siteName || !context) return null;
      const nameClean = siteName.trim();
      const nameUpper = nameClean.toUpperCase();
      const nameLower = nameClean.toLowerCase();
      if (context[nameUpper]) return context[nameUpper];
      if (context[nameLower]) return context[nameLower];
      const normalizedName = normalizeText(nameClean);
      if (context[normalizedName]) return context[normalizedName];
      if (context[nameLower]) return context[nameLower]; 
      for (const key in context) {
        if (normalizeText(key) === normalizedName) {
          return context[key];
        }
      }
      return null;
    };
    
    // --- Inicio Validación Fila --- 
    const errors = [];
    const ROWNUM = index + 1; // Número de fila legible
    
    // 1. Validar campos requeridos del Excel (basado en EXCEL_HEADERS)
    excelHeaders.forEach(header => {
      if (header.required && (row[header.field] === null || row[header.field] === undefined || String(row[header.field]).trim() === '')) {
        errors.push(`Fila ${ROWNUM}: El campo '${header.label}' es requerido.`);
      }
    });
    
    // Si faltan campos requeridos básicos, no continuar con validaciones más específicas
    if (errors.length > 0) return errors;
    
    // 2. Validar búsqueda de Sitios Origen/Destino
    let origenSite = null;
    let destinoSite = null;
    
    if (row.origen) {
      origenSite = findSiteInContext(row.origen, validationContext);
      if (!origenSite) {
        errors.push(`Fila ${ROWNUM}: Sitio de origen "${row.origen}" no encontrado.`);
      }
    }
    
    if (row.destino) {
      destinoSite = findSiteInContext(row.destino, validationContext);
      if (!destinoSite) {
        errors.push(`Fila ${ROWNUM}: Sitio de destino "${row.destino}" no encontrado.`);
      }
    }
    
    // Validar que origen y destino no sean el mismo sitio encontrado
    if (origenSite && destinoSite && origenSite._id === destinoSite._id) {
         errors.push(`Fila ${ROWNUM}: El sitio de origen y destino no pueden ser el mismo ("${row.origen}").`);
    }

    // 3. Validar Tipo de Tarifa
    const tipoUpper = String(row.tipo || '').toUpperCase();
    if (!['TRMC', 'TRMI'].includes(tipoUpper)) {
      errors.push(`Fila ${ROWNUM}: Tipo inválido "${row.tipo}". Debe ser TRMC o TRMI.`);
    }
    
    // 4. Validar Método de Cálculo
    // Convertir primera letra a mayúscula y resto a minúscula para comparar con el enum del backend
    const metodoCalculoRaw = String(row.metodoCalculo || '').trim();
    const metodoCalculoFormatted = metodoCalculoRaw.charAt(0).toUpperCase() + metodoCalculoRaw.slice(1).toLowerCase();
    if (!['Kilometro', 'Palet', 'Fijo'].includes(metodoCalculoFormatted)) {
      errors.push(`Fila ${ROWNUM}: Método de cálculo inválido "${row.metodoCalculo}". Debe ser Kilometro, Palet o Fijo.`);
    }
    
    // 5. Validar Valores Numéricos (Valor y ValorPeaje)
    const valorStr = row.valor == null ? '' : String(row.valor).replace(',', '.');
    const parsedValor = parseFloat(valorStr);
    if (isNaN(parsedValor) || parsedValor < 0) {
      // Log detallado si la validación falla
      console.log(`[DEBUG][Fila ${ROWNUM}] Falló validación numérica para Valor:`, {
          raw: row.valor,
          str: valorStr,
          parsed: parsedValor,
          isNaN: isNaN(parsedValor),
          isNegative: parsedValor < 0
      });
      errors.push(`Fila ${ROWNUM}: Valor inválido "${row.valor}". Debe ser un número mayor o igual a cero.`);
    }
    
    if (row.valorPeaje !== null && row.valorPeaje !== undefined && String(row.valorPeaje).trim() !== '') {
        const valorPeajeStr = row.valorPeaje == null ? '' : String(row.valorPeaje).replace(',', '.');
        const parsedPeaje = parseFloat(valorPeajeStr);
        if (isNaN(parsedPeaje) || parsedPeaje < 0) {
            // Log detallado si la validación falla
            console.log(`[DEBUG][Fila ${ROWNUM}] Falló validación numérica para ValorPeaje:`, {
                raw: row.valorPeaje,
                str: valorPeajeStr,
                parsed: parsedPeaje,
                isNaN: isNaN(parsedPeaje),
                isNegative: parsedPeaje < 0
            });
            errors.push(`Fila ${ROWNUM}: Valor Peaje inválido "${row.valorPeaje}". Debe ser un número mayor o igual a cero.`);
        }
    }

    // 6. Validación básica de Fechas (opcional, mejora UX)
    // Esta validación es simple, el backend hará la conversión final
    const dateFormatRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    if (row.vigenciaDesde && typeof row.vigenciaDesde === 'string' && !dateFormatRegex.test(row.vigenciaDesde)) {
        // Podríamos añadir validación de si es número de serie Excel aquí si fuera necesario
        // console.warn(`Fila ${ROWNUM}: Formato de Vigencia Desde ("${row.vigenciaDesde}") no es DD/MM/YYYY.`);
    }
    if (row.vigenciaHasta && typeof row.vigenciaHasta === 'string' && !dateFormatRegex.test(row.vigenciaHasta)){
        // console.warn(`Fila ${ROWNUM}: Formato de Vigencia Hasta ("${row.vigenciaHasta}") no es DD/MM/YYYY.`);
    }
    
    // --- Fin Validación Fila ---
    return errors;
  };

  // Procesar datos del Excel para enviar al servidor
  const processExcelData = async (data) => {
    try {
      // *** INICIO: Reconstruir mapa de sitios localmente ***
      // Crear mapas aquí asegura que usamos los datos más recientes disponibles
      // Usamos la prop 'sites' que tiene el componente TramoBulkImporter
      const localSiteMaps = (() => {
        const normalizedMap = {};
        const codeMap = {};
        const exactMap = {};
        const normalizeTextInternal = (text) => {
          if (!text || typeof text !== 'string') return '';
          const trimmed = text.trim().toLowerCase();
          return trimmed.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        };
        
        logger.debug(`[processExcelData] Reconstruyendo mapas locales con ${sites.length} sitios.`);
        sites.forEach(site => {
          if (site && typeof site.Site === 'string') {
            const siteNameLower = site.Site.toLowerCase();
            exactMap[siteNameLower] = site;
            normalizedMap[normalizeTextInternal(site.Site)] = site;
            if (site.codigo) {
              codeMap[site.codigo.toLowerCase()] = site;
            }
          }
        });
        logger.debug(`[processExcelData] Mapas locales: ${Object.keys(exactMap).length} exactos, ${Object.keys(codeMap).length} códigos, ${Object.keys(normalizedMap).length} normalizados.`);
        return { normalizedMap, codeMap, exactMap };
      })(); 
      // *** FIN: Reconstruir mapa de sitios localmente ***

      // Procesar y preparar los datos
      const processedData = data.map(row => {
        // Función auxiliar interna para buscar un sitio (AHORA USA localSiteMaps)
        const findSiteInLocalMaps = (siteName) => {
          if (!siteName) return null;
          
          const nameLower = String(siteName).trim().toLowerCase();
          if (localSiteMaps.exactMap[nameLower]) return localSiteMaps.exactMap[nameLower];
          if (localSiteMaps.codeMap[nameLower]) return localSiteMaps.codeMap[nameLower];
          
          const normalizedName = normalizeText(String(siteName).trim()); // Necesitamos la función normalizeText aquí aún
          if (localSiteMaps.normalizedMap[normalizedName]) return localSiteMaps.normalizedMap[normalizedName];

          // Búsqueda flexible (opcional, podría eliminarse si la reconstrucción es fiable)
          for (const key in localSiteMaps.exactMap) {
            if (normalizeText(key) === normalizedName) {
              return localSiteMaps.exactMap[key];
            }
          }
          
          logger.warn(`[processExcelData/findSite] Sitio NO ENCONTRADO: "${siteName}" (normalizado: "${normalizedName}")`);
          return null;
        };
        
        // Función de normalización (necesaria para la búsqueda normalizada)
        const normalizeText = (text) => {
          if (!text || typeof text !== 'string') return '';
          const trimmed = text.trim().toLowerCase();
          return trimmed.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        };

        // Usar la función de búsqueda local para encontrar sitios
        const origenSite = findSiteInLocalMaps(row.origen);
        const destinoSite = findSiteInLocalMaps(row.destino);
        
        // --- Procesamiento de Fechas Mejorado ---
        const todayUtc = dayjs.utc().startOf('day');
        const nextYearUtc = todayUtc.add(1, 'year');

        let vigenciaDesdeDate = null;
        if (typeof row.vigenciaDesde === 'number') {
          vigenciaDesdeDate = excelSerialToDate(row.vigenciaDesde);
        } else if (typeof row.vigenciaDesde === 'string') {
          vigenciaDesdeDate = processDate(row.vigenciaDesde);
        } // No necesitamos el caso `instanceof Date` si las funciones devuelven Dayjs
        
        let vigenciaHastaDate = null;
        if (typeof row.vigenciaHasta === 'number') {
          vigenciaHastaDate = excelSerialToDate(row.vigenciaHasta);
        } else if (typeof row.vigenciaHasta === 'string') {
          vigenciaHastaDate = processDate(row.vigenciaHasta);
        } 

        // Validar y usar fechas convertidas o valores por defecto
        const finalVigenciaDesde = (vigenciaDesdeDate && vigenciaDesdeDate.isValid()) ? vigenciaDesdeDate : todayUtc;
        const finalVigenciaHasta = (vigenciaHastaDate && vigenciaHastaDate.isValid()) ? vigenciaHastaDate : nextYearUtc;
        // --- Fin Procesamiento Fechas ---

        return {
          origen: origenSite?._id, 
          destino: destinoSite?._id, 
          origenNombre: origenSite?.Site || row.origen, 
          destinoNombre: destinoSite?.Site || row.destino, 
          tarifaHistorica: {
            tipo: row.tipo || 'TRMC',
            metodoCalculo: row.metodoCalculo || 'Kilometro',
            valor: parseFloat(typeof row.valor === 'string' ? row.valor.replace(',', '.') : row.valor) || 0,
            valorPeaje: parseFloat(typeof row.valorPeaje === 'string' ? row.valorPeaje.replace(',', '.') : row.valorPeaje || 0),
            // Enviar siempre como ISO string UTC
            vigenciaDesde: finalVigenciaDesde.toISOString(), 
            vigenciaHasta: finalVigenciaHasta.toISOString()
          }
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
      let tramosCreados = 0;
      let tramosActualizados = 0;
      
      // Función auxiliar para pausar la ejecución
      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      // Procesar lotes de forma secuencial para evitar sobrecarga
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        try {
          // Añadir una pausa de 200ms entre lotes para evitar rate limiting
          if (i > 0) { 
            await sleep(200); 
          }

          const response = await tramoService.bulkImportTramos(
            cliente, 
            batch, 
            reutilizarDistancias, 
            actualizarExistentes
          );
          
          // Acceder directamente a las propiedades de la respuesta (que ya es la data)
          exitosos += response.exitosos || 0; 
          tramosCreados += response.tramosCreados || 0;
          tramosActualizados += response.tramosActualizados || 0;
          
          if (response.errores && response.errores.length > 0) {
            errores = [...errores, ...response.errores];
          }
        } catch (error) {
          console.error(`Error procesando lote ${i+1}:`, error);
          errores.push({
            lote: i+1,
            mensaje: error.response?.data?.message || error.message
          });
        }
      }
      
      const resultMessage = `Importación completada: ${exitosos} exitosos, ${errores.length} errores, ${tramosCreados} creados, ${tramosActualizados} actualizados`;
      
      if (errores.length > 0) {
        showNotification(
          `Importación completada con ${errores.length} errores`, 
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
      console.error('Error en importación:', error);
      showNotification('Error al procesar la importación', 'error');
    }
  };

  // Función para convertir número de serie de Excel a objeto Dayjs UTC
  const excelSerialToDate = (serial) => {
    if (typeof serial !== 'number') return null;
    // Corrección: Excel considera 1900 bisiesto, pero no lo fue.
    // Si el número de serie es mayor que 59 (28/Feb/1900), restamos 1 día.
    const offsetDays = serial > 59 ? 1 : 0; 
    const epochStartDays = 25569; // Días desde 30/12/1899 a 01/01/1970
    
    const totalDays = serial - (epochStartDays - offsetDays);
    const milliseconds = totalDays * 86400 * 1000;

    // Crear objeto Dayjs directamente en UTC
    const dateUtc = dayjs.utc(milliseconds);
    
    // Validar si la fecha es válida antes de devolverla
    return dateUtc.isValid() ? dateUtc : null;
  }

  // Función para procesar una fecha en formato DD/MM/YYYY a objeto Dayjs UTC
  const processDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return null;
    
    // Usar dayjs para parsear la fecha en el formato esperado
    // Lo parseamos asumiendo que es una fecha local y luego la convertimos a UTC
    // manteniendo la misma hora (00:00:00) pero ahora en UTC.
    // O parsear directamente como UTC si el formato lo permite.
    
    // Intenta parsear estrictamente con el formato DD/MM/YYYY
    const dateUtc = dayjs.utc(dateString, 'DD/MM/YYYY', true); // El true activa el modo estricto
    
    // Validar si la fecha es válida después del parseo
    return dateUtc.isValid() ? dateUtc : null;
  };

  // Instrucciones para la plantilla - memoizado para evitar recálculos
  const instructionSheets = useMemo(() => [
    {
      name: 'Sitios',
      data: [
        ['ID', 'Site', 'Codigo'],
        ...sites.map(site => [
          site._id,
          site.Site,
          site.codigo || ''
        ])
      ],
      columnWidths: [{ wch: 24 }, { wch: 40 }, { wch: 20 }]
    },
    {
      name: 'Instrucciones',
      data: [
        ['INSTRUCCIONES PARA IMPORTACIÓN DE TRAMOS'],
        [''],
        ['1. Complete los datos en la hoja "Datos"'],
        ['2. Los campos marcados con asterisco (*) son obligatorios'],
        ['3. Utilice los nombres exactos de los sitios como aparecen en la hoja "Sitios"'],
        ['4. Las fechas deben estar en formato DD/MM/YYYY'],
        ['5. Los valores numéricos pueden incluir decimales separados por punto (.)'],
        [''],
        ['TIPOS DE TRAMO VÁLIDOS:'],
        ['- TRMC: Tramo Completo'],
        ['- TRMI: Tramo Intermedio'],
        [''],
        ['MÉTODOS DE CÁLCULO VÁLIDOS:'],
        ['- Kilometro: Por kilómetro recorrido'],
        ['- Fijo: Tarifa fija por tramo'],
        ['- Hora: Por hora de servicio'],
        ['- Palet: Por palet transportado']
      ],
      columnWidths: [{ wch: 80 }]
    },
    {
      name: 'Formatos',
      data: [
        ['CAMPO', 'FORMATO', 'DESCRIPCIÓN'],
        ['Origen*', 'Texto', 'Nombre exacto del sitio de origen como aparece en la hoja "Sitios"'],
        ['Destino*', 'Texto', 'Nombre exacto del sitio de destino como aparece en la hoja "Sitios"'],
        ['Tipo*', 'TRMC/TRMI', 'Tipo de tramo (TRMC: Completo, TRMI: Intermedio)'],
        ['Método de Cálculo*', 'Texto', 'Forma de calcular el costo (Kilometro, Fijo, Hora, Palet)'],
        ['Valor*', 'Numérico', 'Valor base del tramo'],
        ['Valor Peaje', 'Numérico', 'Valor adicional por peaje (opcional)'],
        ['Vigencia Desde', 'DD/MM/YYYY', 'Fecha de inicio de vigencia (por defecto: fecha actual)'],
        ['Vigencia Hasta', 'DD/MM/YYYY', 'Fecha de fin de vigencia (por defecto: 1 año después)']
      ],
      columnWidths: [{ wch: 20 }, { wch: 20 }, { wch: 60 }]
    }
  ], [sites]);

  // Generar plantilla de ejemplo para la primera hoja
  const generateTemplateCallback = () => {
    // Obtener fechas para ejemplos
    const hoy = new Date();
    const unAnoDespues = new Date(hoy);
    unAnoDespues.setFullYear(hoy.getFullYear() + 1);
    
    // Formatear fechas para ejemplo
    const fechaDesdeEjemplo = format(hoy, 'dd/MM/yyyy');
    const fechaHastaEjemplo = format(unAnoDespues, 'dd/MM/yyyy');
    
    return [
      {
        origen: sites[0]?.Site || 'Planta Buenos Aires',
        destino: sites[1]?.Site || 'Depósito Córdoba',
        tipo: 'TRMC',
        metodoCalculo: 'Kilometro',
        valor: '1500.50',
        valorPeaje: '500.00',
        vigenciaDesde: fechaDesdeEjemplo,
        vigenciaHasta: fechaHastaEjemplo
      },
      {
        origen: sites[1]?.Site || 'Depósito Córdoba',
        destino: sites[0]?.Site || 'Planta Buenos Aires',
        tipo: 'TRMI',
        metodoCalculo: 'Palet',
        valor: '250.75',
        valorPeaje: '300.00',
        vigenciaDesde: fechaDesdeEjemplo,
        vigenciaHasta: fechaHastaEjemplo
      }
    ];
  };

  // Opciones adicionales para la importación
  const AdditionalOptions = (
    <Box sx={{ mt: 2, mb: 2 }}>
      <FormControlLabel
        control={
          <Switch
            checked={reutilizarDistancias}
            onChange={(e) => setReutilizarDistancias(e.target.checked)}
            color="primary"
          />
        }
        label="Reutilizar distancias existentes cuando sea posible"
      />
      <FormControlLabel
        control={
          <Switch
            checked={actualizarExistentes}
            onChange={(e) => setActualizarExistentes(e.target.checked)}
            color="primary"
          />
        }
        label="Actualizar tramos existentes si coincide origen y destino"
      />
    </Box>
  );

  return (
    <ExcelImportTemplate
      title="Importación de Tramos mediante Excel"
      open={open}
      onClose={onClose}
      onComplete={onComplete}
      excelHeaders={EXCEL_HEADERS}
      processDataCallback={processExcelData}
      templateFileName="Plantilla_Importacion_Tramos.xlsx"
      validateRow={validateRow}
      instructionSheets={instructionSheets}
      additionalContent={AdditionalOptions}
      exampleData={generateTemplateCallback()}
      validationContext={sites}
    />
  );
};

TramoBulkImporter.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  cliente: PropTypes.string.isRequired,
  onComplete: PropTypes.func,
  sites: PropTypes.array
};

TramoBulkImporter.defaultProps = {
  sites: []
};

export default TramoBulkImporter; // Este archivo será refactorizado según el plan de estandarización de importaciones Excel
