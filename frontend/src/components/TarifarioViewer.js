import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, Checkbox, TextField, FormControl, InputLabel, Select, MenuItem,
    IconButton, Box, Alert, Typography, Toolbar, Grid, Snackbar, Chip, Tooltip, CircularProgress
} from '@mui/material';
import { 
    Add as AddIcon, 
    Delete as DeleteIcon,
    FilterAlt as FilterIcon,
    CloudUpload as CloudUploadIcon,
    Info as InfoIcon,
    FileDownload as FileDownloadIcon,
    Edit as EditIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import { format, parseISO, isWithinInterval } from 'date-fns';
import axios from 'axios';
import TramosBulkImporter from './TramosBulkImporter';
import TramosExcelImporter from './TramosExcelImporter';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import logger from '../utils/logger';
import * as XLSX from 'xlsx';

// Configurar dayjs para usar español y formato de fecha preferido
dayjs.locale('es');
// Añadir el plugin UTC para manejo correcto de zonas horarias
dayjs.extend(utc);
dayjs.extend(timezone);

// Configurar dayjs para no ajustar automáticamente las zonas horarias
const parseDate = (dateString) => {
    if (!dateString) return null;
    return dayjs(dateString).format('YYYY-MM-DD');
};

const AddTramoDialog = ({ open, onClose, onSave, sites, initialData }) => {
    const [tramoData, setTramoData] = useState({
        origen: initialData?.origen || '',
        destino: initialData?.destino || '',
        cliente: initialData?.cliente || '',
        tarifasHistoricas: [{
            tipo: initialData?.tarifasHistoricas?.[0]?.tipo || 'TRMC',
            metodoCalculo: initialData?.tarifasHistoricas?.[0]?.metodoCalculo || 'Kilometro',
            valor: initialData?.tarifasHistoricas?.[0]?.valor || 0,
            valorPeaje: initialData?.tarifasHistoricas?.[0]?.valorPeaje || 0,
            vigenciaDesde: initialData?.tarifasHistoricas?.[0]?.vigenciaDesde ? dayjs(initialData.tarifasHistoricas[0].vigenciaDesde) : dayjs(),
            vigenciaHasta: initialData?.tarifasHistoricas?.[0]?.vigenciaHasta ? dayjs(initialData.tarifasHistoricas[0].vigenciaHasta) : dayjs().add(1, 'year')
        }]
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        if (['tipo', 'metodoCalculo', 'valor', 'valorPeaje'].includes(name)) {
            setTramoData({
                ...tramoData,
                tarifasHistoricas: [
                    {
                        ...tramoData.tarifasHistoricas[0],
                        [name]: value
                    }
                ]
            });
        } else {
            setTramoData({
                ...tramoData,
                [name]: value
            });
        }
    };

    const handleDateChange = (name, date) => {
        setTramoData({
            ...tramoData,
            tarifasHistoricas: [
                {
                    ...tramoData.tarifasHistoricas[0],
                    [name]: date
                }
            ]
        });
    };

    const handleSave = () => {
        const tarifaHistorica = tramoData.tarifasHistoricas[0];
        
        // Optimización: Usar formato ISO directamente para evitar manipulaciones innecesarias
        const vigenciaDesde = tarifaHistorica.vigenciaDesde.format('YYYY-MM-DD');
        const vigenciaHasta = tarifaHistorica.vigenciaHasta.format('YYYY-MM-DD');
        
        const dataToSave = {
            ...tramoData,
            tarifasHistoricas: [{
                ...tarifaHistorica,
                vigenciaDesde,
                vigenciaHasta
            }]
        };
        
        onSave(dataToSave);
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            container={document.getElementById('root')}
        >
            <DialogTitle>Nuevo Tramo</DialogTitle>
            <DialogContent>
                <FormControl fullWidth margin="normal">
                    <InputLabel>Origen</InputLabel>
                    <Select
                        value={tramoData.origen}
                        onChange={(e) => handleInputChange({target: {name: 'origen', value: e.target.value}})}
                    >
                        {sites.sort((a, b) => a.Site.localeCompare(b.Site)).map(site => (
                            <MenuItem key={site._id} value={site._id}>
                                {site.Site}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                    <InputLabel>Destino</InputLabel>
                    <Select
                        value={tramoData.destino}
                        onChange={(e) => handleInputChange({target: {name: 'destino', value: e.target.value}})}
                    >
                        {sites.sort((a, b) => a.Site.localeCompare(b.Site)).map(site => (
                            <MenuItem key={site._id} value={site._id}>
                                {site.Site}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                    <InputLabel>Tipo</InputLabel>
                    <Select
                        value={tramoData.tarifasHistoricas[0].tipo}
                        onChange={(e) => handleInputChange({target: {name: 'tipo', value: e.target.value}})}
                    >
                        <MenuItem value="TRMC">TRMC</MenuItem>
                        <MenuItem value="TRMI">TRMI</MenuItem> {/* Cambiado de TMRI a TRMI */}
                    </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                    <InputLabel>Método de Cálculo</InputLabel>
                    <Select
                        value={tramoData.tarifasHistoricas[0].metodoCalculo}
                        onChange={(e) => handleInputChange({target: {name: 'metodoCalculo', value: e.target.value}})}
                    >
                        <MenuItem value="Kilometro">Por Kilómetro</MenuItem>
                        <MenuItem value="Palet">Por Palet</MenuItem>
                        <MenuItem value="Fijo">Fijo</MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    fullWidth
                    margin="normal"
                    label="Valor Peaje"
                    type="number"
                    inputProps={{ step: "0.01" }}
                    value={tramoData.tarifasHistoricas[0].valorPeaje}
                    onChange={(e) => handleInputChange({target: {name: 'valorPeaje', value: parseFloat(e.target.value)}})}
                />

                <TextField
                    fullWidth
                    margin="normal"
                    label="Valor Tarifa"
                    type="number"
                    inputProps={{ step: "0.01" }}
                    value={tramoData.tarifasHistoricas[0].valor}
                    onChange={(e) => handleInputChange({target: {name: 'valor', value: parseFloat(e.target.value)}})}
                />

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, mt: 2 }}>
                        <DatePicker
                            label="Vigencia Desde"
                            value={tramoData.tarifasHistoricas[0].vigenciaDesde}
                            onChange={(date) => handleDateChange('vigenciaDesde', date)}
                            format="DD/MM/YYYY"
                            sx={{ flex: 1 }}
                        />
                        <DatePicker
                            label="Vigencia Hasta"
                            value={tramoData.tarifasHistoricas[0].vigenciaHasta}
                            onChange={(date) => handleDateChange('vigenciaHasta', date)}
                            format="DD/MM/YYYY"
                            sx={{ flex: 1 }}
                        />
                    </Box>
                </LocalizationProvider>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Cancelar
                </Button>
                <Button onClick={handleSave} color="primary" variant="contained">
                    Guardar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const DATE_FORMAT = 'DD/MM/YYYY';
const ISO_FORMAT = 'YYYY-MM-DD';

const formatMoney = (value) => {
    return Number(value || 0).toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

// Función para obtener la tarifa vigente de un tramo
const obtenerTarifaVigente = (tramo, hoyStr) => {
    // Si el tramo tiene una tarifaActual (del nuevo formato)
    if (tramo.tarifaActual) {
        return tramo.tarifaActual;
    } 
    
    if (tramo.tarifasHistoricas && tramo.tarifasHistoricas.length > 0) {
        // Buscar en tarifasHistoricas por tipo y vigencia
        const tarifaVigenteActual = tramo.tarifasHistoricas.find(tarifa => {
            // Si hay un tipo específico en el tramo, filtrar por ese tipo
            if (tramo.tipo && tarifa.tipo !== tramo.tipo) {
                return false;
            }
            
            // Extraer solo la parte de la fecha (YYYY-MM-DD)
            const tarifaDesdeStr = tarifa.vigenciaDesde.split('T')[0];
            const tarifaHastaStr = tarifa.vigenciaHasta.split('T')[0];
            
            // Comparar las fechas como strings
            return tarifaDesdeStr <= hoyStr && tarifaHastaStr >= hoyStr;
        });
        
        // Si no hay vigente, usar la primera
        return tarifaVigenteActual || tramo.tarifasHistoricas[0];
    } 
    
    // Para tramos con formato antiguo
    return {
        tipo: tramo.tipo || 'TRMC',
        metodoCalculo: tramo.metodoCalculo || 'Kilometro',
        valor: tramo.valor || 0,
        valorPeaje: tramo.valorPeaje || 0,
        vigenciaDesde: tramo.vigenciaDesde,
        vigenciaHasta: tramo.vigenciaHasta
    };
};

// Función para generar el detalle del método de cálculo
const generarDetalleMetodo = (metodoCalculo, valor, distancia) => {
    switch(metodoCalculo) {
        case "Kilometro":
            return `$${formatMoney(valor)}/km (${distancia || 0} km)`;
        case "Palet":
            return `$${formatMoney(valor)}/palet`;
        case "Fijo":
            return "Tarifa fija";
        default:
            return metodoCalculo;
    }
};

// Función para formatear una fecha ISO a formato DD/MM/YYYY
const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'N/A';
    
    // Extraer solo la parte de la fecha (YYYY-MM-DD)
    const soloFecha = fechaStr.split('T')[0];
    
    // Convertir a formato DD/MM/YYYY
    return `${soloFecha.substring(8, 10)}/${soloFecha.substring(5, 7)}/${soloFecha.substring(0, 4)}`;
};

const TarifarioViewer = ({ open, cliente, onClose }) => {
    const [tramos, setTramos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sites, setSites] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showImporter, setShowImporter] = useState(false);
    const [showExcelImporter, setShowExcelImporter] = useState(false);
    const [newTramo, setNewTramo] = useState({
        origen: '',
        destino: '',
        tipo: 'TRMC',
        metodoCalculo: 'Palet',
        valor: 0,
        valorPeaje: 0,
        distancia: 0,
        vigenciaDesde: new Date(),
        vigenciaHasta: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    });
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [tramoToDelete, setTramoToDelete] = useState(null);
    const [tramoToEdit, setTramoToEdit] = useState(null);
    const [permisos, setPermisos] = useState(['editar_tramos', 'eliminar_tramos']);
    
    // Metadata
    const [metadata, setMetadata] = useState({
        totalTramos: 0,
        tramosUnicos: 0,
        combinacionesUnicas: 0
    });
    
    // New state for filters and multi-selection
    const [filtroVigencia, setFiltroVigencia] = useState({
        desde: '',
        hasta: ''
    });
    const [selectedTramos, setSelectedTramos] = useState([]);
    const [filteredTramos, setFilteredTramos] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [isVigenciaMasivaOpen, setIsVigenciaMasivaOpen] = useState(false);
    const [vigenciaMasiva, setVigenciaMasiva] = useState({
        vigenciaDesde: dayjs(),
        vigenciaHasta: dayjs().add(1, 'year')
    });

    const applyFilters = useCallback(() => {
        logger.debug('Aplicando filtros a', tramos.length, 'tramos');
        if (!tramos || tramos.length === 0) {
            setFilteredTramos([]);
            return;
        }
        
        // Si no hay filtros de fecha, mostrar todos los tramos
        if (!filtroVigencia.desde || !filtroVigencia.hasta) {
            setFilteredTramos(tramos);
            return;
        }
        
        // Convertir las fechas de filtro a formato YYYY-MM-DD
        const desdeStr = filtroVigencia.desde;
        const hastaStr = filtroVigencia.hasta;

        logger.debug(`Filtrando tramos por rango de fechas: ${desdeStr} - ${hastaStr}`);

        // Crear un mapa para almacenar solo el tramo más reciente por cada combinación
        const tramosUnicos = new Map();
        
        // Procesar cada tramo
        tramos.forEach(tramo => {
            // Verificar si el tramo tiene tarifas históricas
            if (tramo.tarifasHistoricas?.length > 0) {
                // Filtrar tarifas que se superpongan con el rango de fechas solicitado
                const tarifasEnRango = tramo.tarifasHistoricas.filter(tarifa => {
                    // Extraer solo la parte de la fecha (YYYY-MM-DD)
                    const tarifaDesdeStr = tarifa.vigenciaDesde.split('T')[0];
                    const tarifaHastaStr = tarifa.vigenciaHasta.split('T')[0];
                    
                    // Verificar si la tarifa se superpone con el rango de fechas
                    return tarifaDesdeStr <= hastaStr && tarifaHastaStr >= desdeStr;
                });
                
                // Si no hay tarifas en rango, omitir este tramo
                if (tarifasEnRango.length === 0) return;
                
                // Agrupar por tipo de tarifa
                const tiposTarifa = new Set(tarifasEnRango.map(t => t.tipo));
                
                // Para cada tipo de tarifa, encontrar la más reciente en el rango
                tiposTarifa.forEach(tipo => {
                    // Filtrar tarifas por tipo
                    const tarifasDeTipo = tarifasEnRango.filter(t => t.tipo === tipo);
                    
                    // Ordenar por fecha de vigencia (más reciente primero)
                    tarifasDeTipo.sort((a, b) => 
                        new Date(b.vigenciaHasta) - new Date(a.vigenciaHasta)
                    );
                    
                    if (tarifasDeTipo.length > 0) {
                        // Crear una copia del tramo con la tarifa específica
                        const tramoConTarifa = {
                            ...tramo,
                            tipo: tipo, // Asignar el tipo de la tarifa al tramo
                            tarifaActual: tarifasDeTipo[0] // Guardar referencia a la tarifa más reciente
                        };
                        
                        // Clave única que incluye origen, destino y tipo
                        const key = `${tramo.origen?.Site}-${tramo.destino?.Site}-${tipo}`;
                        
                        // Guardar en el mapa
                        if (!tramosUnicos.has(key) || 
                            new Date(tarifasDeTipo[0].vigenciaHasta) > new Date(tramosUnicos.get(key).tarifaActual.vigenciaHasta)) {
                            tramosUnicos.set(key, tramoConTarifa);
                        }
                    }
                });
            } else if (tramo.vigenciaDesde && tramo.vigenciaHasta) {
                // Para tramos con formato antiguo
                // Extraer solo la parte de la fecha (YYYY-MM-DD)
                const tramoDesdeStr = tramo.vigenciaDesde.split('T')[0];
                const tramoHastaStr = tramo.vigenciaHasta.split('T')[0];
                
                // Verificar si el tramo se superpone con el rango de fechas
                if (tramoDesdeStr <= hastaStr && tramoHastaStr >= desdeStr) {
                    // Clave única que incluye origen, destino y tipo
                    const key = `${tramo.origen?.Site}-${tramo.destino?.Site}-${tramo.tipo || 'TRMC'}`;
                    
                    // Si no existe un tramo para esta clave o este tramo tiene una fecha más reciente
                    if (!tramosUnicos.has(key) || 
                        new Date(tramo.vigenciaHasta) > new Date(tramosUnicos.get(key).vigenciaHasta)) {
                        tramosUnicos.set(key, tramo);
                    }
                }
            }
        });
        
        // Convertir el mapa a array
        const filteredResults = Array.from(tramosUnicos.values());
        
        logger.debug(`Filtrado completado: ${filteredResults.length} tramos coinciden con el filtro de fecha`);
        
        // Si no hay resultados, mostrar un mensaje informativo
        if (filteredResults.length === 0) {
            setError(`No se encontraron tramos para el período ${desdeStr} - ${hastaStr}`);
        } else {
            setError(null);
        }
        
        setFilteredTramos(filteredResults);
    }, [tramos, filtroVigencia]);

    const fetchSites = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/sites?cliente=${cliente}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSites(response.data.data || []);
        } catch (error) {
            logger.error('Error al cargar sites:', error);
            setSites([]);
        }
    }, [cliente]);

    const fetchTramos = useCallback(async () => {
        if (!open || !cliente) return;
        
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            logger.debug('Solicitando tramos para cliente:', cliente);
            
            // Añadir parámetros de filtro de fecha si están presentes
            let url = `/api/tramos/cliente/${encodeURIComponent(cliente)}`;
            if (filtroVigencia.desde && filtroVigencia.hasta) {
                url += `?desde=${filtroVigencia.desde}&hasta=${filtroVigencia.hasta}&incluirHistoricos=true`;
                logger.debug(`Solicitando tramos históricos con filtro: ${url}`);
            }
            
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data && response.data.success) {
                const tramosRecibidos = response.data.data || [];
                logger.debug(`Recibidos ${tramosRecibidos.length} tramos del servidor`);
                
                // Establecer los tramos recibidos directamente
                setTramos(tramosRecibidos);
                setFilteredTramos(tramosRecibidos);
                
                if (response.data.metadata) {
                    setMetadata(response.data.metadata);
                    logger.debug('Metadata recibida:', response.data.metadata);
                }
                
                setError(null);
            } else {
                setError('Formato de respuesta no reconocido');
                setTramos([]);
                setFilteredTramos([]);
            }
        } catch (error) {
            logger.error('Error al cargar tramos:', error);
            setError(`Error al cargar tramos: ${error.message}`);
            setTramos([]);
            setFilteredTramos([]);
        } finally {
            setLoading(false);
        }
        setSelectedTramos([]);
    }, [open, cliente, filtroVigencia.desde, filtroVigencia.hasta]);

    // Inicializar filteredTramos con tramos al principio
    useEffect(() => {
        setFilteredTramos(tramos);
    }, [tramos]);

    useEffect(() => {
        if (open && cliente) {
            logger.debug('TarifarioViewer abierto para cliente:', cliente);
            fetchTramos();
            fetchSites();
        }
    }, [open, cliente, fetchTramos, fetchSites]);

    // Apply filters when tramos or filter criteria change
    useEffect(() => {
        applyFilters();
    }, [tramos, filtroVigencia, applyFilters]);

    const handleAddTramo = async (tramoData) => {
        try {
            setLoading(true);
            // Asegúrate de que el cliente esté establecido
            tramoData.cliente = cliente;
            
            let response;
            
            // Si hay un tramo para editar, actualizar en lugar de crear
            if (tramoToEdit) {
                logger.debug('Actualizando tramo existente:', tramoToEdit._id);
                response = await axios.put(`/api/tramos/${tramoToEdit._id}`, tramoData);
                setSuccessMessage('Tramo actualizado exitosamente');
            } else {
                logger.debug('Creando nuevo tramo');
                response = await axios.post('/api/tramos', tramoData);
                setSuccessMessage('Tramo agregado exitosamente');
            }
            
            // Cerrar el diálogo y limpiar el tramo en edición
            setShowAddForm(false);
            setTramoToEdit(null);
            
            // Recargar los tramos
            fetchTramos();
        } catch (error) {
            logger.error('Error al procesar tramo:', error);
            setError(`Error: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (tramo) => {
        setTramoToDelete(tramo);
        setShowDeleteConfirm(true);
    };

    const handleDeleteSelected = () => {
        // For bulk delete
        const selectedCount = selectedTramos.length;
        if (selectedCount === 0) return;
        
        // Set null to indicate bulk delete
        setTramoToDelete(null);
        setShowDeleteConfirm(true);
    };

    // Función para manejar la edición de un tramo
    const handleEditClick = (tramo) => {
        logger.debug('Editando tramo:', tramo);
        setTramoToEdit(tramo);
        setShowAddForm(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            const token = localStorage.getItem('token');

            if (tramoToDelete) {
                // Single delete
                await axios.delete(`/api/tramos/${tramoToDelete._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                // Bulk delete - get all selected IDs
                const selectedIds = selectedTramos;
                
                // Delete each tramo in sequence
                for (const id of selectedIds) {
                    await axios.delete(`/api/tramos/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
            }
            
            // Refresh the list and reset selection
            fetchTramos();
            setShowDeleteConfirm(false);
            setTramoToDelete(null);
        } catch (error) {
            logger.error('Error al eliminar tramo(s):', error);
            setError('Error al eliminar: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteConfirm(false);
        setTramoToDelete(null);
    };

    // New functions for multi-selection
    const toggleSelectTramo = (id) => {
        setSelectedTramos(prev => {
            if (prev.includes(id)) {
                return prev.filter(tramoId => tramoId !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const toggleSelectAll = () => {
        // Check if all visible tramos are already selected
        const allSelected = filteredTramos.length > 0 && 
                           filteredTramos.every(t => selectedTramos.includes(t._id));
        
        if (allSelected) {
            // Deselect all
            setSelectedTramos([]);
        } else {
            // Select all visible tramos
            setSelectedTramos(filteredTramos.map(t => t._id));
        }
    };

    // Calculate if all visible tramos are selected
    const areAllSelected = filteredTramos.length > 0 && 
                           filteredTramos.every(t => selectedTramos.includes(t._id));
    
    // Count selected tramos
    const selectedCount = selectedTramos.length;

    const handleCloseAll = () => {
        // Cerrar todos los diálogos de una vez
        setShowAddForm(false);
        setShowImporter(false);
        setShowExcelImporter(false);
        onClose();
    };

    // Función para manejar la apertura de importadores
    const handleOpenImporter = (type) => {
        if (type === 'bulk') {
            setShowImporter(true);
        } else if (type === 'excel') {
            setShowExcelImporter(true);
        }
    };

    const handleVigenciaMasivaOpen = () => {
        if (selectedCount === 0) {
            setError('Debe seleccionar al menos un tramo para actualizar');
            return;
        }
        setIsVigenciaMasivaOpen(true);
    };

    const handleVigenciaMasivaClose = () => {
        setIsVigenciaMasivaOpen(false);
    };

    const handleVigenciaMasivaChange = (name, date) => {
        setVigenciaMasiva(prev => ({
            ...prev,
            [name]: date
        }));
    };

    const handleVigenciaMasivaSubmit = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const selectedIds = selectedTramos;

            // Validar que haya tramos seleccionados
            if (selectedIds.length === 0) {
                setError('Debe seleccionar al menos un tramo para actualizar');
                setLoading(false);
                return;
            }

            // Validar que la fecha de inicio sea anterior a la fecha de fin
            if (vigenciaMasiva.vigenciaDesde.isAfter(vigenciaMasiva.vigenciaHasta)) {
                setError('La fecha de inicio debe ser anterior a la fecha de fin');
                setLoading(false);
                return;
            }

            // Formatear las fechas como YYYY-MM-DD sin ajustes de zona horaria
            const vigenciaDesdeISO = vigenciaMasiva.vigenciaDesde.format(ISO_FORMAT);
            const vigenciaHastaISO = vigenciaMasiva.vigenciaHasta.format(ISO_FORMAT);

            logger.debug('Actualizando vigencias con fechas:', { vigenciaDesdeISO, vigenciaHastaISO });

            const response = await axios.post(`/api/tramos/updateVigenciaMasiva`, {
                tramosIds: selectedIds,
                vigenciaDesde: vigenciaDesdeISO,
                vigenciaHasta: vigenciaHastaISO,
                cliente
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Procesar la respuesta
            const { actualizados = [], conflictos = [] } = response.data;
            
            if (conflictos.length > 0) {
                setError(`Se actualizaron ${actualizados.length} tramos. ${conflictos.length} tramos tienen conflictos de fechas.`);
            } else {
                setSuccessMessage(`Se actualizaron ${actualizados.length} tramos correctamente`);
            }

            // Cerrar el diálogo y limpiar la selección
            setIsVigenciaMasivaOpen(false);
            setSelectedTramos([]);
            
            // Recargar los tramos
            fetchTramos();
        } catch (error) {
            logger.error('Error al actualizar vigencias:', error);
            setError('Error al actualizar las vigencias: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    // Función para exportar a Excel las tarifas seleccionadas
    const handleExportToExcel = () => {
        try {
            // Verificar si hay tramos seleccionados
            if (selectedTramos.length === 0) {
                setError('Debe seleccionar al menos un tramo para exportar');
                return;
            }

            // Obtener los tramos seleccionados
            const tramosSeleccionados = filteredTramos.filter(tramo => 
                selectedTramos.includes(tramo._id)
            );

            // Preparar los datos para el Excel
            const excelData = prepararDatosExcel(tramosSeleccionados);
            
            if (excelData.length === 0) {
                setError('No se pudieron procesar los tramos seleccionados');
                return;
            }
            
            // Crear y descargar el archivo Excel
            crearArchivoExcel(excelData, `tarifas_seleccionadas_${cliente.Cliente || cliente}_${dayjs().format('DDMMYYYY')}.xlsx`);
            
            // Mostrar mensaje de éxito
            setSuccessMessage(`Se exportaron ${excelData.length} tarifas correctamente`);
        } catch (error) {
            logger.error('Error al exportar a Excel:', error);
            setError('Error al exportar a Excel: ' + error.message);
        }
    };

    // Función para exportar a Excel todos los tramos visibles
    const handleExportAllToExcel = () => {
        try {
            // Verificar si hay tramos para exportar
            if (filteredTramos.length === 0) {
                setError('No hay tramos para exportar');
                return;
            }

            // Preparar los datos para el Excel
            const excelData = prepararDatosExcel(filteredTramos);
            
            if (excelData.length === 0) {
                setError('No se pudieron procesar los tramos');
                return;
            }
            
            // Crear y descargar el archivo Excel
            crearArchivoExcel(excelData, `tarifas_completo_${cliente.Cliente || cliente}_${dayjs().format('DDMMYYYY')}.xlsx`);
            
            // Mostrar mensaje de éxito
            setSuccessMessage(`Se exportaron ${excelData.length} tarifas correctamente`);
        } catch (error) {
            logger.error('Error al exportar a Excel:', error);
            setError('Error al exportar a Excel: ' + error.message);
        }
    };

    // Función auxiliar para preparar los datos para Excel
    const prepararDatosExcel = (tramos) => {
        // Obtener la fecha actual en formato YYYY-MM-DD
        const hoyStr = dayjs().format('YYYY-MM-DD');
        
        return tramos.map(tramo => {
            // Obtener la tarifa vigente para la fecha actual
            const tarifaVigente = obtenerTarifaVigente(tramo, hoyStr);
            
            if (!tarifaVigente) return null;
            
            // Formatear fechas correctamente sin ajustes de zona horaria
            const vigenciaDesdeStr = tarifaVigente.vigenciaDesde.split('T')[0];
            const vigenciaHastaStr = tarifaVigente.vigenciaHasta.split('T')[0];
            
            // Convertir a formato DD/MM/YYYY para mostrar en Excel
            const fechaDesdeFormateada = vigenciaDesdeStr ? 
                `${vigenciaDesdeStr.substring(8, 10)}/${vigenciaDesdeStr.substring(5, 7)}/${vigenciaDesdeStr.substring(0, 4)}` : 
                'N/A';
            const fechaHastaFormateada = vigenciaHastaStr ? 
                `${vigenciaHastaStr.substring(8, 10)}/${vigenciaHastaStr.substring(5, 7)}/${vigenciaHastaStr.substring(0, 4)}` : 
                'N/A';
            
            // Generar el detalle según el método de cálculo
            let detalleMetodo = "";
            detalleMetodo = generarDetalleMetodo(tarifaVigente.metodoCalculo, tarifaVigente.valor, tramo.distancia);
            
            return {
                'Origen': tramo.origen.Site,
                'Destino': tramo.destino.Site,
                'Tipo': tarifaVigente.tipo,
                'Método de Cálculo': tarifaVigente.metodoCalculo,
                'Valor': Number(tarifaVigente.valor),
                'Valor Peaje': Number(tarifaVigente.valorPeaje),
                'Detalle': detalleMetodo,
                'Vigencia Desde': fechaDesdeFormateada,
                'Vigencia Hasta': fechaHastaFormateada,
                'Distancia (km)': tramo.distancia || 0
            };
        }).filter(Boolean); // Eliminar posibles valores nulos
    };

    // Función auxiliar para crear y descargar el archivo Excel
    const crearArchivoExcel = (data, nombreArchivo) => {
        // Crear el libro de Excel
        const wb = XLSX.utils.book_new();
        
        // Crear la hoja con los datos
        const ws = XLSX.utils.json_to_sheet(data);
        
        // Ajustar el ancho de las columnas
        const wscols = [
            { wch: 25 }, // Origen
            { wch: 25 }, // Destino
            { wch: 10 }, // Tipo
            { wch: 15 }, // Método de Cálculo
            { wch: 12 }, // Valor
            { wch: 12 }, // Valor Peaje
            { wch: 25 }, // Detalle
            { wch: 15 }, // Vigencia Desde
            { wch: 15 }, // Vigencia Hasta
            { wch: 15 }  // Distancia
        ];
        ws['!cols'] = wscols;
        
        // Agregar la hoja al libro
        XLSX.utils.book_append_sheet(wb, ws, 'Tarifas');
        
        // Guardar el archivo
        XLSX.writeFile(wb, nombreArchivo);
    };

    // Función para renderizar la tabla de tramos
    const renderTramosTable = () => {
        if (loading) return <Typography>Cargando tarifario...</Typography>;
        
        if (filteredTramos.length === 0) {
            return <Alert severity="info">No hay tramos disponibles para este cliente.</Alert>;
        }

        // Obtener la fecha actual en formato YYYY-MM-DD
        const hoyStr = dayjs().format(ISO_FORMAT);
        
        return (
            <TableContainer component={Paper} sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox" sx={{ position: 'sticky', left: 0, zIndex: 3, backgroundColor: 'background.paper' }}>
                                <Checkbox
                                    indeterminate={selectedTramos.length > 0 && selectedTramos.length < filteredTramos.length}
                                    checked={selectedTramos.length > 0 && selectedTramos.length === filteredTramos.length}
                                    onChange={toggleSelectAll}
                                />
                            </TableCell>
                            <TableCell sx={{ position: 'sticky', left: '40px', zIndex: 3, backgroundColor: 'background.paper' }}>Origen</TableCell>
                            <TableCell>Destino</TableCell>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Método</TableCell>
                            <TableCell align="right">Valor</TableCell>
                            <TableCell align="right">Peaje</TableCell>
                            <TableCell>Detalle</TableCell>
                            <TableCell>Vigencia</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredTramos.map(tramo => {
                            // Obtener la tarifa vigente para la fecha actual
                            const tarifaVigente = obtenerTarifaVigente(tramo, hoyStr);
                            
                            if (!tarifaVigente) return null;
                            
                            const isSelected = selectedTramos.includes(tramo._id);
                            
                            // Determinar si el tramo está vigente actualmente
                            const vigenciaDesdeStr = tarifaVigente.vigenciaDesde.split('T')[0];
                            const vigenciaHastaStr = tarifaVigente.vigenciaHasta.split('T')[0];
                            const isVigente = vigenciaDesdeStr <= hoyStr && vigenciaHastaStr >= hoyStr;
                            
                            // Generar el detalle según el método de cálculo
                            const detalleMetodo = generarDetalleMetodo(
                                tarifaVigente.metodoCalculo, 
                                tarifaVigente.valor, 
                                tramo.distancia
                            );
                            
                            // Formatear fechas
                            const fechaDesde = formatearFecha(tarifaVigente.vigenciaDesde);
                            const fechaHasta = formatearFecha(tarifaVigente.vigenciaHasta);
                            
                            return (
                                <TableRow 
                                    key={tramo._id}
                                    hover
                                    selected={isSelected}
                                    sx={{
                                        backgroundColor: !isVigente && filtroVigencia.desde && filtroVigencia.hasta ? 'rgba(255, 152, 0, 0.08)' : 'inherit'
                                    }}
                                >
                                    <TableCell padding="checkbox" sx={{ position: 'sticky', left: 0, zIndex: 2, backgroundColor: isSelected ? 'action.selected' : 'background.paper' }}>
                                        <Checkbox
                                            checked={isSelected}
                                            onChange={() => toggleSelectTramo(tramo._id)}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ position: 'sticky', left: '40px', zIndex: 2, backgroundColor: isSelected ? 'action.selected' : 'background.paper' }}>{tramo.origen.Site}</TableCell>
                                    <TableCell>{tramo.destino.Site}</TableCell>
                                    <TableCell>{tarifaVigente.tipo || tramo.tipo || 'TRMC'}</TableCell>
                                    <TableCell>{tarifaVigente.metodoCalculo}</TableCell>
                                    <TableCell align="right">
                                        ${formatMoney(tarifaVigente.valor)}
                                    </TableCell>
                                    <TableCell align="right">
                                        ${formatMoney(tarifaVigente.valorPeaje)}
                                    </TableCell>
                                    <TableCell>
                                        {detalleMetodo}
                                    </TableCell>
                                    <TableCell>
                                        {fechaDesde} - {fechaHasta}
                                        {!isVigente && filtroVigencia.desde && filtroVigencia.hasta && (
                                            <Chip 
                                                size="small" 
                                                color="warning" 
                                                label="Histórico" 
                                                sx={{ ml: 1, fontSize: '0.7rem' }}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton 
                                            size="small" 
                                            onClick={() => handleEditClick(tramo)}
                                            disabled={!permisos.includes('editar_tramos')}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton 
                                            size="small" 
                                            color="error"
                                            onClick={() => handleDeleteClick(tramo)}
                                            disabled={!permisos.includes('eliminar_tramos')}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    return (
        <>
            <Dialog 
                open={open} 
                onClose={handleCloseAll}
                maxWidth="lg"
                fullWidth
                disableEnforceFocus
                disableAutoFocus
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Tarifario de {cliente?.Cliente}</Typography>
                        <Box>
                            <Button 
                                variant="outlined" 
                                color="primary" 
                                startIcon={<CloudUploadIcon />}
                                onClick={() => handleOpenImporter('excel')}
                                sx={{ mr: 1 }}
                            >
                                Importar Excel
                            </Button>
                            <Button 
                                startIcon={<AddIcon />}
                                variant="contained"
                                color="primary"
                                onClick={() => setShowAddForm(true)}
                                sx={{ mr: 1 }}
                            >
                                Nuevo Tramo
                            </Button>
                            <Button 
                                startIcon={<FilterIcon />}
                                variant="outlined" 
                                onClick={() => setShowFilters(!showFilters)}
                                sx={{ mr: 1 }}
                            >
                                Filtros
                            </Button>
                            <Button 
                                variant="outlined" 
                                color="primary" 
                                onClick={handleVigenciaMasivaOpen}
                                disabled={selectedCount === 0}
                                sx={{ mr: 1 }}
                            >
                                Actualizar vigencias ({selectedCount})
                            </Button>
                            <Button 
                                variant="outlined" 
                                color="primary" 
                                startIcon={<FileDownloadIcon />}
                                onClick={handleExportAllToExcel}
                            >
                                Exportar Todo
                            </Button>
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {/* Filtros */}
                    {showFilters && (
                        <Box sx={{ 
                            mb: 2, 
                            p: 2, 
                            bgcolor: 'rgba(0, 0, 0, 0.05)', 
                            borderRadius: 1,
                            border: '1px solid rgba(0, 0, 0, 0.12)'
                        }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                                Filtrar por vigencia
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={5}>
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DatePicker
                                            label="Desde"
                                            value={filtroVigencia.desde ? dayjs(filtroVigencia.desde) : null}
                                            onChange={(date) => setFiltroVigencia({
                                                ...filtroVigencia,
                                                desde: date ? date.format('YYYY-MM-DD') : ''
                                            })}
                                            format="DD/MM/YYYY"
                                            slotProps={{ 
                                                textField: { 
                                                    fullWidth: true,
                                                    variant: "outlined",
                                                    sx: { 
                                                        bgcolor: 'background.paper',
                                                        '& .MuiOutlinedInput-root': {
                                                            '& fieldset': {
                                                                borderColor: 'rgba(0, 0, 0, 0.23)',
                                                            },
                                                            '&:hover fieldset': {
                                                                borderColor: 'primary.main',
                                                            },
                                                        },
                                                    }
                                                } 
                                            }}
                                        />
                                    </LocalizationProvider>
                                </Grid>
                                <Grid item xs={12} sm={5}>
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DatePicker
                                            label="Hasta"
                                            value={filtroVigencia.hasta ? dayjs(filtroVigencia.hasta) : null}
                                            onChange={(date) => setFiltroVigencia({
                                                ...filtroVigencia,
                                                hasta: date ? date.format('YYYY-MM-DD') : ''
                                            })}
                                            format="DD/MM/YYYY"
                                            slotProps={{ 
                                                textField: { 
                                                    fullWidth: true,
                                                    variant: "outlined",
                                                    sx: { 
                                                        bgcolor: 'background.paper',
                                                        '& .MuiOutlinedInput-root': {
                                                            '& fieldset': {
                                                                borderColor: 'rgba(0, 0, 0, 0.23)',
                                                            },
                                                            '&:hover fieldset': {
                                                                borderColor: 'primary.main',
                                                            },
                                                        },
                                                    }
                                                } 
                                            }}
                                        />
                                    </LocalizationProvider>
                                </Grid>
                                <Grid item xs={12} sm={2} display="flex" alignItems="center">
                                    <Button
                                        variant="contained"
                                        onClick={() => setFiltroVigencia({ desde: '', hasta: '' })}
                                        fullWidth
                                        sx={{ height: '56px' }}
                                    >
                                        Limpiar
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {/* Toolbar con acciones */}
                    <Toolbar sx={{ borderBottom: '1px solid #e0e0e0', pl: { sm: 1 }, pr: { xs: 1, sm: 1 } }}>
                        <Typography
                            sx={{ flex: '1 1 100%' }}
                            variant="h6"
                            id="tableTitle"
                            component="div"
                        >
                            {selectedCount > 0 ? (
                                <span>{selectedCount} tramos seleccionados</span>
                            ) : (
                                <>
                                    <span>{filteredTramos.length} tramos {metadata && metadata.totalTramos > metadata.tramosUnicos && (
                                        <Chip 
                                            size="small" 
                                            color="success" 
                                            label={`${Math.round((metadata.totalTramos - metadata.tramosUnicos) / metadata.totalTramos * 100)}% optimizado`} 
                                            sx={{ ml: 1, fontSize: '0.7rem' }}
                                        />
                                    )}</span>
                                </>
                            )}
                        </Typography>

                        {selectedCount > 0 && (
                            <>
                                <Button 
                                    variant="contained" 
                                    color="primary" 
                                    startIcon={<FileDownloadIcon />}
                                    onClick={handleExportToExcel}
                                    sx={{ mr: 1 }}
                                >
                                    Exportar a Excel
                                </Button>
                                <Button 
                                    variant="contained" 
                                    color="error" 
                                    startIcon={<DeleteIcon />}
                                    onClick={handleDeleteSelected}
                                >
                                    Borrar selección
                                </Button>
                            </>
                        )}
                    </Toolbar>

                    {renderTramosTable()}

                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAll}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de confirmación de borrado - Corregido */}
            <Dialog
                open={showDeleteConfirm}
                onClose={handleDeleteCancel}
            >
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {tramoToDelete ? 
                            `¿Está seguro que desea eliminar el tramo de ${tramoToDelete?.origen?.Site || '-'} a ${tramoToDelete?.destino?.Site || '-'}?` : 
                            `¿Está seguro que desea eliminar ${selectedCount} tramo(s) seleccionado(s)?`
                        }
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal de Actualización Masiva de Vigencias */}
            <Dialog 
                open={isVigenciaMasivaOpen} 
                onClose={handleVigenciaMasivaClose}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Actualizar Vigencias ({selectedCount} tramos)
                </DialogTitle>
                <DialogContent>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <Alert severity="info">
                                    Esta acción actualizará la vigencia de todos los tramos seleccionados.
                                    Se validará que no haya conflictos con otros tramos existentes.
                                </Alert>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <DatePicker
                                    label="Vigencia desde"
                                    value={vigenciaMasiva.vigenciaDesde}
                                    onChange={(date) => handleVigenciaMasivaChange('vigenciaDesde', date)}
                                    format={DATE_FORMAT}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <DatePicker
                                    label="Vigencia hasta"
                                    value={vigenciaMasiva.vigenciaHasta}
                                    onChange={(date) => handleVigenciaMasivaChange('vigenciaHasta', date)}
                                    format={DATE_FORMAT}
                                />
                            </Grid>
                        </Grid>
                    </LocalizationProvider>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleVigenciaMasivaClose} color="secondary">
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleVigenciaMasivaSubmit} 
                        color="primary"
                        disabled={loading}
                    >
                        {loading ? 'Actualizando...' : 'Actualizar Vigencias'}
                    </Button>
                </DialogActions>
            </Dialog>

            {showAddForm && (
                <AddTramoDialog
                    open={showAddForm}
                    onClose={() => {
                        setShowAddForm(false);
                        setTramoToEdit(null);
                    }}
                    onSave={handleAddTramo}
                    sites={sites}
                    initialData={tramoToEdit || newTramo}
                />
            )}

            {showImporter && (
                <TramosBulkImporter 
                    open={showImporter}
                    onClose={() => setShowImporter(false)}
                    cliente={cliente}
                    onComplete={fetchTramos}
                    sites={sites}
                />
            )}

            {showExcelImporter && (
                <TramosExcelImporter 
                    open={showExcelImporter}
                    onClose={() => setShowExcelImporter(false)}
                    cliente={cliente}
                    onComplete={fetchTramos}
                    sites={sites}
                />
            )}

            {/* Snackbar para mensajes de éxito */}
            <Snackbar 
                open={!!successMessage}
                autoHideDuration={6000}
                onClose={() => setSuccessMessage(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert onClose={() => setSuccessMessage(null)} severity="success">
                    {successMessage}
                </Alert>
            </Snackbar>
        </>
    );
};

export default TarifarioViewer;
