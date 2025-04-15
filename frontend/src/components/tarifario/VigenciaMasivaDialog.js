import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    Button,
    Box,
    CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

/**
 * Componente de diálogo para actualizar la vigencia de múltiples tramos a la vez
 */
const VigenciaMasivaDialog = ({
    open,
    onClose,
    onUpdate,
    tramosSeleccionados = [],
    loading = false
}) => {
    const [vigenciaData, setVigenciaData] = useState({
        vigenciaDesde: dayjs(),
        vigenciaHasta: dayjs().add(1, 'year')
    });

    const handleVigenciaChange = (name, date) => {
        setVigenciaData(prev => ({
            ...prev,
            [name]: date
        }));
    };

    const handleSubmit = () => {
        // Formatear fechas con hora en UTC para evitar problemas de zona horaria
        const dataToSend = {
            // Asegurarnos de que la fecha se envía con formato YYYY-MM-DD
            // y establecer la hora a mediodía (12:00) en UTC para evitar cualquier
            // problema de zona horaria que pueda cambiar el día
            vigenciaDesde: vigenciaData.vigenciaDesde
                .hour(12).minute(0).second(0).millisecond(0)
                .format('YYYY-MM-DD'),
            vigenciaHasta: vigenciaData.vigenciaHasta
                .hour(12).minute(0).second(0).millisecond(0)
                .format('YYYY-MM-DD'),
        };
        
        onUpdate(tramosSeleccionados, dataToSend);
    };

    const cantidadTramos = tramosSeleccionados.length;

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Actualizar Vigencia Masiva</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {cantidadTramos === 0 
                        ? "No hay tramos seleccionados para actualizar." 
                        : `Se actualizará la vigencia de ${cantidadTramos} tramo(s) seleccionado(s).`
                    }
                </DialogContentText>

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: '300px', my: 2 }}>
                        <DatePicker
                            label="Nueva Vigencia Desde"
                            value={vigenciaData.vigenciaDesde}
                            onChange={(date) => handleVigenciaChange('vigenciaDesde', date)}
                            format="DD/MM/YYYY"
                            slotProps={{ textField: { fullWidth: true } }}
                            disabled={cantidadTramos === 0 || loading}
                        />
                        <DatePicker
                            label="Nueva Vigencia Hasta"
                            value={vigenciaData.vigenciaHasta}
                            onChange={(date) => handleVigenciaChange('vigenciaHasta', date)}
                            format="DD/MM/YYYY"
                            slotProps={{ textField: { fullWidth: true } }}
                            disabled={cantidadTramos === 0 || loading}
                        />
                    </Box>
                </LocalizationProvider>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary" disabled={loading}>
                    Cancelar
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    color="primary" 
                    variant="contained"
                    disabled={cantidadTramos === 0 || loading}
                >
                    {loading ? (
                        <>
                            <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                            Actualizando...
                        </>
                    ) : 'Actualizar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default VigenciaMasivaDialog; 