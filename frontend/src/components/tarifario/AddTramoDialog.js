import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, FormControl, InputLabel, Select, MenuItem,
    TextField, Box
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

/**
 * Componente de diálogo para agregar o editar un tramo
 */
const AddTramoDialog = ({ open, onClose, onSave, sites, initialData }) => {
    const [tramoData, setTramoData] = useState({
        origen: initialData?.origen || '',
        destino: initialData?.destino || '',
        cliente: initialData?.cliente || '',
        tarifasHistoricas: [{
            tipo: initialData?.tarifasHistoricas?.[0]?.tipo || 'TRMC',
            metodoCalculo: initialData?.tarifasHistoricas?.[0]?.metodoCalculo || 'Kilometro',
            valor: initialData?.tarifasHistoricas?.[0]?.valor || 0,
            valorPeaje: initialData?.tarifasHistoricas?.[0]?.valorPeaje || 0,
            vigenciaDesde: initialData?.tarifasHistoricas?.[0]?.vigenciaDesde ? dayjs(initialData.tarifasHistoricas[0].vigenciaDesde) : dayjs(),
            vigenciaHasta: initialData?.tarifasHistoricas?.[0]?.vigenciaHasta ? dayjs(initialData.tarifasHistoricas[0].vigenciaHasta) : dayjs().add(1, 'year')
        }]
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        if (['tipo', 'metodoCalculo', 'valor', 'valorPeaje'].includes(name)) {
            setTramoData({
                ...tramoData,
                tarifasHistoricas: [
                    {
                        ...tramoData.tarifasHistoricas[0],
                        [name]: value
                    }
                ]
            });
        } else {
            setTramoData({
                ...tramoData,
                [name]: value
            });
        }
    };

    const handleDateChange = (name, date) => {
        setTramoData({
            ...tramoData,
            tarifasHistoricas: [
                {
                    ...tramoData.tarifasHistoricas[0],
                    [name]: date
                }
            ]
        });
    };

    const handleSave = () => {
        const tarifaHistorica = tramoData.tarifasHistoricas[0];
        
        // Optimización: Usar formato ISO directamente para evitar manipulaciones innecesarias
        const vigenciaDesde = tarifaHistorica.vigenciaDesde.format('YYYY-MM-DD');
        const vigenciaHasta = tarifaHistorica.vigenciaHasta.format('YYYY-MM-DD');
        
        const dataToSave = {
            ...tramoData,
            tarifasHistoricas: [{
                ...tarifaHistorica,
                vigenciaDesde,
                vigenciaHasta
            }]
        };
        
        onSave(dataToSave);
    };

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
                        onChange={(e) => handleInputChange({target: {name: 'origen', value: e.target.value}})}
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
                        onChange={(e) => handleInputChange({target: {name: 'destino', value: e.target.value}})}
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
                        value={tramoData.tarifasHistoricas[0].tipo}
                        onChange={(e) => handleInputChange({target: {name: 'tipo', value: e.target.value}})}
                    >
                        <MenuItem value="TRMC">TRMC</MenuItem>
                        <MenuItem value="TRMI">TRMI</MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                    <InputLabel>Método de Cálculo</InputLabel>
                    <Select
                        value={tramoData.tarifasHistoricas[0].metodoCalculo}
                        onChange={(e) => handleInputChange({target: {name: 'metodoCalculo', value: e.target.value}})}
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
                    inputProps={{ step: "0.01" }}
                    value={tramoData.tarifasHistoricas[0].valorPeaje}
                    onChange={(e) => handleInputChange({target: {name: 'valorPeaje', value: parseFloat(e.target.value)}})}
                />

                <TextField
                    fullWidth
                    margin="normal"
                    label="Valor Tarifa"
                    type="number"
                    inputProps={{ step: "0.01" }}
                    value={tramoData.tarifasHistoricas[0].valor}
                    onChange={(e) => handleInputChange({target: {name: 'valor', value: parseFloat(e.target.value)}})}
                />

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, mt: 2 }}>
                        <DatePicker
                            label="Vigencia Desde"
                            value={tramoData.tarifasHistoricas[0].vigenciaDesde}
                            onChange={(date) => handleDateChange('vigenciaDesde', date)}
                            format="DD/MM/YYYY"
                            sx={{ flex: 1 }}
                        />
                        <DatePicker
                            label="Vigencia Hasta"
                            value={tramoData.tarifasHistoricas[0].vigenciaHasta}
                            onChange={(date) => handleDateChange('vigenciaHasta', date)}
                            format="DD/MM/YYYY"
                            sx={{ flex: 1 }}
                        />
                    </Box>
                </LocalizationProvider>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Cancelar
                </Button>
                <Button onClick={handleSave} color="primary" variant="contained">
                    Guardar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddTramoDialog; 