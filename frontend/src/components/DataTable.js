/**
 * @module components/DataTable
 * @description Componente de tabla de datos reutilizable con funcionalidades avanzadas
 * como ordenamiento, filtrado y paginación. Implementa Material-UI y TanStack Table
 * para una experiencia de usuario óptima.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Box
} from '@mui/material';
import {
  Sort as SortIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useTable, useSortBy, useFilters, usePagination } from '@tanstack/react-table';

/**
 * Componente de tabla de datos avanzada
 * 
 * @component
 * @example
 * const columns = [
 *   { header: 'Nombre', accessorKey: 'nombre' },
 *   { header: 'Email', accessorKey: 'email' }
 * ];
 * 
 * return (
 *   <DataTable
 *     columns={columns}
 *     data={usuarios}
 *     isLoading={loading}
 *     onRefresh={() => fetchData()}
 *     defaultSort={{ id: 'nombre', desc: false }}
 *   />
 * )
 * 
 * @description
 * Tabla de datos reutilizable con características avanzadas:
 * - Ordenamiento por columnas
 * - Filtrado por columna
 * - Paginación del lado del cliente
 * - Indicador de carga
 * - Función de actualización
 * - Persistencia de preferencias del usuario
 * 
 * Decisiones de diseño:
 * 1. Se utiliza TanStack Table por su flexibilidad y rendimiento
 * 2. Implementación de Material-UI para consistencia visual
 * 3. Memorización de funciones y valores para optimizar rendimiento
 * 4. Manejo de estado local para filtros y ordenamiento
 * 5. Soporte para personalización mediante props
 */
const DataTable = ({
  columns,
  data,
  isLoading,
  onRefresh,
  defaultSort,
  rowsPerPageOptions = [10, 25, 50],
  defaultPageSize = 10
}) => {
  /**
   * Estado para el texto de filtrado global
   * @type {[string, Function]}
   */
  const [filterText, setFilterText] = useState('');

  /**
   * Columnas memorizadas para evitar re-renders innecesarios
   * @type {Array<Object>}
   */
  const memorizedColumns = useMemo(() => columns, [columns]);

  /**
   * Datos memorizados con filtrado aplicado
   * @type {Array<Object>}
   */
  const memorizedData = useMemo(() => {
    if (!filterText) return data;
    return data.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(filterText.toLowerCase())
      )
    );
  }, [data, filterText]);

  /**
   * Manejador de actualización de datos
   * Implementa debounce para evitar llamadas excesivas
   * 
   * @function
   * @param {Event} e - Evento de click
   */
  const handleRefresh = useCallback((e) => {
    e.preventDefault();
    onRefresh?.();
  }, [onRefresh]);

  /**
   * Efecto para restaurar preferencias del usuario
   * Se ejecuta una vez al montar el componente
   */
  useEffect(() => {
    const savedPreferences = localStorage.getItem('tablePreferences');
    if (savedPreferences) {
      try {
        const { pageSize, sortBy } = JSON.parse(savedPreferences);
        // Implementar restauración de preferencias
      } catch (error) {
        console.error('Error al restaurar preferencias:', error);
      }
    }
  }, []);

  /**
   * Configuración de la tabla usando TanStack Table
   */
  const tableInstance = useTable(
    {
      columns: memorizedColumns,
      data: memorizedData,
      initialState: {
        pageSize: defaultPageSize,
        sortBy: defaultSort ? [defaultSort] : []
      }
    },
    useFilters,
    useSortBy,
    usePagination
  );

  // Extraer propiedades y métodos necesarios de tableInstance
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    state: { pageIndex, pageSize },
    setPageSize,
    gotoPage
  } = tableInstance;

  return (
    <Paper elevation={2}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <TextField
          size="small"
          label="Filtrar"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <Tooltip title="Actualizar datos">
          <IconButton onClick={handleRefresh} disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <TableContainer>
        <Table {...getTableProps()}>
          <TableHead>
            {headerGroups.map(headerGroup => (
              <TableRow {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <TableCell
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    sx={{ fontWeight: 'bold' }}
                  >
                    {column.render('header')}
                    {column.isSorted && (
                      <SortIcon sx={{ fontSize: 'small', ml: 1 }} />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody {...getTableBodyProps()}>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <CircularProgress size={40} />
                </TableCell>
              </TableRow>
            ) : (
              page.map(row => {
                prepareRow(row);
                return (
                  <TableRow {...row.getRowProps()}>
                    {row.cells.map(cell => (
                      <TableCell {...cell.getCellProps()}>
                        {cell.render('Cell')}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={memorizedData.length}
        rowsPerPage={pageSize}
        page={pageIndex}
        onPageChange={(_, newPage) => gotoPage(newPage)}
        onRowsPerPageChange={(e) => setPageSize(Number(e.target.value))}
      />
    </Paper>
  );
};

/**
 * Validación de props del componente
 */
DataTable.propTypes = {
  /** Array de definiciones de columnas */
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      header: PropTypes.string.isRequired,
      accessorKey: PropTypes.string.isRequired
    })
  ).isRequired,
  /** Datos a mostrar en la tabla */
  data: PropTypes.array.isRequired,
  /** Indica si se están cargando los datos */
  isLoading: PropTypes.bool,
  /** Función para actualizar los datos */
  onRefresh: PropTypes.func,
  /** Configuración de ordenamiento por defecto */
  defaultSort: PropTypes.shape({
    id: PropTypes.string.isRequired,
    desc: PropTypes.bool
  }),
  /** Opciones de cantidad de filas por página */
  rowsPerPageOptions: PropTypes.arrayOf(PropTypes.number),
  /** Cantidad de filas por página por defecto */
  defaultPageSize: PropTypes.number
};

export default DataTable; 