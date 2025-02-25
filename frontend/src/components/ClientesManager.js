import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, CircularProgress, Alert
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Save as SaveIcon, Store as StoreIcon, AttachMoney as AttachMoneyIcon } from '@mui/icons-material';
import SitesManager from './SitesManager';
import TarifarioViewer from './TarifarioViewer';

const API_URL = process.env.REACT_APP_API_URL;

const ClientesManager = () => {
  const [clientes, setClientes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({ Cliente: '', CUIT: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [tarifarioOpen, setTarifarioOpen] = useState(false);
  const [selectedClienteTarifario, setSelectedClienteTarifario] = useState(null);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/clientes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener los clientes');
      }
      
      const data = await response.json();
      setClientes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching clientes:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/clientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Error al crear cliente');
      
      setFormData({ Cliente: '', CUIT: '' });
      setOpenDialog(false);
      fetchClientes();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleUpdate = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/clientes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Error al actualizar cliente');
      
      setFormData({ Cliente: '', CUIT: '' });
      setEditingClient(null);
      fetchClientes();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este cliente?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/clientes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Error al eliminar cliente');
      
      fetchClientes();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (selectedClient) {
    return <SitesManager cliente={selectedClient} onBack={() => setSelectedClient(null)} />;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <Alert severity="error" style={{ margin: '20px 0' }}>
        {error}
      </Alert>
    );
  }

  return (
    <div>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={() => setOpenDialog(true)}
        style={{ marginBottom: 20 }}
      >
        Nuevo Cliente
      </Button>

      {clientes.length === 0 ? (
        <Alert severity="info">No hay clientes registrados</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>CUIT</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clientes.map((cliente) => (
                <TableRow key={cliente._id}>
                  <TableCell>
                    {editingClient === cliente._id ? (
                      <TextField
                        value={formData.Cliente}
                        onChange={(e) => setFormData({ ...formData, Cliente: e.target.value })}
                      />
                    ) : (
                      cliente.Cliente
                    )}
                  </TableCell>
                  <TableCell>
                    {editingClient === cliente._id ? (
                      <TextField
                        value={formData.CUIT}
                        onChange={(e) => setFormData({ ...formData, CUIT: e.target.value })}
                      />
                    ) : (
                      cliente.CUIT
                    )}
                  </TableCell>
                  <TableCell>
                    {editingClient === cliente._id ? (
                      <IconButton onClick={() => handleUpdate(cliente._id)} color="primary">
                        <SaveIcon />
                      </IconButton>
                    ) : (
                      <>
                        <IconButton onClick={() => setSelectedClient(cliente.Cliente)} title="Gestionar Sites">
                          <StoreIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => {
                            setEditingClient(cliente._id);
                            setFormData({ Cliente: cliente.Cliente, CUIT: cliente.CUIT });
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(cliente._id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => {
                            setSelectedClienteTarifario(cliente.Cliente);
                            setTarifarioOpen(true);
                          }}
                          title="Ver Tarifario"
                        >
                          <AttachMoneyIcon />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Nuevo Cliente</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Nombre del Cliente"
              fullWidth
              variant="outlined"
              value={formData.Cliente}
              onChange={(e) => setFormData({ ...formData, Cliente: e.target.value })}
              required
            />
            <TextField
              margin="dense"
              label="CUIT"
              fullWidth
              variant="outlined"
              value={formData.CUIT}
              onChange={(e) => setFormData({ ...formData, CUIT: e.target.value })}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" color="primary">
              Guardar
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <TarifarioViewer
        open={tarifarioOpen}
        cliente={selectedClienteTarifario}
        onClose={() => {
          setTarifarioOpen(false);
          setSelectedClienteTarifario(null);
        }}
      />
    </div>
  );
};

export default ClientesManager;
