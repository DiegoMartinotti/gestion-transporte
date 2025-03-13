import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TableContainer, Table, TableHead, TableBody,
    TableRow, TableCell, Paper, Alert, Typography, Box,
    LinearProgress, CircularProgress
} from '@mui/material';
import axios from 'axios';
import { format } from 'date-fns';
import logger from '../utils/logger';

const ViajeBulkImporter = ({ open, onClose, cliente, onComplete, sites }) => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);
    const [importing, setImporting] = useState(false);
    const [processingStatus, setProcessingStatus] = useState('');

    const handleClose = () => {
        setRows([]);
        setError(null);
        onClose();
    };

    // Función para convertir números con formato español/europeo (coma decimal) a formato válido para JavaScript
    const parseSpanishNumber = (value) => {
        if (!value) return 0;
        
        // Reemplazar coma por punto para el separador decimal
        const normalizedValue = String(value).replace(',', '.');
        return parseFloat(normalizedValue) || 0;
    };

    const handlePaste = (event) => {
        event.preventDefault();
        const pastedData = event.clipboardData.getData('text');
        const lines = pastedData.split('\n').filter(line => line.trim());

        const processedRows = lines.map(line => {
            const parts = line.split('\t').map(s => s.trim());
            
            // Formato esperado:
            // DT | Fecha | Origen | Destino | Tipo Tramo | Tipo Unidad | Paletas | Observaciones
            const dt = parts[0];
            const fecha = parts[1]; // Formato esperado: DD/MM/YYYY
            const origen = parts[2];
            const destino = parts[3];
            const tipoTramo = parts[4] || 'TRMC';
            const tipoUnidad = parts[5] || 'Sider';
            const paletas = parseSpanishNumber(parts[6]);
            const observaciones = parts[7] || '';

            // Convertir fecha de DD/MM/YYYY a YYYY-MM-DD
            let fechaFormateada = fecha;
            if (fecha && fecha.includes('/')) {
                const [dia, mes, anio] = fecha.split('/');
                fechaFormateada = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
            }

            return {
                dt,
                fecha: fechaFormateada,
                origen: sites.find(s => s.Site === origen)?._id,
                origenNombre: origen,
                destino: sites.find(s => s.Site === destino)?._id,
                destinoNombre: destino,
                tipoTramo,
                tipoUnidad,
                paletas,
                observaciones
            };
        });

        setRows(processedRows);
    };

    const handleImport = async () => {
        try {
            setLoading(true);
            setError(null);
            setImporting(true);
            setProgress(0);

            // Validar datos antes de enviar
            const validRows = rows.filter(row => 
                row.dt && 
                row.fecha && 
                row.origen && 
                row.destino
            );

            if (validRows.length === 0) {
                throw new Error('No hay viajes válidos para importar');
            }

            // Dividir en lotes más pequeños
            const BATCH_SIZE = 20;
            const batches = [];
            for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
                batches.push(validRows.slice(i, i + BATCH_SIZE));
            }

            logger.debug(`Enviando ${validRows.length} viajes en ${batches.length} lotes`);

            let exitosos = 0;
            let errores = [];

            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                setProcessingStatus(`Procesando lote ${i+1} de ${batches.length} (${batch.length} viajes)`);
                
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        throw new Error('No hay token de autenticación');
                    }

                    const response = await axios.post(
                        '/api/viajes/bulk',
                        { 
                            cliente, 
                            viajes: batch
                        },
                        { 
                            headers: { 
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            timeout: 30000
                        }
                    );

                    exitosos += response.data.exitosos;
                    if (response.data.errores) {
                        errores = [...errores, ...response.data.errores];
                    }

                } catch (error) {
                    logger.error(`Error en lote ${i+1}:`, error);
                    batch.forEach((viaje, index) => {
                        errores.push({
                            indice: i * BATCH_SIZE + index,
                            dt: viaje.dt,
                            error: error.message
                        });
                    });
                }

                setProgress(Math.round(((i + 1) / batches.length) * 100));
            }

            // Proceso completo
            setProgress(100);
            
            if (errores.length > 0) {
                logger.error(`Importación completada con errores: ${exitosos} exitosos, ${errores.length} fallidos`);
                setError(`Se importaron ${exitosos} viajes, pero ${errores.length} presentaron errores.`);
                setImporting(false);
                onComplete?.();
            } else if (exitosos > 0) {
                logger.debug(`Importación exitosa: ${exitosos} viajes importados`);
                onComplete?.();
                setTimeout(() => {
                    setImporting(false);
                    handleClose();
                }, 2000);
            } else {
                throw new Error('No se importó ningún viaje');
            }
        } catch (err) {
            logger.error('Error general en importación:', err);
            setProgress(0);
            setImporting(false);
            setError(`Error: ${err.message}`);
        } finally {
            setLoading(false);
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
                Importar Viajes
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" gutterBottom>
                        Pegue los datos de los viajes desde Excel. El formato debe ser:
                    </Typography>
                    <Typography variant="body2" color="textSecondary" component="div" sx={{ mb: 2 }}>
                        DT | Fecha (DD/MM/YYYY) | Origen | Destino | Tipo Tramo | Tipo Unidad | Paletas | Observaciones
                    </Typography>
                </Box>

                <Box 
                    sx={{ 
                        border: '1px dashed grey',
                        p: 2,
                        mb: 2,
                        backgroundColor: '#f5f5f5'
                    }}
                    onPaste={handlePaste}
                >
                    <Typography>
                        Pegue los datos aquí...
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {rows.length > 0 && (
                    <TableContainer component={Paper} sx={{ mb: 2 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>DT</TableCell>
                                    <TableCell>Fecha</TableCell>
                                    <TableCell>Origen</TableCell>
                                    <TableCell>Destino</TableCell>
                                    <TableCell>Tipo Tramo</TableCell>
                                    <TableCell>Tipo Unidad</TableCell>
                                    <TableCell>Paletas</TableCell>
                                    <TableCell>Observaciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.map((row, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{row.dt}</TableCell>
                                        <TableCell>{format(new Date(row.fecha), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell>{row.origenNombre}</TableCell>
                                        <TableCell>{row.destinoNombre}</TableCell>
                                        <TableCell>{row.tipoTramo}</TableCell>
                                        <TableCell>{row.tipoUnidad}</TableCell>
                                        <TableCell>{row.paletas}</TableCell>
                                        <TableCell>{row.observaciones}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {importing && (
                    <Box sx={{ width: '100%', mb: 2 }}>
                        <LinearProgress variant="determinate" value={progress} />
                        <Typography variant="body2" color="textSecondary" align="center">
                            {processingStatus}
                        </Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>
                    Cancelar
                </Button>
                <Button 
                    onClick={handleImport}
                    variant="contained" 
                    color="primary"
                    disabled={rows.length === 0 || loading}
                    startIcon={loading && <CircularProgress size={20} />}
                >
                    Importar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ViajeBulkImporter; 