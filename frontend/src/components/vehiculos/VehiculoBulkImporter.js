/**
 * @module components/vehiculos/VehiculoBulkImporter
 * @description Componente para importación masiva de vehículos
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Typography, 
  Alert, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import BulkUpload from '../common/BulkUpload';
import vehiculoService from '../../services/vehiculoService';

// Columnas para el importador
const IMPORT_COLUMNS = [
  { key: 'dominio', label: 'Dominio/Patente', required: true },
  { key: 'tipo', label: 'Tipo de Vehículo', required: true },
  { key: 'marca', label: 'Marca', required: false },
  { key: 'modelo', label: 'Modelo', required: false },
  { key: 'año', label: 'Año', type: 'number', required: false },
  { key: 'numeroChasis', label: 'Número de Chasis', required: false },
  { key: 'numeroMotor', label: 'Número de Motor', required: false },
  { key: 'seguroNumero', label: 'Número de Seguro', required: false },
  { key: 'seguroCompania', label: 'Compañía de Seguro', required: false },
  { key: 'seguroVencimiento', label: 'Vencimiento Seguro (DD/MM/YYYY)', type: 'date', required: false },
  { key: 'vtvNumero', label: 'Número de VTV', required: false },
  { key: 'vtvVencimiento', label: 'Vencimiento VTV (DD/MM/YYYY)', type: 'date', required: false },
  { key: 'rutaNumero', label: 'Número de Ruta', required: false },
  { key: 'rutaVencimiento', label: 'Vencimiento Ruta (DD/MM/YYYY)', type: 'date', required: false },
  { key: 'capacidadCarga', label: 'Capacidad de Carga (kg)', type: 'number', required: false },
  { key: 'tara', label: 'Tara (kg)', type: 'number', required: false },
  { key: 'configuracionEjes', label: 'Configuración de Ejes', required: false },
  { key: 'largo', label: 'Largo (m)', type: 'number', required: false },
  { key: 'ancho', label: 'Ancho (m)', type: 'number', required: false },
  { key: 'alto', label: 'Alto (m)', type: 'number', required: false },
  { key: 'tipoCarroceria', label: 'Tipo de Carrocería', required: false },
  { key: 'activo', label: 'Activo (SI/NO)', type: 'boolean', required: false },
  { key: 'observaciones', label: 'Observaciones', required: false }
];

/**
 * Componente para importar vehículos masivamente
 */
const VehiculoBulkImporter = ({ empresaId, onImportComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [templateDialog, setTemplateDialog] = useState(false);

  /**
   * Procesa los datos de vehículos antes de enviarlos al servidor
   */
  const procesarDatos = (data) => {
    return data.map(item => ({
      dominio: item.dominio,
      tipo: item.tipo,
      marca: item.marca,
      modelo: item.modelo,
      año: item.año,
      numeroChasis: item.numeroChasis,
      numeroMotor: item.numeroMotor,
      empresa: empresaId,
      documentacion: {
        seguro: {
          numero: item.seguroNumero,
          compania: item.seguroCompania,
          vencimiento: item.seguroVencimiento
        },
        vtv: {
          numero: item.vtvNumero,
          vencimiento: item.vtvVencimiento
        },
        ruta: {
          numero: item.rutaNumero,
          vencimiento: item.rutaVencimiento
        }
      },
      caracteristicas: {
        capacidadCarga: item.capacidadCarga,
        tara: item.tara,
        configuracionEjes: item.configuracionEjes,
        largo: item.largo,
        ancho: item.ancho,
        alto: item.alto,
        tipoCarroceria: item.tipoCarroceria
      },
      activo: item.activo !== undefined ? item.activo : true,
      observaciones: item.observaciones
    }));
  };

  /**
   * Maneja la carga de vehículos al servidor
   */
  const handleUpload = async (datos) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const procesados = procesarDatos(datos);
      const resultado = await vehiculoService.bulkUploadVehiculos(procesados);

      if (resultado.exitosos) {
        setSuccess(`${resultado.exitosos} vehículos importados correctamente.`);
        onImportComplete && onImportComplete();
      }

      return resultado;
    } catch (err) {
      setError(err.message || 'Error al subir los vehículos');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Genera un archivo de plantilla Excel para la importación
   */
  const generarPlantilla = () => {
    // Crear datos de ejemplo
    const ejemploData = [
      {
        dominio: 'ABC123',
        tipo: 'Camión',
        marca: 'Mercedes Benz',
        modelo: 'Actros',
        año: 2022,
        numeroChasis: 'MBCHASIS12345',
        numeroMotor: 'MBMOTOR12345',
        seguroNumero: '123456',
        seguroCompania: 'La Caja',
        seguroVencimiento: '31/12/2023',
        vtvNumero: 'VTV987654',
        vtvVencimiento: '15/06/2023',
        rutaNumero: 'RUTA54321',
        rutaVencimiento: '30/09/2023',
        capacidadCarga: 12000,
        tara: 9000,
        configuracionEjes: '6x2',
        largo: 16.5,
        ancho: 2.6,
        alto: 4.2,
        tipoCarroceria: 'Curtain Sider',
        activo: 'SI',
        observaciones: 'Vehículo de ejemplo'
      }
    ];

    // Crear workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(ejemploData);

    // Agregar instrucciones en una nueva hoja
    const instrucciones = [
      ["INSTRUCCIONES PARA IMPORTACIÓN DE VEHÍCULOS"],
      [""],
      ["1. Complete los datos en la hoja 'Vehículos'"],
      ["2. Los campos marcados con (*) son obligatorios"],
      ["3. Las fechas deben estar en formato DD/MM/YYYY"],
      ["4. Para 'Activo' use 'SI' o 'NO'"],
      ["5. Las medidas deben ser en metros (m) y pesos en kilogramos (kg)"],
      [""],
      ["TIPOS DE VEHÍCULO VÁLIDOS:"],
      ["- Camión"],
      ["- Acoplado"],
      ["- Semirremolque"],
      ["- Bitren"],
      ["- Furgón"],
      ["- Utilitario"]
    ];
    const wsInstrucciones = XLSX.utils.aoa_to_sheet(instrucciones);

    // Agregar hojas al workbook
    XLSX.utils.book_append_sheet(wb, wsInstrucciones, "Instrucciones");
    XLSX.utils.book_append_sheet(wb, ws, "Vehículos");

    // Descargar archivo
    XLSX.writeFile(wb, "Plantilla_Importacion_Vehiculos.xlsx");
    setTemplateDialog(false);
  };

  return (
    <Box mt={2}>
      <Box display="flex" flexDirection="column" gap={2}>
        <Typography variant="h6">Importación Masiva de Vehículos</Typography>
        
        <Box display="flex" gap={2} alignItems="center">
          <BulkUpload
            columns={IMPORT_COLUMNS}
            onUpload={handleUpload}
            onUploadComplete={onImportComplete}
            buttonText="Importar Vehículos"
            dialogTitle="Importar Vehículos desde Excel"
          />
          
          <Button
            variant="outlined"
            startIcon={<CloudDownloadIcon />}
            onClick={() => setTemplateDialog(true)}
          >
            Descargar Plantilla
          </Button>
        </Box>
        
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
      </Box>

      {/* Diálogo de confirmación para descargar plantilla */}
      <Dialog open={templateDialog} onClose={() => setTemplateDialog(false)}>
        <DialogTitle>Descargar Plantilla</DialogTitle>
        <DialogContent>
          <Typography>
            Se generará un archivo Excel con la estructura necesaria para importar vehículos.
            ¿Desea proceder con la descarga?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialog(false)}>Cancelar</Button>
          <Button 
            onClick={generarPlantilla} 
            variant="contained" 
            color="primary"
            startIcon={<CloudDownloadIcon />}
          >
            Descargar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

VehiculoBulkImporter.propTypes = {
  empresaId: PropTypes.string.isRequired,
  onImportComplete: PropTypes.func
};

export default VehiculoBulkImporter; 