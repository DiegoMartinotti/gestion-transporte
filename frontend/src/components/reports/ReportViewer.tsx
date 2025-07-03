import React, { useState, useMemo } from 'react';
import {
  Title,
  Group,
  Button,
  Stack,
  Grid,
  Card,
  Text,
  Table,
  ScrollArea,
  Badge,
  ActionIcon,
  Loader,
  Tabs,
  Select,
  Pagination,
  Tooltip,
  Menu,
  Modal,
  TextInput,
  Box,
  Center,
  Container,
  Skeleton
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconTable,
  IconDownload,
  IconRefresh,
  IconSettings,
  IconMaximize,
  IconDots,
  IconSearch,
  IconSortAscending,
  IconSortDescending,
  IconFileExport,
  IconChartBar
} from '@tabler/icons-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ScatterChart,
  Scatter
} from 'recharts';
import {
  ReportData,
  ReportDefinition,
  ChartConfig,
  ExportConfig
} from '../../types/reports';

interface ReportViewerProps {
  reportDefinition: ReportDefinition;
  data: ReportData;
  loading?: boolean;
  onRefresh?: () => void;
  onExport?: (config: ExportConfig) => void;
}

interface TableState {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDirection: 'asc' | 'desc';
  searchTerm: string;
  filters: Record<string, any>;
}

const CHART_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
  '#ff00ff', '#00ffff', '#ff0000', '#0000ff', '#ffff00'
];

export const ReportViewer: React.FC<ReportViewerProps> = ({
  reportDefinition,
  data,
  loading = false,
  onRefresh,
  onExport
}) => {
  const [activeTab, setActiveTab] = useState('table');
  const [selectedChart, setSelectedChart] = useState<number>(0);
  const [tableState, setTableState] = useState<TableState>({
    page: 1,
    pageSize: 50,
    sortDirection: 'asc',
    searchTerm: '',
    filters: {}
  });

  const [fullscreenModalOpened, { open: openFullscreenModal, close: closeFullscreenModal }] = useDisclosure(false);

  // Procesar datos para la tabla
  const processedTableData = useMemo(() => {
    if (!data) return { rows: [], totalPages: 0, visibleRows: [] };

    let filteredRows = data.rows;

    // Aplicar búsqueda
    if (tableState.searchTerm) {
      const searchLower = tableState.searchTerm.toLowerCase();
      filteredRows = filteredRows.filter(row =>
        row.some(cell => 
          String(cell).toLowerCase().includes(searchLower)
        )
      );
    }

    // Aplicar ordenamiento
    if (tableState.sortBy) {
      const columnIndex = data.headers.indexOf(tableState.sortBy);
      if (columnIndex !== -1) {
        filteredRows = [...filteredRows].sort((a, b) => {
          const aVal = a[columnIndex];
          const bVal = b[columnIndex];
          
          const comparison = String(aVal).localeCompare(String(bVal), undefined, {
            numeric: true,
            sensitivity: 'base'
          });
          
          return tableState.sortDirection === 'asc' ? comparison : -comparison;
        });
      }
    }

    // Calcular paginación
    const totalPages = Math.ceil(filteredRows.length / tableState.pageSize);
    const startIndex = (tableState.page - 1) * tableState.pageSize;
    const endIndex = startIndex + tableState.pageSize;
    const visibleRows = filteredRows.slice(startIndex, endIndex);

    return { rows: filteredRows, totalPages, visibleRows };
  }, [data, tableState]);

  // Procesar datos para gráficos
  const processedChartData = useMemo(() => {
    if (!data || !data.rows.length) return [];

    return data.rows.map((row, index) => {
      const item: any = { _index: index };
      data.headers.forEach((header, headerIndex) => {
        item[header] = row[headerIndex];
      });
      return item;
    });
  }, [data]);

  const handleSort = (column: string) => {
    setTableState(prev => ({
      ...prev,
      sortBy: column,
      sortDirection: prev.sortBy === column && prev.sortDirection === 'asc' ? 'desc' : 'asc',
      page: 1
    }));
  };

  const handleSearch = (searchTerm: string) => {
    setTableState(prev => ({
      ...prev,
      searchTerm,
      page: 1
    }));
  };

  const handlePageChange = (page: number) => {
    setTableState(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setTableState(prev => ({ ...prev, pageSize, page: 1 }));
  };

  const formatCellValue = (value: any, header: string) => {
    if (value === null || value === undefined) return '-';
    
    // Determinar el tipo de campo para formateo
    const reportField = reportDefinition.fields.find(f => f.label === header);
    
    if (reportField?.type === 'currency') {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
      }).format(Number(value));
    }
    
    if (reportField?.type === 'number') {
      return new Intl.NumberFormat('es-AR').format(Number(value));
    }
    
    if (reportField?.type === 'date') {
      return new Date(value).toLocaleDateString('es-AR');
    }
    
    if (reportField?.type === 'boolean') {
      return value ? 'Sí' : 'No';
    }
    
    return String(value);
  };

  const renderChart = (chartConfig: ChartConfig) => {
    const commonProps = {
      data: processedChartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartConfig.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={chartConfig.height || 300}>
            <BarChart {...commonProps}>
              {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={chartConfig.xAxis} />
              <YAxis />
              {chartConfig.showTooltip && <RechartsTooltip />}
              {chartConfig.showLegend && <Legend />}
              {chartConfig.yAxis.map((yField, yIndex) => (
                <Bar
                  key={yField}
                  dataKey={yField}
                  fill={CHART_COLORS[yIndex % CHART_COLORS.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={chartConfig.height || 300}>
            <LineChart {...commonProps}>
              {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={chartConfig.xAxis} />
              <YAxis />
              {chartConfig.showTooltip && <RechartsTooltip />}
              {chartConfig.showLegend && <Legend />}
              {chartConfig.yAxis.map((yField, yIndex) => (
                <Line
                  key={yField}
                  type="monotone"
                  dataKey={yField}
                  stroke={CHART_COLORS[yIndex % CHART_COLORS.length]}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={chartConfig.height || 300}>
            <AreaChart {...commonProps}>
              {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={chartConfig.xAxis} />
              <YAxis />
              {chartConfig.showTooltip && <RechartsTooltip />}
              {chartConfig.showLegend && <Legend />}
              {chartConfig.yAxis.map((yField, yIndex) => (
                <Area
                  key={yField}
                  type="monotone"
                  dataKey={yField}
                  stackId="1"
                  stroke={CHART_COLORS[yIndex % CHART_COLORS.length]}
                  fill={CHART_COLORS[yIndex % CHART_COLORS.length]}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const pieData = processedChartData.slice(0, 10); // Limitar a 10 elementos
        return (
          <ResponsiveContainer width="100%" height={chartConfig.height || 300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey={chartConfig.yAxis[0]}
                nameKey={chartConfig.xAxis}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              {chartConfig.showTooltip && <RechartsTooltip />}
              {chartConfig.showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={chartConfig.height || 300}>
            <ScatterChart {...commonProps}>
              {chartConfig.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={chartConfig.xAxis} />
              <YAxis dataKey={chartConfig.yAxis[0]} />
              {chartConfig.showTooltip && <RechartsTooltip />}
              {chartConfig.showLegend && <Legend />}
              <Scatter
                data={processedChartData}
                fill={CHART_COLORS[0]}
              />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <Center h={200}>
            <Text c="dimmed">Tipo de gráfico no soportado: {chartConfig.type}</Text>
          </Center>
        );
    }
  };

  const renderTableView = () => (
    <Stack gap="md">
      {/* Controles de tabla */}
      <Group justify="space-between">
        <Group>
          <TextInput
            placeholder="Buscar en los datos..."
            leftSection={<IconSearch size={16} />}
            value={tableState.searchTerm}
            onChange={(e) => handleSearch(e.currentTarget.value)}
            w={300}
          />
          <Select
            placeholder="Filas por página"
            data={[
              { value: '25', label: '25 filas' },
              { value: '50', label: '50 filas' },
              { value: '100', label: '100 filas' },
              { value: '200', label: '200 filas' }
            ]}
            value={String(tableState.pageSize)}
            onChange={(value) => handlePageSizeChange(Number(value))}
            w={120}
          />
        </Group>
        
        <Group>
          <Badge variant="light">
            {processedTableData.rows.length} registros
          </Badge>
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={onRefresh}
            loading={loading}
          >
            Actualizar
          </Button>
        </Group>
      </Group>

      {/* Tabla */}
      <Card withBorder>
        <ScrollArea>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                {data?.headers.map((header) => (
                  <Table.Th
                    key={header}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSort(header)}
                  >
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={500}>{header}</Text>
                      {tableState.sortBy === header && (
                        <ActionIcon size="xs" variant="transparent">
                          {tableState.sortDirection === 'asc' ? (
                            <IconSortAscending size={12} />
                          ) : (
                            <IconSortDescending size={12} />
                          )}
                        </ActionIcon>
                      )}
                    </Group>
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <Table.Tr key={index}>
                    {data?.headers.map((header) => (
                      <Table.Td key={header}>
                        <Skeleton height={20} />
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))
              ) : (
                processedTableData.visibleRows.map((row, rowIndex) => (
                  <Table.Tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <Table.Td key={cellIndex}>
                        <Text size="sm">
                          {formatCellValue(cell, data.headers[cellIndex])}
                        </Text>
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        {/* Paginación */}
        {processedTableData.totalPages > 1 && (
          <Group justify="center" mt="md">
            <Pagination
              total={processedTableData.totalPages}
              value={tableState.page}
              onChange={handlePageChange}
              size="sm"
            />
          </Group>
        )}
      </Card>
    </Stack>
  );

  const renderChartsView = () => {
    if (!reportDefinition.charts || reportDefinition.charts.length === 0) {
      return (
        <Center h={300}>
          <Stack align="center" gap="md">
            <IconChartBar size={48} color="gray" />
            <Text c="dimmed">No hay gráficos configurados para este reporte</Text>
          </Stack>
        </Center>
      );
    }

    return (
      <Stack gap="md">
        {/* Selector de gráfico */}
        {reportDefinition.charts.length > 1 && (
          <Group>
            <Text size="sm" fw={500}>Seleccionar gráfico:</Text>
            <Select
              data={reportDefinition.charts.map((chart, index) => ({
                value: String(index),
                label: chart.title
              }))}
              value={String(selectedChart)}
              onChange={(value) => setSelectedChart(Number(value))}
              w={300}
            />
          </Group>
        )}

        {/* Gráfico actual */}
        <Card withBorder>
          <Group justify="space-between" mb="md">
            <Text fw={500} size="lg">
              {reportDefinition.charts[selectedChart]?.title}
            </Text>
            <Group>
              <Tooltip label="Pantalla completa">
                <ActionIcon
                  variant="light"
                  onClick={openFullscreenModal}
                >
                  <IconMaximize size={16} />
                </ActionIcon>
              </Tooltip>
              <Menu>
                <Menu.Target>
                  <ActionIcon variant="light">
                    <IconDots size={16} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item leftSection={<IconDownload size={16} />}>
                    Descargar imagen
                  </Menu.Item>
                  <Menu.Item leftSection={<IconSettings size={16} />}>
                    Configurar
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
          
          {loading ? (
            <Center h={300}>
              <Loader />
            </Center>
          ) : (
            <Box>
              {renderChart(reportDefinition.charts[selectedChart])}
            </Box>
          )}
        </Card>

        {/* Todos los gráficos en modo galería */}
        {reportDefinition.charts.length > 1 && (
          <Card withBorder>
            <Text fw={500} mb="md">Todos los gráficos</Text>
            <Grid>
              {reportDefinition.charts.map((chart, index) => (
                <Grid.Col key={index} span={6}>
                  <Card withBorder>
                    <Text size="sm" fw={500} mb="xs">{chart.title}</Text>
                    <Box style={{ height: 200 }}>
                      {renderChart({ ...chart, height: 200 })}
                    </Box>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          </Card>
        )}
      </Stack>
    );
  };

  if (!data) {
    return (
      <Card withBorder>
        <Center h={300}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">Cargando datos del reporte...</Text>
          </Stack>
        </Center>
      </Card>
    );
  }

  return (
    <Container size="xl">
      <Stack gap="md">
        {/* Header del reporte */}
        <Card withBorder p="md">
          <Group justify="space-between">
            <div>
              <Title order={3}>{reportDefinition.name}</Title>
              {reportDefinition.description && (
                <Text c="dimmed" size="sm" mt="xs">
                  {reportDefinition.description}
                </Text>
              )}
              <Group gap="xs" mt="xs">
                <Badge variant="light">
                  {reportDefinition.type}
                </Badge>
                {data.metadata?.generatedAt && (
                  <Text size="xs" c="dimmed">
                    Generado: {new Date(data.metadata.generatedAt).toLocaleString('es-AR')}
                  </Text>
                )}
                {data.metadata?.executionTime && (
                  <Text size="xs" c="dimmed">
                    Tiempo: {data.metadata.executionTime}ms
                  </Text>
                )}
              </Group>
            </div>
            
            <Group>
              <Button
                variant="light"
                leftSection={<IconRefresh size={16} />}
                onClick={onRefresh}
                loading={loading}
              >
                Actualizar
              </Button>
              <Button
                leftSection={<IconFileExport size={16} />}
                onClick={() => onExport?.({
                  format: 'excel',
                  includeCharts: true,
                  includeTable: true
                })}
              >
                Exportar
              </Button>
            </Group>
          </Group>
        </Card>

        {/* Pestañas */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'table')}>
          <Tabs.List>
            <Tabs.Tab
              value="table"
              leftSection={<IconTable size={16} />}
            >
              Tabla de Datos
            </Tabs.Tab>
            <Tabs.Tab
              value="charts"
              leftSection={<IconChartBar size={16} />}
              disabled={!reportDefinition.charts?.length}
            >
              Gráficos ({reportDefinition.charts?.length || 0})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="table" pt="md">
            {renderTableView()}
          </Tabs.Panel>

          <Tabs.Panel value="charts" pt="md">
            {renderChartsView()}
          </Tabs.Panel>
        </Tabs>

        {/* Modal de pantalla completa */}
        <Modal
          opened={fullscreenModalOpened}
          onClose={closeFullscreenModal}
          size="xl"
          title={reportDefinition.charts?.[selectedChart]?.title}
          fullScreen
        >
          {reportDefinition.charts?.[selectedChart] && (
            <Box h="80vh">
              {renderChart(reportDefinition.charts[selectedChart])}
            </Box>
          )}
        </Modal>
      </Stack>
    </Container>
  );
};