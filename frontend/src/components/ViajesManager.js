import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, CircularProgress, Alert,
  Select, MenuItem, FormControl, InputLabel, Snackbar, Box, Typography,
  Menu, Checkbox, ListItemText, OutlinedInput, Tooltip
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, CloudUpload as CloudUploadIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger from '../utils/logger';
import ViajeBulkImporter from './ViajeBulkImporter';

const API_URL = process.env.REACT_APP_API_URL || '';

// --- Helper Functions ---

const flattenObject = (obj, parentKey = '', result = {}) => {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = parentKey ? `${parentKey}.${key}` : key;
      if (key === '_id' || key === '__v' || obj[key] === null || typeof obj[key] === 'undefined') {
        continue;
      }

      if (Array.isArray(obj[key])) {
         obj[key].forEach((item, index) => {
            if (typeof item === 'object' && item !== null && Object.keys(item).length > 0) {
               flattenObject(item, `${newKey}.${index}`, result);
            } else if (item !== null && typeof item !== 'undefined') {
               result[`${newKey}.${index}`] = item;
            }
         });
      } else if (typeof obj[key] === 'object' && Object.keys(obj[key]).length > 0 && !(obj[key] instanceof Date)) {
         flattenObject(obj[key], newKey, result);
      } else {
         result[newKey] = obj[key];
      }
    }
  }
  return result;
};

const getValueByPath = (obj, path) => {
  try {
    return path.split('.').reduce((acc, part) => {
      const arrayMatch = part.match(/^(\\d+)$/);
      if (arrayMatch && Array.isArray(acc)) {
        return acc[parseInt(arrayMatch[1], 10)];
      }
      return acc && acc[part];
    }, obj);
  } catch (error) {
    logger.error(`Error getting value by path "${path}":`, error);
    return undefined;
  }
};

const formatColumnHeader = (accessor) => {
  return accessor
    .split('.')
    .map(part => part.replace(/([A-Z])/g, ' $1'))
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatCellValue = (value, accessor) => {
  if (value === null || typeof value === 'undefined') {
    return '-';
  }

  if (accessor.toLowerCase().includes('fecha') || value instanceof Date) {
    try {
      const date = typeof value === 'string' ? new Date(value) : value;
      if (!isNaN(date.getTime())) {
         return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
      }
    } catch (e) { /* Ignora error de formato, probará otros */ }
  }

  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }

  if (typeof value === 'number' && (accessor.toLowerCase().includes('importe') || accessor.toLowerCase().includes('costo') || accessor.toLowerCase().includes('precio'))) {
    return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  }

  if (typeof value === 'number') {
    return value.toLocaleString('es-AR');
  }

  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }

  return String(value);
};

const FIXED_ACCESSORS = ['fecha', 'origen', 'destino', 'estado'];
const ACTION_COLUMN_ID = 'acciones';

// Función para agrupar accessors para el menú
const buildColumnMenuGroups = (fixed, dynamic) => {
  const groups = {};
  const topLevel = [];

  dynamic.forEach(accessor => {
    const parts = accessor.split('.');
    if (parts.length > 1) {
      // Agrupa por el primer nivel (ej. 'chofer', 'vehiculos.0', 'facturacion')
      const groupKey = parts[0];
       // Si la clave es un número (índice de array), usar los dos primeros niveles (ej. vehiculos.0)
       const displayGroupKey = /^[0-9]+$/.test(parts[1]) ? `${parts[0]}.${parts[1]}` : groupKey;
       const displayGroupName = formatColumnHeader(displayGroupKey);

       if (!groups[displayGroupName]) {
          groups[displayGroupName] = [];
       }
       groups[displayGroupName].push(accessor);
    } else {
      // Accessor de nivel superior (no anidado)
      topLevel.push(accessor);
    }
  });

  // Ordenar grupos y accessors dentro de grupos
  Object.keys(groups).forEach(groupName => {
      groups[groupName].sort();
  });
  topLevel.sort();

  return {
    fixed: fixed.sort(),
    groups: groups, // Objeto { 'Grupo Legible': [accessors...] }
    topLevel: topLevel // Array [accessors...]
  };
};

const ViajesManager = () => {
  const [viajes, setViajes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [selectedViaje, setSelectedViaje] = useState(null);
  const [formData, setFormData] = useState({
    cliente: '',
    fecha: '',
    origen: '',
    destino: '',
    estado: 'Pendiente',
    observaciones: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [sites, setSites] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState('');
  const [clienteDetails, setClienteDetails] = useState(null);
  const [personalList, setPersonalList] = useState([]);
  const [vehiculosList, setVehiculosList] = useState([]);
  const [loadingImporterData, setLoadingImporterData] = useState(false);
  const { isAuthenticated } = useAuth();

  const [allApiAccessors, setAllApiAccessors] = useState([]);
  const [visibleAccessors, setVisibleAccessors] = useState(new Set(FIXED_ACCESSORS));
  const [columnSelectorAnchorEl, setColumnSelectorAnchorEl] = useState(null);

  // --- Estructura agrupada para el menú de columnas ---
  const columnMenuStructure = useMemo(() => {
      // Filtrar accessors de la API:
      const dynamicApiAccessors = allApiAccessors.filter(acc => 
          // 1. Excluir los que ya son fijos
          !FIXED_ACCESSORS.includes(acc) && 
          // 2. Excluir _id si apareciera
          acc !== '_id' && 
          // 3. Excluir subcampos de cliente si se aplanaran
          !acc.startsWith('cliente.') 
          // Añadir otras exclusiones si es necesario
      );
      // Pasar los fijos y los dinámicos filtrados a la función de agrupación
      return buildColumnMenuGroups(FIXED_ACCESSORS, dynamicApiAccessors);
  }, [allApiAccessors]); // Solo depende de los accessors detectados
  // --- Fin estructura de menú ---

  const getCacheKey = useCallback((clientId) => clientId ? `viajes_visible_columns_${clientId}` : null, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchClientes();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && selectedCliente) {
      fetchViajes();
      fetchSites();
      const clienteSeleccionado = clientes.find(c => c._id === selectedCliente);
      setClienteDetails(clienteSeleccionado);
    } else {
      setViajes([]);
      setAllApiAccessors([]);
      setVisibleAccessors(new Set(FIXED_ACCESSORS));
      setClienteDetails(null);
    }
  }, [isAuthenticated, selectedCliente]);

  useEffect(() => {
    if (!selectedCliente) return;

    const cacheKey = getCacheKey(selectedCliente);

    const cached = localStorage.getItem(cacheKey);
    let initialVisible = new Set(FIXED_ACCESSORS);

    if (cached) {
      try {
        const parsedAccessors = JSON.parse(cached);
        if (Array.isArray(parsedAccessors)) {
          logger.debug(`Cache de columnas encontrado para ${selectedCliente}, cargando.`);
          parsedAccessors.forEach(acc => initialVisible.add(acc));
        } else {
          logger.warn(`Cache de columnas inválido para ${selectedCliente}, usando default.`);
          localStorage.removeItem(cacheKey);
          if (allApiAccessors.length > 0) {
             allApiAccessors.forEach(acc => initialVisible.add(acc));
          }
        }
      } catch (e) {
        logger.error(`Error parseando cache de columnas para ${selectedCliente}`, e);
        localStorage.removeItem(cacheKey);
        if (allApiAccessors.length > 0) {
            allApiAccessors.forEach(acc => initialVisible.add(acc));
        }
      }
    } else {
      logger.debug(`No hay caché de columnas para ${selectedCliente}, usando todas las detectadas.`);
      if (allApiAccessors.length > 0) {
        allApiAccessors.forEach(acc => initialVisible.add(acc));
      }
    }
    setVisibleAccessors(initialVisible);
  }, [selectedCliente, allApiAccessors]);

  useEffect(() => {
    const cacheKey = getCacheKey(selectedCliente);
    if (cacheKey) {
      const accessorsToCache = Array.from(visibleAccessors).filter(acc => !FIXED_ACCESSORS.includes(acc));
      localStorage.setItem(cacheKey, JSON.stringify(accessorsToCache));
      logger.debug(`Columnas guardadas en caché para ${selectedCliente}:`, accessorsToCache);
    }
  }, [visibleAccessors, selectedCliente, getCacheKey]);

  const fetchClientes = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/clientes`);
      const clientesData = Array.isArray(response.data) ? response.data : [];
      logger.debug('Clientes recibidos:', clientesData);
      setClientes(clientesData);
      
      if (clientesData && clientesData.length > 0) {
        const primerClienteId = clientesData[0]._id || '';
        setSelectedCliente(primerClienteId);
      } else {
        setSelectedCliente('');
      }
    } catch (error) {
      logger.error('Error al obtener clientes:', error);
      setError('Error al cargar los clientes');
      setClientes([]);
      setSelectedCliente('');
    }
  };

  const fetchViajes = async () => {
    setLoading(true);
    setError(null);

    if (!selectedCliente) {
        setViajes([]);
        setLoading(false);
        setVisibleAccessors(new Set(FIXED_ACCESSORS));
        setAllApiAccessors([]);
        return;
    }

    try {
        const response = await axios.get(`${API_URL}/api/viajes`, {
        params: { cliente: selectedCliente, limit: 9999 }
        });
        const fetchedViajes = response.data?.data && Array.isArray(response.data.data) ? response.data.data : [];
      logger.debug(`Viajes recibidos para ${selectedCliente}:`, fetchedViajes.length);
        setViajes(fetchedViajes);

        if (fetchedViajes.length > 0) {
        const firstViajeFlattened = flattenObject(fetchedViajes[0]);
        const detectedAccessors = Object.keys(firstViajeFlattened)
                                    .filter(key => !FIXED_ACCESSORS.includes(key));
        logger.debug("Accessors detectados (sin fijos):", detectedAccessors);
        setAllApiAccessors(prev => {
           const currentSet = new Set(prev);
           let changed = false;
           detectedAccessors.forEach(acc => {
               if (!currentSet.has(acc)) {
                   currentSet.add(acc);
                   changed = true;
               }
           });
           return changed ? Array.from(currentSet).sort() : prev;
            });
        } else {
        setViajes([]);
      }
      setError(null);

    } catch (error) {
        logger.error('Error al obtener viajes:', error);
        setError('Error al cargar los viajes');
        setViajes([]);
    } finally {
        setLoading(false);
    }
  };

  const fetchSites = async () => {
    if (!selectedCliente) {
        logger.warn("fetchSites llamado sin selectedCliente, omitiendo.");
        setSites([]);
        return;
    }
    try {
      const response = await axios.get(`${API_URL}/api/sites`, {
          params: { cliente: selectedCliente }
      });
      const sitesData = Array.isArray(response.data?.data) ? response.data.data 
                      : Array.isArray(response.data) ? response.data 
                      : [];
      setSites(sitesData);
      logger.debug(`Sitios recibidos y procesados para ${selectedCliente}:`, sitesData.length);
    } catch (error) {
      logger.error(`Error al obtener sites para ${selectedCliente}:`, error);
      setError(prev => prev ? `${prev}, Error al cargar los sites` : `Error al cargar los sites`);
      setSites([]);
    }
  };

  const fetchPersonalActivo = async () => {
    try {
        const response = await axios.get(`${API_URL}/api/personal/activo`);
        setPersonalList(response.data || []);
    } catch (error) {
        logger.error('Error fetching active personal:', error);
        setError(prev => prev ? `${prev}, Error al cargar personal` : 'Error al cargar personal');
      setPersonalList([]);
    }
  };

  const fetchVehiculos = async () => {
    try {
          const response = await axios.get(`${API_URL}/api/vehiculos?limit=1000`);
          setVehiculosList(response.data?.data || []);
    } catch (error) {
          logger.error('Error fetching vehiculos:', error);
          setError(prev => prev ? `${prev}, Error al cargar vehículos` : 'Error al cargar vehículos');
      setVehiculosList([]);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
        fetchPersonalActivo();
        fetchVehiculos();
    }
  }, [isAuthenticated]);

  const handleClienteChange = (event) => {
    const newClienteId = event.target.value;
    logger.debug('Cliente seleccionado:', newClienteId);
    setSelectedCliente(newClienteId);
    setFormData({
      cliente: newClienteId,
      fecha: '',
      origen: '',
      destino: '',
      estado: 'Pendiente',
      observaciones: ''
    });
    setSelectedViaje(null);
  };

  const handleEdit = (viaje) => {
    setSelectedViaje(viaje);
    const initialFormData = {
        cliente: viaje.cliente?._id || viaje.cliente || selectedCliente,
        fecha: viaje.fecha ? format(new Date(viaje.fecha), "yyyy-MM-dd'T'HH:mm") : '',
        origen: viaje.origen?._id || viaje.origen || '',
        destino: viaje.destino?._id || viaje.destino || '',
        estado: viaje.estado || 'Pendiente',
        observaciones: viaje.observaciones || '',
        chofer: viaje.chofer?._id || viaje.chofer || '',
        'vehiculos.0': viaje.vehiculos && viaje.vehiculos[0]?._id || viaje.vehiculos?.[0] || '',
        importe: getValueByPath(viaje, 'facturacion.importe') || '',
    };
     Object.keys(initialFormData).forEach(key => {
        if (typeof getValueByPath(viaje, key.replace(/\.\d+$/, '')) === 'undefined' && key !== 'cliente') {
            initialFormData[key] = '';
        }
     });

    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este viaje?')) {
      try {
        await axios.delete(`${API_URL}/api/viajes/${id}`);
        setSuccessMessage('Viaje eliminado correctamente');
        fetchViajes();
      } catch (error) {
        logger.error('Error al eliminar viaje:', error);
        setError('Error al eliminar el viaje');
      }
    }
  };

  const handleCloseDialog = () => {
    setIsModalOpen(false);
    setSelectedViaje(null);
    setFormData({
      cliente: selectedCliente,
      fecha: '',
      origen: '',
      destino: '',
      estado: 'Pendiente',
      observaciones: ''
    });
    setError(null);
  };

  const handleSubmit = async () => {
    try {
       const dataToSend = { ...formData };
       if (dataToSend['vehiculos.0']) {
            dataToSend.vehiculos = [dataToSend['vehiculos.0']];
            delete dataToSend['vehiculos.0'];
       } else {
           dataToSend.vehiculos = [];
           delete dataToSend['vehiculos.0'];
       }
       if (dataToSend.fecha) {
           dataToSend.fecha = new Date(dataToSend.fecha).toISOString();
       }

       let response;
      if (selectedViaje) {
         response = await axios.put(`${API_URL}/api/viajes/${selectedViaje._id}`, dataToSend);
        setSuccessMessage('Viaje actualizado correctamente');
      } else {
         response = await axios.post(`${API_URL}/api/viajes`, dataToSend);
        setSuccessMessage('Viaje creado correctamente');
      }
       logger.debug('Respuesta submit:', response.data);
      handleCloseDialog();
      fetchViajes();
    } catch (error) {
       logger.error('Error al guardar viaje:', error.response?.data || error.message);
       setError(error.response?.data?.message || error.response?.data?.error || 'Error al guardar el viaje');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImportComplete = () => {
    setIsImporterOpen(false);
    setSuccessMessage("Importación completada.");
    fetchViajes();
  };

  const handleOpenImporter = async () => {
    setLoadingImporterData(true);
    try {
        await Promise.all([fetchSites(), fetchPersonalActivo(), fetchVehiculos()]);
        setIsImporterOpen(true);
    } catch (error) {
        logger.error("Error preparando datos para el importador:", error);
        setError("No se pudieron cargar los datos necesarios para el importador.");
    } finally {
        setLoadingImporterData(false);
    }
  };

  const handleOpenColumnSelector = (event) => {
    setColumnSelectorAnchorEl(event.currentTarget);
  };

  const handleCloseColumnSelector = () => {
    setColumnSelectorAnchorEl(null);
  };

  const handleToggleColumnVisibility = (accessor) => {
    setVisibleAccessors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accessor)) {
        newSet.delete(accessor);
      } else {
        newSet.add(accessor);
      }
      return newSet;
    });
  };

  const renderTableCell = (viaje, accessor) => {
    if (accessor === 'cliente') {
      return clienteDetails?.razonSocial || clienteDetails?.Cliente || clienteDetails?.nombre || selectedCliente || '-';
    }
    if (accessor === 'origen' || accessor === 'destino') {
       const siteData = viaje[accessor];
       const siteId = typeof siteData === 'object' && siteData !== null ? siteData._id : siteData;
       const site = sites.find(s => s._id === siteId);
       const displayName = site?.nombre;
       return displayName || siteId || '-';
    }
    if (accessor === 'estado') {
        const estadoValue = getValueByPath(viaje, accessor);
        return formatCellValue(estadoValue, accessor);
    }
    if (accessor === 'chofer' || accessor.startsWith('chofer.')) {
        const choferId = getValueByPath(viaje, 'chofer._id') || getValueByPath(viaje, 'chofer');
        const chofer = personalList.find(p => p._id === choferId);
        
        if (accessor === 'chofer') {
             return chofer ? `${chofer.nombre || ''} ${chofer.apellido || ''}`.trim() : choferId || '-';
        } else {
             const subValue = chofer ? getValueByPath(chofer, accessor.substring(7)) : undefined;
             return formatCellValue(subValue, accessor);
        }
    }

    const value = getValueByPath(viaje, accessor);
    const formattedValue = formatCellValue(value, accessor);

    const needsTooltip = typeof formattedValue === 'string' && formattedValue.length > 30;

        return (
      <Tooltip title={needsTooltip ? formattedValue : ''} arrow>
        <Typography variant="body2" noWrap={needsTooltip} sx={{ maxWidth: 200 }}>
          {formattedValue === 'null' || formattedValue === 'undefined' ? '-' : formattedValue}
        </Typography>
      </Tooltip>
    );
  };

  const columnsToRender = useMemo(() => {
    const cols = [];

    cols.push({
        id: 'cliente',
        accessor: 'cliente',
        Header: 'Cliente',
    });

    FIXED_ACCESSORS.forEach(accessor => {
        if (visibleAccessors.has(accessor)) {
            cols.push({
                id: accessor,
                accessor: accessor,
                Header: formatColumnHeader(accessor),
            });
        }
    });

    const dynamicVisible = Array.from(visibleAccessors)
        .filter(acc => !FIXED_ACCESSORS.includes(acc) && acc !== 'cliente')
        .sort();

    dynamicVisible.forEach(accessor => {
        cols.push({
            id: accessor,
            accessor: accessor,
            Header: formatColumnHeader(accessor),
        });
    });

    cols.push({
      id: ACTION_COLUMN_ID,
      accessor: ACTION_COLUMN_ID,
      Header: 'Acciones',
    });

    return cols;
  }, [visibleAccessors, clienteDetails]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h5" gutterBottom>Gestión de Viajes</Typography>

      <FormControl fullWidth margin="normal">
        <InputLabel id="cliente-select-label">Cliente</InputLabel>
          <Select
            labelId="cliente-select-label"
            id="cliente-select"
            value={selectedCliente}
            label="Cliente"
            onChange={handleClienteChange}
            disabled={loading || clientes.length === 0}
          >
            {clientes.length === 0 && <MenuItem disabled>Cargando clientes...</MenuItem>}
            {clientes.map((cliente) => {
              logger.debug('Renderizando MenuItem para cliente:', cliente);
              return (
              <MenuItem key={cliente._id} value={cliente._id}>
                  {cliente.Cliente || cliente._id}
              </MenuItem>
              );
            })}
          </Select>
        </FormControl>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button variant="contained" onClick={() => { setSelectedViaje(null); setIsModalOpen(true); }} disabled={!selectedCliente || loading}>
          Nuevo Viaje
        </Button>
        <Box sx={{ display: 'flex', gap: 1}}>
        <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
          onClick={handleOpenImporter}
              disabled={!selectedCliente || loading || loadingImporterData}
        >
              {loadingImporterData ? <CircularProgress size={20} /> : "Importar Viajes"}
        </Button>
        <Button
            aria-controls="column-selector-menu"
            aria-haspopup="true"
            onClick={handleOpenColumnSelector}
            variant="outlined"
            startIcon={<FilterListIcon />}
            disabled={allApiAccessors.length === 0}
        >
            Columnas
        </Button>
        </Box>
      </Box>

      {/* Menú Selector de Columnas */}
      <Menu
        id="column-selector-menu"
        anchorEl={columnSelectorAnchorEl}
        keepMounted
        open={Boolean(columnSelectorAnchorEl)}
        onClose={handleCloseColumnSelector}
        // Ajustar altura máxima y scroll si hay muchas opciones
        PaperProps={{
          style: {
            maxHeight: 400,
            width: '30ch',
          },
        }}
      >
         {/* 1. Columnas Fijas */}
         <Typography sx={{ pl: 2, pt: 1, fontWeight: 'bold', fontSize: '0.9rem' }}>Columnas Fijas</Typography>
         {columnMenuStructure.fixed.map((accessor) => (
           <MenuItem key={accessor} onClick={() => handleToggleColumnVisibility(accessor)} dense>
             <Checkbox checked={visibleAccessors.has(accessor)} size="small" />
             <ListItemText primary={formatColumnHeader(accessor)} />
           </MenuItem>
         ))}

         {/* 2. Grupos de Campos Anidados */}
         {Object.entries(columnMenuStructure.groups).length > 0 && (
            <>
                <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #eee'}} />
                <Typography sx={{ pl: 2, fontWeight: 'bold', fontSize: '0.9rem' }}>Campos Detallados</Typography>
            </>
         )}
         {Object.entries(columnMenuStructure.groups).map(([groupName, accessors]) => (
            <React.Fragment key={groupName}>
                {/* Título del Grupo (no seleccionable directamente) */}
                <Typography sx={{ pl: 2, pt: 1, fontSize: '0.85rem', fontWeight: 500, color: 'text.secondary' }}>{groupName}</Typography>
                {/* Propiedades del Grupo */}
                {accessors.map(accessor => (
                    <MenuItem key={accessor} onClick={() => handleToggleColumnVisibility(accessor)} sx={{ pl: 4 }} dense> {/* Indentación */}
                        <Checkbox checked={visibleAccessors.has(accessor)} size="small" />
                        {/* Mostrar solo la última parte del accessor como nombre */}
                        <ListItemText primary={formatColumnHeader(accessor.split('.').pop())} />
                    </MenuItem>
                ))}
            </React.Fragment>
         ))}

        {/* 3. Campos de Nivel Superior (No anidados y no fijos) */}
         {columnMenuStructure.topLevel.length > 0 && (
            <>
                <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #eee'}} />
                <Typography sx={{ pl: 2, fontWeight: 'bold', fontSize: '0.9rem' }}>Otros Campos</Typography>
            </>
         )}
         {columnMenuStructure.topLevel.map((accessor) => (
           <MenuItem key={accessor} onClick={() => handleToggleColumnVisibility(accessor)} dense>
             <Checkbox checked={visibleAccessors.has(accessor)} size="small" />
             <ListItemText primary={formatColumnHeader(accessor)} />
           </MenuItem>
         ))}
      </Menu>

      {loading && <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {successMessage && <Snackbar open={Boolean(successMessage)} autoHideDuration={6000} onClose={() => setSuccessMessage(null)} message={successMessage} />}

      {!loading && selectedCliente && (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
                 {columnsToRender.map((column) => (
                   <TableCell key={column.id} sx={{ fontWeight: 'bold' }}>
                     {column.Header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
              {viajes.length > 0 ? (
                viajes.map((viaje) => (
                  <TableRow hover key={viaje._id}>
                    {columnsToRender.map((column) => (
                      <TableCell key={`${viaje._id}-${column.id}`}>
                        {column.id === ACTION_COLUMN_ID ? (
                          <>
                            <IconButton size="small" onClick={() => handleEdit(viaje)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(viaje._id)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        ) : (
                           renderTableCell(viaje, column.accessor)
                        )}
                     </TableCell>
                    ))}
                 </TableRow>
                ))
               ) : (
                 <TableRow>
                   <TableCell colSpan={columnsToRender.length} align="center">
                     No se encontraron viajes para este cliente.
                     </TableCell>
                 </TableRow>
             )}
          </TableBody>
        </Table>
      </TableContainer>
      )}
      {!selectedCliente && !loading && (
           <Typography sx={{ textAlign: 'center', mt: 4 }}>Seleccione un cliente para ver los viajes.</Typography>
      )}

      <Dialog open={isModalOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{selectedViaje ? 'Editar Viaje' : 'Nuevo Viaje'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            margin="dense"
             label="Cliente"
             value={clienteDetails?.razonSocial || clienteDetails?.nombre || selectedCliente || ''}
            fullWidth
             disabled
             sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
             label="Fecha y Hora"
             type="datetime-local"
             name="fecha"
             value={formData.fecha || ''}
             onChange={handleInputChange}
             fullWidth
             InputLabelProps={{ shrink: true }}
             sx={{ mb: 2 }}
           />
           <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
               <InputLabel id="origen-select-label">Origen</InputLabel>
               <Select
                   labelId="origen-select-label"
            name="origen"
                   value={formData.origen || ''}
            label="Origen"
            onChange={handleInputChange}
               >
                   {sites.map(site => <MenuItem key={site._id} value={site._id}>{site.nombre}</MenuItem>)}
               </Select>
           </FormControl>
           <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
               <InputLabel id="destino-select-label">Destino</InputLabel>
               <Select
                   labelId="destino-select-label"
            name="destino"
                   value={formData.destino || ''}
            label="Destino"
            onChange={handleInputChange}
               >
                   {sites.map(site => <MenuItem key={site._id} value={site._id}>{site.nombre}</MenuItem>)}
               </Select>
           </FormControl>
            <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
                <InputLabel id="estado-select-label">Estado</InputLabel>
            <Select
                    labelId="estado-select-label"
              name="estado"
                    value={formData.estado || 'Pendiente'}
                    label="Estado"
              onChange={handleInputChange}
            >
                    <MenuItem value="Pendiente">Pendiente</MenuItem>
                    <MenuItem value="Asignado">Asignado</MenuItem>
                    <MenuItem value="En curso">En curso</MenuItem>
                    <MenuItem value="Completado">Completado</MenuItem>
              <MenuItem value="Cancelado">Cancelado</MenuItem>
                    <MenuItem value="Facturado">Facturado</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Observaciones"
            type="text"
                name="observaciones"
                value={formData.observaciones || ''}
                onChange={handleInputChange}
            fullWidth
            multiline
                rows={3}
                sx={{ mb: 2 }}
             />

             {allApiAccessors.filter(acc => !FIXED_ACCESSORS.includes(acc) && !['origen', 'destino', 'estado', 'observaciones', 'fecha'].includes(acc) && acc !== 'cliente' && !acc.startsWith('vehiculos.') && acc !== 'chofer').map(accessor => (
                <TextField
                    key={accessor}
                    margin="dense"
                    label={formatColumnHeader(accessor)}
                    type={typeof getValueByPath(selectedViaje || {}, accessor) === 'number' ? 'number' : 'text'}
                    name={accessor}
                    value={formData[accessor] || ''}
            onChange={handleInputChange}
                    fullWidth
                    sx={{ mb: 2 }}
                />
             ))}

            {allApiAccessors.some(acc => acc.startsWith('chofer')) && (
                <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
                   <InputLabel id="chofer-select-label">Chofer</InputLabel>
                   <Select
                       labelId="chofer-select-label"
                       name="chofer"
                       value={formData.chofer || ''}
                       label="Chofer"
                       onChange={handleInputChange}
                   >
                       <MenuItem value="">* Sin asignar *</MenuItem>
                       {personalList.map(p => <MenuItem key={p._id} value={p._id}>{p.nombre} {p.apellido}</MenuItem>)}
                   </Select>
               </FormControl>
            )}

            {allApiAccessors.some(acc => acc.startsWith('vehiculos.')) && (
                 <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
                    <InputLabel id="vehiculo-select-label">Vehículo</InputLabel>
                    <Select
                        labelId="vehiculo-select-label"
                        name="vehiculos.0"
                        value={formData['vehiculos.0'] || ''}
                        label="Vehículo"
                        onChange={handleInputChange}
                    >
                         <MenuItem value="">* Sin asignar *</MenuItem>
                        {vehiculosList.map(v => <MenuItem key={v._id} value={v._id}>{v.patente} ({v.marca} {v.modelo})</MenuItem>)}
                    </Select>
                </FormControl>
            )}

        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedViaje ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

          <ViajeBulkImporter
            open={isImporterOpen}
            onClose={() => setIsImporterOpen(false)}
            onImportComplete={handleImportComplete}
            clienteId={selectedCliente}
            sites={sites}
            personal={personalList}
            vehiculos={vehiculosList}
          />
    </Paper>
  );
};

export default ViajesManager;
