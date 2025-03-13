import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, Checkbox, TextField, FormControl, InputLabel, Select, MenuItem,
    IconButton, Box, Alert, Typography, Toolbar, Grid, Snackbar
} from '@mui/material';
import { 
    Add as AddIcon, 
    Delete as DeleteIcon,
    FilterAlt as FilterIcon
} from '@mui/icons-material';
import { format, parseISO, isWithinInterval } from 'date-fns';
import axios from 'axios';
import TramosBulkImporter from './TramosBulkImporter';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import logger from '../utils/logger';

// Configurar dayjs para usar español y formato de fecha preferido
dayjs.locale('es');
// Añadir el plugin UTC para manejo correcto de zonas horarias
dayjs.extend(utc);
dayjs.extend(timezone);

const AddTramoDialog = ({ open, onClose, onSave, sites, initialData }) => {
    const [tramoData, setTramoData] = useState(initialData);

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
                        onChange={(e) => setTramoData({...tramoData, origen: e.target.value})}
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
                        onChange={(e) => setTramoData({...tramoData, destino: e.target.value})}
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
                        value={tramoData.tipo}
                        onChange={(e) => setTramoData({...tramoData, tipo: e.target.value})}
                    >
                        <MenuItem value="TRMC">TRMC</MenuItem>
                        <MenuItem value="TRMI">TRMI</MenuItem> {/* Cambiado de TMRI a TRMI */}
                    </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                    <InputLabel>Método de Cálculo</InputLabel>
                    <Select
                        value={tramoData.metodoCalculo}
                        onChange={(e) => setTramoData({...tramoData, metodoCalculo: e.target.value})}
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
                    value={tramoData.valorPeaje}
                    onChange={(e) => setTramoData({...tramoData, valorPeaje: parseFloat(e.target.value)})}
                />

                <TextField
                    fullWidth
                    margin="normal"
                    label="Valor"
                    type="number"
                    value={tramoData.valor}
                    onChange={(e) => setTramoData({
                        ...tramoData, 
                        valor: parseFloat(e.target.value)
                    })}
                    helperText={
                        tramoData.metodoCalculo === 'Kilometro' ? 'Valor por kilómetro' :
                        tramoData.metodoCalculo === 'Palet' ? 'Valor por palet' :
                        'Valor fijo'
                    }
                />

                <TextField
                    fullWidth
                    margin="normal"
                    label="Vigencia Desde"
                    type="date"
                    value={tramoData.vigenciaDesde}
                    onChange={(e) => setTramoData({...tramoData, vigenciaDesde: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                />

                <TextField
                    fullWidth
                    margin="normal"
                    label="Vigencia Hasta"
                    type="date"
                    value={tramoData.vigenciaHasta}
                    onChange={(e) => setTramoData({...tramoData, vigenciaHasta: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button 
                    onClick={() => onSave(tramoData)} 
                    variant="contained" 
                    color="primary"
                >
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

const TarifarioViewer = ({ open, cliente, onClose }) => {
    const [tramos, setTramos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sites, setSites] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showImporter, setShowImporter] = useState(false);
    const [newTramo, setNewTramo] = useState({
        origen: '',
        destino: '',
        tipo: 'TRMC',
        metodoCalculo: 'Kilometro',
        valorPeaje: 0,
        valor: 0,
        vigenciaDesde: format(new Date(), 'yyyy-MM-dd'),
        vigenciaHasta: format(new Date(Date.now() + 31536000000), 'yyyy-MM-dd') // Un año después
    });
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);  // Agregando estado faltante
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [tramoToDelete, setTramoToDelete] = useState(null);
    
    // New state for filters and multi-selection
    const [filtroVigencia, setFiltroVigencia] = useState({
        desde: '',
        hasta: ''
    });
    const [selectedTramos, setSelectedTramos] = useState({});
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
        
        let results = [...tramos];
        if (filtroVigencia.desde && filtroVigencia.hasta) {
            const desde = parseISO(filtroVigencia.desde);
            const hasta = parseISO(filtroVigencia.hasta);

            results = results.filter(tramo => {
                const tramoDesde = new Date(tramo.vigenciaDesde);
                const tramoHasta = new Date(tramo.vigenciaHasta);
                
                return isWithinInterval(desde, { start: tramoDesde, end: tramoHasta }) ||
                       isWithinInterval(hasta, { start: tramoDesde, end: tramoHasta }) ||
                       (desde <= tramoDesde && hasta >= tramoHasta);
            });
        }
        
        setFilteredTramos(results);
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
            
            const url = `/api/tramos/cliente/${encodeURIComponent(cliente)}`;
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data) {
                if (response.data.success) {
                    const tramosRecibidos = response.data.data || [];
                    setTramos(tramosRecibidos);
                    setFilteredTramos(tramosRecibidos);
                    setError(null);
                } else if (Array.isArray(response.data)) {
                    setTramos(response.data);
                    setFilteredTramos(response.data);
                    setError(null);
                } else {
                    setError('Formato de respuesta no reconocido');
                    setTramos([]);
                    setFilteredTramos([]);
                }
            } else {
                setError('Respuesta vacía del servidor');
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
        setSelectedTramos({});
    }, [open, cliente]);

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
            const token = localStorage.getItem('token');
            await axios.post('/api/tramos', 
                { ...tramoData, cliente },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setShowAddForm(false);
            setNewTramo({
                origen: '',
                destino: '',
                tipo: 'TRMC',
                metodoCalculo: 'Kilometro',
                valorPeaje: 0,
                valor: 0,
                vigenciaDesde: format(new Date(), 'yyyy-MM-dd'),
                vigenciaHasta: format(new Date(Date.now() + 31536000000), 'yyyy-MM-dd')
            });
            fetchTramos();
        } catch (error) {
            logger.error('Error al crear tramo:', error);
        }
    };

    const handleDeleteClick = (tramo) => {
        // For single delete
        setTramoToDelete(tramo);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteSelected = () => {
        // For bulk delete
        const selectedCount = Object.values(selectedTramos).filter(Boolean).length;
        if (selectedCount === 0) return;
        
        // Set null to indicate bulk delete
        setTramoToDelete(null);
        setDeleteConfirmOpen(true);
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
                const selectedIds = Object.entries(selectedTramos)
                    .filter(([_, selected]) => selected)
                    .map(([id]) => id);
                
                // Delete each tramo in sequence
                for (const id of selectedIds) {
                    await axios.delete(`/api/tramos/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
            }
            
            // Refresh the list and reset selection
            fetchTramos();
            setDeleteConfirmOpen(false);
            setTramoToDelete(null);
        } catch (error) {
            logger.error('Error al eliminar tramo(s):', error);
            setError('Error al eliminar: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirmOpen(false);
        setTramoToDelete(null);
    };

    // New functions for multi-selection
    const toggleSelectTramo = (id) => {
        setSelectedTramos(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const toggleSelectAll = () => {
        // Check if all visible tramos are already selected
        const allSelected = filteredTramos.every(t => selectedTramos[t._id]);
        
        // Create new selection state
        const newSelection = {};
        
        if (!allSelected) {
            // Select all visible tramos
            filteredTramos.forEach(t => {
                newSelection[t._id] = true;
            });
        }
        // If all were selected, this will clear the selection
        
        setSelectedTramos(newSelection);
    };

    // Calculate if all visible tramos are selected
    const areAllSelected = filteredTramos.length > 0 && 
                           filteredTramos.every(t => selectedTramos[t._id]);
    
    // Count selected tramos
    const selectedCount = Object.values(selectedTramos).filter(Boolean).length;

    const handleCloseAll = () => {
        setShowAddForm(false);
        setShowImporter(false);
        onClose();
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
            const selectedIds = Object.entries(selectedTramos)
                .filter(([_, selected]) => selected)
                .map(([id]) => id);

            // Convertir las fechas a UTC manteniendo el día seleccionado
            const vigenciaDesdeUTC = vigenciaMasiva.vigenciaDesde
                .utc(true)
                .startOf('day')
                .toISOString();
            
            const vigenciaHastaUTC = vigenciaMasiva.vigenciaHasta
                .utc(true)
                .startOf('day')
                .toISOString();

            const response = await axios.post(`/api/tramos/updateVigenciaMasiva`, {
                tramosIds: selectedIds,
                vigenciaDesde: vigenciaDesdeUTC,
                vigenciaHasta: vigenciaHastaUTC,
                cliente
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.conflictos && response.data.conflictos.length > 0) {
                setError(`Se actualizaron ${response.data.actualizados.length} tramos. ${response.data.conflictos.length} tramos tienen conflictos de fechas.`);
            } else {
                setSuccessMessage(`Se actualizaron ${response.data.actualizados.length} tramos correctamente`);
            }

            setIsVigenciaMasivaOpen(false);
            setSelectedTramos({});
            fetchTramos();
        } catch (error) {
            setError('Error al actualizar las vigencias: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
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
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography>Tarifario - {cliente}</Typography>
                        <Box>
                            <Button 
                                startIcon={<AddIcon />}
                                variant="contained"
                                onClick={() => setShowImporter(true)}
                                sx={{ mr: 1 }}
                            >
                                Importar Tramos
                            </Button>
                            <Button 
                                startIcon={<AddIcon />}
                                variant="contained"
                                onClick={() => setShowAddForm(true)}
                                sx={{ mr: 1 }}
                            >
                                Nuevo Tramo
                            </Button>
                            <Button 
                                startIcon={<FilterIcon />}
                                variant="outlined"
                                onClick={() => setShowFilters(!showFilters)}
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
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {/* Filtros */}
                    {showFilters && (
                        <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Filtrar por vigencia
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={5}>
                                    <TextField
                                        label="Desde"
                                        type="date"
                                        fullWidth
                                        value={filtroVigencia.desde}
                                        onChange={(e) => setFiltroVigencia({
                                            ...filtroVigencia,
                                            desde: e.target.value
                                        })}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={5}>
                                    <TextField
                                        label="Hasta"
                                        type="date"
                                        fullWidth
                                        value={filtroVigencia.hasta}
                                        onChange={(e) => setFiltroVigencia({
                                            ...filtroVigencia,
                                            hasta: e.target.value
                                        })}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={2} display="flex" alignItems="center">
                                    <Button
                                        variant="outlined"
                                        onClick={() => setFiltroVigencia({ desde: '', hasta: '' })}
                                    >
                                        Limpiar
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {/* Toolbar para acciones masivas */}
                    <Toolbar 
                        sx={{ 
                            pl: { sm: 2 }, 
                            pr: { xs: 1 },
                            bgcolor: selectedCount > 0 ? '#e3f2fd' : 'transparent',
                            minHeight: 48
                        }}
                        variant="dense"
                    >
                        {selectedCount > 0 ? (
                            <Typography sx={{ flex: '1 1 100%' }} color="inherit" variant="subtitle1">
                                {selectedCount} tramo(s) seleccionado(s)
                            </Typography>
                        ) : (
                            <Typography sx={{ flex: '1 1 100%' }} variant="subtitle1">
                                {filteredTramos.length} tramos encontrados
                            </Typography>
                        )}

                        {selectedCount > 0 && (
                            <Button 
                                variant="contained" 
                                color="error" 
                                startIcon={<DeleteIcon />}
                                onClick={handleDeleteSelected}
                            >
                                Borrar selección
                            </Button>
                        )}
                    </Toolbar>

                    <TableContainer component={Paper}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            indeterminate={selectedCount > 0 && !areAllSelected}
                                            checked={areAllSelected}
                                            onChange={toggleSelectAll}
                                        />
                                    </TableCell>
                                    <TableCell>Origen</TableCell>
                                    <TableCell>Destino</TableCell>
                                    <TableCell>Método</TableCell>
                                    <TableCell>Tipo</TableCell>
                                    <TableCell>Distancia</TableCell>
                                    <TableCell>Vigencia Desde</TableCell>
                                    <TableCell>Vigencia Hasta</TableCell>
                                    <TableCell>Valor</TableCell>
                                    <TableCell>Peaje</TableCell>
                                    <TableCell>Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={11} align="center">
                                            Cargando tramos...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredTramos.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={11} align="center">
                                            {error ? 
                                                `Error: ${error}` : 
                                                `No hay tramos disponibles para el cliente ${cliente}`
                                            }
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTramos.map((tramo) => (
                                        <TableRow 
                                            key={tramo._id}
                                            selected={!!selectedTramos[tramo._id]}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={!!selectedTramos[tramo._id]}
                                                    onChange={() => toggleSelectTramo(tramo._id)}
                                                />
                                            </TableCell>
                                            <TableCell>{tramo.origen?.Site || '-'}</TableCell>
                                            <TableCell>{tramo.destino?.Site || '-'}</TableCell>
                                            <TableCell>{tramo.metodoCalculo}</TableCell>
                                            <TableCell>{tramo.tipo}</TableCell>
                                            <TableCell>{tramo.distancia} km</TableCell>
                                            <TableCell>
                                                {dayjs.utc(tramo.vigenciaDesde).format(DATE_FORMAT)}
                                            </TableCell>
                                            <TableCell>
                                                {dayjs.utc(tramo.vigenciaHasta).format(DATE_FORMAT)}
                                            </TableCell>
                                            <TableCell>
                                                ${formatMoney(tramo.valor)} 
                                                {tramo.metodoCalculo === 'Kilometro' ? '/km' : 
                                                tramo.metodoCalculo === 'Palet' ? '/palet' : ''}
                                            </TableCell>
                                            <TableCell>${formatMoney(tramo.valorPeaje)}</TableCell>
                                            <TableCell>
                                                <IconButton 
                                                    size="small" 
                                                    color="error"
                                                    onClick={() => handleDeleteClick(tramo)}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

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
                open={deleteConfirmOpen}
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
                    onClose={() => setShowAddForm(false)}
                    onSave={handleAddTramo}
                    sites={sites}
                    initialData={newTramo}
                />
            )}

            {showImporter && (
                <TramosBulkImporter
                    open={showImporter}
                    onClose={() => setShowImporter(false)}
                    cliente={cliente}
                    sites={sites}
                    onComplete={fetchTramos}
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
