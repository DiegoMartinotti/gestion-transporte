import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, TextField, FormControl, InputLabel, Select, MenuItem,
    IconButton, Box, Alert
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';

const TarifarioViewer = ({ open, cliente, onClose }) => {
    const [tramos, setTramos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sites, setSites] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTramo, setNewTramo] = useState({
        origen: '',
        destino: '',
        tipo: 'TRMC',
        metodoCalculo: 'Kilometro',
        valorPeaje: 0,
        vigenciaDesde: format(new Date(), 'yyyy-MM-dd'),
        vigenciaHasta: format(new Date(Date.now() + 31536000000), 'yyyy-MM-dd') // Un año después
    });

    useEffect(() => {
        if (open && cliente) {
            fetchTramos();
            fetchSites();
        }
    }, [open, cliente]);

    const fetchSites = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/sites?cliente=${cliente}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSites(response.data.data || []);
        } catch (error) {
            console.error('Error al cargar sites:', error);
        }
    };

    const handleAddTramo = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/tramos', 
                { ...newTramo, cliente },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setShowAddForm(false);
            setNewTramo({
                origen: '',
                destino: '',
                tipo: 'TRMC',
                metodoCalculo: 'Kilometro',
                valorPeaje: 0,
                vigenciaDesde: format(new Date(), 'yyyy-MM-dd'),
                vigenciaHasta: format(new Date(Date.now() + 31536000000), 'yyyy-MM-dd')
            });
            fetchTramos();
        } catch (error) {
            console.error('Error al crear tramo:', error);
        }
    };

    const fetchTramos = async () => {
        if (!open || !cliente) return;
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/tramos/cliente/${cliente}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setTramos(response.data.data);
        } catch (error) {
            console.error('Error al cargar tramos:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    Tarifario - {cliente}
                    <Button 
                        startIcon={<AddIcon />}
                        variant="contained"
                        onClick={() => setShowAddForm(true)}
                    >
                        Nuevo Tramo
                    </Button>
                </Box>
            </DialogTitle>
            <DialogContent>
                {/* Formulario para agregar nuevo tramo */}
                <Dialog open={showAddForm} onClose={() => setShowAddForm(false)}>
                    <DialogTitle>Nuevo Tramo</DialogTitle>
                    <DialogContent>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Origen</InputLabel>
                            <Select
                                value={newTramo.origen}
                                onChange={(e) => setNewTramo({...newTramo, origen: e.target.value})}
                            >
                                {sites.map(site => (
                                    <MenuItem key={site._id} value={site._id}>
                                        {site.Site}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth margin="normal">
                            <InputLabel>Destino</InputLabel>
                            <Select
                                value={newTramo.destino}
                                onChange={(e) => setNewTramo({...newTramo, destino: e.target.value})}
                            >
                                {sites.map(site => (
                                    <MenuItem key={site._id} value={site._id}>
                                        {site.Site}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth margin="normal">
                            <InputLabel>Tipo</InputLabel>
                            <Select
                                value={newTramo.tipo}
                                onChange={(e) => setNewTramo({...newTramo, tipo: e.target.value})}
                            >
                                <MenuItem value="TRMC">TRMC</MenuItem>
                                <MenuItem value="TMRI">TMRI</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth margin="normal">
                            <InputLabel>Método de Cálculo</InputLabel>
                            <Select
                                value={newTramo.metodoCalculo}
                                onChange={(e) => setNewTramo({...newTramo, metodoCalculo: e.target.value})}
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
                            value={newTramo.valorPeaje}
                            onChange={(e) => setNewTramo({...newTramo, valorPeaje: parseFloat(e.target.value)})}
                        />

                        <TextField
                            fullWidth
                            margin="normal"
                            label="Vigencia Desde"
                            type="date"
                            value={newTramo.vigenciaDesde}
                            onChange={(e) => setNewTramo({...newTramo, vigenciaDesde: e.target.value})}
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            fullWidth
                            margin="normal"
                            label="Vigencia Hasta"
                            type="date"
                            value={newTramo.vigenciaHasta}
                            onChange={(e) => setNewTramo({...newTramo, vigenciaHasta: e.target.value})}
                            InputLabelProps={{ shrink: true }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowAddForm(false)}>Cancelar</Button>
                        <Button onClick={handleAddTramo} variant="contained" color="primary">
                            Guardar
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Tabla existente de tramos */}
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Origen</TableCell>
                                <TableCell>Destino</TableCell>
                                <TableCell>Método</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Distancia</TableCell>
                                <TableCell>Vigencia Desde</TableCell>
                                <TableCell>Vigencia Hasta</TableCell>
                                <TableCell>Peaje</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tramos.map((tramo) => (
                                <TableRow key={tramo._id}>
                                    <TableCell>{tramo.origen?.Site || '-'}</TableCell>
                                    <TableCell>{tramo.destino?.Site || '-'}</TableCell>
                                    <TableCell>{tramo.metodoCalculo}</TableCell>
                                    <TableCell>{tramo.tipo}</TableCell>
                                    <TableCell>{tramo.distancia} km</TableCell>
                                    <TableCell>
                                        {format(new Date(tramo.vigenciaDesde), 'dd/MM/yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(tramo.vigenciaHasta), 'dd/MM/yyyy')}
                                    </TableCell>
                                    <TableCell>${tramo.valorPeaje}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default TarifarioViewer;
