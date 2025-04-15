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
import logger from '../utils/logger';

// Configurar axios para usar credenciales en todas las solicitudes
axios.defaults.withCredentials = true;

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
  const [metodoCalculo, setMetodoCalculo] = useState('');
  const [metodosCalculoDisponibles, setMetodosCalculoDisponibles] = useState([]);

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
      const response = await axios.get('/api/clientes', { withCredentials: true });
      setClientes(response.data);
    } catch (error) {
      setError('Error al cargar clientes: ' + error.message);
    }
  };

  const fetchSites = async () => {
    try {
      const response = await axios.get(`/api/sites?cliente=${selectedCliente}`, { withCredentials: true });
      setSites(response.data.data || []);
    } catch (error) {
      setError('Error al cargar sites: ' + error.message);
    }
  };

  const fetchTramos = async () => {
    try {
      const response = await axios.get(`/api/tramos/cliente/${selectedCliente}`, { withCredentials: true });
      setTramos(response.data.data || []);
    } catch (error) {
      setError('Error al cargar tramos: ' + error.message);
    }
  };

  // Función para actualizar métodos de cálculo disponibles
  const actualizarMetodosCalculo = (tramoSeleccionado) => {
    if (tramoSeleccionado && tramoSeleccionado.tarifasHistoricas && tramoSeleccionado.tarifasHistoricas.length > 0) {
      const metodos = [...new Set(tramoSeleccionado.tarifasHistoricas.map(tarifa => tarifa.metodoCalculo))];
      setMetodosCalculoDisponibles(metodos);
      
      // Si solo hay un método disponible, seleccionarlo automáticamente
      if (metodos.length === 1) {
        setMetodoCalculo(metodos[0]);
      } else if (metodos.length > 0 && tramoSeleccionado.tarifaActual) {
        // Si hay varios métodos y una tarifa actual, seleccionar su método
        setMetodoCalculo(tramoSeleccionado.tarifaActual.metodoCalculo || '');
      } else {
        setMetodoCalculo('');
      }
    } else {
      setMetodosCalculoDisponibles([]);
      setMetodoCalculo('');
    }
  };

  const handleCalcular = async () => {
    setLoading(true);
    setResultado(null);
    setError(null);

    if (!selectedCliente || !origen || !destino || !tipoTramo) {
      setError('Por favor complete todos los campos requeridos.');
      setLoading(false);
      return;
    }

    try {
      // Verificar que tenemos un tramo seleccionado con tarifa
      if (!selectedTramo || !selectedTramo.tarifaActual) {
        setError('No se encontró un tramo válido para esta ruta y tipo.');
        setLoading(false);
        return;
      }
      
      // Hacer la consulta con el tramo seleccionado y withCredentials para enviar cookies
      const response = await axios.post('/api/tramos/calcular-tarifa', {
        origen: origen,
        destino: destino,
        cliente: selectedCliente,
        fecha: dayjs().format('YYYY-MM-DD'),
        palets: palets,
        tipoUnidad: tipoUnidad,
        tipoTramo: tipoTramo,
        metodoCalculo: metodoCalculo,
        permitirTramoNoVigente: tramoNoVigente,
        tramoId: selectedTramo._id,
        tarifaHistoricaId: selectedTramo.tarifaActual._id
      }, { 
        withCredentials: true 
      });

      if (response.data.error) {
        setError(response.data.error);
      } else {
        // Crear una copia del objeto de respuesta y asegurarnos de que tenga el método de cálculo correcto
        const resultadoData = {
          ...response.data.data,
          tramo: selectedTramo,
          origen: sites.find(s => s._id === origen),
          destino: sites.find(s => s._id === destino)
        };
        
        // Si el método de cálculo en la respuesta es "No disponible", usar el seleccionado en la UI
        if (resultadoData.detalles && resultadoData.detalles.metodoCalculo === 'No disponible') {
          resultadoData.detalles.metodoCalculo = metodoCalculo;
        }
        
        setResultado(resultadoData);
      }
    } catch (error) {
      logger.error("Error al calcular tarifa:", error);
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOrigenChange = (event, newValue) => {
    setOrigen(newValue ? newValue._id : '');
    setDestino(''); // Limpiar el destino cuando cambia el origen
    setTiposDisponibles([]); // Limpiar tipos disponibles
    setTipoTramo(''); // Limpiar tipo seleccionado
    setMetodosCalculoDisponibles([]);
    setMetodoCalculo('');
  };

  // Función para verificar si un tramo está vigente
  const estaTramoVigente = (tramoEvaluar) => {
    if (!tramoEvaluar || !tramoEvaluar.tarifasHistoricas || tramoEvaluar.tarifasHistoricas.length === 0) return false;
    
    const hoy = dayjs();
    
    // Verificar si hay alguna tarifa vigente
    return tramoEvaluar.tarifasHistoricas.some(tarifa => {
      const vigenciaDesde = dayjs(tarifa.vigenciaDesde);
      const vigenciaHasta = dayjs(tarifa.vigenciaHasta);
      return hoy.isAfter(vigenciaDesde) && hoy.isBefore(vigenciaHasta);
    });
  };

  const handleDestinoChange = (event, newValue) => {
    setDestino(newValue ? newValue._id : '');
    
    // Buscar el tramo correspondiente
    if (newValue && origen) {
      const tramosCoincidentes = tramos.filter(tramo => 
        tramo.origen._id === origen && 
        tramo.destino._id === newValue._id
      );
      
      // Si hay tramos, seleccionar el que esté vigente
      if (tramosCoincidentes.length > 0) {
        // Filtrar primero los tipos de tramos disponibles
        const tiposDisponibles = [...new Set(tramosCoincidentes.flatMap(
          tramo => tramo.tarifasHistoricas.map(tarifa => tarifa.tipo)
        ))];
        setTiposDisponibles(tiposDisponibles);
        
        // Verificar si hay al menos un tramo vigente
        const tramosVigentes = tramosCoincidentes.filter(estaTramoVigente);
        
        if (tramosVigentes.length > 0) {
          // Seleccionar el primer tramo vigente
          const tramoSeleccionado = tramosVigentes[0];
          
          // Buscar una tarifa vigente en este tramo
          const hoy = dayjs();
          const tarifaVigente = tramoSeleccionado.tarifasHistoricas.find(tarifa => 
            hoy.isAfter(dayjs(tarifa.vigenciaDesde)) && 
            hoy.isBefore(dayjs(tarifa.vigenciaHasta))
          );
          
          setSelectedTramo({
            ...tramoSeleccionado,
            tarifaActual: tarifaVigente
          });
          setTramoNoVigente(false);
          
          // Actualizar métodos de cálculo disponibles
          actualizarMetodosCalculo(tramoSeleccionado);
          
          // Si solo hay un tipo de tramo disponible, seleccionarlo automáticamente
          if (tiposDisponibles.length === 1) {
            setTipoTramo(tiposDisponibles[0]);
          }
        } else {
          // No hay tramos vigentes, ordenar los tramos por fecha de vigencia (más reciente primero)
          const tramosOrdenados = [...tramosCoincidentes].sort((a, b) => {
            // Ordenar por la fecha de vigencia más reciente en las tarifas históricas
            const ultimaTarifaA = a.tarifasHistoricas.sort((t1, t2) => 
              dayjs(t2.vigenciaHasta).diff(dayjs(t1.vigenciaHasta))
            )[0];
            
            const ultimaTarifaB = b.tarifasHistoricas.sort((t1, t2) => 
              dayjs(t2.vigenciaHasta).diff(dayjs(t1.vigenciaHasta))
            )[0];
            
            return dayjs(ultimaTarifaB.vigenciaHasta).diff(dayjs(ultimaTarifaA.vigenciaHasta));
          });
          
          // Seleccionar el tramo más reciente
          const tramoSeleccionado = tramosOrdenados[0];
          
          // Ordenar las tarifas por fecha y seleccionar la más reciente
          const tarifasOrdenadas = [...tramoSeleccionado.tarifasHistoricas].sort((t1, t2) => 
            dayjs(t2.vigenciaHasta).diff(dayjs(t1.vigenciaHasta))
          );
          
          setSelectedTramo({
            ...tramoSeleccionado,
            tarifaActual: tarifasOrdenadas[0]
          });
          
          // Actualizar métodos de cálculo disponibles
          actualizarMetodosCalculo(tramoSeleccionado);
          
          setTramoNoVigente(true);
          setError('Advertencia: No hay tramos vigentes para esta ruta.');
          
          // Si solo hay un tipo de tramo disponible, seleccionarlo automáticamente
          if (tiposDisponibles.length === 1) {
            setTipoTramo(tiposDisponibles[0]);
          }
        }
      } else {
        setSelectedTramo(null);
        setTiposDisponibles([]);
        setTipoTramo('');
        setMetodosCalculoDisponibles([]);
        setMetodoCalculo('');
        setError('No hay tramos definidos para esta ruta.');
      }
    } else {
      setSelectedTramo(null);
      setTiposDisponibles([]);
      setTipoTramo('');
      setMetodosCalculoDisponibles([]);
      setMetodoCalculo('');
    }
  };

  const handleTipoTramoChange = (event) => {
    const nuevoTipo = event.target.value;
    setTipoTramo(nuevoTipo);
    
    // Si tenemos un tramo seleccionado, actualizar la tarifa actual
    if (selectedTramo && selectedTramo.tarifasHistoricas) {
      const hoy = dayjs();
      
      // Primero buscar las tarifas que coinciden con el tipo seleccionado
      const tarifasDelTipo = selectedTramo.tarifasHistoricas.filter(tarifa => 
        tarifa.tipo === nuevoTipo
      );
      
      // Ordenar por fecha de vigencia (más reciente primero)
      const tarifasOrdenadas = [...tarifasDelTipo].sort((a, b) => 
        dayjs(b.vigenciaHasta).diff(dayjs(a.vigenciaHasta))
      );

      // Log para depuración
      console.log(`Encontradas ${tarifasDelTipo.length} tarifas para el tipo ${nuevoTipo}`);
      console.log('Tarifas disponibles:', tarifasDelTipo);
      
      // Buscar primero una tarifa vigente del tipo seleccionado
      const tarifaVigente = tarifasDelTipo.find(tarifa => 
        hoy.isAfter(dayjs(tarifa.vigenciaDesde)) && 
        hoy.isBefore(dayjs(tarifa.vigenciaHasta))
      );
      
      if (tarifaVigente) {
        // Hay una tarifa vigente para este tipo
        console.log('Encontrada tarifa vigente:', tarifaVigente);
        setSelectedTramo({
          ...selectedTramo,
          tarifaActual: tarifaVigente
        });
        setTramoNoVigente(false);
        
        // Actualizar métodos de cálculo disponibles
        const metodos = [...new Set(tarifasDelTipo.map(tarifa => tarifa.metodoCalculo))];
        setMetodosCalculoDisponibles(metodos);
        
        // Si la tarifa vigente tiene un método de cálculo, seleccionarlo
        if (tarifaVigente.metodoCalculo) {
          setMetodoCalculo(tarifaVigente.metodoCalculo);
          console.log(`Seleccionado método de cálculo: ${tarifaVigente.metodoCalculo}`);
        } else if (metodos.length === 1) {
          setMetodoCalculo(metodos[0]);
          console.log(`Seleccionado único método disponible: ${metodos[0]}`);
        } else {
          setMetodoCalculo('');
        }
      } else {
        // No hay tarifa vigente, usar la más reciente
        if (tarifasOrdenadas.length > 0) {
          console.log('No hay tarifa vigente, usando la más reciente:', tarifasOrdenadas[0]);
          setSelectedTramo({
            ...selectedTramo,
            tarifaActual: tarifasOrdenadas[0]
          });
          setTramoNoVigente(true);
          setError('Advertencia: No hay tarifas vigentes para este tipo de tramo.');
          
          // Actualizar métodos de cálculo disponibles
          const metodos = [...new Set(tarifasOrdenadas.map(tarifa => tarifa.metodoCalculo))];
          setMetodosCalculoDisponibles(metodos);
          
          // Si la tarifa tiene un método de cálculo, seleccionarlo
          if (tarifasOrdenadas[0].metodoCalculo) {
            setMetodoCalculo(tarifasOrdenadas[0].metodoCalculo);
            console.log(`Seleccionado método de cálculo de tarifa no vigente: ${tarifasOrdenadas[0].metodoCalculo}`);
          } else if (metodos.length === 1) {
            setMetodoCalculo(metodos[0]);
            console.log(`Seleccionado único método disponible: ${metodos[0]}`);
          } else {
            setMetodoCalculo('');
          }
        } else {
          setError('No se encontró ninguna tarifa para este tipo de tramo.');
          setMetodosCalculoDisponibles([]);
          setMetodoCalculo('');
        }
      }
    }
  };

  // Nuevo handler para el cambio de método de cálculo
  const handleMetodoCalculoChange = (event) => {
    const nuevoMetodo = event.target.value;
    setMetodoCalculo(nuevoMetodo);
    console.log(`Método de cálculo cambiado a: ${nuevoMetodo}`);
    
    // Si tenemos un tramo seleccionado, buscar una tarifa que coincida con el método y tipo seleccionados
    if (selectedTramo && selectedTramo.tarifasHistoricas && tipoTramo) {
      const tarifasCoincidentes = selectedTramo.tarifasHistoricas.filter(tarifa => 
        tarifa.tipo === tipoTramo && 
        tarifa.metodoCalculo === nuevoMetodo
      );
      
      console.log(`Encontradas ${tarifasCoincidentes.length} tarifas con método ${nuevoMetodo} y tipo ${tipoTramo}`);
      
      if (tarifasCoincidentes.length > 0) {
        // Ordenar por fecha de vigencia (más reciente primero)
        const tarifasOrdenadas = [...tarifasCoincidentes].sort((a, b) => 
          dayjs(b.vigenciaHasta).diff(dayjs(a.vigenciaHasta))
        );
        
        // Verificar si hay alguna tarifa vigente
        const hoy = dayjs();
        const tarifaVigente = tarifasCoincidentes.find(tarifa => 
          hoy.isAfter(dayjs(tarifa.vigenciaDesde)) && 
          hoy.isBefore(dayjs(tarifa.vigenciaHasta))
        );
        
        if (tarifaVigente) {
          // Usar la tarifa vigente
          console.log('Encontrada tarifa vigente con el método seleccionado:', tarifaVigente);
          setSelectedTramo({
            ...selectedTramo,
            tarifaActual: tarifaVigente
          });
          setTramoNoVigente(false);
        } else {
          // Usar la tarifa más reciente
          console.log('No hay tarifa vigente con el método seleccionado, usando la más reciente:', tarifasOrdenadas[0]);
          setSelectedTramo({
            ...selectedTramo,
            tarifaActual: tarifasOrdenadas[0]
          });
          setTramoNoVigente(true);
          setError('Advertencia: No hay tarifas vigentes para este método de cálculo.');
        }
      }
    }
  };

  // Referencias para los componentes
  const destinoInputRef = useRef(null);
  const tipoTramoInputRef = useRef(null);
  const metodoCalculoInputRef = useRef(null);

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
        (option?.Site || option?.nombre || '').toLowerCase().includes(inputValue)
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Calcular Tarifa
          </Typography>

          <Button
            variant="outlined"
            onClick={() => window.history.back()}
            sx={{ width: 'auto' }}
          >
            Volver Atrás
          </Button>
        </Box>

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
              options={sites.sort((a, b) => (a?.Site || a?.nombre || '').localeCompare(b?.Site || b?.nombre || ''))}
              getOptionLabel={(option) => option.Site || option.nombre || ''}
              getOptionKey={(option) => option._id}
              value={sites.find(site => site._id === origen) || null}
              onChange={handleOrigenChange}
              disabled={!selectedCliente}
              onKeyDown={(e) => handleAutoCompleteKeyDown(e, sites, handleOrigenChange, destinoInputRef)}
              blurOnSelect={false}
              selectOnFocus={true}
              sx={{
                '& .MuiAutocomplete-listbox li': {
                  color: (theme) => theme.palette.text.primary,
                  backgroundColor: (theme) => theme.palette.background.paper,
                  padding: '6px 16px',
                }
              }}
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
                  (option?.Site || option?.nombre || '').toLowerCase().includes(inputValue.toLowerCase())
                )
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              options={destinosDisponibles.sort((a, b) => (a?.Site || a?.nombre || '').localeCompare(b?.Site || b?.nombre || ''))}
              getOptionLabel={(option) => option.Site || option.nombre || ''}
              getOptionKey={(option) => option._id}
              value={destinosDisponibles.find(site => site._id === destino) || null}
              onChange={handleDestinoChange}
              disabled={!origen || destinosDisponibles.length === 0}
              onKeyDown={(e) => handleAutoCompleteKeyDown(e, destinosDisponibles, handleDestinoChange, tipoTramoInputRef)}
              blurOnSelect={false}
              selectOnFocus={true}
              sx={{
                '& .MuiAutocomplete-listbox li': {
                  color: (theme) => theme.palette.text.primary,
                  backgroundColor: (theme) => theme.palette.background.paper,
                  padding: '6px 16px',
                }
              }}
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
                  (option?.Site || option?.nombre || '').toLowerCase().includes(inputValue.toLowerCase())
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
                    Se utilizará el tramo más reciente con vigencia desde {dayjs.utc(selectedTramo.tarifaActual?.vigenciaDesde).format('DD/MM/YYYY')} 
                    hasta {dayjs.utc(selectedTramo.tarifaActual?.vigenciaHasta).format('DD/MM/YYYY')}
                  </>
                ) : (
                  <>
                    Tarifa vigente desde {dayjs.utc(selectedTramo.tarifaActual?.vigenciaDesde).format('DD/MM/YYYY')} 
                    hasta {dayjs.utc(selectedTramo.tarifaActual?.vigenciaHasta).format('DD/MM/YYYY')}
                  </>
                )}
              </Alert>
            </Grid>
          )}

          <Grid item xs={12} md={4}>
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

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Tramo</InputLabel>
              <Select
                value={tipoTramo}
                onChange={handleTipoTramoChange}
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

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Método de Cálculo</InputLabel>
              <Select
                value={metodoCalculo}
                onChange={handleMetodoCalculoChange}
                label="Método de Cálculo"
                disabled={!origen || !destino || !tipoTramo || metodosCalculoDisponibles.length === 0}
                inputRef={metodoCalculoInputRef}
              >
                {metodosCalculoDisponibles.map((metodo) => (
                  <MenuItem key={metodo} value={metodo}>
                    {metodo}
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
              disabled={loading || !selectedCliente || !origen || !destino || !tipoTramo || !metodoCalculo}
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
                      Método de cálculo: {
                        resultado.detalles?.metodoCalculo !== 'No disponible' 
                          ? resultado.detalles?.metodoCalculo 
                          : metodoCalculo
                      }
                      {(resultado.detalles?.metodoCalculo === 'Kilometro' || metodoCalculo === 'Kilometro') && 
                        ` (${resultado.detalles?.distancia} km)`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Tipo: {resultado.detalles?.tipo || tipoTramo}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Unidad: {resultado.detalles?.tipoUnidad || tipoUnidad}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Valor base: ${formatMoney(resultado.detalles?.valor)} 
                      {(resultado.detalles?.metodoCalculo === 'Kilometro' || metodoCalculo === 'Kilometro') ? '/km' : 
                       (resultado.detalles?.metodoCalculo === 'Palet' || metodoCalculo === 'Palet') ? '/palet' : ''}
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
                          Vigencia: {dayjs.utc(selectedTramo.tarifaActual?.vigenciaDesde).format('DD/MM/YYYY')} 
                          {' '} al {' '}
                          {dayjs.utc(selectedTramo.tarifaActual?.vigenciaHasta).format('DD/MM/YYYY')}
                        </Typography>
                        {tramoNoVigente && (
                          <Typography variant="body2" color="warning.dark" sx={{ mt: 0.5 }}>
                            Esta tarifa está {
                              dayjs().utc().isBefore(dayjs.utc(selectedTramo.tarifaActual?.vigenciaDesde)) ? 
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