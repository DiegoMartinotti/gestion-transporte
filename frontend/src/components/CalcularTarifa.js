import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TextField,
  Box,
  Alert,
} from '@mui/material';
import axios from 'axios';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const CalcularTarifa = () => {
  const [clientes, setClientes] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState('');
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [fecha, setFecha] = useState(dayjs());
  const [palets, setPalets] = useState(1);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    if (selectedCliente) {
      fetchSites();
    }
  }, [selectedCliente]);

  const fetchClientes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/clientes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClientes(response.data);
    } catch (error) {
      setError('Error al cargar clientes: ' + error.message);
    }
  };

  const fetchSites = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/sites?cliente=${selectedCliente}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSites(response.data.data || []);
    } catch (error) {
      setError('Error al cargar sites: ' + error.message);
    }
  };

  const handleCalcular = async () => {
    if (!selectedCliente || !origen || !destino || !fecha) {
      setError('Por favor complete todos los campos requeridos');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/tramos/calcular-tarifa', {
        cliente: selectedCliente,
        origen,
        destino,
        fecha: fecha.toISOString(),
        palets
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Verificar que la respuesta tenga la estructura esperada
      if (response.data.success && response.data.data) {
        setResultado(response.data.data);
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error) {
      setError('Error al calcular tarifa: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Calcular Tarifa
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Cliente</InputLabel>
              <Select
                value={selectedCliente}
                onChange={(e) => setSelectedCliente(e.target.value)}
                label="Cliente"
              >
                {clientes.map((cliente) => (
                  <MenuItem key={cliente.Cliente} value={cliente.Cliente}>
                    {cliente.Cliente}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Origen</InputLabel>
              <Select
                value={origen}
                onChange={(e) => setOrigen(e.target.value)}
                label="Origen"
                disabled={!selectedCliente}
              >
                {sites.map((site) => (
                  <MenuItem key={site._id} value={site._id}>
                    {site.Site}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Destino</InputLabel>
              <Select
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                label="Destino"
                disabled={!selectedCliente}
              >
                {sites.map((site) => (
                  <MenuItem key={site._id} value={site._id}>
                    {site.Site}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Fecha"
                value={fecha}
                onChange={(newValue) => setFecha(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Cantidad de Palets"
              type="number"
              value={palets}
              onChange={(e) => setPalets(Math.max(1, parseInt(e.target.value) || 1))}
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCalcular}
              disabled={loading || !selectedCliente || !origen || !destino || !fecha}
              fullWidth
            >
              {loading ? 'Calculando...' : 'Calcular Tarifa'}
            </Button>
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}

          {resultado && (
            <Grid item xs={12}>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Resultado del cálculo:
                </Typography>
                <Grid container spacing={2}>
                  {/* Información de la ruta */}
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Ruta: {resultado.detalles?.origen} → {resultado.detalles?.destino}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Método de cálculo: {resultado.detalles?.metodoCalculo}
                      {resultado.detalles?.metodoCalculo === 'Kilometro' && 
                        ` (${resultado.detalles?.distancia} km)`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Tipo: {resultado.detalles?.tipo}
                    </Typography>
                  </Grid>
                  {/* Valores monetarios */}
                  <Grid item xs={6}>
                    <Typography variant="body1">
                      Tarifa base: ${resultado.tarifaBase?.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body1">
                      Peaje: ${resultado.peaje?.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="h6" color="primary">
                      Total: ${resultado.total?.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Container>
  );
};

export default CalcularTarifa;