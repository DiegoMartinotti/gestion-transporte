import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Box,
  Typography,
  Toolbar,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  GetApp as DownloadIcon,
} from '@mui/icons-material';

/**
 * Componente de tabla reutilizable con funcionalidades de ordenación, paginación y búsqueda
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.columns - Definición de columnas (array de objetos con id, label, align, format)
 * @param {Array} props.data - Datos a mostrar en la tabla
 * @param {string} props.title - Título de la tabla
 * @param {boolean} props.enableSearch - Habilitar búsqueda
 * @param {boolean} props.enableDownload - Habilitar descarga
 * @param {boolean} props.enableFilters - Habilitar filtros
 * @param {Function} props.onRowClick - Función a ejecutar al hacer clic en una fila
 * @returns {React.Component} Componente de tabla
 */
const Table = ({
  columns,
  data,
  title,
  enableSearch = true,
  enableDownload = false,
  enableFilters = false,
  onRowClick = null,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');

  // Función para ordenar datos
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Función para cambiar de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Función para cambiar el número de filas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Función para manejar la búsqueda
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Función para comparar valores al ordenar
  const descendingComparator = (a, b, orderBy) => {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  };

  // Función para obtener el comparador según la dirección de ordenación
  const getComparator = (order, orderBy) => {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };

  // Función para filtrar los datos según el término de búsqueda
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter((row) => {
      return Object.keys(row).some((key) => {
        const value = row[key];
        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm]);

  // Ordenar y paginar los datos
  const sortedData = useMemo(() => {
    if (!orderBy) return filteredData;
    
    return [...filteredData].sort(getComparator(order, orderBy));
  }, [filteredData, order, orderBy]);

  // Datos paginados
  const paginatedData = useMemo(() => {
    return sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sortedData, page, rowsPerPage]);

  // Renderizar la tabla vacía
  if (data.length === 0) {
    return (
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 } }}>
          <Typography
            sx={{ flex: '1 1 100%' }}
            variant="h6"
            id="tableTitle"
            component="div"
          >
            {title}
          </Typography>
        </Toolbar>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <Typography variant="body1" color="text.secondary">
            No hay datos disponibles
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 } }}>
        <Typography
          sx={{ flex: '1 1 100%' }}
          variant="h6"
          id="tableTitle"
          component="div"
        >
          {title}
        </Typography>

        {enableSearch && (
          <TextField
            size="small"
            variant="outlined"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mr: 2, width: '240px' }}
          />
        )}

        {enableFilters && (
          <Tooltip title="Filtrar lista">
            <IconButton>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        )}

        {enableDownload && (
          <Tooltip title="Descargar">
            <IconButton>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>

      <TableContainer>
        <MuiTable sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size="medium">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sortDirection={orderBy === column.id ? order : false}
                  sx={{ fontWeight: 'bold' }}
                >
                  <TableSortLabel
                    active={orderBy === column.id}
                    direction={orderBy === column.id ? order : 'asc'}
                    onClick={() => handleRequestSort(column.id)}
                  >
                    {column.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row, index) => {
              return (
                <TableRow
                  hover
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  tabIndex={-1}
                  key={`row-${index}`}
                  sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((column) => {
                    const value = row[column.id];
                    return (
                      <TableCell key={`cell-${column.id}-${index}`} align={column.align || 'left'}>
                        {column.format ? column.format(value, row) : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </MuiTable>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      />
    </Paper>
  );
};

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      align: PropTypes.oneOf(['left', 'right', 'center']),
      format: PropTypes.func,
    })
  ).isRequired,
  data: PropTypes.array.isRequired,
  title: PropTypes.string,
  enableSearch: PropTypes.bool,
  enableDownload: PropTypes.bool,
  enableFilters: PropTypes.bool,
  onRowClick: PropTypes.func,
};

export default Table; 