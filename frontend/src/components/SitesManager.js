import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, CircularProgress, Alert,
    IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Box, DialogContentText
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import axios from 'axios';
import SiteBulkImporter from './SiteBulkImporter';
import logger from '../utils/logger';
import useNotification from '../hooks/useNotification';

// Configuración de la URL base de la API
const API_URL = process.env.REACT_APP_API_URL || '';

const SitesManager = ({ cliente, onBack }) => {
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingSite, setEditingSite] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [importerOpen, setImporterOpen] = useState(false);
    const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false);
    const [deletingAll, setDeletingAll] = useState(false);
    const [confirmReprocessOpen, setConfirmReprocessOpen] = useState(false);
    const [reprocessing, setReprocessing] = useState(false);
    const { showNotification } = useNotification();
    const [formData, setFormData] = useState({
        Site: '',
        Codigo: '',
        Direccion: '',
        Localidad: '',
        Provincia: ''
    });

    const fetchSites = useCallback(async () => {
        try {
            logger.debug('Intentando obtener sites para cliente:', cliente);
            // Token handling removed for cookie-based auth
            // Asegurarnos de que la URL sea correcta
            const response = await axios.get(`/api/sites`, {
                // headers removed, handled by cookies
                params: { cliente }
            });

            logger.debug('Respuesta completa:', response);
            // Asegurarnos de que sites sea siempre un array
            const sitesData = response.data.data || response.data || [];
            logger.debug('Sites procesados:', sitesData);
            
            if (!Array.isArray(sitesData)) {
                logger.error('Los datos recibidos no son un array:', sitesData);
                throw new Error('Formato de datos inválido');
            }

            setSites(sitesData);
            setError(null);
        } catch (error) {
            logger.error('Error detallado:', error.response || error);
            setError('Error al cargar los sites: ' + (error.response?.data?.message || error.message));
            setSites([]); // Establecer un array vacío en caso de error
        } finally {
            setLoading(false);
        }
    }, [cliente]);

    useEffect(() => {
        if (cliente) {
            fetchSites();
        }
    }, [fetchSites, cliente]);

    const handleImportComplete = () => {
        fetchSites(); // Recargar la lista después de importar
    };

    const handleEdit = (site) => {
        setEditingSite(site);
        setFormData({
            Site: site.Site,
            Codigo: site.Codigo || '',
            Direccion: site.Direccion || '',
            Localidad: site.Localidad || '',
            Provincia: site.Provincia || ''
        });
        setDialogOpen(true);
    };

    const handleDelete = async (siteId) => {
        if (!window.confirm('¿Está seguro de eliminar este site?')) return;

        try {
            // const token = localStorage.getItem('token'); // No necesario con cookies
            await axios.delete(`/api/sites/${siteId}`); // Headers no necesarios
            fetchSites();
        } catch (error) {
            logger.error('Error al eliminar:', error);
            setError('Error al eliminar el site');
        }
    };

    const handleSave = async () => {
        try {
            // const token = localStorage.getItem('token'); // No necesario con cookies
            await axios.put(
                `/api/sites/${editingSite._id}`,
                { ...formData, Cliente: cliente }
                // Headers no necesarios
            );
            setDialogOpen(false);
            fetchSites();
        } catch (error) {
            logger.error('Error al actualizar:', error);
            setError('Error al actualizar el site');
        }
    };

    const handleChange = (field) => (event) => {
        setFormData({ ...formData, [field]: event.target.value });
    };

    const formatCoordenadas = (site) => {
        if (site.location && site.location.lat && site.location.lng) {
            return `${site.location.lat}, ${site.location.lng}`;
        }
        if (site.coordenadas && site.coordenadas.lat && site.coordenadas.lng) {
            return `${site.coordenadas.lat}, ${site.coordenadas.lng}`;
        }
        return '-';
    };

    const handleDeleteAll = async () => {
        try {
            setDeletingAll(true);
            await axios.delete(`/api/site/bulk/cliente/${cliente}`);
            setDeletingAll(false);
            setConfirmDeleteAllOpen(false);
            fetchSites();
            showNotification('Todos los sites del cliente han sido eliminados.', 'success');
        } catch (error) {
            logger.error('Error al eliminar todos los sites:', error);
            showNotification(`Error al eliminar los sites: ${error.response?.data?.message || error.message}`, 'error');
            setDeletingAll(false);
            setConfirmDeleteAllOpen(false);
        }
    };

    // Función para reprocesar direcciones
    const handleReprocessAddresses = async () => {
        try {
            setReprocessing(true);
            setConfirmReprocessOpen(false);
            
            // Simular llamada al backend (reemplazar con llamada real cuando exista)
            // const response = await axios.post(`/api/sites/reprocess-addresses/${cliente}`);
            // await new Promise(resolve => setTimeout(resolve, 2000)); // Simular delay del backend
            
            // TODO: Cambiar esta parte por la llamada real al endpoint POST /api/sites/reprocess-addresses/${cliente}
            // Simulación de éxito por ahora
            showNotification('Solicitud de reprocesamiento enviada. Los sitios se actualizarán en breve.', 'info'); 
            // Idealmente, el backend podría tardar, por lo que la actualización podría no ser inmediata.
            // Opcionalmente, se puede hacer polling o usar websockets para saber cuándo terminó.
            // Por simplicidad, recargamos después de un delay simulado
            
            // Simulación de llamada real y actualización
            // Asegúrate de manejar la URL y el token/cookies según tu configuración
            await axios.post(`/api/site/reprocess-addresses/${cliente}`); 
            showNotification('Las direcciones se han reprocesado correctamente.', 'success');
            fetchSites(); // Recargar los sitios para ver los cambios

        } catch (error) {
            logger.error('Error al reprocesar direcciones:', error.response || error);
            const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
            showNotification(`Error al reprocesar direcciones: ${errorMessage}`, 'error');
            setError('Error al reprocesar las direcciones'); // Puedes usar setError también si prefieres
        } finally {
            setReprocessing(false);
        }
    };

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Container>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Button 
                    startIcon={<ArrowBackIcon />} 
                    onClick={onBack}
                    variant="outlined"
                    sx={{ mr: 2 }}
                >
                    Volver
                </Button>
                <Typography variant="h5">
                    Sites de {cliente}
                </Typography>
                
                <Box sx={{ flexGrow: 1 }} />
                
                <Button 
                    variant="outlined"
                    color="secondary"
                    onClick={() => setConfirmReprocessOpen(true)}
                    sx={{ ml: 1, mr: 1 }}
                    disabled={sites.length === 0 || reprocessing}
                >
                    {reprocessing ? 'Reprocesando...' : 'Reprocesar Direcciones'}
                </Button>
                
                <Button 
                    variant="outlined" 
                    color="error"
                    onClick={() => setConfirmDeleteAllOpen(true)}
                    sx={{ ml: 2, mr: 1 }}
                    disabled={sites.length === 0}
                >
                    Eliminar Todos
                </Button>
                
                <Button 
                    variant="contained" 
                    color="primary"
                    onClick={() => setImporterOpen(true)}
                    sx={{ ml: 1 }}
                >
                    Importar Sites
                </Button>
            </Box>

            <SiteBulkImporter 
                open={importerOpen}
                onClose={() => setImporterOpen(false)}
                cliente={cliente}
                onComplete={handleImportComplete}
            />

            <TableContainer component={Paper} sx={{ mt: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Site</TableCell>
                            <TableCell>Código</TableCell>
                            <TableCell>Dirección</TableCell>
                            <TableCell>Localidad</TableCell>
                            <TableCell>Provincia</TableCell>
                            <TableCell>Coordenadas</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!Array.isArray(sites) || sites.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    No hay sites registrados
                                </TableCell>
                            </TableRow>
                        ) : (
                            sites.map((site) => (
                                <TableRow key={site._id || Math.random()}>
                                    <TableCell>{site?.nombre || '-'}</TableCell>
                                    <TableCell>{site?.codigo || '-'}</TableCell>
                                    <TableCell>{site?.direccion || '-'}</TableCell>
                                    <TableCell>{site?.localidad || '-'}</TableCell>
                                    <TableCell>{site?.provincia || '-'}</TableCell>
                                    <TableCell>{formatCoordenadas(site)}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleEdit(site)}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(site._id)} color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                <DialogTitle>Editar Site</DialogTitle>
                <DialogContent>
                    <TextField
                        margin="dense"
                        label="Site"
                        fullWidth
                        value={formData.Site}
                        onChange={handleChange('Site')}
                    />
                    <TextField
                        margin="dense"
                        label="Código"
                        fullWidth
                        value={formData.Codigo}
                        onChange={handleChange('Codigo')}
                    />
                    <TextField
                        margin="dense"
                        label="Dirección"
                        fullWidth
                        value={formData.Direccion}
                        onChange={handleChange('Direccion')}
                    />
                    <TextField
                        margin="dense"
                        label="Localidad"
                        fullWidth
                        value={formData.Localidad}
                        onChange={handleChange('Localidad')}
                    />
                    <TextField
                        margin="dense"
                        label="Provincia"
                        fullWidth
                        value={formData.Provincia}
                        onChange={handleChange('Provincia')}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} variant="contained">
                        Guardar
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={confirmDeleteAllOpen}
                onClose={() => !deletingAll && setConfirmDeleteAllOpen(false)}
            >
                <DialogTitle>Confirmar eliminación masiva</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Está seguro que desea eliminar TODOS los sites del cliente <strong>{cliente}</strong>?
                        <br /><br />
                        Esta acción no se puede deshacer y podría afectar a otros datos relacionados.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setConfirmDeleteAllOpen(false)} 
                        disabled={deletingAll}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleDeleteAll} 
                        color="error" 
                        variant="contained"
                        disabled={deletingAll}
                    >
                        {deletingAll ? 'Eliminando...' : 'Eliminar todos los sites'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Diálogo de confirmación para reprocesar direcciones */}
            <Dialog
                open={confirmReprocessOpen}
                onClose={() => !reprocessing && setConfirmReprocessOpen(false)}
            >
                <DialogTitle>Confirmar Reprocesamiento</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Está seguro que desea reprocesar las direcciones para TODOS los sites del cliente <strong>{cliente}</strong>?
                        <br /><br />
                        Esto utilizará las coordenadas de cada sitio para obtener la dirección, localidad y provincia actualizadas mediante un servicio de geocodificación.
                        <br />
                        Este proceso puede tardar varios segundos o minutos dependiendo de la cantidad de sitios y podría sobrescribir datos existentes.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setConfirmReprocessOpen(false)} 
                        disabled={reprocessing}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleReprocessAddresses} 
                        color="primary" 
                        variant="contained"
                        disabled={reprocessing}
                    >
                        {reprocessing ? 'Reprocesando...' : 'Confirmar Reprocesamiento'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default SitesManager;
