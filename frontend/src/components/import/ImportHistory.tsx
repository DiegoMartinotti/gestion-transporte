import React, { useState, useMemo } from 'react';
import {
  Stack,
  Group,
  Text,
  Badge,
  Button,
  Paper,
  Table,
  ScrollArea,
  TextInput,
  Select,
  ActionIcon,
  Tooltip,
  Modal,
  Timeline,
  Card,
  SimpleGrid,
  Title,
  ThemeIcon,
  RingProgress,
  Center,
  Menu,
  Divider,
  Alert,
  Tabs,
  Progress,
} from '@mantine/core';
import {
  IconSearch,
  IconFilter,
  IconDownload,
  IconEye,
  IconRefresh,
  IconTrash,
  IconClock,
  IconCalendar,
  IconFileImport,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconDots,
  IconFileExport,
  IconChartBar,
  IconTrendingUp,
  IconHistory,
  IconDatabase,
  IconFileSpreadsheet,
  IconArrowUp,
  IconArrowDown,
} from '@tabler/icons-react';
import { DateRangePicker } from '../base/DateRangePicker';
import { formatDistanceToNow } from '../../utils/dateUtils';

interface ImportRecord {
  id: string;
  timestamp: Date;
  entityType: string;
  fileName: string;
  fileSize: number;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  warningRecords: number;
  duration: number; // en segundos
  status: 'completed' | 'failed' | 'partial' | 'in_progress';
  user: string;
  errors?: ImportError[];
  logs?: ImportLog[];
}

interface ImportError {
  row: number;
  field: string;
  error: string;
  value: any;
}

interface ImportLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
}

interface ImportStats {
  totalImports: number;
  successfulImports: number;
  failedImports: number;
  totalRecordsProcessed: number;
  averageSuccessRate: number;
  mostImportedEntity: string;
  lastImportDate: Date | null;
}

interface ImportHistoryProps {
  onRetryImport?: (importId: string) => void;
  onViewDetails?: (importId: string) => void;
  onExportReport?: (importId: string) => void;
}

// Datos de ejemplo
const MOCK_IMPORTS: ImportRecord[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // Hace 30 minutos
    entityType: 'clientes',
    fileName: 'clientes_julio_2024.xlsx',
    fileSize: 2456789,
    totalRecords: 1500,
    successfulRecords: 1485,
    failedRecords: 10,
    warningRecords: 5,
    duration: 45,
    status: 'partial',
    user: 'admin@empresa.com',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // Hace 2 horas
    entityType: 'vehiculos',
    fileName: 'flota_vehiculos.xlsx',
    fileSize: 1234567,
    totalRecords: 250,
    successfulRecords: 250,
    failedRecords: 0,
    warningRecords: 12,
    duration: 15,
    status: 'completed',
    user: 'operador@empresa.com',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // Hace 1 día
    entityType: 'personal',
    fileName: 'empleados_nuevos.xlsx',
    fileSize: 567890,
    totalRecords: 75,
    successfulRecords: 0,
    failedRecords: 75,
    warningRecords: 0,
    duration: 8,
    status: 'failed',
    user: 'rrhh@empresa.com',
    errors: [
      { row: 1, field: 'dni', error: 'DNI duplicado', value: '12345678' },
      { row: 2, field: 'email', error: 'Email inválido', value: 'invalid-email' },
    ],
  },
];

export const ImportHistory: React.FC<ImportHistoryProps> = ({
  onRetryImport,
  onViewDetails,
  onExportReport,
}) => {
  const [imports] = useState<ImportRecord[]>(MOCK_IMPORTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [selectedImport, setSelectedImport] = useState<ImportRecord | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [sortField, setSortField] = useState<keyof ImportRecord>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Calcular estadísticas
  const stats: ImportStats = useMemo(() => {
    const successfulImports = imports.filter(i => i.status === 'completed').length;
    const failedImports = imports.filter(i => i.status === 'failed').length;
    const totalRecordsProcessed = imports.reduce((sum, i) => sum + i.totalRecords, 0);
    const totalSuccessfulRecords = imports.reduce((sum, i) => sum + i.successfulRecords, 0);
    
    const entityCounts = imports.reduce((acc, i) => {
      acc[i.entityType] = (acc[i.entityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostImportedEntity = Object.entries(entityCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';
    
    return {
      totalImports: imports.length,
      successfulImports,
      failedImports,
      totalRecordsProcessed,
      averageSuccessRate: totalRecordsProcessed > 0 
        ? (totalSuccessfulRecords / totalRecordsProcessed) * 100 
        : 0,
      mostImportedEntity,
      lastImportDate: imports.length > 0 ? imports[0].timestamp : null,
    };
  }, [imports]);

  // Filtrar importaciones
  const filteredImports = useMemo(() => {
    return imports.filter(imp => {
      const matchesSearch = searchTerm === '' || 
        imp.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        imp.user.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesEntity = filterEntity === 'all' || imp.entityType === filterEntity;
      const matchesStatus = filterStatus === 'all' || imp.status === filterStatus;
      
      const matchesDate = !dateRange[0] || !dateRange[1] || 
        (imp.timestamp >= dateRange[0] && imp.timestamp <= dateRange[1]);
      
      return matchesSearch && matchesEntity && matchesStatus && matchesDate;
    });
  }, [imports, searchTerm, filterEntity, filterStatus, dateRange]);

  // Ordenar importaciones
  const sortedImports = useMemo(() => {
    const sorted = [...filteredImports].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [filteredImports, sortField, sortDirection]);

  const handleSort = (field: keyof ImportRecord) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <IconCheck size={16} />;
      case 'failed': return <IconX size={16} />;
      case 'partial': return <IconAlertCircle size={16} />;
      case 'in_progress': return <IconClock size={16} />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'failed': return 'red';
      case 'partial': return 'yellow';
      case 'in_progress': return 'blue';
      default: return 'gray';
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const SortIcon = ({ field }: { field: keyof ImportRecord }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />;
  };

  return (
    <Stack spacing="lg">
      {/* Encabezado y estadísticas */}
      <Card withBorder>
        <Group position="apart" mb="md">
          <div>
            <Title order={3}>Historial de importaciones</Title>
            <Text size="sm" color="dimmed">
              Registro completo de todas las importaciones realizadas
            </Text>
          </div>
          <Button
            leftIcon={<IconFileImport size={16} />}
            onClick={() => {
              // Navegar a nueva importación
            }}
          >
            Nueva importación
          </Button>
        </Group>
        
        <SimpleGrid cols={4} spacing="md">
          <Card withBorder>
            <Stack spacing={4} align="center">
              <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                <IconHistory size={20} />
              </ThemeIcon>
              <Text size="xs" color="dimmed">Total importaciones</Text>
              <Text size="xl" weight={700}>{stats.totalImports}</Text>
            </Stack>
          </Card>
          
          <Card withBorder>
            <Stack spacing={4} align="center">
              <ThemeIcon size="lg" radius="md" color="green" variant="light">
                <IconCheck size={20} />
              </ThemeIcon>
              <Text size="xs" color="dimmed">Exitosas</Text>
              <Text size="xl" weight={700} color="green">{stats.successfulImports}</Text>
            </Stack>
          </Card>
          
          <Card withBorder>
            <Stack spacing={4} align="center">
              <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                <IconDatabase size={20} />
              </ThemeIcon>
              <Text size="xs" color="dimmed">Registros procesados</Text>
              <Text size="xl" weight={700}>{stats.totalRecordsProcessed.toLocaleString()}</Text>
            </Stack>
          </Card>
          
          <Card withBorder>
            <Center h="100%">
              <RingProgress
                size={80}
                thickness={8}
                sections={[{ value: stats.averageSuccessRate, color: 'green' }]}
                label={
                  <Center>
                    <Text size="xs" weight={700}>
                      {Math.round(stats.averageSuccessRate)}%
                    </Text>
                  </Center>
                }
              />
              <Text size="xs" color="dimmed" ml="sm">
                Tasa de éxito promedio
              </Text>
            </Center>
          </Card>
        </SimpleGrid>
      </Card>
      
      {/* Filtros */}
      <Paper p="md" withBorder>
        <Stack spacing="sm">
          <Group>
            <TextInput
              placeholder="Buscar por archivo o usuario..."
              icon={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              style={{ flex: 1 }}
            />
            
            <Select
              placeholder="Tipo de entidad"
              icon={<IconFilter size={16} />}
              value={filterEntity}
              onChange={(value) => setFilterEntity(value || 'all')}
              data={[
                { value: 'all', label: 'Todas las entidades' },
                { value: 'clientes', label: 'Clientes' },
                { value: 'empresas', label: 'Empresas' },
                { value: 'personal', label: 'Personal' },
                { value: 'vehiculos', label: 'Vehículos' },
                { value: 'sites', label: 'Sites' },
                { value: 'tramos', label: 'Tramos' },
                { value: 'viajes', label: 'Viajes' },
              ]}
              style={{ width: 200 }}
            />
            
            <Select
              placeholder="Estado"
              icon={<IconFilter size={16} />}
              value={filterStatus}
              onChange={(value) => setFilterStatus(value || 'all')}
              data={[
                { value: 'all', label: 'Todos los estados' },
                { value: 'completed', label: 'Completadas' },
                { value: 'partial', label: 'Parciales' },
                { value: 'failed', label: 'Fallidas' },
                { value: 'in_progress', label: 'En progreso' },
              ]}
              style={{ width: 180 }}
            />
          </Group>
          
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="Filtrar por fecha"
            icon={<IconCalendar size={16} />}
          />
        </Stack>
      </Paper>
      
      {/* Tabla de historial */}
      <Paper withBorder>
        <ScrollArea>
          <Table highlightOnHover>
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('timestamp')}>
                  <Group spacing={4}>
                    Fecha
                    <SortIcon field="timestamp" />
                  </Group>
                </th>
                <th>Entidad</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('fileName')}>
                  <Group spacing={4}>
                    Archivo
                    <SortIcon field="fileName" />
                  </Group>
                </th>
                <th>Usuario</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('totalRecords')}>
                  <Group spacing={4}>
                    Registros
                    <SortIcon field="totalRecords" />
                  </Group>
                </th>
                <th>Resultado</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('duration')}>
                  <Group spacing={4}>
                    Duración
                    <SortIcon field="duration" />
                  </Group>
                </th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedImports.map((imp) => {
                const successRate = imp.totalRecords > 0 
                  ? (imp.successfulRecords / imp.totalRecords) * 100 
                  : 0;
                
                return (
                  <tr key={imp.id}>
                    <td>
                      <Stack spacing={0}>
                        <Text size="sm">{imp.timestamp.toLocaleDateString()}</Text>
                        <Text size="xs" color="dimmed">
                          {imp.timestamp.toLocaleTimeString()}
                        </Text>
                      </Stack>
                    </td>
                    <td>
                      <Badge variant="light">
                        {imp.entityType}
                      </Badge>
                    </td>
                    <td>
                      <Stack spacing={0}>
                        <Text size="sm">{imp.fileName}</Text>
                        <Text size="xs" color="dimmed">
                          {formatFileSize(imp.fileSize)}
                        </Text>
                      </Stack>
                    </td>
                    <td>
                      <Text size="sm">{imp.user}</Text>
                    </td>
                    <td>
                      <Text size="sm">{imp.totalRecords.toLocaleString()}</Text>
                    </td>
                    <td>
                      <Stack spacing={0}>
                        <Progress
                          value={successRate}
                          size="sm"
                          color={successRate === 100 ? 'green' : successRate > 50 ? 'yellow' : 'red'}
                        />
                        <Group spacing={4} mt={4}>
                          <Text size="xs" color="green">
                            ✓ {imp.successfulRecords}
                          </Text>
                          {imp.failedRecords > 0 && (
                            <Text size="xs" color="red">
                              ✗ {imp.failedRecords}
                            </Text>
                          )}
                          {imp.warningRecords > 0 && (
                            <Text size="xs" color="yellow">
                              ⚠ {imp.warningRecords}
                            </Text>
                          )}
                        </Group>
                      </Stack>
                    </td>
                    <td>
                      <Text size="sm">{formatDuration(imp.duration)}</Text>
                    </td>
                    <td>
                      <Badge
                        color={getStatusColor(imp.status)}
                        leftSection={getStatusIcon(imp.status)}
                      >
                        {imp.status === 'completed' && 'Completada'}
                        {imp.status === 'partial' && 'Parcial'}
                        {imp.status === 'failed' && 'Fallida'}
                        {imp.status === 'in_progress' && 'En progreso'}
                      </Badge>
                    </td>
                    <td>
                      <Menu position="bottom-end" shadow="md">
                        <Menu.Target>
                          <ActionIcon variant="subtle">
                            <IconDots size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        
                        <Menu.Dropdown>
                          <Menu.Item
                            icon={<IconEye size={14} />}
                            onClick={() => {
                              setSelectedImport(imp);
                              setShowDetailsModal(true);
                            }}
                          >
                            Ver detalles
                          </Menu.Item>
                          
                          {imp.status === 'failed' && onRetryImport && (
                            <Menu.Item
                              icon={<IconRefresh size={14} />}
                              onClick={() => onRetryImport(imp.id)}
                            >
                              Reintentar importación
                            </Menu.Item>
                          )}
                          
                          <Menu.Item
                            icon={<IconFileExport size={14} />}
                            onClick={() => onExportReport?.(imp.id)}
                          >
                            Exportar reporte
                          </Menu.Item>
                          
                          <Menu.Divider />
                          
                          <Menu.Item
                            color="red"
                            icon={<IconTrash size={14} />}
                          >
                            Eliminar registro
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </ScrollArea>
        
        {sortedImports.length === 0 && (
          <Center p="xl">
            <Stack align="center" spacing="xs">
              <ThemeIcon size="xl" radius="md" color="gray" variant="light">
                <IconHistory size={30} />
              </ThemeIcon>
              <Text color="dimmed">No se encontraron importaciones</Text>
            </Stack>
          </Center>
        )}
      </Paper>
      
      {/* Modal de detalles */}
      <Modal
        opened={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Detalles de importación"
        size="lg"
      >
        {selectedImport && (
          <Stack spacing="md">
            <SimpleGrid cols={2} spacing="md">
              <Paper p="sm" withBorder>
                <Stack spacing={4}>
                  <Text size="xs" color="dimmed">Archivo</Text>
                  <Text weight={500}>{selectedImport.fileName}</Text>
                </Stack>
              </Paper>
              
              <Paper p="sm" withBorder>
                <Stack spacing={4}>
                  <Text size="xs" color="dimmed">Usuario</Text>
                  <Text weight={500}>{selectedImport.user}</Text>
                </Stack>
              </Paper>
              
              <Paper p="sm" withBorder>
                <Stack spacing={4}>
                  <Text size="xs" color="dimmed">Fecha y hora</Text>
                  <Text weight={500}>
                    {selectedImport.timestamp.toLocaleString()}
                  </Text>
                </Stack>
              </Paper>
              
              <Paper p="sm" withBorder>
                <Stack spacing={4}>
                  <Text size="xs" color="dimmed">Duración</Text>
                  <Text weight={500}>{formatDuration(selectedImport.duration)}</Text>
                </Stack>
              </Paper>
            </SimpleGrid>
            
            <Divider />
            
            <Title order={5}>Resultados</Title>
            
            <SimpleGrid cols={3} spacing="sm">
              <Card withBorder>
                <Stack spacing={4} align="center">
                  <IconCheck size={20} color="var(--mantine-color-green-6)" />
                  <Text size="xs" color="dimmed">Exitosos</Text>
                  <Text size="lg" weight={700} color="green">
                    {selectedImport.successfulRecords}
                  </Text>
                </Stack>
              </Card>
              
              <Card withBorder>
                <Stack spacing={4} align="center">
                  <IconX size={20} color="var(--mantine-color-red-6)" />
                  <Text size="xs" color="dimmed">Fallidos</Text>
                  <Text size="lg" weight={700} color="red">
                    {selectedImport.failedRecords}
                  </Text>
                </Stack>
              </Card>
              
              <Card withBorder>
                <Stack spacing={4} align="center">
                  <IconAlertCircle size={20} color="var(--mantine-color-yellow-6)" />
                  <Text size="xs" color="dimmed">Advertencias</Text>
                  <Text size="lg" weight={700} color="yellow">
                    {selectedImport.warningRecords}
                  </Text>
                </Stack>
              </Card>
            </SimpleGrid>
            
            {selectedImport.errors && selectedImport.errors.length > 0 && (
              <>
                <Divider />
                <Title order={5}>Errores encontrados</Title>
                <ScrollArea style={{ height: 200 }}>
                  <Table>
                    <thead>
                      <tr>
                        <th>Fila</th>
                        <th>Campo</th>
                        <th>Error</th>
                        <th>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedImport.errors.map((error, index) => (
                        <tr key={index}>
                          <td>{error.row}</td>
                          <td>{error.field}</td>
                          <td>{error.error}</td>
                          <td>{error.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </ScrollArea>
              </>
            )}
            
            <Group position="right">
              <Button variant="default" onClick={() => setShowDetailsModal(false)}>
                Cerrar
              </Button>
              <Button leftIcon={<IconDownload size={16} />}>
                Descargar reporte
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
};