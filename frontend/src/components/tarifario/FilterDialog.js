import React from 'react';
import {
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button, 
    Box
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

/**
 * Componente de diálogo para filtrar tarifas por fecha de vigencia
 */
const FilterDialog = ({ 
    open, 
    onClose, 
    onApplyFilter, 
    filtros 
}) => {
    const [filtroLocal, setFiltroLocal] = React.useState({
        desde: filtros.desde ? dayjs(filtros.desde) : null,
        hasta: filtros.hasta ? dayjs(filtros.hasta) : null
    });

    /**
     * Maneja el cambio de fecha en los filtros
     * @param {string} field - Campo a modificar (desde o hasta)
     * @param {Object} date - Objeto dayjs con la fecha seleccionada
     */
    const handleDateChange = (field, date) => {
        setFiltroLocal(prev => ({
            ...prev,
            [field]: date
        }));
    };

    /**
     * Aplica los filtros y cierra el diálogo
     */
    const handleApplyFilter = () => {
        const filtrosFormateados = {
            desde: filtroLocal.desde ? filtroLocal.desde.format('YYYY-MM-DD') : '',
            hasta: filtroLocal.hasta ? filtroLocal.hasta.format('YYYY-MM-DD') : ''
        };
        onApplyFilter(filtrosFormateados);
        onClose();
    };

    /**
     * Limpia todos los filtros
     */
    const handleClearFilter = () => {
        setFiltroLocal({
            desde: null,
            hasta: null
        });
        onApplyFilter({
            desde: '',
            hasta: ''
        });
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Filtrar por Vigencia</DialogTitle>
            <DialogContent>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: '300px', my: 1 }}>
                        <DatePicker
                            label="Vigencia Desde"
                            value={filtroLocal.desde}
                            onChange={(date) => handleDateChange('desde', date)}
                            format="DD/MM/YYYY"
                            slotProps={{ textField: { fullWidth: true } }}
                        />
                        <DatePicker
                            label="Vigencia Hasta"
                            value={filtroLocal.hasta}
                            onChange={(date) => handleDateChange('hasta', date)}
                            format="DD/MM/YYYY"
                            slotProps={{ textField: { fullWidth: true } }}
                        />
                    </Box>
                </LocalizationProvider>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClearFilter} color="secondary">
                    Limpiar Filtros
                </Button>
                <Button onClick={onClose} color="primary">
                    Cancelar
                </Button>
                <Button onClick={handleApplyFilter} color="primary" variant="contained">
                    Aplicar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default FilterDialog; 