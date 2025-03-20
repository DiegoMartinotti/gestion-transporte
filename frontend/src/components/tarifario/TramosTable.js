import React, { memo, useMemo, useCallback } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Checkbox,
    IconButton,
    Tooltip,
    Chip,
    Typography
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import { formatMoney, formatDate } from './utils';

// Componente de fila optimizado
const TramoRow = memo(({ 
    tramo, 
    isSelected, 
    vigente, 
    onSelect, 
    onEdit, 
    onDelete, 
    permisos 
}) => {
    const { tarifaActual } = tramo;
    
    // Memoizar el detalle para evitar recálculos en cada renderizado
    const detalle = useMemo(() => {
        const metodoCalculo = tarifaActual.metodoCalculo;
        const valor = tarifaActual.valor;
        const distancia = tramo.distancia;
        
        switch (metodoCalculo) {
            case 'Kilometro':
                return `$${formatMoney(valor)} por km (${distancia || 0} km)`;
            case 'Palet':
                return `$${formatMoney(valor)} por palet`;
            case 'Fijo':
                return `$${formatMoney(valor)} tarifa fija`;
            default:
                return `$${formatMoney(valor)}`;
        }
    }, [tarifaActual.metodoCalculo, tarifaActual.valor, tramo.distancia]);
    
    // Optimizar los manejadores de eventos con useCallback
    const handleSelect = useCallback(() => {
        onSelect(tramo._idCompuesto);
    }, [onSelect, tramo._idCompuesto]);
    
    const handleEdit = useCallback(() => {
        onEdit(tramo);
    }, [onEdit, tramo]);
    
    const handleDelete = useCallback(() => {
        onDelete(tramo);
    }, [onDelete, tramo]);
    
    return (
        <TableRow 
            selected={isSelected}
            hover
        >
            <TableCell padding="checkbox">
                <Checkbox
                    checked={isSelected}
                    onChange={handleSelect}
                />
            </TableCell>
            <TableCell>{tramo.origen?.Site || 'N/A'}</TableCell>
            <TableCell>{tramo.destino?.Site || 'N/A'}</TableCell>
            <TableCell>{tarifaActual.tipo || 'N/A'}</TableCell>
            <TableCell>{tarifaActual.metodoCalculo || 'N/A'}</TableCell>
            <TableCell align="right">${formatMoney(tarifaActual.valor)}</TableCell>
            <TableCell align="right">${formatMoney(tarifaActual.valorPeaje)}</TableCell>
            <TableCell>{detalle}</TableCell>
            <TableCell>
                {formatDate(tarifaActual.vigenciaDesde)} a {formatDate(tarifaActual.vigenciaHasta)}
            </TableCell>
            <TableCell>
                {vigente ? (
                    <Chip 
                        icon={<CheckCircleIcon />} 
                        label="Vigente" 
                        color="success" 
                        size="small" 
                    />
                ) : (
                    <Chip 
                        icon={<CancelIcon />} 
                        label="No Vigente" 
                        color="error" 
                        size="small" 
                    />
                )}
            </TableCell>
            <TableCell>
                {permisos.includes('editar_tramos') && (
                    <Tooltip title="Editar">
                        <IconButton 
                            size="small" 
                            onClick={handleEdit}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
                
                {permisos.includes('eliminar_tramos') && (
                    <Tooltip title="Eliminar">
                        <IconButton 
                            size="small" 
                            onClick={handleDelete}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </TableCell>
        </TableRow>
    );
});

/**
 * Componente para mostrar la tabla de tramos con tarifas
 */
const TramosTable = memo(({
    tramos = [],
    selectedTramos = [],
    fechaVigencia,
    onSelect,
    onSelectAll,
    onEdit,
    onDelete,
    permisos = []
}) => {
    /**
     * Verifica si todos los tramos están seleccionados
     */
    const isAllSelected = useMemo(() => 
        tramos.length > 0 && tramos.every(
            tramo => selectedTramos.includes(tramo._idCompuesto)
        ),
    [tramos, selectedTramos]);

    /**
     * Verifica si la tarifa está vigente
     */
    const checkVigencia = useCallback((vigenciaDesde, vigenciaHasta) => {
        if (!fechaVigencia) return true;
        
        const hoy = fechaVigencia ? new Date(fechaVigencia) : new Date();
        const desde = new Date(vigenciaDesde);
        const hasta = new Date(vigenciaHasta);
        
        return desde <= hoy && hoy <= hasta;
    }, [fechaVigencia]);

    /**
     * Formatea y muestra el detalle del método de cálculo
     */
    const generarDetalleMetodo = (metodoCalculo, valor, distancia) => {
        switch (metodoCalculo) {
            case 'Kilometro':
                return `$${formatMoney(valor)} por km (${distancia || 0} km)`;
            case 'Palet':
                return `$${formatMoney(valor)} por palet`;
            case 'Fijo':
                return `$${formatMoney(valor)} tarifa fija`;
            default:
                return `$${formatMoney(valor)}`;
        }
    };

    // Contenido de la tabla optimizado
    const tableContent = useMemo(() => {
        if (tramos.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={11} align="center">
                        <Typography variant="body1" sx={{ py: 2 }}>
                            No se encontraron tramos registrados
                        </Typography>
                    </TableCell>
                </TableRow>
            );
        }
        
        return tramos.map((tramo) => {
            const isSelected = selectedTramos.includes(tramo._idCompuesto);
            const vigente = checkVigencia(
                tramo.tarifaActual.vigenciaDesde, 
                tramo.tarifaActual.vigenciaHasta
            );
            
            return (
                <TramoRow 
                    key={tramo._idCompuesto}
                    tramo={tramo}
                    isSelected={isSelected}
                    vigente={vigente}
                    onSelect={onSelect}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    permisos={permisos}
                />
            );
        });
    }, [tramos, selectedTramos, checkVigencia, onSelect, onEdit, onDelete, permisos]);

    return (
        <TableContainer component={Paper} sx={{ mt: 2, maxHeight: '60vh' }}>
            <Table stickyHeader size="small">
                <TableHead>
                    <TableRow>
                        <TableCell padding="checkbox">
                            <Checkbox
                                indeterminate={selectedTramos.length > 0 && !isAllSelected}
                                checked={isAllSelected}
                                onChange={onSelectAll}
                            />
                        </TableCell>
                        <TableCell>Origen</TableCell>
                        <TableCell>Destino</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Método</TableCell>
                        <TableCell align="right">Tarifa</TableCell>
                        <TableCell align="right">Peaje</TableCell>
                        <TableCell>Detalle</TableCell>
                        <TableCell>Vigencia</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Acciones</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {tableContent}
                </TableBody>
            </Table>
        </TableContainer>
    );
});

export default TramosTable; 