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
import dayjs from 'dayjs';

const CalcularTarifa = () => {
  const [clientes, setClientes] = useState([]);
  const [sites, setSites] = useState([]);
  const [destinosDisponibles, setDestinosDisponibles] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState('');
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [palets, setPalets] = useState(26);
  const [tipoUnidad, setTipoUnidad] = useState('Sider');
  const [tipoTramo, setTipoTramo] = useState('');
  const [tiposDisponibles, setTiposDisponibles] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tramos, setTramos] = useState([]);
  const [selectedTramo, setSelectedTramo] = useState(null);

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    if (selectedCliente) {
      fetchSites();
      fetchTramos();
    }
  }, [selectedCliente]);

  // Efecto para actualizar destinos disponibles cuando cambia el origen
  useEffect(() => {
    if (origen && tramos.length > 0) {
      const destinosFiltrados = tramos
        .filter(tramo => tramo.origen?._id === origen)
        .map(tramo => tramo.destino)
        .filter((destino, index, self) => 
          destino && index === self.findIndex(d => d._id === destino._id)
        );
      setDestinosDisponibles(destinosFiltrados);
      // Limpiar el destino seleccionado si ya no está en la lista de disponibles
      if (!destinosFiltrados.find(d => d._id === destino)) {
        setDestino('');
      }
    } else {
      setDestinosDisponibles([]);
      setDestino('');
    }
  }, [origen, tramos]);

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

  const fetchTramos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/tramos/cliente/${selectedCliente}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTramos(response.data.data || []);
    } catch (error) {
      setError('Error al cargar tramos: ' + error.message);
    }
  };

  const handleCalcular = async () => {
    if (!selectedCliente || !origen || !destino || !tipoTramo) {
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
        fecha: dayjs().toISOString(), // Use current date for calculation
        palets,
        tipoUnidad,
        tipoTramo
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

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

  const handleOrigenChange = (event) => {
    setOrigen(event.target.value);
    setDestino(''); // Limpiar el destino cuando cambia el origen
    setTiposDisponibles([]); // Limpiar tipos disponibles
    setTipoTramo(''); // Limpiar tipo seleccionado
  };

  const handleDestinoChange = (event) => {
    const destinoId = event.target.value;
    setDestino(destinoId);
    
    // Buscar todos los tramos para este par origen-destino y obtener sus tipos únicos
    if (origen && destinoId) {
      const tramosDisponibles = tramos.filter(
        tramo => tramo.origen?._id === origen && tramo.destino?._id === destinoId
      );
      
      // Obtener tipos únicos y el tramo más reciente
      const tiposUnicos = [...new Set(tramosDisponibles.map(tramo => tramo.tipo))];
      setTiposDisponibles(tiposUnicos);
      
      // Encontrar el tramo más reciente
      if (tramosDisponibles.length > 0) {
        const tramoMasReciente = tramosDisponibles.reduce((prev, current) => {
          return new Date(prev.vigenciaHasta) > new Date(current.vigenciaHasta) ? prev : current;
        });
        setSelectedTramo(tramoMasReciente);
      }
      
      // Siempre seleccionar el primer tipo disponible
      if (tiposUnicos.length > 0) {
        setTipoTramo(tiposUnicos[0]);
      } else {
        setTipoTramo('');
      }
    }
  };

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
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
                onChange={handleOrigenChange}
                label="Origen"
                disabled={!selectedCliente}
              >
                {sites.sort((a, b) => a.Site.localeCompare(b.Site)).map((site) => (
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
                onChange={handleDestinoChange}
                label="Destino"
                disabled={!origen || destinosDisponibles.length === 0}
              >
                {destinosDisponibles
                  .sort((a, b) => a.Site.localeCompare(b.Site))
                  .map((site) => (
                    <MenuItem key={site._id} value={site._id}>
                      {site.Site}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          {selectedTramo && (
            <Grid item xs={12}>
              <Alert severity="info">
                Tarifa vigente desde {dayjs.utc(selectedTramo.vigenciaDesde).format('DD/MM/YYYY')} hasta {dayjs.utc(selectedTramo.vigenciaHasta).format('DD/MM/YYYY')}
              </Alert>
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Unidad</InputLabel>
              <Select
                value={tipoUnidad}
                onChange={(e) => setTipoUnidad(e.target.value)}
                label="Tipo de Unidad"
              >
                <MenuItem value="Sider">Sider</MenuItem>
                <MenuItem value="Bitren">Bitren</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Tramo</InputLabel>
              <Select
                value={tipoTramo}
                onChange={(e) => setTipoTramo(e.target.value)}
                label="Tipo de Tramo"
                disabled={!origen || !destino || tiposDisponibles.length === 0}
              >
                {tiposDisponibles.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>
                    {tipo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
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
              disabled={loading || !selectedCliente || !origen || !destino || !tipoTramo}
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
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Ruta: {resultado.detalles?.origen} → {resultado.detalles?.destino}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Distancia: {resultado.detalles?.distancia} km
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Método de cálculo: {resultado.detalles?.metodoCalculo}
                      {resultado.detalles?.metodoCalculo === 'Kilometro' && 
                        ` (${resultado.detalles?.distancia} km)`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Tipo: {resultado.detalles?.tipo}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Unidad: {resultado.detalles?.tipoUnidad || tipoUnidad}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Valor base: ${formatMoney(resultado.detalles?.valor)} 
                      {resultado.detalles?.metodoCalculo === 'Kilometro' ? '/km' : 
                       resultado.detalles?.metodoCalculo === 'Palet' ? '/palet' : ''}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Valor peaje: ${formatMoney(resultado.detalles?.valorPeaje)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="h6" color="primary">
                      Total: ${formatMoney(resultado.total)}
                    </Typography>
                    {resultado.detalles?.distancia > 0 && (
                      <Typography variant="body1" color="text.secondary">
                        Valor por km: ${formatMoney(resultado.total / resultado.detalles.distancia)}
                      </Typography>
                    )}
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