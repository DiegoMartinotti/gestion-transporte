/**
 * @module components/vehiculos/VehiculoList
 * @description Componente para mostrar la lista de vehículos en una tabla
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Typography,
  Box
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Componente que muestra una lista de vehículos en formato tabla
 * @component
 */
const VehiculoList = ({
  vehiculos,
  onEdit,
  onDelete,
  loading
}) => {
  // Función para formatear fechas
  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: es });
    } catch (error) {
      return '-';
    }
  };

  // Verificar si un documento está por vencer (menos de 30 días)
  const isPorVencer = (date) => {
    if (!date) return false;
    try {
      const vencimiento = new Date(date);
      const hoy = new Date();
      const diffTime = vencimiento - hoy;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 30;
    } catch (error) {
      return false;
    }
  };

  // Verificar si un documento está vencido
  const isVencido = (date) => {
    if (!date) return false;
    try {
      const vencimiento = new Date(date);
      const hoy = new Date();
      return vencimiento < hoy;
    } catch (error) {
      return false;
    }
  };

  // Renderizar estado del documento con color según vencimiento
  const renderEstadoDocumento = (date) => {
    if (!date) return <Chip size="small" label="Sin fecha" color="default" />;
    
    if (isVencido(date)) {
      return (
        <Tooltip title="Vencido">
          <Chip
            size="small"
            icon={<ErrorIcon />}
            label={formatDate(date)}
            color="error"
            variant="outlined"
          />
        </Tooltip>
      );
    }
    
    if (isPorVencer(date)) {
      return (
        <Tooltip title="Por vencer">
          <Chip
            size="small"
            label={formatDate(date)}
            color="warning"
            variant="outlined"
          />
        </Tooltip>
      );
    }
    
    return (
      <Tooltip title="Vigente">
        <Chip
          size="small"
          icon={<CheckCircleIcon />}
          label={formatDate(date)}
          color="success"
          variant="outlined"
        />
      </Tooltip>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>Cargando vehículos...</Typography>
      </Box>
    );
  }

  if (!vehiculos.length) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>No hay vehículos registrados.</Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell><strong>Dominio</strong></TableCell>
            <TableCell><strong>Tipo</strong></TableCell>
            <TableCell><strong>Marca/Modelo</strong></TableCell>
            <TableCell><strong>Seguro</strong></TableCell>
            <TableCell><strong>VTV</strong></TableCell>
            <TableCell><strong>Ruta</strong></TableCell>
            <TableCell><strong>Estado</strong></TableCell>
            <TableCell><strong>Acciones</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {vehiculos.map((vehiculo) => (
            <TableRow key={vehiculo._id}>
              <TableCell>{vehiculo.dominio}</TableCell>
              <TableCell>{vehiculo.tipo}</TableCell>
              <TableCell>
                {vehiculo.marca} {vehiculo.modelo} {vehiculo.año ? `(${vehiculo.año})` : ''}
              </TableCell>
              <TableCell>
                {renderEstadoDocumento(vehiculo.documentacion?.seguro?.vencimiento)}
              </TableCell>
              <TableCell>
                {renderEstadoDocumento(vehiculo.documentacion?.vtv?.vencimiento)}
              </TableCell>
              <TableCell>
                {renderEstadoDocumento(vehiculo.documentacion?.ruta?.vencimiento)}
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={vehiculo.activo ? "Activo" : "Inactivo"}
                  color={vehiculo.activo ? "primary" : "default"}
                  variant={vehiculo.activo ? "filled" : "outlined"}
                />
              </TableCell>
              <TableCell>
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={() => onEdit(vehiculo)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton size="small" onClick={() => onDelete(vehiculo)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

VehiculoList.propTypes = {
  vehiculos: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

VehiculoList.defaultProps = {
  loading: false
};

export default VehiculoList; 