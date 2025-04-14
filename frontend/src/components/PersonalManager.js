import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, CircularProgress, Alert, Typography,
  Tooltip, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  Box
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Save as SaveIcon, 
  Add as AddIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import logger from '../utils/logger';
import PersonalBulkImporter from './PersonalBulkImporter';

const API_URL = process.env.REACT_APP_API_URL;

const PersonalManager = () => {
  const { empresaId } = useParams();
  const location = useLocation();
  const empresaNombre = location.state?.empresaNombre || 'Empresa';
  
  const [personal, setPersonal] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    tipo: 'Conductor',
    contacto: {
      telefono: '',
      email: ''
    },
    direccion: {
      calle: ''
    },
    documentacion: {
      licenciaConducir: {
        numero: ''
      }
    },
    activo: true,
    observaciones: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openImporter, setOpenImporter] = useState(false);

  useEffect(() => {
    fetchPersonal();
  }, [empresaId]);

  const fetchPersonal = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/personal?empresaId=${empresaId}`, {
        credentials: 'include',
        headers: {
          // 'Authorization': `Bearer ${token}` // No necesario con cookies
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener el personal');
      }
      
      const data = await response.json();
      setPersonal(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error('Error fetching personal:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Asegurarse de que la empresa esté incluida en los datos
      const personalData = {
        ...formData,
        empresa: empresaId
      };
      
      // Asegurarse de que hay un período de empleo
      if (!personalData.periodosEmpleo || personalData.periodosEmpleo.length === 0) {
        personalData.periodosEmpleo = [{
          fechaIngreso: new Date(),
          categoria: 'Inicial'
        }];
      }
      
      const response = await fetch(`${API_URL}/api/personal`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}` // No necesario con cookies
        },
        body: JSON.stringify(personalData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear personal');
      }
      
      resetForm();
      setOpenDialog(false);
      fetchPersonal();
    } catch (error) {
      logger.error('Error:', error);
      setError(error.message);
    }
  };

  const handleUpdate = async (id) => {
    try {
      // Asegurarse de que la empresa esté incluida en los datos
      const personalData = {
        ...formData,
        empresa: empresaId
      };
      
      const response = await fetch(`${API_URL}/api/personal/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}` // No necesario con cookies
        },
        body: JSON.stringify(personalData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar personal');
      }
      
      resetForm();
      setEditingPersonal(null);
      setOpenDialog(false);
      fetchPersonal();
    } catch (error) {
      logger.error('Error:', error);
      setError(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este personal?')) {
      try {
        const response = await fetch(`${API_URL}/api/personal/${id}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            // 'Authorization': `Bearer ${token}` // No necesario con cookies
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al eliminar personal');
        }
        
        fetchPersonal();
      } catch (error) {
        logger.error('Error:', error);
        setError(error.message);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    
    // Manejar campos anidados
    if (name.includes('.')) {
      const parts = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current = newData;
        
        // Navegar a través de la estructura anidada
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        
        // Establecer el valor en el campo más profundo
        current[parts[parts.length - 1]] = name.endsWith('activo') ? checked : value;
        return newData;
      });
    } else {
      // Manejar campos simples
      const val = name === 'activo' ? checked : value;
      setFormData(prev => ({ ...prev, [name]: val }));
    }
  };

  const handleEdit = (persona) => {
    setEditingPersonal(persona._id);
    
    // Preparar los datos para el formulario
    const formattedData = {
      nombre: persona.nombre || '',
      apellido: persona.apellido || '',
      dni: persona.dni || '',
      tipo: persona.tipo || 'Conductor',
      contacto: {
        telefono: persona.contacto?.telefono || '',
        email: persona.contacto?.email || ''
      },
      direccion: {
        calle: persona.direccion?.calle || ''
      },
      documentacion: {
        licenciaConducir: {
          numero: persona.documentacion?.licenciaConducir?.numero || ''
        }
      },
      activo: persona.activo !== undefined ? persona.activo : true,
      observaciones: persona.observaciones || ''
    };
    
    setFormData(formattedData);
    setOpenDialog(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      dni: '',
      tipo: 'Conductor',
      contacto: {
        telefono: '',
        email: ''
      },
      direccion: {
        calle: ''
      },
      documentacion: {
        licenciaConducir: {
          numero: ''
        }
      },
      activo: true,
      observaciones: ''
    });
  };

  const handleOpenDialog = () => {
    setEditingPersonal(null);
    resetForm();
    setOpenDialog(true);
  };

  const handleOpenImporter = () => {
    setOpenImporter(true);
  };

  const handleCloseImporter = () => {
    setOpenImporter(false);
  };

  const handleImportComplete = (result) => {
    logger.debug('Importación de personal completada:', result);
    fetchPersonal();
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Personal de {empresaNombre}
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          onClick={handleOpenDialog}
        >
          Nuevo Personal
        </Button>
        
        <Button 
          variant="outlined" 
          color="secondary" 
          startIcon={<UploadIcon />} 
          onClick={handleOpenImporter}
        >
          Importar Personal Masivamente
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Apellido</TableCell>
                <TableCell>DNI</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Licencia</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {personal.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No hay personal registrado para esta empresa
                  </TableCell>
                </TableRow>
              ) : (
                personal.map((persona) => (
                  <TableRow key={persona._id}>
                    <TableCell>{persona.nombre}</TableCell>
                    <TableCell>{persona.apellido}</TableCell>
                    <TableCell>{persona.dni}</TableCell>
                    <TableCell>{persona.tipo}</TableCell>
                    <TableCell>
                      {persona.contacto?.telefono && (
                        <div><strong>Tel:</strong> {persona.contacto.telefono}</div>
                      )}
                      {persona.contacto?.email && (
                        <div><strong>Email:</strong> {persona.contacto.email}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {persona.documentacion?.licenciaConducir?.numero || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span style={{ 
                        color: persona.activo ? 'green' : 'red',
                        fontWeight: 'bold'
                      }}>
                        {persona.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Editar">
                        <IconButton onClick={() => handleEdit(persona)} color="primary">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton onClick={() => handleDelete(persona._id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingPersonal ? 'Editar Personal' : 'Nuevo Personal'}</DialogTitle>
        <DialogContent>
          <form onSubmit={editingPersonal ? () => handleUpdate(editingPersonal) : handleSubmit}>
            <TextField
              margin="dense"
              name="nombre"
              label="Nombre"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.nombre}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              name="apellido"
              label="Apellido"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.apellido}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              name="dni"
              label="DNI"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.dni}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel>Tipo de Personal</InputLabel>
              <Select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                label="Tipo de Personal"
                required
              >
                <MenuItem value="Conductor">Conductor</MenuItem>
                <MenuItem value="Administrativo">Administrativo</MenuItem>
                <MenuItem value="Mecánico">Mecánico</MenuItem>
                <MenuItem value="Supervisor">Supervisor</MenuItem>
                <MenuItem value="Otro">Otro</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              margin="dense"
              name="contacto.telefono"
              label="Teléfono"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.contacto.telefono}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              name="contacto.email"
              label="Email"
              type="email"
              fullWidth
              variant="outlined"
              value={formData.contacto.email}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              name="direccion.calle"
              label="Dirección"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.direccion.calle}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              name="documentacion.licenciaConducir.numero"
              label="Licencia de Conducir"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.documentacion.licenciaConducir.numero}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.activo}
                  onChange={handleChange}
                  name="activo"
                  color="primary"
                />
              }
              label="Personal Activo"
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              name="observaciones"
              label="Observaciones"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.observaciones}
              onChange={handleChange}
              multiline
              rows={4}
              sx={{ mb: 2 }}
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="secondary">
            Cancelar
          </Button>
          <Button 
            onClick={editingPersonal ? () => handleUpdate(editingPersonal) : handleSubmit} 
            color="primary"
            startIcon={<SaveIcon />}
          >
            {editingPersonal ? 'Actualizar' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <PersonalBulkImporter 
        open={openImporter}
        onClose={handleCloseImporter}
        onComplete={handleImportComplete}
        empresas={[{ _id: empresaId, nombre: empresaNombre }]}
      />
    </div>
  );
};

export default PersonalManager; 