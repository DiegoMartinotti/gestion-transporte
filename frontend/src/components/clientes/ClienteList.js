import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, IconButton, CircularProgress, Alert, Tooltip
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Store as StoreIcon, 
  AttachMoney as AttachMoneyIcon, 
  Functions as FunctionsIcon, 
  Add as AddIcon 
} from '@mui/icons-material';
import clienteService from '../../services/clienteService';
import useNotification from '../../hooks/useNotification';
import logger from '../../utils/logger';

/**
 * Componente para listar clientes con sus acciones disponibles
 * @param {Object} props
 * @param {Function} props.onEdit - Función al editar un cliente
 * @param {Function} props.onSites - Función al seleccionar sitios
 * @param {Function} props.onTarifario - Función al seleccionar tarifario
 * @param {Function} props.onFormulas - Función al editar fórmulas
 * @param {Function} props.onExtras - Función al gestionar extras
 */
const ClienteList = ({ 
  onEdit, 
  onSites, 
  onTarifario, 
  onFormulas,
  onExtras
}) => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchClientes();
  }, []);

  /**
   * Carga la lista de clientes desde la API
   */
  const fetchClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      logger.debug('Obteniendo clientes desde la API...');
      const data = await clienteService.getClientes();
      logger.debug('Datos recibidos de la API:', data);
      setClientes(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error('Error fetching clientes:', error);
      setError('Error al obtener los clientes');
      showNotification('Error al cargar la lista de clientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja la eliminación de un cliente
   * @param {string} id - ID del cliente a eliminar
   */
  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este cliente?')) return;
    
    try {
      await clienteService.deleteCliente(id);
      showNotification('Cliente eliminado correctamente', 'success');
      fetchClientes();
    } catch (error) {
      logger.error('Error al eliminar cliente:', error);
      showNotification('Error al eliminar el cliente', 'error');
    }
  };

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
        onClick={() => onEdit(null)}
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
                  <TableCell>{cliente.Cliente}</TableCell>
                  <TableCell>{cliente.CUIT}</TableCell>
                  <TableCell>
                    <Tooltip title="Gestionar Sites">
                      <IconButton onClick={() => onSites(cliente)}>
                        <StoreIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar cliente">
                      <IconButton onClick={() => onEdit(cliente)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar cliente">
                      <IconButton onClick={() => handleDelete(cliente._id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Ver Tarifario">
                      <IconButton onClick={() => onTarifario(cliente)}>
                        <AttachMoneyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar fórmulas de cálculo">
                      <IconButton onClick={() => onFormulas(cliente)} color="secondary">
                        <FunctionsIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Gestionar Extras">
                      <IconButton onClick={() => onExtras(cliente)} color="primary">
                        <AddIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
};

export default ClienteList; 