import React, { useState } from 'react';
import {
    Button, Dialog, DialogContent, DialogActions,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, TextField, CircularProgress, Alert
} from '@mui/material';
import axios from 'axios';
import logger from '../utils/logger';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const SiteBulkImporter = ({ cliente, onComplete }) => {
    const [open, setOpen] = useState(false);
    const [rows, setRows] = useState([{ 
        site: '', 
        coordenadas: '', 
        localidad: '', 
        provincia: '',
        direccion: '' 
    }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const obtenerDireccion = async (lat, lng) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/proxy/geocode`, {
                params: { lat, lng },
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const { address } = response.data;
            return {
                direccion: address.road ? `${address.road} ${address.house_number || ''}`.trim() : '',
                localidad: address.city || address.town || address.village || '',
                provincia: address.state || ''
            };
        } catch (error) {
            logger.error('Error en geocodificación:', error);
            return { direccion: '', localidad: '', provincia: '' };
        }
    };

    const handlePaste = async (event) => {
        event.preventDefault();
        setLoading(true);
        const data = event.clipboardData.getData('text');
        const lines = data.split('\n').filter(line => line.trim());

        const newRows = [];
        for (const line of lines) {
            const [site, coordsString] = line.split('\t').map(s => s.trim());
            const [lat, lng] = coordsString.split(',').map(n => parseFloat(n.trim()));
            
            // Obtener dirección para cada site
            const direccionData = await obtenerDireccion(lat, lng);
            
            newRows.push({
                site,
                coordenadas: coordsString,
                ...direccionData
            });
        }

        setRows(newRows);
        setLoading(false);
    };

    const handleChange = (index, field, value) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };
        setRows(newRows);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            setError(null);

            const validRows = rows.filter(row => row.site && row.coordenadas);
            const processedSites = validRows.map(row => {
                const [lat, lng] = row.coordenadas.split(',').map(n => n.trim());
                return {
                    site: row.site,
                    cliente,
                    coordenadas: { lat: parseFloat(lat), lng: parseFloat(lng) },
                    localidad: row.localidad,
                    provincia: row.provincia
                };
            });

            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/sites/bulk`,
                { sites: processedSites },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            onComplete?.();
            setOpen(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button variant="contained" onClick={() => setOpen(true)}>
                Importar Sites
            </Button>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
                <DialogContent>
                    <TableContainer component={Paper} onPaste={handlePaste}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Site</TableCell>
                                    <TableCell>Coordenadas</TableCell>
                                    <TableCell>Dirección</TableCell>
                                    <TableCell>Localidad</TableCell>
                                    <TableCell>Provincia</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.map((row, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                value={row.site}
                                                onChange={(e) => handleChange(index, 'site', e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                value={row.coordenadas}
                                                onChange={(e) => handleChange(index, 'coordenadas', e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                value={row.direccion}
                                                onChange={(e) => handleChange(index, 'direccion', e.target.value)}
                                                placeholder="Dirección"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                value={row.localidad}
                                                onChange={(e) => handleChange(index, 'localidad', e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                value={row.provincia}
                                                onChange={(e) => handleChange(index, 'provincia', e.target.value)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button 
                        onClick={handleSave}
                        variant="contained"
                        disabled={loading || !rows.some(r => r.site && r.coordenadas)}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Importar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default SiteBulkImporter;
