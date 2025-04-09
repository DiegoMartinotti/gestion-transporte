import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Tooltip, Typography, Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Componente que muestra una lista de fórmulas personalizadas
 * @param {Object} props
 * @param {Array} props.formulas - Lista de fórmulas a mostrar
 * @param {string} props.tipoUnidad - Tipo de unidad seleccionado
 * @param {Function} props.onEdit - Función para editar una fórmula
 * @param {Function} props.onDelete - Función para eliminar una fórmula
 */
const FormulasList = ({ formulas, tipoUnidad, onEdit, onDelete }) => {
  // Ordenar fórmulas por fecha de vigencia (más recientes primero)
  const sortedFormulas = [...formulas].sort((a, b) => {
    return new Date(b.vigenciaDesde) - new Date(a.vigenciaDesde);
  });

  // Formatear fecha en español
  const formatDate = (dateString) => {
    if (!dateString) return 'Indefinida';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Mostrar mensaje si no hay fórmulas
  if (formulas.length === 0) {
    return (
      <Alert severity="info">
        No hay fórmulas personalizadas para {tipoUnidad}. Cree una nueva fórmula utilizando el botón superior.
      </Alert>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Estado</TableCell>
            <TableCell>Fórmula</TableCell>
            <TableCell>Vigencia Desde</TableCell>
            <TableCell>Vigencia Hasta</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedFormulas.map((formula) => {
            // Determinar si la fórmula está activa actualmente
            const now = new Date();
            const isActive = new Date(formula.vigenciaDesde) <= now && 
              (!formula.vigenciaHasta || new Date(formula.vigenciaHasta) >= now);
            
            // Determinar si la fórmula es futura
            const isFuture = new Date(formula.vigenciaDesde) > now;
            
            // Determinar el estado para mostrar
            let estadoLabel = 'Histórica';
            let estadoColor = 'text.secondary';
            
            if (isActive) {
              estadoLabel = 'Activa';
              estadoColor = 'success.main';
            } else if (isFuture) {
              estadoLabel = 'Pendiente';
              estadoColor = 'info.main';
            }
            
            return (
              <TableRow key={formula._id}>
                <TableCell>
                  <Typography color={estadoColor} fontWeight={isActive ? 'bold' : 'normal'}>
                    {estadoLabel}
                  </Typography>
                </TableCell>
                <TableCell>{formula.formula}</TableCell>
                <TableCell>{formatDate(formula.vigenciaDesde)}</TableCell>
                <TableCell>{formatDate(formula.vigenciaHasta)}</TableCell>
                <TableCell>
                  <Tooltip title="Editar fórmula">
                    <IconButton onClick={() => onEdit(formula)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar fórmula">
                    <IconButton onClick={() => onDelete(formula._id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default FormulasList; 