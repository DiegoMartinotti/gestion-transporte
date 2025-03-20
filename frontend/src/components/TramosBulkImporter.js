import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TableContainer, Table, TableHead, TableBody,
    TableRow, TableCell, Paper, Alert, Typography, Box, TextField,
    LinearProgress, CircularProgress, Tooltip, IconButton
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import axios from 'axios';
import { format } from 'date-fns';
import logger from '../utils/logger';

// Constante para la URL de la API
const API_URL = process.env.REACT_APP_API_URL || '';

const TramosBulkImporter = ({ open, onClose, cliente, onComplete, sites = [] }) => {
    // Manejar la posibilidad de que sites sea undefined
    const sitesList = Array.isArray(sites) ? sites : [];
    
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [vigencia, setVigencia] = useState({
        desde: new Date().toISOString().split('T')[0],
        hasta: new Date(Date.now() + 31536000000).toISOString().split('T')[0] // Un año
    });
    const [progress, setProgress] = useState(0);
    const [importing, setImporting] = useState(false);
    const [processingStatus, setProcessingStatus] = useState('');
    const [duplicados, setDuplicados] = useState([]);
    const [showDuplicados, setShowDuplicados] = useState(false);
    const [distanciasExistentes, setDistanciasExistentes] = useState({});

    // Nuevo efecto para cargar distancias existentes cuando se abre el diálogo
    useEffect(() => {
        if (open) {
            cargarDistanciasExistentes();
        }
    }, [open]);

    // Función para cargar distancias existentes
    const cargarDistanciasExistentes = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

            const response = await axios.get(
                '/api/tramos/distancias',
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                // Crear un mapa de distancias por origen-destino
                const distanciasMap = {};
                response.data.data.forEach(item => {
                    const key = `${item.origen}-${item.destino}`;
                    distanciasMap[key] = item.distancia;
                });
                setDistanciasExistentes(distanciasMap);
                logger.debug('Distancias existentes cargadas:', distanciasMap);
            }
        } catch (error) {
            logger.error('Error al cargar distancias existentes:', error);
            // No interrumpimos el flujo si falla la carga de distancias
        }
    };

    const handleClose = () => {
        setRows([]);
        setError(null);
        setVigencia({
            desde: new Date().toISOString().split('T')[0],
            hasta: new Date(Date.now() + 31536000000).toISOString().split('T')[0]
        });
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
            
            // Manejar el caso donde vienen también fechas en el pegado
            const origen = parts[0];
            const destino = parts[1];
            const tipo = parts[2];
            const metodo = parts[3];
            
            // Usar parseSpanishNumber para manejar correctamente los números con coma decimal
            const valor = parseSpanishNumber(parts[4]);
            const peaje = parseSpanishNumber(parts[5]);
            
            // Si vienen fechas en el formato, las usamos
            let fechaDesde = vigencia.desde;
            let fechaHasta = vigencia.hasta;
            
            // Procesamiento de fechas mejorado
            // Verificar si hay un rango de fechas (formato: DD/MM/YYYY - DD/MM/YYYY)
            if (parts.length >= 5 && parts[4] && parts[4].includes('-') && parts[4].includes('/')) {
                const fechaRango = parts[4].split('-').map(f => f.trim());
                if (fechaRango.length === 2) {
                    const fDesde = fechaRango[0].split('/');
                    const fHasta = fechaRango[1].split('/');
                    
                    if (fDesde.length === 3) {
                        fechaDesde = `${fDesde[2]}-${fDesde[1]}-${fDesde[0]}`;
                    }
                    
                    if (fHasta.length === 3) {
                        fechaHasta = `${fHasta[2]}-${fHasta[1]}-${fHasta[0]}`;
                    }
                }
            } 
            // Si no hay rango, procesamos fechas individuales
            else {
                if (parts.length >= 7 && parts[6]) {
                    // Convertir DD/MM/YYYY a YYYY-MM-DD
                    const fDesde = parts[6].split('/');
                    if (fDesde.length === 3) {
                        fechaDesde = `${fDesde[2]}-${fDesde[1]}-${fDesde[0]}`;
                    }
                }
                
                if (parts.length >= 8 && parts[7]) {
                    // Convertir DD/MM/YYYY a YYYY-MM-DD
                    const fHasta = parts[7].split('/');
                    if (fHasta.length === 3) {
                        fechaHasta = `${fHasta[2]}-${fHasta[1]}-${fHasta[0]}`;
                    }
                }
            }

            // Importante: Asegurarnos que las fechas estén en formato YYYY-MM-DD
            logger.debug(`Fechas procesadas para ${origen}-${destino}: ${fechaDesde} - ${fechaHasta}`);

            return {
                origen: sitesList.find(s => s.Site === origen)?._id,
                destino: sitesList.find(s => s.Site === destino)?._id,
                origenNombre: origen,
                destinoNombre: destino,
                tipo: tipo || 'TRMC',
                metodoCalculo: metodo || 'Kilometro',
                valor: valor,
                valorPeaje: peaje,
                vigenciaDesde: fechaDesde,
                vigenciaHasta: fechaHasta
            };
        });

        // Actualizar fechas de vigencia si se detectaron en el pegado
        if (processedRows.length > 0 && processedRows[0].vigenciaDesde !== vigencia.desde) {
            setVigencia({
                desde: processedRows[0].vigenciaDesde,
                hasta: processedRows[0].vigenciaHasta
            });
        }

        setRows(processedRows);
    };

    const formatVigencia = (desde, hasta) => {
        try {
            const fechaDesde = format(new Date(desde + 'T00:00:00'), 'dd/MM/yyyy');
            const fechaHasta = format(new Date(hasta + 'T00:00:00'), 'dd/MM/yyyy');
            return `${fechaDesde} - ${fechaHasta}`;
        } catch (error) {
            logger.error('Error formateando fechas:', error);
            return 'Fecha inválida';
        }
    };

    const handleImport = async () => {
        try {
            setLoading(true);
            setError(null);
            setImporting(true);
            setProgress(0);

            // Asegurar el formato correcto de las fechas y datos
            const validRows = rows.filter(row => row.origen && row.destino).map(row => {
                // Asegurar que tengamos las fechas de vigencia con formato ISO
                const vigenciaDesde = `${vigencia.desde}T00:00:00.000Z`;
                const vigenciaHasta = `${vigencia.hasta}T23:59:59.999Z`;

                // Verificar si ya tenemos la distancia calculada para este origen-destino
                const distanciaKey = `${row.origen}-${row.destino}`;
                const distanciaExistente = distanciasExistentes[distanciaKey];

                return {
                    ...row,
                    vigenciaDesde,
                    vigenciaHasta,
                    valor: Number(row.valor) || 0,
                    valorPeaje: Number(row.valorPeaje || 0),
                    // Si existe una distancia calculada previamente, la incluimos
                    distanciaPreCalculada: distanciaExistente !== undefined ? distanciaExistente : null
                };
            });

            if (validRows.length === 0) {
                throw new Error('No hay tramos válidos para importar');
            }

            // Añadir validación para detectar duplicados en el lote antes de enviar
            const origDesPairs = {};
            const posiblesDuplicados = [];

            validRows.forEach((row, idx) => {
                // Ya NO incluir el tipo en la clave para permitir tramos del mismo origen-destino con diferentes tipos
                // Solo detectamos como duplicados aquellos que tienen mismo origen, destino, método de cálculo y fechas
                const key = `${row.origen}-${row.destino}-${row.metodoCalculo}-${row.vigenciaDesde.substring(0, 10)}-${row.vigenciaHasta.substring(0, 10)}`;
                
                if (origDesPairs[key] && origDesPairs[key].tipo === row.tipo) {
                    // Solo consideramos duplicado si el tipo también es igual
                    posiblesDuplicados.push({
                        indice: idx,
                        origen: row.origenNombre,
                        destino: row.destinoNombre,
                        tipo: row.tipo
                    });
                } else {
                    // Guardamos la información completa incluyendo el tipo
                    origDesPairs[key] = {
                        tipo: row.tipo,
                        index: idx
                    };
                }
            });

            if (posiblesDuplicados.length > 0) {
                const confirmed = window.confirm(`Se detectaron ${posiblesDuplicados.length} posibles duplicados en el lote a importar. ¿Desea continuar de todas formas?`);
                
                if (!confirmed) {
                    setProgress(0);
                    setImporting(false);
                    logger.debug('Duplicados detectados:', posiblesDuplicados);
                    setError(`Duplicados detectados en los datos. Revise y vuelva a intentar.`);
                    return;
                }
            }

            // Dividir en lotes más pequeños para evitar problemas de tamaño
            const BATCH_SIZE = 20; // Procesar máximo 20 tramos a la vez
            const batches = [];
            for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
                batches.push(validRows.slice(i, i + BATCH_SIZE));
            }

            logger.debug(`Enviando ${validRows.length} tramos en ${batches.length} lotes`);

            let exitosos = 0;
            let errores = [];

            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                setProcessingStatus(`Procesando lote ${i+1} de ${batches.length} (${batch.length} tramos)`);
                
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        throw new Error('No hay token de autenticación');
                    }

                    logger.debug(`Enviando lote ${i+1}:`, {
                        tamañoLote: batch.length,
                        primerTramo: batch[0],
                        distanciasPreCalculadas: batch.filter(t => t.distanciaPreCalculada !== null).length
                    });

                    const response = await axios.post(
                        '/api/tramos/bulk',
                        { 
                            cliente, 
                            tramos: batch,
                            reutilizarDistancias: true // Indicar al backend que queremos reutilizar distancias
                        },
                        { 
                            headers: { 
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            timeout: 30000 // 30 segundos por lote
                        }
                    );

                    logger.debug(`Respuesta del lote ${i+1}:`, response.data);
                    
                    if (response.data.success) {
                        exitosos += response.data.exitosos || 0;
                        if (response.data.errores) {
                            errores = [...errores, ...response.data.errores];
                        }
                    } else {
                        throw new Error(response.data.message || `Error en lote ${i+1}`);
                    }
                } catch (batchError) {
                    logger.error(`Error en lote ${i+1}:`, batchError);
                    
                    // Registrar información detallada del error
                    if (batchError.response) {
                        // Error de respuesta del servidor
                        logger.error('Error del servidor:', {
                            status: batchError.response.status,
                            data: batchError.response.data,
                            headers: batchError.response.headers
                        });
                        errores.push({
                            lote: i+1,
                            error: `Error ${batchError.response.status}: ${batchError.response.data?.message || 'Error del servidor'}`
                        });
                    } else if (batchError.request) {
                        // Error de falta de respuesta
                        logger.error('Error de red - no hubo respuesta:', batchError.request);
                        errores.push({
                            lote: i+1,
                            error: 'No se recibió respuesta del servidor'
                        });
                    } else {
                        // Error de configuración
                        logger.error('Error de configuración:', batchError.message);
                        errores.push({
                            lote: i+1,
                            error: `Error de configuración: ${batchError.message}`
                        });
                    }
                }
                
                // Actualizar progreso
                setProgress(Math.round(((i + 1) / batches.length) * 100));
            }

            // Proceso completo
            setProgress(100);
            
            // Actualizar mensaje de error para mejor interpretación y mostrar detalles
            if (errores.length > 0) {
                logger.error(`Importación completada con errores: ${exitosos} exitosos, ${errores.length} fallidos`);
                
                // Agrupar errores por tipo
                const duplicadosEncontrados = errores.filter(e => e.error && e.error.includes('Tramo duplicado'));
                
                // Almacenar los duplicados en el estado para poder mostrarlos después
                setDuplicados(duplicadosEncontrados);
                
                let mensajeError = `Se importaron ${exitosos} tramos, pero ${errores.length} presentaron errores.`;
                
                if (duplicadosEncontrados.length > 0) {
                    mensajeError += ` ${duplicadosEncontrados.length} tramos eran duplicados.`;
                    setShowDuplicados(true);
                }
                
                // Mostrar detalles de los errores en la consola para debugging
                logger.error('Detalle de errores:', errores);
                
                // Añadir mejor log de errores
                logger.error("Muestra de errores:", errores.slice(0, 5).map(e => ({
                    origen: e.origen,
                    destino: e.destino,
                    tipo: e.tipo,
                    metodo: e.metodo,
                    error: e.error
                })));
                
                // Agrupar errores por tipo
                const errorPorTipos = {};
                errores.forEach(e => {
                    const errorMsg = e.error || 'Error desconocido';
                    if (!errorPorTipos[errorMsg]) {
                        errorPorTipos[errorMsg] = 0;
                    }
                    errorPorTipos[errorMsg]++;
                });
                
                logger.error("Recuento de errores por tipo:", errorPorTipos);
                
                setError(mensajeError);
                setImporting(false);
                onComplete?.();
            } else if (exitosos > 0) {
                logger.debug(`Importación exitosa: ${exitosos} tramos importados`);
                onComplete?.();
                setTimeout(() => {
                    setImporting(false); // Asegurar que importing se establece en false antes de cerrar
                    handleClose();
                }, 2000);
            } else {
                throw new Error('No se importó ningún tramo');
            }
        } catch (err) {
            logger.error('Error general en importación:', err);
            setProgress(0);
            setImporting(false); // Asegurar que importing siempre se establece en false en caso de error
            setError(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Añadir función para formatear valores con dos decimales, usando coma como separador decimal para mostrar
    const formatCurrency = (value) => {
        if (value === undefined || value === null) return '$0,00';
        
        // Formatear con dos decimales y usar coma como separador decimal para mostrar
        return `$${parseFloat(value).toFixed(2).replace('.', ',')}`;
    };

    const formatMoney = (value) => {
        return Number(value || 0).toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const processRows = (rows) => {
        let parsedRows = [];
        let errorsFound = [];

        rows.forEach((row, index) => {
            try {
                // Validar campos obligatorios
                const origen = row['Origen'];
                const destino = row['Destino'];
                const cliente = row['Cliente'];
                const tipo = row['Tipo'] || 'TRMC';
                const metodoCalculo = row['Método de Cálculo'] || 'Kilometro';
                const valor = parseFloat(row['Valor'] || 0);
                const valorPeaje = parseFloat(row['Peaje'] || 0);
                
                // Validar fechas de vigencia
                let vigenciaDesde = row['Vigencia Desde'] ? new Date(row['Vigencia Desde']) : new Date();
                let vigenciaHasta = row['Vigencia Hasta'] ? new Date(row['Vigencia Hasta']) : new Date();
                vigenciaHasta.setFullYear(vigenciaHasta.getFullYear() + 1);

                if (!origen || !destino || !cliente) {
                    throw new Error('Faltan campos obligatorios (Origen, Destino o Cliente)');
                }

                if (isNaN(valor)) {
                    throw new Error('El valor debe ser un número');
                }

                parsedRows.push({
                    origen,
                    destino,
                    cliente,
                    tarifasHistoricas: [{
                        tipo,
                        metodoCalculo,
                        valor,
                        valorPeaje,
                        vigenciaDesde: vigenciaDesde.toISOString(),
                        vigenciaHasta: vigenciaHasta.toISOString()
                    }]
                });
            } catch (error) {
                errorsFound.push({
                    row: index + 1,
                    error: error.message
                });
            }
        });

        setErrors(errorsFound);
        return parsedRows;
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
            <DialogTitle>Importar Tramos</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 3, mt: 1 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Vigencia para todos los tramos
                    </Typography>
                    <Box display="flex" gap={2}>
                        <TextField
                            label="Vigencia Desde"
                            type="date"
                            value={vigencia.desde}
                            onChange={(e) => setVigencia({
                                ...vigencia,
                                desde: e.target.value
                            })}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Vigencia Hasta"
                            type="date"
                            value={vigencia.hasta}
                            onChange={(e) => setVigencia({
                                ...vigencia,
                                hasta: e.target.value
                            })}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                </Box>
                
                <Alert severity="info" sx={{ mb: 2 }}>
                    Formato esperado: Origen⇥Destino⇥Tipo⇥Método⇥Valor⇥Peaje⇥FechaDesde⇥FechaHasta
                </Alert>
                
                <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Optimización de cálculo de distancias:</Typography>
                    <Typography variant="body2">
                        El sistema reutilizará automáticamente los cálculos de distancia existentes para los mismos pares origen-destino,
                        mejorando el rendimiento de la importación.
                    </Typography>
                </Alert>
                
                <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Evitar duplicados:</Typography>
                    <Typography variant="body2">
                        Un tramo se considera duplicado cuando coinciden: origen, destino, cliente, tipo, método de cálculo,
                        y hay superposición en las fechas de vigencia. Asegúrese de que sus tramos nuevos no se superpongan
                        con tramos existentes en el mismo período.
                    </Typography>
                </Alert>
                
                {importing && (
                    <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
                        <Box display="flex" alignItems="center" mb={1}>
                            <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                                {processingStatus || 'Procesando importación...'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {Math.round(progress)}%
                            </Typography>
                        </Box>
                        <LinearProgress 
                            variant="determinate" 
                            value={progress} 
                            color={progress === 100 ? "success" : "primary"}
                        />
                    </Box>
                )}
                <Box 
                    sx={{ 
                        p: 2, 
                        border: '2px dashed #ccc', 
                        mb: 2,
                        bgcolor: '#f5f5f5',
                        textAlign: 'center'
                    }} 
                    onPaste={handlePaste}
                >
                    <Typography>Pega aquí los datos desde Excel</Typography>
                </Box>
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Origen</TableCell>
                                <TableCell>Destino</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Método</TableCell>
                                <TableCell>Valor</TableCell>
                                <TableCell>Peaje</TableCell>
                                <TableCell>Vigencia</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((row, index) => (
                                <TableRow 
                                    key={index}
                                    sx={{
                                        bgcolor: !row.origen || !row.destino ? '#ffebee' : 'inherit'
                                    }}
                                >
                                    <TableCell>{row.origenNombre}</TableCell>
                                    <TableCell>{row.destinoNombre}</TableCell>
                                    <TableCell>{row.tipo}</TableCell>
                                    <TableCell>{row.metodoCalculo}</TableCell>
                                    <TableCell>{formatCurrency(row.valor)}</TableCell>
                                    <TableCell>{formatCurrency(row.valorPeaje)}</TableCell>
                                    <TableCell>
                                        {formatVigencia(vigencia.desde, vigencia.hasta)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                        {showDuplicados && duplicados.length > 0 && (
                            <Box mt={2}>
                                <Typography variant="subtitle2">
                                    Tramos duplicados ({duplicados.length}):
                                </Typography>
                                <Button 
                                    size="small" 
                                    onClick={() => setShowDuplicados(!showDuplicados)}
                                    sx={{ mb: 1 }}
                                >
                                    {showDuplicados ? 'Ocultar detalles' : 'Mostrar detalles'}
                                </Button>
                                {showDuplicados && (
                                    <TableContainer component={Paper} sx={{ maxHeight: 300, overflow: 'auto' }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Origen</TableCell>
                                                    <TableCell>Destino</TableCell>
                                                    <TableCell>Tipo</TableCell>
                                                    <TableCell>Método</TableCell>
                                                    <TableCell>Vigencia</TableCell>
                                                    <TableCell>Conflicto con</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {duplicados.map((dup, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell>{dup.origen}</TableCell>
                                                        <TableCell>{dup.destino}</TableCell>
                                                        <TableCell>{dup.tipo}</TableCell>
                                                        <TableCell>{dup.metodo}</TableCell>
                                                        <TableCell>{`${dup.fechaDesde} - ${dup.fechaHasta}`}</TableCell>
                                                        <TableCell>
                                                            {dup.tramoExistente ? (
                                                                <Tooltip 
                                                                    title={
                                                                        <React.Fragment>
                                                                            <Typography color="inherit" variant="subtitle2">
                                                                                Tramo existente:
                                                                            </Typography>
                                                                            <Typography variant="body2">
                                                                                {dup.tramoExistente.origen} → {dup.tramoExistente.destino}
                                                                            </Typography>
                                                                            <Typography variant="body2">
                                                                                Tipo: {dup.tramoExistente.tipo}, Método: {dup.tramoExistente.metodo}
                                                                            </Typography>
                                                                            <Typography variant="body2">
                                                                                Vigencia: {dup.tramoExistente.vigenciaDesde} - {dup.tramoExistente.vigenciaHasta}
                                                                            </Typography>
                                                                            <Typography variant="body2">
                                                                                Valor: ${formatMoney(dup.tramoExistente.valor)}, Peaje: ${formatMoney(dup.tramoExistente.valorPeaje)}
                                                                            </Typography>
                                                                        </React.Fragment>
                                                                    }
                                                                    placement="left"
                                                                    arrow
                                                                >
                                                                    <Button size="small" variant="outlined" color="error">
                                                                        Ver detalle
                                                                    </Button>
                                                                </Tooltip>
                                                            ) : (
                                                                <Tooltip title={dup.error}>
                                                                    <IconButton size="small">
                                                                        <InfoIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </Box>
                        )}
                    </Alert>
                )}
                {progress === 100 && !error && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        Importación completada exitosamente
                    </Alert>
                )}
            </DialogContent>
            <DialogActions>
                <Button 
                    onClick={handleClose} 
                    disabled={importing} // Solo deshabilitado durante la importación activa
                >
                    Cerrar
                </Button>
                <Button 
                    onClick={handleImport}
                    variant="contained"
                    disabled={importing || loading || rows.length === 0}
                    startIcon={loading && !importing ? <CircularProgress size={20} /> : null}
                >
                    {importing ? `Importando... (${Math.round(progress)}%)` : 'Importar Tramos'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TramosBulkImporter;
