import React, { useState } from 'react';
import {
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TableContainer, 
  Table, 
  TableHead, 
  TableBody,
  TableRow, 
  TableCell, 
  Paper, 
  Alert, 
  Typography, 
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import { 
  CloudUpload as UploadIcon, 
  GetApp as DownloadIcon,
  Info as InfoIcon 
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import logger from '../utils/logger';

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

const PersonalBulkImporter = ({ open, onClose, onComplete, empresas }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const fileInputRef = React.useRef(null);
  const [fileKey, setFileKey] = useState(Date.now()); // Clave única para forzar la recreación del input

  const resetFileInput = () => {
    // Cambiar la clave para forzar la recreación del componente
    setFileKey(Date.now());
    // Limpiar el valor del input si existe
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    setRows([]);
    setError(null);
    setProgress(0);
    setProcessingStatus('');
    resetFileInput();
    onClose();
  };

  // Función para descargar la plantilla Excel
  const handleDownloadTemplate = () => {
    try {
      // Crear el libro de Excel
      const wb = XLSX.utils.book_new();

      // Crear la hoja principal con los encabezados
      const wsData = XLSX.utils.json_to_sheet([{}]);
      XLSX.utils.sheet_add_aoa(wsData, [EXCEL_HEADERS.map(header => header.label)], { origin: 'A1' });
      
      // Agregar datos de ejemplo
      const ejemploData = [
        {
          'Nombre*': 'Juan',
          'Apellido*': 'Pérez',
          'DNI*': '30123456',
          'Teléfono': '1155667788',
          'Email': 'juan.perez@ejemplo.com',
          'Dirección': 'Av. Ejemplo 123',
          'Fecha de Nacimiento (DD/MM/AAAA)': '15/05/1985',
          'ID de Empresa*': empresas && empresas.length > 0 ? empresas[0]._id : 'ID_EMPRESA',
          'Cargo': 'Chofer',
          'Licencia de Conducir': 'B1',
          'Activo (SI/NO)*': 'SI',
          'Observaciones': 'Ejemplo de observación'
        }
      ];
      
      // Agregar datos de ejemplo a la hoja
      XLSX.utils.sheet_add_json(wsData, ejemploData, { origin: 'A2', skipHeader: true });
      
      // Agregar la hoja al libro
      XLSX.utils.book_append_sheet(wb, wsData, 'Personal');
      
      // Agregar hoja de ayuda con IDs de empresas
      if (empresas && empresas.length > 0) {
        const empresasData = empresas.map(empresa => ({
          'ID': empresa._id,
          'Nombre': empresa.nombre,
          'Tipo': empresa.tipo
        }));
        
        const wsEmpresas = XLSX.utils.json_to_sheet(empresasData);
        XLSX.utils.book_append_sheet(wb, wsEmpresas, 'Empresas');
      }
      
      // Agregar hoja con información de formatos
      const formatosData = [
        { 'Campo': 'Nombre*', 'Formato': 'Texto', 'Descripción': 'Nombre del empleado. Campo obligatorio.' },
        { 'Campo': 'Apellido*', 'Formato': 'Texto', 'Descripción': 'Apellido del empleado. Campo obligatorio.' },
        { 'Campo': 'DNI*', 'Formato': 'Numérico (7-8 dígitos)', 'Descripción': 'Documento Nacional de Identidad. Solo números, sin puntos. Campo obligatorio.' },
        { 'Campo': 'Teléfono', 'Formato': 'Texto', 'Descripción': 'Número de teléfono del empleado. Preferentemente con código de área.' },
        { 'Campo': 'Email', 'Formato': 'Texto (formato email)', 'Descripción': 'Correo electrónico del empleado. Debe tener formato válido (ejemplo@dominio.com).' },
        { 'Campo': 'Dirección', 'Formato': 'Texto', 'Descripción': 'Dirección completa del empleado.' },
        { 'Campo': 'Fecha de Nacimiento', 'Formato': 'DD/MM/AAAA', 'Descripción': 'Fecha de nacimiento en formato día/mes/año. Ejemplo: 15/05/1985.' },
        { 'Campo': 'ID de Empresa*', 'Formato': 'Texto (ID MongoDB)', 'Descripción': 'Identificador único de la empresa a la que pertenece el empleado. Ver hoja "Empresas". Campo obligatorio.' },
        { 'Campo': 'Cargo', 'Formato': 'Texto', 'Descripción': 'Cargo o puesto del empleado. Valores recomendados: Conductor, Administrativo, Mecánico, Supervisor, Otro.' },
        { 'Campo': 'Licencia de Conducir', 'Formato': 'Texto', 'Descripción': 'Número o categoría de licencia de conducir del empleado.' },
        { 'Campo': 'Activo (SI/NO)*', 'Formato': 'Texto (SI/NO)', 'Descripción': 'Estado del empleado. Valores aceptados: SI, NO, TRUE, FALSE, 1, 0. Campo obligatorio.' },
        { 'Campo': 'Observaciones', 'Formato': 'Texto', 'Descripción': 'Notas adicionales sobre el empleado.' }
      ];
      
      const wsFormatos = XLSX.utils.json_to_sheet(formatosData);
      
      // Ajustar ancho de columnas para la hoja de formatos
      const wscols = [
        { wch: 25 }, // Campo
        { wch: 25 }, // Formato
        { wch: 80 }  // Descripción
      ];
      
      wsFormatos['!cols'] = wscols;
      
      XLSX.utils.book_append_sheet(wb, wsFormatos, 'Formatos');
      
      // Agregar hoja con instrucciones generales
      const instruccionesData = [
        { 'Instrucción': 'Información General', 'Detalle': 'Esta plantilla permite la carga masiva de personal al sistema.' },
        { 'Instrucción': 'Campos Obligatorios', 'Detalle': 'Los campos marcados con asterisco (*) son obligatorios y deben completarse para todos los registros.' },
        { 'Instrucción': 'Nombre y Apellido', 'Detalle': 'Ingrese el nombre y apellido en campos separados. Ambos son obligatorios.' },
        { 'Instrucción': 'Formato de Fechas', 'Detalle': 'Todas las fechas deben ingresarse en formato DD/MM/AAAA (día/mes/año).' },
        { 'Instrucción': 'ID de Empresa', 'Detalle': 'El ID de Empresa debe corresponder a una empresa existente en el sistema. Consulte la hoja "Empresas" para ver los IDs disponibles.' },
        { 'Instrucción': 'Validación de Datos', 'Detalle': 'Antes de importar, el sistema validará todos los datos. Si hay errores, se mostrarán en pantalla.' },
        { 'Instrucción': 'Duplicados', 'Detalle': 'No se permiten DNIs duplicados. Si intenta importar un DNI que ya existe, se generará un error.' },
        { 'Instrucción': 'Ejemplo', 'Detalle': 'La primera fila de la hoja "Personal" contiene un ejemplo de cómo completar los datos.' },
        { 'Instrucción': 'Formatos', 'Detalle': 'Consulte la hoja "Formatos" para ver el formato específico de cada campo.' }
      ];
      
      const wsInstrucciones = XLSX.utils.json_to_sheet(instruccionesData);
      
      // Ajustar ancho de columnas para la hoja de instrucciones
      const wscols2 = [
        { wch: 25 }, // Instrucción
        { wch: 100 }  // Detalle
      ];
      
      wsInstrucciones['!cols'] = wscols2;
      
      XLSX.utils.book_append_sheet(wb, wsInstrucciones, 'Instrucciones');
      
      // Descargar el archivo
      XLSX.writeFile(wb, 'Plantilla_Carga_Personal.xlsx');
    } catch (error) {
      logger.error('Error al generar la plantilla Excel:', error);
      setError(['Error al generar la plantilla Excel']);
    }
  };

  // Función para procesar el archivo Excel
  const processExcelFile = async (file) => {
    try {
      setLoading(true);
      setError(null);
      setRows([]);
      
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Obtener la primera hoja
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convertir a JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: EXCEL_HEADERS.map(h => h.field) });
          
          // Eliminar la fila de encabezados si existe
          if (jsonData.length > 0 && jsonData[0].nombre === 'Nombre*') {
            jsonData.shift();
          }
          
          // Procesar los datos
          await processExcelData(jsonData);
          
          // Liberar memoria
          e.target.result = null;
        } catch (error) {
          logger.error('Error al procesar el archivo Excel:', error);
          setError(['Error al procesar el archivo Excel: ' + error.message]);
          setLoading(false);
        }
      };
      
      reader.onerror = () => {
        setError(['Error al leer el archivo']);
        setLoading(false);
      };
      
      reader.readAsArrayBuffer(file);
      
      // Limpiar la referencia al archivo después de leerlo
      return () => {
        reader.onload = null;
        reader.onerror = null;
      };
    } catch (error) {
      logger.error('Error al procesar el archivo:', error);
      setError(['Error al procesar el archivo: ' + error.message]);
      setLoading(false);
    }
  };

  // Función para manejar la carga del archivo
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      processExcelFile(file);
    }
  };

  // Función para procesar los datos del Excel
  const processExcelData = async (data) => {
    try {
      setImporting(false);
      setProcessingStatus('Procesando datos...');
      
      // Validar datos
      const processedRows = [];
      const errores = [];
      
      data.forEach((row, index) => {
        try {
          // Validar campos requeridos
          EXCEL_HEADERS.forEach(header => {
            if (header.required && !row[header.field]) {
              throw new Error(`Fila ${index + 1}: El campo ${header.label} es requerido`);
            }
          });
          
          // Validar formato de DNI (7-8 dígitos numéricos)
          if (row.dni && !/^[0-9]{7,8}$/.test(row.dni)) {
            throw new Error(`Fila ${index + 1}: El DNI debe contener entre 7 y 8 dígitos numéricos`);
          }
          
          // Validar formato de email si existe
          if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
            throw new Error(`Fila ${index + 1}: El formato del email es inválido`);
          }
          
          // Procesar fecha de nacimiento si existe
          let fechaNacimiento = null;
          if (row.fechaNacimiento) {
            const parts = row.fechaNacimiento.split('/');
            if (parts.length === 3) {
              // Validar que las partes sean números
              if (!/^\d+$/.test(parts[0]) || !/^\d+$/.test(parts[1]) || !/^\d+$/.test(parts[2])) {
                throw new Error(`Fila ${index + 1}: Formato de fecha inválido. Use DD/MM/AAAA con números`);
              }
              
              // Validar rangos de fecha válidos
              const dia = parseInt(parts[0], 10);
              const mes = parseInt(parts[1], 10);
              const anio = parseInt(parts[2], 10);
              
              if (dia < 1 || dia > 31) {
                throw new Error(`Fila ${index + 1}: El día debe estar entre 1 y 31`);
              }
              
              if (mes < 1 || mes > 12) {
                throw new Error(`Fila ${index + 1}: El mes debe estar entre 1 y 12`);
              }
              
              if (anio < 1900 || anio > new Date().getFullYear()) {
                throw new Error(`Fila ${index + 1}: El año debe estar entre 1900 y ${new Date().getFullYear()}`);
              }
              
              fechaNacimiento = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            } else {
              throw new Error(`Fila ${index + 1}: Formato de fecha inválido. Use DD/MM/AAAA`);
            }
          }
          
          // Validar ID de empresa (debe ser un ID de MongoDB válido)
          if (row.empresaId && !/^[0-9a-fA-F]{24}$/.test(row.empresaId)) {
            throw new Error(`Fila ${index + 1}: El ID de empresa no tiene un formato válido`);
          }
          
          // Procesar campo activo
          let activo = true;
          if (row.activo) {
            const activoValue = row.activo.toString().toUpperCase();
            if (activoValue === 'NO' || activoValue === 'FALSE' || activoValue === '0') {
              activo = false;
            } else if (activoValue !== 'SI' && activoValue !== 'TRUE' && activoValue !== '1') {
              throw new Error(`Fila ${index + 1}: El campo Activo debe ser SI/NO, TRUE/FALSE o 1/0`);
            }
          }
          
          // Crear objeto procesado
          const processedRow = {
            nombre: row.nombre,
            apellido: row.apellido,
            dni: row.dni,
            telefono: row.telefono || '',
            email: row.email || '',
            direccion: row.direccion || '',
            fechaNacimiento: fechaNacimiento,
            empresaId: row.empresaId,
            cargo: row.cargo || '',
            licenciaConducir: row.licenciaConducir || '',
            activo: activo,
            observaciones: row.observaciones || ''
          };
          
          processedRows.push(processedRow);
        } catch (error) {
          errores.push(error.message);
        }
      });
      
      // Si hay errores, mostrarlos
      if (errores.length > 0) {
        setError(errores);
        setLoading(false);
        return;
      }
      
      setRows(processedRows);
      setProcessingStatus('Datos procesados correctamente');
      setLoading(false);
    } catch (error) {
      logger.error('Error al procesar los datos:', error);
      setError(['Error al procesar los datos: ' + error.message]);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // Función para importar los datos
  const handleImport = async () => {
    try {
      setImporting(true);
      setProcessingStatus('Importando personal...');
      setProgress(0);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      const response = await fetch(`${API_URL}/api/personal/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ personal: rows })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al importar el personal');
      }
      
      setProcessingStatus('Importación completada');
      setProgress(100);
      
      // Limpiar el input de archivo
      resetFileInput();
      
      // Notificar al componente padre
      if (onComplete) {
        onComplete(result);
      }
      
      // Cerrar el diálogo después de un breve retraso
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      logger.error('Error al importar el personal:', error);
      setError(['Error al importar el personal: ' + (error.message || 'Error al importar el personal')]);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h6">Importación Masiva de Personal</Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" paragraph>
            Utilice esta herramienta para importar múltiples registros de personal al sistema. 
            La plantilla Excel incluye las siguientes hojas:
          </Typography>
          
          <ul>
            <li>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Personal: 
                <span style={{ fontWeight: 'normal' }}> Hoja principal para ingresar los datos del personal.</span>
              </Typography>
            </li>
            <li>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Empresas: 
                <span style={{ fontWeight: 'normal' }}> Lista de empresas disponibles con sus IDs correspondientes.</span>
              </Typography>
            </li>
            <li>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Formatos: 
                <span style={{ fontWeight: 'normal' }}> Descripción detallada del formato requerido para cada campo.</span>
              </Typography>
            </li>
            <li>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Instrucciones: 
                <span style={{ fontWeight: 'normal' }}> Guía general para completar correctamente la plantilla.</span>
              </Typography>
            </li>
          </ul>
        </Box>
        
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadTemplate}
          >
            Descargar Plantilla Excel
          </Button>
          
          <Button
            variant="contained"
            component="label"
            startIcon={<UploadIcon />}
            disabled={loading || importing}
          >
            Cargar Archivo Excel
            <input
              key={fileKey}
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={handleFileUpload}
              ref={fileInputRef}
            />
          </Button>
        </Box>
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {Array.isArray(error) ? (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Se encontraron {error.length} errores:
                </Typography>
                <Box component="ul" sx={{ pl: 2, mt: 1, mb: 0 }}>
                  {error.slice(0, 10).map((err, index) => (
                    <li key={index}>{err}</li>
                  ))}
                  {error.length > 10 && (
                    <li>... y {error.length - 10} errores más</li>
                  )}
                </Box>
              </>
            ) : (
              error
            )}
          </Alert>
        )}
        
        {rows.length > 0 && (
          <>
            <Typography variant="subtitle1" gutterBottom>
              Vista previa de datos ({rows.length} registros)
            </Typography>
            
            <TableContainer component={Paper} sx={{ mb: 3, maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {EXCEL_HEADERS.map((header) => (
                      <TableCell key={header.field}>
                        {header.label}
                        {header.required && (
                          <Tooltip title="Campo obligatorio">
                            <IconButton size="small">
                              <InfoIcon fontSize="small" color="primary" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.nombre}</TableCell>
                      <TableCell>{row.apellido}</TableCell>
                      <TableCell>{row.dni}</TableCell>
                      <TableCell>{row.telefono}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.direccion}</TableCell>
                      <TableCell>{row.fechaNacimiento}</TableCell>
                      <TableCell>{row.empresaId}</TableCell>
                      <TableCell>{row.cargo}</TableCell>
                      <TableCell>{row.licenciaConducir}</TableCell>
                      <TableCell>{row.activo ? 'SI' : 'NO'}</TableCell>
                      <TableCell>{row.observaciones}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {importing && (
              <Box sx={{ width: '100%', mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  {processingStatus}
                </Typography>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
            )}
          </>
        )}
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary">
            * Los campos marcados con asterisco son obligatorios.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            * Para la fecha de nacimiento, utilice el formato DD/MM/AAAA.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            * Para el campo Activo, utilice "SI" o "NO".
          </Typography>
          <Typography variant="body2" color="textSecondary">
            * El ID de Empresa debe corresponder a una empresa existente en el sistema.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} color="secondary">
          Cancelar
        </Button>
        <Button 
          onClick={handleImport} 
          color="primary" 
          variant="contained"
          disabled={rows.length === 0 || loading || importing}
        >
          Importar Personal
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PersonalBulkImporter; 