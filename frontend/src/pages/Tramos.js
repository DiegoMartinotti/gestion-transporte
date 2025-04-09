import React, { useState, useEffect } from 'react';
import { 
  Container, Paper, Box, Typography, 
  FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Button, Grid, Alert
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import TramoList from '../components/tramos/TramoList';
import TramoForm from '../components/tramos/TramoForm';
import TramoBulkImporter from '../components/tramos/TramoBulkImporter';
import useNotification from '../hooks/useNotification';
import useAuth from '../hooks/useAuth';
import axios from 'axios';

const Tramos = () => {
  const [clientes, setClientes] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState('');
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [openImporter, setOpenImporter] = useState(false);
  const [selectedTramo, setSelectedTramo] = useState(null);
  const { showNotification } = useNotification();
  const { user } = useAuth();
  
  // Cargar clientes al iniciar
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        setLoadingClientes(true);
        // const token = localStorage.getItem('token'); // No necesario con cookies
        // if (!token) throw new Error('No hay token de autenticación'); // La cookie maneja esto
        
        const response = await axios.get('/api/clientes'); // Headers no necesarios
        
        setClientes(response.data);
      } catch (error) {
        console.error('Error al cargar clientes:', error);
        showNotification('Error al cargar los clientes', 'error');
      } finally {
        setLoadingClientes(false);
      }
    };
    
    fetchClientes();
  }, []);
  
  // Cargar sitios cuando se selecciona un cliente
  useEffect(() => {
    if (!selectedCliente) {
      setSites([]);
      return;
    }
    
    const fetchSites = async () => {
      try {
        setLoadingSites(true);
        // const token = localStorage.getItem('token'); // No necesario con cookies
        // if (!token) throw new Error('No hay token de autenticación'); // La cookie maneja esto
        
        const response = await axios.get(`/api/sites/cliente/${selectedCliente}`); // Headers no necesarios
        
        setSites(response.data || []);
      } catch (error) {
        console.error('Error al cargar sitios:', error);
        showNotification('Error al cargar los sitios', 'error');
      } finally {
        setLoadingSites(false);
      }
    };
    
    fetchSites();
  }, [selectedCliente, showNotification]);
  
  const handleClienteChange = (event) => {
    setSelectedCliente(event.target.value);
  };
  
  const handleOpenForm = (tramo = null) => {
    setSelectedTramo(tramo);
    setOpenForm(true);
  };
  
  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedTramo(null);
  };
  
  const handleSaveTramo = () => {
    showNotification('Tramo guardado correctamente', 'success');
    setOpenForm(false);
    setSelectedTramo(null);
    // El componente TramoList hará su propia recarga
  };
  
  const handleOpenImporter = () => {
    setOpenImporter(true);
  };
  
  const handleCloseImporter = () => {
    setOpenImporter(false);
  };
  
  const handleImportComplete = (result) => {
    const mensaje = `
      Importación completada: ${result.exitosos} tramos exitosos
      (${result.tramosCreados} creados, ${result.tramosActualizados} actualizados).
    `;
    showNotification(mensaje, 'success');
  };
  
  return (
    <Container maxWidth="xl">
      <Paper sx={{ p: 3, mt: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gestión de Tramos
        </Typography>
        
        <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="cliente-select-label">Cliente</InputLabel>
              <Select
                labelId="cliente-select-label"
                id="cliente-select"
                value={selectedCliente}
                label="Cliente"
                onChange={handleClienteChange}
                disabled={loadingClientes}
                startAdornment={
                  loadingClientes ? (
                    <Box display="flex" alignItems="center" mr={1}>
                      <CircularProgress size={20} />
                    </Box>
                  ) : null
                }
              >
                {clientes.map((cliente) => (
                  <MenuItem key={cliente._id} value={cliente._id}>
                    {cliente.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6} container justifyContent="flex-end">
            <Button
              variant="contained"
              color="secondary"
              startIcon={<CloudUploadIcon />}
              onClick={handleOpenImporter}
              disabled={!selectedCliente || loadingSites}
              sx={{ ml: 2 }}
            >
              Importación Masiva
            </Button>
          </Grid>
        </Grid>
        
        {loadingSites && (
          <Box display="flex" justifyContent="center" my={3}>
            <CircularProgress />
          </Box>
        )}
        
        {!selectedCliente ? (
          <Alert severity="info">
            Seleccione un cliente para gestionar sus tramos
          </Alert>
        ) : !loadingSites && sites.length === 0 ? (
          <Alert severity="warning">
            No hay sitios disponibles para este cliente. Debe crear sitios antes de poder crear tramos.
          </Alert>
        ) : (
          <TramoList 
            cliente={selectedCliente}
            onEdit={handleOpenForm}
            onAdd={() => handleOpenForm()}
          />
        )}
      </Paper>
      
      {/* Formulario para añadir/editar tramos */}
      <TramoForm
        open={openForm}
        onClose={handleCloseForm}
        onSave={handleSaveTramo}
        tramo={selectedTramo}
        cliente={selectedCliente}
        sites={sites}
      />
      
      {/* Importador masivo */}
      <TramoBulkImporter
        open={openImporter}
        onClose={handleCloseImporter}
        onComplete={handleImportComplete}
        cliente={selectedCliente}
        sites={sites}
      />
    </Container>
  );
};

export default Tramos; 