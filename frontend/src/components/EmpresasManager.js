import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, CircularProgress, Alert, Typography,
  Tooltip, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Save as SaveIcon, 
  DirectionsCar as VehiculoIcon, Person as PersonalIcon, Add as AddIcon,
  CloudUpload as UploadIcon } from '@mui/icons-material';
import logger from '../utils/logger';
import { useNavigate } from 'react-router-dom';
import PersonalBulkImporter from './PersonalBulkImporter';

const API_URL = process.env.REACT_APP_API_URL;

const EmpresasManager = () => {
  const [empresas, setEmpresas] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState(null);
  const [formData, setFormData] = useState({ 
    nombre: '', 
    tipo: 'Propia', 
    razonSocial: '',
    direccion: '',
    telefono: '',
    mail: '',
    cuit: '',
    contactoPrincipal: '',
    activa: true,
    observaciones: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openPersonalImporter, setOpenPersonalImporter] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const fetchEmpresas = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/empresas`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener las empresas');
      }
      
      const data = await response.json();
      setEmpresas(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error('Error fetching empresas:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/empresas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Error al crear empresa');
      
      setFormData({ 
        nombre: '', 
        tipo: 'Propia', 
        razonSocial: '',
        direccion: '',
        telefono: '',
        mail: '',
        cuit: '',
        contactoPrincipal: '',
        activa: true,
        observaciones: ''
      });
      setOpenDialog(false);
      fetchEmpresas();
    } catch (error) {
      logger.error('Error:', error);
    }
  };

  const handleUpdate = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/empresas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Error al actualizar empresa');
      
      setFormData({ 
        nombre: '', 
        tipo: 'Propia', 
        razonSocial: '',
        direccion: '',
        telefono: '',
        mail: '',
        cuit: '',
        contactoPrincipal: '',
        activa: true,
        observaciones: ''
      });
      setEditingEmpresa(null);
      setOpenDialog(false);
      fetchEmpresas();
    } catch (error) {
      logger.error('Error:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta empresa?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/empresas/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Error al eliminar empresa');
        
        fetchEmpresas();
      } catch (error) {
        logger.error('Error:', error);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    const val = name === 'activa' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleEdit = (empresa) => {
    setEditingEmpresa(empresa._id);
    setFormData({
      nombre: empresa.nombre,
      tipo: empresa.tipo,
      razonSocial: empresa.razonSocial || '',
      direccion: empresa.direccion || '',
      telefono: empresa.telefono || '',
      mail: empresa.mail || '',
      cuit: empresa.cuit || '',
      contactoPrincipal: empresa.contactoPrincipal || '',
      activa: empresa.activa,
      observaciones: empresa.observaciones || ''
    });
    setOpenDialog(true);
  };

  const handleOpenDialog = () => {
    setEditingEmpresa(null);
    setFormData({ 
      nombre: '', 
      tipo: 'Propia', 
      razonSocial: '',
      direccion: '',
      telefono: '',
      mail: '',
      cuit: '',
      contactoPrincipal: '',
      activa: true,
      observaciones: ''
    });
    setOpenDialog(true);
  };

  const handleGestionarVehiculos = (empresaId, empresaNombre) => {
    navigate(`/vehiculos/${empresaId}`, { state: { empresaNombre } });
  };

  const handleGestionarPersonal = (empresaId, empresaNombre) => {
    navigate(`/personal/${empresaId}`, { state: { empresaNombre } });
  };

  const handleOpenPersonalImporter = () => {
    setOpenPersonalImporter(true);
  };

  const handleClosePersonalImporter = () => {
    setOpenPersonalImporter(false);
  };

  const handlePersonalImportComplete = (result) => {
    logger.debug('Importación de personal completada:', result);
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Gestión de Empresas
      </Typography>
      
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          onClick={handleOpenDialog}
        >
          Nueva Empresa
        </Button>
        
        <Button 
          variant="outlined" 
          color="secondary" 
          startIcon={<UploadIcon />} 
          onClick={handleOpenPersonalImporter}
        >
          Importar Personal Masivamente
        </Button>
      </div>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>CUIT</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {empresas.map((empresa) => (
                <TableRow key={empresa._id}>
                  <TableCell>{empresa.nombre}</TableCell>
                  <TableCell>{empresa.tipo}</TableCell>
                  <TableCell>{empresa.cuit}</TableCell>
                  <TableCell>
                    {empresa.contactoPrincipal && (
                      <div><strong>Contacto:</strong> {empresa.contactoPrincipal}</div>
                    )}
                    {empresa.telefono && (
                      <div><strong>Tel:</strong> {empresa.telefono}</div>
                    )}
                    {empresa.mail && (
                      <div><strong>Email:</strong> {empresa.mail}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span style={{ 
                      color: empresa.activa ? 'green' : 'red',
                      fontWeight: 'bold'
                    }}>
                      {empresa.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleEdit(empresa)} color="primary">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton onClick={() => handleDelete(empresa._id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Gestionar Vehículos">
                      <IconButton 
                        onClick={() => handleGestionarVehiculos(empresa._id, empresa.nombre)} 
                        color="secondary"
                      >
                        <VehiculoIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Gestionar Personal">
                      <IconButton 
                        onClick={() => handleGestionarPersonal(empresa._id, empresa.nombre)} 
                        color="info"
                      >
                        <PersonalIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingEmpresa ? 'Editar Empresa' : 'Nueva Empresa'}</DialogTitle>
        <DialogContent>
          <form onSubmit={editingEmpresa ? () => handleUpdate(editingEmpresa) : handleSubmit}>
            <TextField
              margin="dense"
              name="nombre"
              label="Nombre de la Empresa"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.nombre}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel>Tipo de Empresa</InputLabel>
              <Select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                label="Tipo de Empresa"
                required
              >
                <MenuItem value="Propia">Propia</MenuItem>
                <MenuItem value="Subcontratada">Subcontratada</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              margin="dense"
              name="razonSocial"
              label="Razón Social"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.razonSocial}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              name="cuit"
              label="CUIT"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.cuit}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              name="direccion"
              label="Dirección"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.direccion}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              name="telefono"
              label="Teléfono"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.telefono}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              name="mail"
              label="Email"
              type="email"
              fullWidth
              variant="outlined"
              value={formData.mail}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              name="contactoPrincipal"
              label="Contacto Principal"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.contactoPrincipal}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.activa}
                  onChange={handleChange}
                  name="activa"
                  color="primary"
                />
              }
              label="Empresa Activa"
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
            onClick={editingEmpresa ? () => handleUpdate(editingEmpresa) : handleSubmit} 
            color="primary"
            startIcon={<SaveIcon />}
          >
            {editingEmpresa ? 'Actualizar' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <PersonalBulkImporter 
        open={openPersonalImporter}
        onClose={handleClosePersonalImporter}
        onComplete={handlePersonalImportComplete}
        empresas={empresas}
      />
    </div>
  );
};

export default EmpresasManager; 