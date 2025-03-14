import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, CircularProgress, Alert, Typography,
  Tooltip, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  Grid, Box, Chip, Divider, Breadcrumbs, Link
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Save as SaveIcon, 
  Add as AddIcon, 
  ArrowBack as ArrowBackIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import logger from '../utils/logger';

const API_URL = process.env.REACT_APP_API_URL;

// Columnas del Excel para la carga masiva
const EXCEL_HEADERS = [
  { key: 'dominio', label: 'Dominio/Patente *' },
  { key: 'tipo', label: 'Tipo de Vehículo *' },
  { key: 'marca', label: 'Marca' },
  { key: 'modelo', label: 'Modelo' },
  { key: 'año', label: 'Año' },
  { key: 'numeroChasis', label: 'Número de Chasis' },
  { key: 'numeroMotor', label: 'Número de Motor' },
  { key: 'seguroNumero', label: 'Número de Seguro' },
  { key: 'seguroCompania', label: 'Compañía de Seguro' },
  { key: 'seguroVencimiento', label: 'Vencimiento Seguro (DD/MM/YYYY)' },
  { key: 'vtvNumero', label: 'Número de VTV' },
  { key: 'vtvVencimiento', label: 'Vencimiento VTV (DD/MM/YYYY)' },
  { key: 'rutaNumero', label: 'Número de Ruta' },
  { key: 'rutaVencimiento', label: 'Vencimiento Ruta (DD/MM/YYYY)' },
  { key: 'capacidadCarga', label: 'Capacidad de Carga (kg)' },
  { key: 'tara', label: 'Tara (kg)' },
  { key: 'configuracionEjes', label: 'Configuración de Ejes' },
  { key: 'largo', label: 'Largo (m)' },
  { key: 'ancho', label: 'Ancho (m)' },
  { key: 'alto', label: 'Alto (m)' },
  { key: 'tipoCarroceria', label: 'Tipo de Carrocería' },
  { key: 'activo', label: 'Activo (SI/NO)' },
  { key: 'observaciones', label: 'Observaciones' }
];

// Valores predefinidos para referencia
const VALORES_PREDEFINIDOS = {
  tiposVehiculo: [
    'Camión',
    'Acoplado',
    'Semirremolque',
    'Bitren',
    'Furgón',
    'Utilitario'
  ],
  activo: ['SI', 'NO'],
  formatoFechas: 'DD/MM/YYYY',
  ejemplos: {
    dominio: 'AB123CD o ABC123',
    configuracionEjes: '6x2, 4x2, etc.',
    capacidadCarga: 'En kilogramos (kg)',
    tara: 'En kilogramos (kg)',
    dimensiones: 'En metros (m)',
  }
};

const VehiculosManager = () => {
  const { empresaId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const empresaNombre = location.state?.empresaNombre || 'Empresa';

  const [vehiculos, setVehiculos] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [formData, setFormData] = useState({
    dominio: '',
    tipo: 'Camión',
    marca: '',
    modelo: '',
    año: new Date().getFullYear(),
    numeroChasis: '',
    numeroMotor: '',
    empresa: empresaId,
    documentacion: {
      seguro: {
        numero: '',
        vencimiento: null,
        compania: ''
      },
      vtv: {
        numero: '',
        vencimiento: null
      },
      ruta: {
        numero: '',
        vencimiento: null
      },
      senasa: {
        numero: '',
        vencimiento: null
      }
    },
    caracteristicas: {
      capacidadCarga: '',
      tara: '',
      largo: '',
      ancho: '',
      alto: '',
      configuracionEjes: '',
      tipoCarroceria: ''
    },
    activo: true,
    observaciones: ''
  });

  useEffect(() => {
    fetchVehiculos();
  }, [empresaId]);

  const fetchVehiculos = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/vehiculos/empresa/${empresaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener los vehículos');
      }
      
      const data = await response.json();
      setVehiculos(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error('Error fetching vehiculos:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/vehiculos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Error al crear vehículo');
      
      resetForm();
      setOpenDialog(false);
      fetchVehiculos();
    } catch (error) {
      logger.error('Error:', error);
    }
  };

  const handleUpdate = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/vehiculos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Error al actualizar vehículo');
      
      resetForm();
      setEditingVehiculo(null);
      setOpenDialog(false);
      fetchVehiculos();
    } catch (error) {
      logger.error('Error:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este vehículo?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/vehiculos/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Error al eliminar vehículo');
        
        fetchVehiculos();
      } catch (error) {
        logger.error('Error:', error);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: name === 'activo' ? checked : value
        }
      }));
    } else if (name.includes('documentacion.')) {
      const parts = name.split('.');
      const docType = parts[1];
      const field = parts[2];
      
      setFormData(prev => ({
        ...prev,
        documentacion: {
          ...prev.documentacion,
          [docType]: {
            ...prev.documentacion[docType],
            [field]: value
          }
        }
      }));
    } else if (name.includes('caracteristicas.')) {
      const parts = name.split('.');
      const field = parts[1];
      
      setFormData(prev => ({
        ...prev,
        caracteristicas: {
          ...prev.caracteristicas,
          [field]: value
        }
      }));
    } else {
      const val = name === 'activo' ? checked : value;
      setFormData(prev => ({ ...prev, [name]: val }));
    }
  };

  const handleDateChange = (date, docType, field) => {
    setFormData(prev => ({
      ...prev,
      documentacion: {
        ...prev.documentacion,
        [docType]: {
          ...prev.documentacion[docType],
          [field]: date
        }
      }
    }));
  };

  const handleEdit = (vehiculo) => {
    setEditingVehiculo(vehiculo._id);
    setFormData({
      dominio: vehiculo.dominio,
      tipo: vehiculo.tipo,
      marca: vehiculo.marca || '',
      modelo: vehiculo.modelo || '',
      año: vehiculo.año || new Date().getFullYear(),
      numeroChasis: vehiculo.numeroChasis || '',
      numeroMotor: vehiculo.numeroMotor || '',
      empresa: empresaId,
      documentacion: {
        seguro: {
          numero: vehiculo.documentacion?.seguro?.numero || '',
          vencimiento: vehiculo.documentacion?.seguro?.vencimiento ? new Date(vehiculo.documentacion.seguro.vencimiento) : null,
          compania: vehiculo.documentacion?.seguro?.compania || ''
        },
        vtv: {
          numero: vehiculo.documentacion?.vtv?.numero || '',
          vencimiento: vehiculo.documentacion?.vtv?.vencimiento ? new Date(vehiculo.documentacion.vtv.vencimiento) : null
        },
        ruta: {
          numero: vehiculo.documentacion?.ruta?.numero || '',
          vencimiento: vehiculo.documentacion?.ruta?.vencimiento ? new Date(vehiculo.documentacion.ruta.vencimiento) : null
        },
        senasa: {
          numero: vehiculo.documentacion?.senasa?.numero || '',
          vencimiento: vehiculo.documentacion?.senasa?.vencimiento ? new Date(vehiculo.documentacion.senasa.vencimiento) : null
        }
      },
      caracteristicas: {
        capacidadCarga: vehiculo.caracteristicas?.capacidadCarga || '',
        tara: vehiculo.caracteristicas?.tara || '',
        largo: vehiculo.caracteristicas?.largo || '',
        ancho: vehiculo.caracteristicas?.ancho || '',
        alto: vehiculo.caracteristicas?.alto || '',
        configuracionEjes: vehiculo.caracteristicas?.configuracionEjes || '',
        tipoCarroceria: vehiculo.caracteristicas?.tipoCarroceria || ''
      },
      activo: vehiculo.activo,
      observaciones: vehiculo.observaciones || ''
    });
    setOpenDialog(true);
  };

  const handleOpenDialog = () => {
    setEditingVehiculo(null);
    resetForm();
    setOpenDialog(true);
  };

  const resetForm = () => {
    setFormData({
      dominio: '',
      tipo: 'Camión',
      marca: '',
      modelo: '',
      año: new Date().getFullYear(),
      numeroChasis: '',
      numeroMotor: '',
      empresa: empresaId,
      documentacion: {
        seguro: {
          numero: '',
          vencimiento: null,
          compania: ''
        },
        vtv: {
          numero: '',
          vencimiento: null
        },
        ruta: {
          numero: '',
          vencimiento: null
        },
        senasa: {
          numero: '',
          vencimiento: null
        }
      },
      caracteristicas: {
        capacidadCarga: '',
        tara: '',
        largo: '',
        ancho: '',
        alto: '',
        configuracionEjes: '',
        tipoCarroceria: ''
      },
      activo: true,
      observaciones: ''
    });
  };

  const isVencimientoProximo = (fecha) => {
    if (!fecha) return false;
    const hoy = new Date();
    const fechaVencimiento = new Date(fecha);
    const diasDiferencia = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));
    return diasDiferencia <= 30 && diasDiferencia >= 0;
  };

  const isVencido = (fecha) => {
    if (!fecha) return false;
    const hoy = new Date();
    const fechaVencimiento = new Date(fecha);
    return fechaVencimiento < hoy;
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'No establecida';
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  // Función para descargar la plantilla Excel
  const handleDownloadTemplate = () => {
    try {
      // Crear el libro de Excel
      const wb = XLSX.utils.book_new();

      // Crear la hoja principal con los encabezados
      const wsData = XLSX.utils.json_to_sheet([{}]);
      XLSX.utils.sheet_add_aoa(wsData, [EXCEL_HEADERS.map(header => header.label)], { origin: 'A1' });
      
      // Ajustar el ancho de las columnas en la hoja principal
      const wscols = EXCEL_HEADERS.map(() => ({ wch: 20 }));
      wsData['!cols'] = wscols;

      // Crear la hoja de referencia
      const referenceData = [
        ['VALORES DE REFERENCIA'],
        [''],
        ['Tipos de Vehículo Disponibles:'],
        ...VALORES_PREDEFINIDOS.tiposVehiculo.map(tipo => [tipo]),
        [''],
        ['Campo Activo:'],
        ...VALORES_PREDEFINIDOS.activo.map(valor => [valor]),
        [''],
        ['Formato de Fechas:'],
        [VALORES_PREDEFINIDOS.formatoFechas],
        [''],
        ['Ejemplos y Formatos:'],
        ['Campo', 'Formato/Ejemplo'],
        ['Dominio', VALORES_PREDEFINIDOS.ejemplos.dominio],
        ['Configuración de Ejes', VALORES_PREDEFINIDOS.ejemplos.configuracionEjes],
        ['Capacidad de Carga', VALORES_PREDEFINIDOS.ejemplos.capacidadCarga],
        ['Tara', VALORES_PREDEFINIDOS.ejemplos.tara],
        ['Dimensiones (largo, ancho, alto)', VALORES_PREDEFINIDOS.ejemplos.dimensiones],
      ];

      const wsReference = XLSX.utils.aoa_to_sheet(referenceData);
      
      // Ajustar el ancho de las columnas en la hoja de referencia
      wsReference['!cols'] = [
        { wch: 25 }, // Primera columna
        { wch: 30 }, // Segunda columna
      ];

      // Añadir estilos a los encabezados
      ['A1', 'A3', 'A6', 'A9', 'A12'].forEach(cell => {
        wsReference[cell].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "CCCCCC" } }
        };
      });

      // Agregar las hojas al libro
      XLSX.utils.book_append_sheet(wb, wsData, 'Plantilla Vehículos');
      XLSX.utils.book_append_sheet(wb, wsReference, 'Valores de Referencia');

      // Guardar el archivo
      XLSX.writeFile(wb, `plantilla_vehiculos_${empresaNombre}.xlsx`);
    } catch (error) {
      logger.error('Error al generar la plantilla:', error);
      setError('Error al generar la plantilla de Excel');
    }
  };

  // Función para procesar el archivo Excel cargado
  const processExcelFile = async (file) => {
    try {
      setUploadError(null);
      setUploadSuccess(false);
      setUploadResult(null);
      setLoading(true);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: EXCEL_HEADERS.map(h => h.key) });

          // Remover la fila de encabezados si está presente
          if (jsonData.length > 0 && (jsonData[0].dominio === 'Dominio/Patente *' || typeof jsonData[0].dominio !== 'string')) {
            jsonData.shift();
          }

          if (jsonData.length === 0) {
            throw new Error('El archivo no contiene datos para importar');
          }

          // Transformar los datos al formato esperado por la API
          const vehiculosData = jsonData.map((row, index) => {
            // Función para convertir fechas desde diferentes formatos
            const parseDate = (dateStr) => {
              if (!dateStr) return null;
              
              // Si es un número de serie de Excel, convertirlo a fecha
              if (typeof dateStr === 'number') {
                return XLSX.SSF.parse_date_code(dateStr);
              }
              
              // Intentar parsear como string en formato DD/MM/YYYY
              const parts = String(dateStr).split('/');
              if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1; // Meses en JS son 0-11
                const year = parseInt(parts[2], 10);
                return new Date(year, month, day);
              }
              
              // Último intento con Date constructor
              return new Date(dateStr);
            };

            return {
              dominio: row.dominio,
              tipo: row.tipo,
              marca: row.marca || '',
              modelo: row.modelo || '',
              año: row.año ? parseInt(row.año, 10) : new Date().getFullYear(),
              numeroChasis: row.numeroChasis || '',
              numeroMotor: row.numeroMotor || '',
              empresa: empresaId,
              documentacion: {
                seguro: {
                  numero: row.seguroNumero || '',
                  vencimiento: row.seguroVencimiento ? parseDate(row.seguroVencimiento) : null,
                  compania: row.seguroCompania || ''
                },
                vtv: {
                  numero: row.vtvNumero || '',
                  vencimiento: row.vtvVencimiento ? parseDate(row.vtvVencimiento) : null
                },
                ruta: {
                  numero: row.rutaNumero || '',
                  vencimiento: row.rutaVencimiento ? parseDate(row.rutaVencimiento) : null
                },
                senasa: {
                  numero: row.senasaNumero || '',
                  vencimiento: row.senasaVencimiento ? parseDate(row.senasaVencimiento) : null
                }
              },
              caracteristicas: {
                capacidadCarga: row.capacidadCarga ? parseFloat(row.capacidadCarga) : '',
                tara: row.tara ? parseFloat(row.tara) : '',
                largo: row.largo ? parseFloat(row.largo) : '',
                ancho: row.ancho ? parseFloat(row.ancho) : '',
                alto: row.alto ? parseFloat(row.alto) : '',
                configuracionEjes: row.configuracionEjes || '',
                tipoCarroceria: row.tipoCarroceria || ''
              },
              activo: typeof row.activo === 'string' ? row.activo.toUpperCase() === 'SI' : true,
              observaciones: row.observaciones || ''
            };
          });

          // Validar datos requeridos
          const invalidData = vehiculosData.filter(v => !v.dominio || !v.tipo);
          if (invalidData.length > 0) {
            throw new Error(`Algunos registros no tienen los campos requeridos (Dominio y Tipo). Filas con problemas: ${invalidData.map((_, i) => i + 2).join(', ')}`);
          }

          // Enviar los datos al servidor
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_URL}/api/vehiculos/bulk`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ vehiculos: vehiculosData })
          });

          const responseData = await response.json();

          if (!response.ok) {
            // Formatear mensajes de error específicos
            if (responseData.dominiosExistentes) {
              throw new Error(`Algunos dominios ya existen en la base de datos: ${responseData.dominiosExistentes.join(', ')}`);
            }
            throw new Error(responseData.message || 'Error al cargar los vehículos');
          }

          setUploadSuccess(true);
          setUploadResult({
            total: vehiculosData.length,
            insertados: responseData.insertados
          });
          fetchVehiculos();
        } catch (error) {
          logger.error('Error procesando archivo:', error);
          setUploadError(error.message || 'Error al procesar el archivo');
          setLoading(false);
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = (error) => {
        logger.error('Error al leer el archivo:', error);
        setUploadError('Error al leer el archivo');
        setLoading(false);
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      logger.error('Error al leer el archivo:', error);
      setUploadError('Error al leer el archivo');
      setLoading(false);
    }
  };

  // Función para manejar la carga del archivo
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.type === 'application/vnd.ms-excel') {
        processExcelFile(file);
      } else {
        setUploadError('Por favor, seleccione un archivo Excel válido (.xlsx o .xls)');
      }
    }
  };

  return (
    <div>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link 
            color="inherit" 
            onClick={() => navigate('/empresas')}
            sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <ArrowBackIcon sx={{ mr: 0.5 }} fontSize="small" />
            Empresas
          </Link>
          <Typography color="text.primary">Vehículos de {empresaNombre}</Typography>
        </Breadcrumbs>
      </Box>

      <Typography variant="h4" gutterBottom>
        Gestión de Vehículos - {empresaNombre}
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          onClick={handleOpenDialog}
        >
          Nuevo Vehículo
        </Button>

        <Button
          variant="outlined"
          color="primary"
          startIcon={<CloudDownloadIcon />}
          onClick={handleDownloadTemplate}
        >
          Descargar Plantilla Excel
        </Button>

        <Button
          variant="outlined"
          color="primary"
          startIcon={<CloudUploadIcon />}
          component="label"
        >
          Cargar Excel
          <input
            type="file"
            hidden
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
          />
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {uploadError && <Alert severity="error" sx={{ mb: 2 }}>{uploadError}</Alert>}
      {uploadSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {uploadResult 
            ? `Se han cargado exitosamente ${uploadResult.insertados} de ${uploadResult.total} vehículos.`
            : 'Los vehículos se han cargado exitosamente'}
        </Alert>
      )}
      
      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Dominio</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Marca/Modelo</TableCell>
                <TableCell>Documentación</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vehiculos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body1" sx={{ py: 2 }}>
                      No hay vehículos registrados para esta empresa
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                vehiculos.map((vehiculo) => (
                  <TableRow key={vehiculo._id}>
                    <TableCell>{vehiculo.dominio}</TableCell>
                    <TableCell>{vehiculo.tipo}</TableCell>
                    <TableCell>
                      {vehiculo.marca} {vehiculo.modelo}
                      {vehiculo.año && <div>Año: {vehiculo.año}</div>}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {vehiculo.documentacion?.seguro?.vencimiento && (
                          <Chip 
                            label={`Seguro: ${formatFecha(vehiculo.documentacion.seguro.vencimiento)}`}
                            color={isVencido(vehiculo.documentacion.seguro.vencimiento) ? 'error' : 
                                  isVencimientoProximo(vehiculo.documentacion.seguro.vencimiento) ? 'warning' : 'success'}
                            size="small"
                            icon={isVencido(vehiculo.documentacion.seguro.vencimiento) ? <WarningIcon /> : 
                                 isVencimientoProximo(vehiculo.documentacion.seguro.vencimiento) ? <WarningIcon /> : <CheckCircleIcon />}
                          />
                        )}
                        {vehiculo.documentacion?.vtv?.vencimiento && (
                          <Chip 
                            label={`VTV: ${formatFecha(vehiculo.documentacion.vtv.vencimiento)}`}
                            color={isVencido(vehiculo.documentacion.vtv.vencimiento) ? 'error' : 
                                  isVencimientoProximo(vehiculo.documentacion.vtv.vencimiento) ? 'warning' : 'success'}
                            size="small"
                            icon={isVencido(vehiculo.documentacion.vtv.vencimiento) ? <WarningIcon /> : 
                                 isVencimientoProximo(vehiculo.documentacion.vtv.vencimiento) ? <WarningIcon /> : <CheckCircleIcon />}
                          />
                        )}
                        {vehiculo.documentacion?.ruta?.vencimiento && (
                          <Chip 
                            label={`Ruta: ${formatFecha(vehiculo.documentacion.ruta.vencimiento)}`}
                            color={isVencido(vehiculo.documentacion.ruta.vencimiento) ? 'error' : 
                                  isVencimientoProximo(vehiculo.documentacion.ruta.vencimiento) ? 'warning' : 'success'}
                            size="small"
                            icon={isVencido(vehiculo.documentacion.ruta.vencimiento) ? <WarningIcon /> : 
                                 isVencimientoProximo(vehiculo.documentacion.ruta.vencimiento) ? <WarningIcon /> : <CheckCircleIcon />}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <span style={{ 
                        color: vehiculo.activo ? 'green' : 'red',
                        fontWeight: 'bold'
                      }}>
                        {vehiculo.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Editar">
                        <IconButton onClick={() => handleEdit(vehiculo)} color="primary">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton onClick={() => handleDelete(vehiculo._id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingVehiculo ? 'Editar Vehículo' : 'Nuevo Vehículo'}</DialogTitle>
        <DialogContent>
          <form onSubmit={editingVehiculo ? () => handleUpdate(editingVehiculo) : handleSubmit}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  name="dominio"
                  label="Dominio/Patente"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={formData.dominio}
                  onChange={handleChange}
                  required
                  helperText="Formato: ABC123 o AB123CD"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Tipo de Vehículo</InputLabel>
                  <Select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                    label="Tipo de Vehículo"
                    required
                  >
                    <MenuItem value="Camión">Camión</MenuItem>
                    <MenuItem value="Acoplado">Acoplado</MenuItem>
                    <MenuItem value="Semirremolque">Semirremolque</MenuItem>
                    <MenuItem value="Bitren">Bitren</MenuItem>
                    <MenuItem value="Furgón">Furgón</MenuItem>
                    <MenuItem value="Utilitario">Utilitario</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  name="marca"
                  label="Marca"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={formData.marca}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="modelo"
                  label="Modelo"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={formData.modelo}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="año"
                  label="Año"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={formData.año}
                  onChange={handleChange}
                  inputProps={{ min: 1950, max: new Date().getFullYear() + 1 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="numeroChasis"
                  label="Número de Chasis"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={formData.numeroChasis}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="numeroMotor"
                  label="Número de Motor"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={formData.numeroMotor}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                  Documentación
                </Typography>
                <Divider />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  name="documentacion.seguro.numero"
                  label="Número de Seguro"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={formData.documentacion.seguro.numero}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="documentacion.seguro.compania"
                  label="Compañía de Seguro"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={formData.documentacion.seguro.compania}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                  <DatePicker
                    label="Vencimiento Seguro"
                    value={formData.documentacion.seguro.vencimiento}
                    onChange={(date) => handleDateChange(date, 'seguro', 'vencimiento')}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="documentacion.vtv.numero"
                  label="Número de VTV"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={formData.documentacion.vtv.numero}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                  <DatePicker
                    label="Vencimiento VTV"
                    value={formData.documentacion.vtv.vencimiento}
                    onChange={(date) => handleDateChange(date, 'vtv', 'vencimiento')}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="documentacion.ruta.numero"
                  label="Número de Ruta"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={formData.documentacion.ruta.numero}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                  <DatePicker
                    label="Vencimiento Ruta"
                    value={formData.documentacion.ruta.vencimiento}
                    onChange={(date) => handleDateChange(date, 'ruta', 'vencimiento')}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                  Características
                </Typography>
                <Divider />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  name="caracteristicas.capacidadCarga"
                  label="Capacidad de Carga (kg)"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={formData.caracteristicas.capacidadCarga}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="caracteristicas.tara"
                  label="Tara (kg)"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={formData.caracteristicas.tara}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="caracteristicas.configuracionEjes"
                  label="Configuración de Ejes"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={formData.caracteristicas.configuracionEjes}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  name="caracteristicas.largo"
                  label="Largo (m)"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={formData.caracteristicas.largo}
                  onChange={handleChange}
                  inputProps={{ step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="caracteristicas.ancho"
                  label="Ancho (m)"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={formData.caracteristicas.ancho}
                  onChange={handleChange}
                  inputProps={{ step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="caracteristicas.alto"
                  label="Alto (m)"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={formData.caracteristicas.alto}
                  onChange={handleChange}
                  inputProps={{ step: 0.01 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="caracteristicas.tipoCarroceria"
                  label="Tipo de Carrocería"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={formData.caracteristicas.tipoCarroceria}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.activo}
                      onChange={handleChange}
                      name="activo"
                      color="primary"
                    />
                  }
                  label="Vehículo Activo"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="observaciones"
                  label="Observaciones"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={formData.observaciones}
                  onChange={handleChange}
                  multiline
                  rows={4}
                />
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="secondary">
            Cancelar
          </Button>
          <Button 
            onClick={editingVehiculo ? () => handleUpdate(editingVehiculo) : handleSubmit} 
            color="primary"
            startIcon={<SaveIcon />}
          >
            {editingVehiculo ? 'Actualizar' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default VehiculosManager; 