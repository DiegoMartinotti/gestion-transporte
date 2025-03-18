import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button
} from '@mui/material';
import clienteService from '../../services/clienteService';
import useNotification from '../../hooks/useNotification';
import logger from '../../utils/logger';

/**
 * Componente para formulario de edición/creación de clientes
 * @param {Object} props
 * @param {boolean} props.open - Estado de apertura del diálogo
 * @param {Object} props.cliente - Cliente a editar (null para nuevo)
 * @param {Function} props.onClose - Función al cerrar el diálogo
 * @param {Function} props.onSave - Función al guardar cambios
 */
const ClienteForm = ({ open, cliente, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    Cliente: '',
    CUIT: '',
    formulaPaletSider: 'Valor * Palets + Peaje',
    formulaPaletBitren: 'Valor * Palets + Peaje'
  });
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    if (cliente) {
      setFormData({
        Cliente: cliente.Cliente || '',
        CUIT: cliente.CUIT || '',
        formulaPaletSider: cliente.formulaPaletSider || 'Valor * Palets + Peaje',
        formulaPaletBitren: cliente.formulaPaletBitren || 'Valor * Palets + Peaje'
      });
    } else {
      // Para nuevo cliente
      setFormData({
        Cliente: '',
        CUIT: '',
        formulaPaletSider: 'Valor * Palets + Peaje',
        formulaPaletBitren: 'Valor * Palets + Peaje'
      });
    }
  }, [cliente, open]);

  /**
   * Maneja el envío del formulario
   * @param {Event} e - Evento de formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (cliente) {
        // Actualizar cliente existente
        await clienteService.updateCliente(cliente._id, formData);
        showNotification('Cliente actualizado correctamente', 'success');
      } else {
        // Crear nuevo cliente
        await clienteService.createCliente(formData);
        showNotification('Cliente creado correctamente', 'success');
      }
      
      if (onSave) onSave();
      onClose();
    } catch (error) {
      logger.error('Error al guardar cliente:', error);
      showNotification('Error al guardar el cliente', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualiza el estado del formulario
   * @param {Object} e - Evento de cambio
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre del Cliente"
            name="Cliente"
            fullWidth
            variant="outlined"
            value={formData.Cliente}
            onChange={handleChange}
            required
          />
          <TextField
            margin="dense"
            label="CUIT"
            name="CUIT"
            fullWidth
            variant="outlined"
            value={formData.CUIT}
            onChange={handleChange}
            required
          />
          <TextField
            margin="dense"
            label="Fórmula para Palet (Sider)"
            name="formulaPaletSider"
            fullWidth
            variant="outlined"
            value={formData.formulaPaletSider}
            onChange={handleChange}
            helperText="Ejemplo: Valor * Palets + Peaje"
          />
          <TextField
            margin="dense"
            label="Fórmula para Palet (Bitren)"
            name="formulaPaletBitren"
            fullWidth
            variant="outlined"
            value={formData.formulaPaletBitren}
            onChange={handleChange}
            helperText="Ejemplo: SI(Palets>26;26+(Palets-26)*0,5;Palets)*Valor+Peaje"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            Guardar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ClienteForm; 