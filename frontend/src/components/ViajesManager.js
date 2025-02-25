import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, CircularProgress, Alert,
  Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL;

const ViajesManager = () => {
  const [viajes, setViajes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingViaje, setEditingViaje] = useState(null);
  const [formData, setFormData] = useState({
    cliente: '',
    fecha: '',
    origen: '',
    destino: '',
    estado: 'Pendiente',
    observaciones: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchViajes();
    }
  }, [isAuthenticated]);

  const fetchViajes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/viajes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setViajes(response.data);
      setError(null);
    } catch (error) {
      console.error('Error al obtener viajes:', error);
      setError('Error al cargar los viajes');
    } finally {
      setLoading(false);
    }
  };

  // ... Implementar handleSubmit, handleUpdate, handleDelete similar a ClientesManager

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <div>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={() => setOpenDialog(true)}
        style={{ marginBottom: 20 }}
      >
        Nuevo Viaje
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Origen</TableCell>
              <TableCell>Destino</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {viajes.map((viaje) => (
              <TableRow key={viaje._id}>
                <TableCell>{viaje.cliente}</TableCell>
                <TableCell>{new Date(viaje.fecha).toLocaleDateString()}</TableCell>
                <TableCell>{viaje.origen}</TableCell>
                <TableCell>{viaje.destino}</TableCell>
                <TableCell>{viaje.estado}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(viaje)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(viaje._id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Implementar Dialog para crear/editar viajes */}
    </div>
  );
};

export default ViajesManager;
