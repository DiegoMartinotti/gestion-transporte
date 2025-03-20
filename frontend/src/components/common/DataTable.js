/**
 * @module components/common/DataTable
 * @description Componente de tabla de datos reutilizable con funcionalidades avanzadas
 * como ordenamiento, filtrado y paginación. Implementa Material-UI y TanStack Table
 * para una experiencia de usuario óptima.
 */

import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Box,
  Typography
} from '@mui/material';
import {
  Sort as SortIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel, 
  getFilteredRowModel, 
  getPaginationRowModel,
  flexRender
} from '@tanstack/react-table';
import logger from '../../utils/logger';

/**
 * Componente de tabla de datos avanzada
 * 
 * @component
 * @example
 * const columns = [
 *   { id: 'nombre', header: 'Nombre', accessorKey: 'nombre' },
 *   { id: 'email', header: 'Email', accessorKey: 'email' }
 * ];
 * 
 * return (
 *   <DataTable
 *     columns={columns}
 *     rows={usuarios}
 *     loading={loading}
 *     onRefresh={() => fetchData()}
 *     getRowId={(row) => row.id}
 *     emptyMessage="No hay datos para mostrar"
 *   />
 * )
 */

const DataTable = ({
  columns,
  rows = [],
  loading = false,
  onRefresh,
  getRowId = (row) => row.id,
  emptyMessage = "No hay datos para mostrar"
}) => {
  // Estado para filtro global
  const [globalFilter, setGlobalFilter] = useState('');
  
  // Estado para la paginación
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  
  // Estado para ordenamiento
  const [sorting, setSorting] = useState([]);
  
  // Preparamos las columnas en el formato esperado por TanStack Table
  const tableColumns = useMemo(() => 
    columns.map(column => {
      // Asegurarnos de que cada columna tenga un id válido
      const id = column.id || column.field || column.accessorKey || String(Math.random());
      
      // Mapear el encabezado según la estructura de la columna
      let header = column.header || column.headerName || column.label || id;
      
      // Determinar el accessorKey (para acceder a los datos)
      const accessorKey = column.accessorKey || column.field || id;
      
      // Determinar la función de renderización de celda
      const cellRenderer = column.cell || column.renderCell;
      
      return {
        id: id,
        accessorKey: accessorKey,
        header: header,
        cell: info => {
          // Si hay una función personalizada para renderizar la celda, usarla
          if (cellRenderer) {
            return cellRenderer({
              row: info.row.original,
              value: info.getValue(),
              rowIndex: info.row.index
            });
          }
          // Si hay una función de formato, usarla
          else if (column.format) {
            return column.format(info.getValue(), info.row.original);
          }
          // Valor por defecto
          return info.getValue();
        },
        enableSorting: column.enableSorting !== false,
        meta: {
          align: column.align || 'left',
        }
      };
    })
  , [columns]);
  
  // Instancia de tabla
  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    state: {
      sorting,
      pagination,
      globalFilter,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => getRowId(row),
  });
  
  // Manejar cambio de página
  const handleChangePage = (_, newPage) => {
    table.setPageIndex(newPage);
  };
  
  // Manejar cambio de filas por página
  const handleChangeRowsPerPage = (event) => {
    const pageSize = parseInt(event.target.value, 10);
    table.setPageSize(pageSize);
  };
  
  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Barra superior con búsqueda y botones */}
      <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
        <TextField
          label="Buscar"
          variant="outlined"
          size="small"
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
        />
        
        {onRefresh && (
          <Tooltip title="Refrescar datos">
            <IconButton onClick={onRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      {/* Tabla principal */}
      <TableContainer>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" p={4}>
            <CircularProgress />
          </Box>
        ) : rows.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" p={4}>
            <Typography variant="body1" color="textSecondary">
              {emptyMessage}
            </Typography>
          </Box>
        ) : (
          <Table stickyHeader size="small">
            <TableHead>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableCell 
                      key={header.id}
                      align={header.column.columnDef.meta?.align || 'left'}
                      sx={{ 
                        fontWeight: 'bold',
                        cursor: header.column.getCanSort() ? 'pointer' : 'default'
                      }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() ? (
                        header.column.getIsSorted() === 'desc' ? ' 🔽' : ' 🔼'
                      ) : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableHead>
            <TableBody>
              {table.getRowModel().rows.map(row => (
                <TableRow key={row.id} hover>
                  {row.getVisibleCells().map(cell => (
                    <TableCell 
                      key={cell.id}
                      align={cell.column.columnDef.meta?.align || 'left'}
                    >
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
        )}
      </TableContainer>
      
      {/* Paginación */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={table.getFilteredRowModel().rows.length}
        rowsPerPage={table.getState().pagination.pageSize}
        page={table.getState().pagination.pageIndex}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      />
    </Paper>
  );
};

DataTable.propTypes = {
  columns: PropTypes.array.isRequired,
  rows: PropTypes.array,
  loading: PropTypes.bool,
  onRefresh: PropTypes.func,
  getRowId: PropTypes.func,
  emptyMessage: PropTypes.string
};

export default DataTable; 