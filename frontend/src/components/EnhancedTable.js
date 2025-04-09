import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, TextField, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Button,
  Select, MenuItem
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import BulkUpload from './common/BulkUpload';
import logger from '../utils/logger';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateForInput = (dateString) => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const API_URL = process.env.REACT_APP_API_URL;

const EnhancedTable = () => {
  const [data, setData] = useState([]);
  const [editCell, setEditCell] = useState(null); // { rowId, field, value }
  const [editValue, setEditValue] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, row: null });
  const [clienteSites, setClienteSites] = useState([]);

  useEffect(() => {
    // const token = localStorage.getItem('token'); // No necesario con cookies
    fetch(`${API_URL}/api/viajes`, {
      headers: {
        // 'Authorization': `Bearer ${token}` // No necesario con cookies
      }
    })
      .then(res => res.json())
      .then(setData)
      .catch(logger.error);
  }, []);

  const columns = [
    { header: 'DT', accessorKey: 'dt' },
    { header: 'Cliente', accessorKey: 'cliente' },
    {
      header: 'Origen',
      accessorKey: 'origen',
      cell: ({ row }) => renderCell(row.original, 'origen', row.original.origen)
    },
    {
      header: 'Destino',
      accessorKey: 'destino',
      cell: ({ row }) => renderCell(row.original, 'destino', row.original.destino)
    },
    {
      header: 'Fecha',
      accessorKey: 'fecha',
      cell: ({ row }) => renderCell(row.original, 'fecha', row.original.fecha)
    },
    {
      header: 'Tarifa',
      accessorKey: 'tarifa',
      cell: ({ row }) => renderCell(row.original, 'tarifa', row.original.tarifa)
    },
    {
      header: 'Acciones',
      cell: ({ row }) => (
        <IconButton 
          onClick={() => setDeleteConfirm({ open: true, row: row.original })}
          size="small"
          color="error"
          title="Eliminar viaje"
        >
          <DeleteIcon />
        </IconButton>
      )
    }
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleClick = (row, field, value) => {
    // No permitir edición de dt y cliente
    if (field === 'dt' || field === 'cliente') return;
    
    const rowId = `${row.dt}_${row.cliente}`;
    setEditCell({ rowId, field, value });
    setEditValue(value);
  };

  const handleKeyDown = (e, row) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave(row);
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleSave = async (row) => {
    if (!editCell) return;

    try {
      // const token = localStorage.getItem('token'); // No necesario con cookies
      const updatedData = { [editCell.field]: editValue };

      // Si el campo es numérico, convertir a número
      if (['tarifa', 'demoras', 'operativos', 'estadias', 'paletas'].includes(editCell.field)) {
        updatedData[editCell.field] = Number(editValue);
      }
      // Si el campo es fecha, convertir a ISO
      else if (editCell.field === 'fecha') {
        updatedData[editCell.field] = new Date(editValue).toISOString();
      }

      const response = await fetch(
        `${API_URL}/api/viajes?dt=${encodeURIComponent(row.dt)}&cliente=${encodeURIComponent(row.cliente)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${token}` // No necesario con cookies
          },
          body: JSON.stringify(updatedData)
        }
      );

      if (!response.ok) throw new Error('Error al actualizar');

      const updatedRow = await response.json();
      setData(prev => prev.map(item => 
        item.dt === row.dt && item.cliente === row.cliente ? updatedRow : item
      ));
    } catch (error) {
      logger.error('Error:', error);
    } finally {
      setEditCell(null);
      setEditValue('');
    }
  };

  const handleCancel = () => {
    setEditCell(null);
    setEditValue('');
  };

  const handleBulkUploadComplete = (result) => {
    // Recargar los datos después de una carga masiva exitosa
    fetch(`${API_URL}/api/viajes`, {
      headers: {
        // 'Authorization': `Bearer ${localStorage.getItem('token')}` // No necesario con cookies
      }
    })
      .then(res => res.json())
      .then(setData)
      .catch(logger.error);
  };

  const handleDelete = async () => {
    if (!deleteConfirm.row) return;

    try {
      // const token = localStorage.getItem('token'); // No necesario con cookies
      const { dt, cliente } = deleteConfirm.row;

      const response = await fetch(
        `${API_URL}/api/viajes?dt=${encodeURIComponent(dt)}&cliente=${encodeURIComponent(cliente)}`,
        {
          method: 'DELETE',
          headers: {
            // 'Authorization': `Bearer ${token}`, // No necesario con cookies
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar');
      }

      // Actualizar la tabla eliminando el viaje
      setData(prev => prev.filter(item => 
        !(item.dt === dt && item.cliente === cliente)
      ));
      
      // Cerrar el diálogo solo si la eliminación fue exitosa
      setDeleteConfirm({ open: false, row: null });
    } catch (error) {
      logger.error('Error:', error);
      // Opcional: Mostrar el error al usuario
      alert('Error al eliminar el viaje: ' + error.message);
    }
  };

  const fetchSitesForCliente = async (cliente) => {
    try {
      // const token = localStorage.getItem('token'); // No necesario con cookies
      const response = await fetch(`${API_URL}/api/sites/cliente/${encodeURIComponent(cliente)}`, {
        headers: {
          // 'Authorization': `Bearer ${token}` // No necesario con cookies
        }
      });
      
      if (!response.ok) throw new Error('Error al obtener sites');
      
      const data = await response.json();
      setClienteSites(data);
    } catch (error) {
      logger.error('Error:', error);
    }
  };

  const handleSiteChange = async (e, row) => {
    const newValue = e.target.value;
    setEditValue(newValue);
    
    // Esperar a que se actualice el estado antes de guardar
    try {
      // const token = localStorage.getItem('token'); // No necesario con cookies
      const updatedData = { [editCell.field]: newValue };

      const response = await fetch(
        `${API_URL}/api/viajes?dt=${encodeURIComponent(row.dt)}&cliente=${encodeURIComponent(row.cliente)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${token}` // No necesario con cookies
          },
          body: JSON.stringify(updatedData)
        }
      );

      if (!response.ok) throw new Error('Error al actualizar');

      const updatedRow = await response.json();
      setData(prev => prev.map(item => 
        item.dt === row.dt && item.cliente === row.cliente ? updatedRow : item
      ));
      setEditCell(null);
    } catch (error) {
      logger.error('Error:', error);
    }
  };

  const renderCell = (row, field, value) => {
    const rowId = `${row.dt}_${row.cliente}`;
    const isEditing = editCell?.rowId === rowId && editCell?.field === field;

    if (field === 'dt' || field === 'cliente') {
      return value;
    }

    if (isEditing) {
      if (field === 'origen' || field === 'destino') {
        return (
          <Select
            value={editValue}
            onChange={(e) => handleSiteChange(e, row)}
            onClose={() => setEditCell(null)}
            fullWidth
            size="small"
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 300
                }
              }
            }}
          >
            {clienteSites.map((site) => (
              <MenuItem 
                key={site._id} 
                value={site.Site}
              >
                {site.Site}
              </MenuItem>
            ))}
          </Select>
        );
      }

      if (field === 'fecha') {
        return (
          <TextField
            type="date"
            value={formatDateForInput(value)}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleSave(row)}
            size="small"
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
          />
        );
      }

      return (
        <TextField
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, row)}
          size="small"
          autoFocus
          type={['tarifa', 'demoras', 'operativos', 'estadias', 'paletas'].includes(field) ? 'number' : 'text'}
          onBlur={() => handleSave(row)}
          fullWidth
        />
      );
    }

    return (
      <div
        onClick={() => {
          if (field === 'origen' || field === 'destino') {
            fetchSitesForCliente(row.cliente).then(() => {
              handleClick(row, field, value);
            });
          } else {
            handleClick(row, field, value);
          }
        }}
        style={{ cursor: 'pointer' }}
      >
        {field === 'fecha' ? formatDate(value) : value}
      </div>
    );
  };

  return (
    <>
      <BulkUpload onUploadComplete={handleBulkUploadComplete} />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableCell key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, row: null })}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          ¿Está seguro que desea eliminar este viaje?
          {deleteConfirm.row && (
            <div style={{ marginTop: '10px' }}>
              <strong>DT:</strong> {deleteConfirm.row.dt}<br />
              <strong>Cliente:</strong> {deleteConfirm.row.cliente}<br />
              <strong>Origen:</strong> {deleteConfirm.row.origen}<br />
              <strong>Destino:</strong> {deleteConfirm.row.destino}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteConfirm({ open: false, row: null })}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EnhancedTable;
