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
  
  // Crear mapa de sitios para búsquedas rápidas usando useMemo para mejorar rendimiento
  const sitesMap = useMemo(() => {
    const map = {};
    sites.forEach(site => {
      map[site.nombre.toLowerCase()] = site;
    });
    return map;
  }, [sites]);

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
    if (row.origen && !sitesMap[row.origen.toLowerCase()]) {
      errors.push(`Fila ${index + 1}: Sitio de origen "${row.origen}" no encontrado`);
    }
    
    if (row.destino && !sitesMap[row.destino.toLowerCase()]) {
      errors.push(`Fila ${index + 1}: Sitio de destino "${row.destino}" no encontrado`);
    }
    
    // Validar tipo
    if (row.tipo && !['TRMC', 'TRMI'].includes(row.tipo)) {
      errors.push(`Fila ${index + 1}: El tipo debe ser TRMC o TRMI`);
    }
    
    // Validar método de cálculo
    if (row.metodoCalculo && !['Kilometro', 'Fijo', 'Hora', 'Palet'].includes(row.metodoCalculo)) {
      errors.push(`Fila ${index + 1}: Método de cálculo inválido (debe ser Kilometro, Fijo, Hora o Palet)`);
    }
    
    // Validar valores numéricos
    if (row.valor && isNaN(parseFloat(row.valor))) {
      errors.push(`Fila ${index + 1}: El valor debe ser un número`);
    }
    
    if (row.valorPeaje && isNaN(parseFloat(row.valorPeaje))) {
      errors.push(`Fila ${index + 1}: El valor del peaje debe ser un número`);
    }
    
    // Validar fechas
    const fechaRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    
    if (row.vigenciaDesde && !fechaRegex.test(row.vigenciaDesde)) {
      errors.push(`Fila ${index + 1}: Formato de fecha inválido para Vigencia Desde. Use DD/MM/YYYY`);
    }
    
    if (row.vigenciaHasta && !fechaRegex.test(row.vigenciaHasta)) {
      errors.push(`Fila ${index + 1}: Formato de fecha inválido para Vigencia Hasta. Use DD/MM/YYYY`);
    }
    
    return errors;
  };

  // Función para procesar una fecha en formato DD/MM/YYYY
  const processDate = (dateString) => {
    if (!dateString) return null;
    
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    
    return new Date(parts[2], parts[1] - 1, parts[0]);
  };

  // Procesar datos del Excel para enviar al servidor
  const processExcelData = async (data) => {
    try {
      // Procesar y preparar los datos
      const processedData = data.map(row => {
        const origenSite = sitesMap[row.origen.toLowerCase()];
        const destinoSite = sitesMap[row.destino.toLowerCase()];
        
        // Formatear fechas de vigencia
        const today = new Date();
        const nextYear = new Date(today);
        nextYear.setFullYear(today.getFullYear() + 1);
        
        // Convertir fechas usando la función auxiliar
        const vigenciaDesde = processDate(row.vigenciaDesde) || today;
        const vigenciaHasta = processDate(row.vigenciaHasta) || nextYear;
        
        return {
          origen: origenSite._id,
          destino: destinoSite._id,
          origenNombre: origenSite.nombre,
          destinoNombre: destinoSite.nombre,
          tarifaHistorica: {
            tipo: row.tipo || 'TRMC',
            metodoCalculo: row.metodoCalculo || 'Kilometro',
            valor: parseFloat(row.valor) || 0,
            valorPeaje: parseFloat(row.valorPeaje || 0),
            vigenciaDesde: vigenciaDesde.toISOString(),
            vigenciaHasta: vigenciaHasta.toISOString()
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
      
      // Procesar lotes de forma secuencial para evitar sobrecarga
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        try {
          const response = await tramoService.bulkImportTramos(
            cliente, 
            batch, 
            reutilizarDistancias, 
            actualizarExistentes
          );
          
          exitosos += response.data.exitosos || 0;
          tramosCreados += response.data.tramosCreados || 0;
          tramosActualizados += response.data.tramosActualizados || 0;
          
          if (response.data.errores && response.data.errores.length > 0) {
            errores = [...errores, ...response.data.errores];
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

  // Instrucciones para la plantilla - memoizado para evitar recálculos
  const instructionSheets = useMemo(() => [
    {
      name: 'Sitios',
      data: [
        ['ID', 'Nombre', 'Tipo'],
        ...sites.map(site => [
          site._id,
          site.nombre,
          site.tipo
        ])
      ],
      columnWidths: [{ wch: 24 }, { wch: 40 }, { wch: 15 }]
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
        origen: sites[0]?.nombre || 'Planta Buenos Aires',
        destino: sites[1]?.nombre || 'Depósito Córdoba',
        tipo: 'TRMC',
        metodoCalculo: 'Kilometro',
        valor: '1500.50',
        valorPeaje: '500.00',
        vigenciaDesde: fechaDesdeEjemplo,
        vigenciaHasta: fechaHastaEjemplo
      },
      {
        origen: sites[1]?.nombre || 'Depósito Córdoba',
        destino: sites[0]?.nombre || 'Planta Buenos Aires',
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
