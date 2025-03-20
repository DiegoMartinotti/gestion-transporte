import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import ExcelImportTemplate from '../common/ExcelImportTemplate';
import clienteService from '../../services/clienteService';
import useNotification from '../../hooks/useNotification';
import validationUtils from '../../utils/validationUtils';

// Definición de las cabeceras del Excel
const EXCEL_HEADERS = [
  { field: 'Cliente', label: 'Cliente*', required: true },
  { field: 'CUIT', label: 'CUIT*', required: true },
  { field: 'formulaPaletSider', label: 'Fórmula Palet Sider', required: false },
  { field: 'formulaPaletBitren', label: 'Fórmula Palet Bitren', required: false },
  { field: 'observacion', label: 'Observaciones', required: false }
];

/**
 * Componente para importación masiva de clientes desde Excel
 * @component
 */
const ClienteBulkImporter = ({ open, onClose, onComplete }) => {
  const { showNotification } = useNotification();
  
  // Definir esquema de validación usando las utilidades
  const validationSchema = useMemo(() => ({
    Cliente: {
      label: 'Cliente',
      validators: [
        (value, fieldName, rowIndex) => validationUtils.isRequired(value, fieldName, rowIndex)
      ]
    },
    CUIT: {
      label: 'CUIT',
      validators: [
        (value, fieldName, rowIndex) => validationUtils.isRequired(value, fieldName, rowIndex),
        (value, fieldName, rowIndex) => validationUtils.isCUIT(value, fieldName, rowIndex)
      ]
    }
  }), []);

  // Validación de cada fila del Excel
  const validateRow = (row, index) => {
    return validationUtils.validateSchema(row, index, validationSchema);
  };

  // Procesar datos del Excel para enviar al servidor
  const processExcelData = async (data) => {
    try {
      // Procesar y preparar los datos
      const processedData = data.map(row => {
        return {
          Cliente: row.Cliente,
          CUIT: row.CUIT?.toString() || '',
          formulaPaletSider: row.formulaPaletSider || 'Valor * Palets + Peaje',
          formulaPaletBitren: row.formulaPaletBitren || 'Valor * Palets + Peaje',
          observacion: row.observacion || ''
        };
      });
      
      // Enviar datos al servidor
      let successCount = 0;
      let errorCount = 0;
      const errores = [];
      
      // Proceso de importación cliente por cliente para mayor control
      for (const cliente of processedData) {
        try {
          await clienteService.createCliente(cliente);
          successCount++;
        } catch (error) {
          errorCount++;
          errores.push(`Error al importar cliente ${cliente.Cliente}: ${error.message || 'Error desconocido'}`);
        }
      }
      
      // Mostrar resultado
      if (errorCount > 0) {
      showNotification(
        `Importación completada: ${successCount} clientes importados, ${errorCount} errores`,
          'warning'
        );
        console.error('Errores en importación:', errores);
      } else {
        showNotification(
          `Importación completada: ${successCount} clientes importados correctamente`,
          'success'
        );
      }
      
      // Notificar al componente padre
      if (onComplete) {
        onComplete();
      }
      
      onClose();
    } catch (error) {
      console.error('Error en la importación de clientes:', error);
      showNotification('Error al procesar la importación', 'error');
    }
  };

  // Instrucciones para la plantilla
  const instructionSheets = useMemo(() => [
    {
      name: 'Instrucciones',
      data: [
        ['INSTRUCCIONES PARA IMPORTACIÓN DE CLIENTES'],
        [''],
        ['1. Complete los datos en la hoja "Datos"'],
        ['2. Los campos marcados con asterisco (*) son obligatorios'],
        ['3. El CUIT debe tener el formato XX-XXXXXXXX-X'],
        ['4. Si no se especifica una fórmula para el cálculo de palets, se usará "Valor * Palets + Peaje"'],
      ],
      columnWidths: [{ wch: 80 }]
    },
    {
      name: 'Formato CUIT',
      data: [
        ['Formato de CUIT'],
        [''],
        ['El CUIT (Clave Única de Identificación Tributaria) debe ingresarse con el formato: XX-XXXXXXXX-X'],
        ['Ejemplo: 30-12345678-9'],
        [''],
        ['El primer bloque identifica el tipo de entidad:'],
        ['- 20, 23, 24, 27: Personas físicas'],
        ['- 30, 33, 34: Empresas, asociaciones, etc.'],
        [''],
        ['El número debe ser válido según el algoritmo de validación de AFIP.']
      ],
      columnWidths: [{ wch: 80 }]
    }
  ], []);

  // Generar datos de ejemplo para la plantilla
  const exampleData = [
    {
      Cliente: 'Distribuidora XYZ S.A.',
      CUIT: '30-12345678-9',
      formulaPaletSider: 'Valor * Palets + Peaje',
      formulaPaletBitren: 'Valor * Palets * 1.2 + Peaje',
      observacion: 'Cliente preferencial con contrato anual'
    },
    {
      Cliente: 'Transportes ABC',
      CUIT: '33-87654321-0',
      formulaPaletSider: 'Valor * Palets',
      formulaPaletBitren: 'Valor * Palets',
      observacion: 'Solo opera en CABA y GBA'
    }
  ];

  return (
    <ExcelImportTemplate
      title="Importación de Clientes mediante Excel"
      open={open}
      onClose={onClose}
      onComplete={onComplete}
      excelHeaders={EXCEL_HEADERS}
      processDataCallback={processExcelData}
      templateFileName="Plantilla_Importacion_Clientes.xlsx"
      validateRow={validateRow}
      instructionSheets={instructionSheets}
      exampleData={exampleData}
    />
  );
};

ClienteBulkImporter.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onComplete: PropTypes.func
};

export default ClienteBulkImporter; 