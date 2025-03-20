import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, CircularProgress, Alert,
    IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Box
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import axios from 'axios';
import SiteBulkImporter from './SiteBulkImporter';
import logger from '../utils/logger';

// Configuración de la URL base de la API
const API_URL = process.env.REACT_APP_API_URL || '';

const SitesManager = ({ cliente, onBack }) => {
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingSite, setEditingSite] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [importerOpen, setImporterOpen] = useState(false);
    const [formData, setFormData] = useState({
        Site: '',
        Direccion: '',
        Localidad: '',
        Provincia: ''
    });

    const fetchSites = useCallback(async () => {
        try {
            logger.debug('Intentando obtener sites para cliente:', cliente);
            const token = localStorage.getItem('token');
            
            // Asegurarnos de que la URL sea correcta
            const response = await axios.get(`/api/sites`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
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
            Direccion: site.Direccion || '',
            Localidad: site.Localidad || '',
            Provincia: site.Provincia || ''
        });
        setDialogOpen(true);
    };

    const handleDelete = async (siteId) => {
        if (!window.confirm('¿Está seguro de eliminar este site?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/sites/${siteId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchSites();
        } catch (error) {
            logger.error('Error al eliminar:', error);
            setError('Error al eliminar el site');
        }
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `/api/sites/${editingSite._id}`,
                { ...formData, Cliente: cliente },
                { headers: { 'Authorization': `Bearer ${token}` } }
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
                    variant="contained" 
                    color="primary"
                    onClick={() => setImporterOpen(true)}
                    sx={{ ml: 2 }}
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
                                <TableCell colSpan={6} align="center">
                                    No hay sites registrados
                                </TableCell>
                            </TableRow>
                        ) : (
                            sites.map((site) => (
                                <TableRow key={site._id || Math.random()}>
                                    <TableCell>{site?.Site || '-'}</TableCell>
                                    <TableCell>{site?.Direccion || '-'}</TableCell>
                                    <TableCell>{site?.Localidad || '-'}</TableCell>
                                    <TableCell>{site?.Provincia || '-'}</TableCell>
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
        </Container>
    );
};

export default SitesManager;
