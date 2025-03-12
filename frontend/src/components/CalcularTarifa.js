import React, { useState, useEffect, useRef } from 'react';
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
  Autocomplete,
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
  const [tramoNoVigente, setTramoNoVigente] = useState(false);

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
      console.log('Campos faltantes:', { selectedCliente, origen, destino, tipoTramo });
      return;
    }

    setLoading(true);
    setError(null);
    
    // Declarar las variables fuera del bloque try para que sean accesibles en catch
    let tramoAUsar = null;
    let usandoTramoNoVigente = false;
    
    try {
      console.log('Iniciando cálculo con tramos:', tramos);
      
      // Obtener los tramos disponibles para esta ruta
      const tramosDisponibles = tramos.filter(
        tramo => {
          console.log('Evaluando tramo:', tramo);
          return tramo.origen?._id === origen && 
                 tramo.destino?._id === destino && 
                 tramo.tipo === tipoTramo;
        }
      );

      console.log('Tramos disponibles encontrados:', tramosDisponibles);

      // Si no hay tramos disponibles, mostrar error
      if (tramosDisponibles.length === 0) {
        console.log('No se encontraron tramos. Datos de búsqueda:', {
          origen,
          destino,
          tipoTramo,
          tramosTotal: tramos.length
        });
        throw new Error('No se encontraron tramos para la ruta especificada');
      }

      // Buscar tramos vigentes
      const tramosVigentes = tramosDisponibles.filter(estaTramoVigente);
      console.log('Tramos vigentes:', tramosVigentes);
      
      // Determinar qué tramo usar
      if (tramosVigentes.length > 0) {
        // Usar el tramo vigente más reciente
        tramoAUsar = tramosVigentes.sort((a, b) => 
          dayjs(b.vigenciaHasta).diff(dayjs(a.vigenciaHasta))
        )[0];
        console.log('Usando tramo vigente:', tramoAUsar);
        usandoTramoNoVigente = false;
      } else {
        // Usar el tramo más reciente de todos (ordenados por fecha de vigencia descendente)
        tramoAUsar = tramosDisponibles.sort((a, b) => 
          dayjs(b.vigenciaHasta).diff(dayjs(a.vigenciaHasta))
        )[0];
        console.log('Usando tramo no vigente más reciente:', tramoAUsar);
        usandoTramoNoVigente = true;
      }

      const token = localStorage.getItem('token');
      
      // Verificar que tramoAUsar exista antes de construir la solicitud
      if (!tramoAUsar) {
        throw new Error('No se pudo determinar un tramo válido para la ruta especificada');
      }
      
      const requestData = {
        cliente: selectedCliente,
        origen,
        destino,
        fecha: dayjs().toISOString(),
        palets,
        tipoUnidad,
        tipoTramo,
        permitirTramoNoVigente: true,
        tramoId: tramoAUsar._id,
        esTramoNoVigente: usandoTramoNoVigente,
        vigenciaDesde: tramoAUsar.vigenciaDesde,
        vigenciaHasta: tramoAUsar.vigenciaHasta
      };
      
      console.log('Enviando solicitud al servidor:', requestData);

      const response = await axios.post('/api/tramos/calcular-tarifa', requestData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Respuesta del servidor:', response.data);

      if (response.data.success && response.data.data) {
        setResultado(response.data.data);
        setSelectedTramo(tramoAUsar);
        setTramoNoVigente(usandoTramoNoVigente);
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error) {
      console.error('Error completo:', error);
      let mensajeError = 'Error al calcular tarifa: ';
      
      // Determinar si el error está relacionado con tramos no vigentes
      if (error.response?.data?.message?.includes('vigente') || error.message?.includes('vigente')) {
        mensajeError += 'No se pudo aplicar el tramo no vigente. Por favor contacte a soporte técnico.';
        
        // Solo loguear la información del tramo si realmente existe
        if (tramoAUsar) {
          console.error('Se intentó usar un tramo no vigente pero fue rechazado:', {
            tramoId: tramoAUsar._id,
            vigenciaDesde: tramoAUsar.vigenciaDesde,
            vigenciaHasta: tramoAUsar.vigenciaHasta,
            permitirTramoNoVigente: true
          });
        } else {
          console.error('Error con tramo no vigente, pero no se encontró información del tramo');
        }
      } else {
        mensajeError += (error.response?.data?.message || error.message);
      }
      
      setError(mensajeError);
    } finally {
      setLoading(false);
    }
  };

  const handleOrigenChange = (event, newValue) => {
    setOrigen(newValue ? newValue._id : '');
    setDestino(''); // Limpiar el destino cuando cambia el origen
    setTiposDisponibles([]); // Limpiar tipos disponibles
    setTipoTramo(''); // Limpiar tipo seleccionado
  };

  // Función para verificar si un tramo está vigente
  const estaTramoVigente = (tramoEvaluar) => {
    const fechaActualUTC = dayjs().utc();
    const vigenciaDesdeTramo = dayjs.utc(tramoEvaluar.vigenciaDesde);
    const vigenciaHastaTramo = dayjs.utc(tramoEvaluar.vigenciaHasta);
    return (fechaActualUTC.isAfter(vigenciaDesdeTramo) || fechaActualUTC.isSame(vigenciaDesdeTramo, 'day')) && 
           (fechaActualUTC.isBefore(vigenciaHastaTramo) || fechaActualUTC.isSame(vigenciaHastaTramo, 'day'));
  };

  const handleDestinoChange = (event, newValue) => {
    const destinoId = newValue ? newValue._id : '';
    setDestino(destinoId);
    setTramoNoVigente(false); // Resetear el estado de advertencia
    
    if (origen && destinoId) {
      const tramosDisponibles = tramos.filter(
        tramo => tramo.origen?._id === origen && tramo.destino?._id === destinoId
      );
      
      if (tramosDisponibles.length > 0) {
        // Primero buscar tramos vigentes
        const tramosVigentes = tramosDisponibles.filter(estaTramoVigente);
        
        if (tramosVigentes.length > 0) {
          // Si hay tramos vigentes, usar el más reciente de ellos
          const tramoVigenteMasReciente = tramosVigentes.sort((a, b) => 
            dayjs(b.vigenciaHasta).diff(dayjs(a.vigenciaHasta))
          )[0];
          setSelectedTramo(tramoVigenteMasReciente);
          setTramoNoVigente(false);
          console.log('Preseleccionando tramo vigente:', tramoVigenteMasReciente);
        } else {
          // Si no hay tramos vigentes, usar el más reciente de todos
          const tramoMasReciente = tramosDisponibles.sort((a, b) => 
            dayjs(b.vigenciaHasta).diff(dayjs(a.vigenciaHasta))
          )[0];
          setSelectedTramo(tramoMasReciente);
          setTramoNoVigente(true);
          console.log('Preseleccionando tramo NO vigente:', tramoMasReciente);
        }
      }
      
      // Obtener tipos únicos
      const tiposUnicos = [...new Set(tramosDisponibles.map(tramo => tramo.tipo))];
      setTiposDisponibles(tiposUnicos);
      
      if (tiposUnicos.length > 0) {
        setTipoTramo(tiposUnicos[0]);
      } else {
        setTipoTramo('');
      }
    }
  };

  // Referencias para los componentes
  const destinoInputRef = useRef(null);
  const tipoTramoInputRef = useRef(null);

  // Función mejorada para manejar las teclas en Autocomplete
  const handleAutoCompleteKeyDown = (event, options, onChange, nextFieldRef) => {
    if (event.key === 'Tab' || event.key === 'Enter') {
      const listboxNode = document.querySelector('[role="listbox"]');
      if (!listboxNode) return;
      
      const highlightedOption = listboxNode.querySelector('[aria-selected="true"]');
      if (!highlightedOption) return;
      
      // Obtener el índice del elemento resaltado
      const highlightedIndex = Array.from(listboxNode.children).indexOf(highlightedOption);
      if (highlightedIndex === -1) return;

      // Obtener las opciones filtradas según el texto ingresado
      const inputValue = event.target.value.toLowerCase();
      const filteredOptions = options.filter(option => 
        option.Site.toLowerCase().includes(inputValue)
      );

      // Si hay una opción válida resaltada, seleccionarla
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        event.preventDefault();
        event.stopPropagation();
        
        // Seleccionar la opción
        onChange(event, filteredOptions[highlightedIndex]);

        // Si es Tab y hay un siguiente campo, mover el foco
        if (event.key === 'Tab' && nextFieldRef?.current) {
          setTimeout(() => {
            nextFieldRef.current.focus();
          }, 0);
        }
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
            <Autocomplete
              options={sites.sort((a, b) => a.Site.localeCompare(b.Site))}
              getOptionLabel={(option) => option.Site || ''}
              value={sites.find(site => site._id === origen) || null}
              onChange={handleOrigenChange}
              disabled={!selectedCliente}
              onKeyDown={(e) => handleAutoCompleteKeyDown(e, sites, handleOrigenChange, destinoInputRef)}
              blurOnSelect={false}
              selectOnFocus={true}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Origen"
                  fullWidth
                />
              )}
              isOptionEqualToValue={(option, value) => option._id === value._id}
              filterOptions={(options, { inputValue }) => 
                options.filter(option =>
                  option.Site.toLowerCase().includes(inputValue.toLowerCase())
                )
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              options={destinosDisponibles.sort((a, b) => a.Site.localeCompare(b.Site))}
              getOptionLabel={(option) => option.Site || ''}
              value={destinosDisponibles.find(site => site._id === destino) || null}
              onChange={handleDestinoChange}
              disabled={!origen || destinosDisponibles.length === 0}
              onKeyDown={(e) => handleAutoCompleteKeyDown(e, destinosDisponibles, handleDestinoChange, tipoTramoInputRef)}
              blurOnSelect={false}
              selectOnFocus={true}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Destino"
                  fullWidth
                  inputRef={destinoInputRef}
                />
              )}
              isOptionEqualToValue={(option, value) => option._id === value._id}
              filterOptions={(options, { inputValue }) => 
                options.filter(option =>
                  option.Site.toLowerCase().includes(inputValue.toLowerCase())
                )
              }
            />
          </Grid>

          {selectedTramo && (
            <Grid item xs={12}>
              <Alert severity={tramoNoVigente ? "warning" : "info"} 
                     icon={tramoNoVigente ? <span>⚠️</span> : undefined}
                     sx={{
                       '& .MuiAlert-icon': {
                         alignItems: 'center',
                         padding: tramoNoVigente ? '0 6px' : undefined
                       }
                     }}>
                {tramoNoVigente ? (
                  <>
                    <strong>Advertencia:</strong> No hay tramos vigentes para esta ruta. 
                    Se utilizará el tramo más reciente con vigencia desde {dayjs.utc(selectedTramo.vigenciaDesde).format('DD/MM/YYYY')} 
                    hasta {dayjs.utc(selectedTramo.vigenciaHasta).format('DD/MM/YYYY')}
                  </>
                ) : (
                  <>
                    Tarifa vigente desde {dayjs.utc(selectedTramo.vigenciaDesde).format('DD/MM/YYYY')} 
                    hasta {dayjs.utc(selectedTramo.vigenciaHasta).format('DD/MM/YYYY')}
                  </>
                )}
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
                inputRef={tipoTramoInputRef}
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
                    
                    {/* Mostrar información de vigencia de la tarifa */}
                    {selectedTramo && (
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 1, 
                          mt: 1, 
                          mb: 1, 
                          bgcolor: tramoNoVigente ? 'warning.light' : 'info.light',
                          borderLeft: tramoNoVigente ? '4px solid #ED6C02' : '4px solid #0288d1'
                        }}
                      >
                        <Typography variant="body2" fontWeight={500}>
                          {tramoNoVigente ? (
                            <span style={{color: '#ED6C02', fontWeight: 'bold'}}>
                              ⚠️ TARIFA NO VIGENTE
                            </span>
                          ) : (
                            <span style={{color: '#0288d1'}}>
                              Tarifa vigente
                            </span>
                          )}
                        </Typography>
                        <Typography variant="body2">
                          Fecha actual: {dayjs().utc().format('DD/MM/YYYY')}
                        </Typography>
                        <Typography variant="body2">
                          Vigencia: {dayjs.utc(selectedTramo.vigenciaDesde).format('DD/MM/YYYY')} 
                          {' '} al {' '}
                          {dayjs.utc(selectedTramo.vigenciaHasta).format('DD/MM/YYYY')}
                        </Typography>
                        {tramoNoVigente && (
                          <Typography variant="body2" color="warning.dark" sx={{ mt: 0.5 }}>
                            Esta tarifa está {
                              dayjs().utc().isBefore(dayjs.utc(selectedTramo.vigenciaDesde)) ? 
                                'pendiente de entrar en vigencia' : 
                                'vencida'
                            }.
                          </Typography>
                        )}
                      </Paper>
                    )}
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