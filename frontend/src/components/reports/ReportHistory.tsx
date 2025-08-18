import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Title,
  Group,
  Button,
  Stack,
  Grid,
  Card,
  Text,
  Table,
  Badge,
  ActionIcon,
  Modal,
  ScrollArea,
  Alert,
  Pagination,
  TextInput,
  Select,
  Tooltip,
  Menu,
  Divider,
  Container,
  Center,
  Skeleton,
  Checkbox,
  Code,
  Tabs,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconHistory,
  IconDownload,
  IconTrash,
  IconEye,
  IconSearch,
  IconFilter,
  IconRefresh,
  IconFileTypePdf,
  IconFileTypeXls,
  IconFileTypeCsv,
  IconPhoto,
  IconClock,
  IconCheck,
  IconX,
  IconDots,
  IconAlertCircle,
  IconSortAscending,
  IconSortDescending,
  IconShare,
  IconArchive,
  IconDatabase,
  IconSettings,
} from '@tabler/icons-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ReportExecution,
  ReportDefinition,
  ExportFormat,
  ReportExecutionStatus,
} from '../../types/reports';
import { reportService } from '../../services/reportService';

interface ReportHistoryProps {
  reportDefinitions: ReportDefinition[];
  onReportDownload?: (execution: ReportExecution) => void;
  onReportRerun?: (reportId: string) => void;
}

interface HistoryFilters {
  reportId?: string;
  status?: ReportExecutionStatus;
  format?: ExportFormat;
  startDate?: Date;
  endDate?: Date;
  createdBy?: string;
  searchTerm: string;
}

interface HistoryState {
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  filters: HistoryFilters;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente', color: 'orange' },
  { value: 'running', label: 'Ejecutando', color: 'blue' },
  { value: 'completed', label: 'Completado', color: 'green' },
  { value: 'failed', label: 'Fallido', color: 'red' },
  { value: 'cancelled', label: 'Cancelado', color: 'gray' },
];

const FORMAT_OPTIONS = [
  { value: 'pdf', label: 'PDF', icon: IconFileTypePdf, color: 'red' },
  { value: 'excel', label: 'Excel', icon: IconFileTypeXls, color: 'green' },
  { value: 'csv', label: 'CSV', icon: IconFileTypeCsv, color: 'blue' },
  { value: 'image', label: 'Imagen', icon: IconPhoto, color: 'orange' },
];

// Funciones auxiliares para reducir complejidad
const filterExecutionsByTab = (executions: ReportExecution[], activeTab: string) => {
  if (activeTab === 'all') return executions;

  return executions.filter((e) => {
    switch (activeTab) {
      case 'completed':
        return e.status === 'completed';
      case 'running':
        return e.status === 'running' || e.status === 'pending';
      case 'failed':
        return e.status === 'failed';
      case 'scheduled':
        return e.isScheduled;
      default:
        return true;
    }
  });
};

const renderExecutionDetails = (
  execution: ReportExecution,
  reportDefinition: ReportDefinition | undefined,
  getStatusBadge: (status: ReportExecutionStatus) => JSX.Element,
  getFormatIcon: (format: ExportFormat) => JSX.Element
) => (
  <Grid>
    <Grid.Col span={6}>
      <Stack gap="xs">
        <Text size="sm" fw={500}>
          Reporte
        </Text>
        <Text size="sm">{reportDefinition?.name || 'Reporte eliminado'}</Text>
      </Stack>
    </Grid.Col>
    <Grid.Col span={6}>
      <Stack gap="xs">
        <Text size="sm" fw={500}>
          Estado
        </Text>
        {getStatusBadge(execution.status)}
      </Stack>
    </Grid.Col>
    <Grid.Col span={6}>
      <Stack gap="xs">
        <Text size="sm" fw={500}>
          Formato
        </Text>
        <Group gap="xs">
          {getFormatIcon(execution.format)}
          <Text size="sm">{execution.format.toUpperCase()}</Text>
        </Group>
      </Stack>
    </Grid.Col>
    <Grid.Col span={6}>
      <Stack gap="xs">
        <Text size="sm" fw={500}>
          Ejecutado por
        </Text>
        <Text size="sm">{execution.createdBy}</Text>
      </Stack>
    </Grid.Col>
  </Grid>
);

const renderExecutionTiming = (
  execution: ReportExecution,
  formatDuration: (start: string, end?: string) => string
) => (
  <Grid>
    <Grid.Col span={6}>
      <Stack gap="xs">
        <Text size="sm" fw={500}>
          Inicio
        </Text>
        <Text size="sm">
          {format(new Date(execution.startTime), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
        </Text>
      </Stack>
    </Grid.Col>
    <Grid.Col span={6}>
      <Stack gap="xs">
        <Text size="sm" fw={500}>
          Fin
        </Text>
        <Text size="sm">
          {execution.endTime
            ? format(new Date(execution.endTime), 'dd/MM/yyyy HH:mm:ss', { locale: es })
            : 'En progreso...'}
        </Text>
      </Stack>
    </Grid.Col>
    <Grid.Col span={6}>
      <Stack gap="xs">
        <Text size="sm" fw={500}>
          Duración
        </Text>
        <Text size="sm">{formatDuration(execution.startTime, execution.endTime)}</Text>
      </Stack>
    </Grid.Col>
    <Grid.Col span={6}>
      <Stack gap="xs">
        <Text size="sm" fw={500}>
          Registros Procesados
        </Text>
        <Text size="sm">{execution.recordsProcessed?.toLocaleString('es-AR') || 'N/A'}</Text>
      </Stack>
    </Grid.Col>
  </Grid>
);

const renderExecutionFile = (
  execution: ReportExecution,
  formatFileSize: (bytes: number) => string
) => {
  if (!execution.outputFile) return null;

  return (
    <>
      <Divider />
      <Grid>
        <Grid.Col span={6}>
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Archivo
            </Text>
            <Text size="sm">{execution.outputFile.name}</Text>
          </Stack>
        </Grid.Col>
        <Grid.Col span={6}>
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Tamaño
            </Text>
            <Text size="sm">{formatFileSize(execution.outputFile.size)}</Text>
          </Stack>
        </Grid.Col>
      </Grid>
    </>
  );
};

const renderExecutionError = (execution: ReportExecution) => {
  if (!execution.error) return null;

  return (
    <>
      <Divider />
      <Alert color="red" icon={<IconAlertCircle size={16} />} title="Error">
        <Code block>{execution.error}</Code>
      </Alert>
    </>
  );
};

const renderExecutionParameters = (execution: ReportExecution) => {
  if (!execution.parameters || Object.keys(execution.parameters).length === 0) return null;

  return (
    <>
      <Divider />
      <Stack gap="xs">
        <Text size="sm" fw={500}>
          Parámetros
        </Text>
        <Code block>{JSON.stringify(execution.parameters, null, 2)}</Code>
      </Stack>
    </>
  );
};

// Funciones helper para reducir complejidad del componente principal
const getStatusBadge = (status: ReportExecutionStatus) => {
  const statusConfig = STATUS_OPTIONS.find((s) => s.value === status);
  return (
    <Badge color={statusConfig?.color} variant="light">
      {statusConfig?.label || status}
    </Badge>
  );
};

const getFormatIcon = (format: ExportFormat) => {
  const formatConfig = FORMAT_OPTIONS.find((f) => f.value === format);
  const IconComponent = formatConfig?.icon || IconFileTypePdf;
  return <IconComponent size={16} color={`var(--mantine-color-${formatConfig?.color}-6)`} />;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDuration = (startTime: string, endTime?: string) => {
  if (!endTime) return 'En progreso...';
  const start = new Date(startTime);
  const end = new Date(endTime);
  const duration = end.getTime() - start.getTime();

  if (duration < 1000) return `${duration}ms`;
  if (duration < 60000) return `${Math.round(duration / 1000)}s`;
  return `${Math.round(duration / 60000)}m ${Math.round((duration % 60000) / 1000)}s`;
};

const handleBulkDownload = async (
  selectedIds: string[],
  executions: ReportExecution[],
  handleDownload: (execution: ReportExecution) => Promise<void>
) => {
  for (const id of selectedIds) {
    const execution = executions.find((e) => e.id === id);
    if (execution && execution.status === 'completed') {
      await handleDownload(execution);
    }
  }
};

const showNotification = (title: string, message: string, color: string) => {
  notifications.show({ title, message, color });
};

const executeBulkAction = async (
  action: string,
  selectedIds: string[],
  executions: ReportExecution[],
  handleDownload: (execution: ReportExecution) => Promise<void>,
  loadExecutions: () => void
) => {
  switch (action) {
    case 'download':
      await handleBulkDownload(selectedIds, executions, handleDownload);
      break;
    case 'delete':
      await reportService.deleteReportExecutions(selectedIds);
      loadExecutions();
      showNotification(
        'Reportes eliminados',
        `${selectedIds.length} reportes eliminados correctamente`,
        'green'
      );
      break;
    case 'archive':
      await reportService.archiveReportExecutions(selectedIds);
      loadExecutions();
      showNotification(
        'Reportes archivados',
        `${selectedIds.length} reportes archivados correctamente`,
        'green'
      );
      break;
  }
};

const renderExecutionRow = (
  execution: ReportExecution,
  reportDefinitions: ReportDefinition[],
  selectedExecutions: string[],
  onSelectionChange: (id: string, selected: boolean) => void,
  onDetailModalOpen: (execution: ReportExecution) => void,
  onDownload: (execution: ReportExecution) => void,
  onCancel: (execution: ReportExecution) => void,
  onRerun: (execution: ReportExecution) => void
) => {
  const reportDefinition = reportDefinitions.find((r) => r.id === execution.reportDefinitionId);
  const isSelected = selectedExecutions.includes(execution.id);

  return (
    <Table.Tr
      key={execution.id}
      style={{
        backgroundColor: isSelected ? 'var(--mantine-color-blue-0)' : undefined,
      }}
    >
      <Table.Td>
        <Checkbox
          checked={isSelected}
          onChange={(e) => onSelectionChange(execution.id, e.currentTarget.checked)}
        />
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          {getFormatIcon(execution.format)}
          <div>
            <Text size="sm" fw={500}>
              {reportDefinition?.name || 'Reporte eliminado'}
            </Text>
            <Text size="xs" c="dimmed">
              {reportDefinition?.type || 'N/A'}
            </Text>
          </div>
        </Group>
      </Table.Td>
      <Table.Td>{getStatusBadge(execution.status)}</Table.Td>
      <Table.Td>
        <Text size="sm">
          {format(new Date(execution.startTime), 'dd/MM/yyyy HH:mm', { locale: es })}
        </Text>
        <Text size="xs" c="dimmed">
          {formatDistanceToNow(new Date(execution.startTime), {
            addSuffix: true,
            locale: es,
          })}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{execution.createdBy}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{formatDuration(execution.startTime, execution.endTime)}</Text>
      </Table.Td>
      <Table.Td>
        {execution.outputFile && (
          <div>
            <Text size="sm">{formatFileSize(execution.outputFile.size)}</Text>
            <Text size="xs" c="dimmed">
              {execution.outputFile.name}
            </Text>
          </div>
        )}
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Tooltip label="Ver detalles">
            <ActionIcon variant="light" onClick={() => onDetailModalOpen(execution)}>
              <IconEye size={16} />
            </ActionIcon>
          </Tooltip>

          {execution.status === 'completed' && execution.outputFile && (
            <Tooltip label="Descargar">
              <ActionIcon variant="light" color="green" onClick={() => onDownload(execution)}>
                <IconDownload size={16} />
              </ActionIcon>
            </Tooltip>
          )}

          {(execution.status === 'running' || execution.status === 'pending') && (
            <Tooltip label="Cancelar">
              <ActionIcon variant="light" color="red" onClick={() => onCancel(execution)}>
                <IconX size={16} />
              </ActionIcon>
            </Tooltip>
          )}

          <Menu>
            <Menu.Target>
              <ActionIcon variant="light">
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconRefresh size={14} />}
                onClick={() => onRerun(execution)}
                disabled={execution.status === 'running' || execution.status === 'pending'}
              >
                Re-ejecutar
              </Menu.Item>
              <Menu.Item
                leftSection={<IconShare size={14} />}
                disabled={execution.status !== 'completed'}
              >
                Compartir
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconArchive size={14} />}
                disabled={execution.status === 'running'}
              >
                Archivar
              </Menu.Item>
              <Menu.Item
                leftSection={<IconTrash size={14} />}
                color="red"
                disabled={execution.status === 'running'}
              >
                Eliminar
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
};

const createFilterModalHandlers = (
  state: HistoryState,
  updateState: (updates: Partial<HistoryState>) => void,
  _reportDefinitions: ReportDefinition[],
  _closeFilterModal: () => void
) => {
  const handleReportChange = (value: string | null) => {
    updateState({
      filters: { ...state.filters, reportId: value || undefined },
    });
  };

  const handleStatusChange = (value: string | null) => {
    updateState({
      filters: { ...state.filters, status: (value as ReportExecutionStatus) || undefined },
    });
  };

  const handleFormatChange = (value: string | null) => {
    updateState({
      filters: { ...state.filters, format: (value as ExportFormat) || undefined },
    });
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateState({
      filters: { ...state.filters, createdBy: e.target.value || undefined },
    });
  };

  const handleStartDateChange = (value: Date | null) => {
    updateState({
      filters: { ...state.filters, startDate: value || undefined },
    });
  };

  const handleEndDateChange = (value: Date | null) => {
    updateState({
      filters: { ...state.filters, endDate: value || undefined },
    });
  };

  const handleClearFilters = () => {
    updateState({
      filters: { searchTerm: '' },
      page: 1,
    });
  };

  return {
    handleReportChange,
    handleStatusChange,
    handleFormatChange,
    handleUserChange,
    handleStartDateChange,
    handleEndDateChange,
    handleClearFilters,
  };
};

export const ReportHistory: React.FC<ReportHistoryProps> = ({
  reportDefinitions,
  onReportDownload,
  onReportRerun,
}) => {
  const [executions, setExecutions] = useState<ReportExecution[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<ReportExecution | null>(null);
  const [selectedExecutions, setSelectedExecutions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<HistoryState>({
    page: 1,
    pageSize: 25,
    sortBy: 'startTime',
    sortDirection: 'desc',
    filters: {
      searchTerm: '',
    },
  });

  const [detailModalOpened, { open: openDetailModal, close: closeDetailModal }] =
    useDisclosure(false);
  const [filterModalOpened, { open: openFilterModal, close: closeFilterModal }] =
    useDisclosure(false);
  const [bulkModalOpened, { open: openBulkModal, close: closeBulkModal }] = useDisclosure(false);

  const loadExecutions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await reportService.getReportExecutions({
        page: state.page,
        pageSize: state.pageSize,
        sortBy: state.sortBy,
        sortDirection: state.sortDirection,
        ...state.filters,
      });
      setExecutions(data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudieron cargar el historial de reportes',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [state]);

  useEffect(() => {
    loadExecutions();
  }, [loadExecutions]);

  // Auto-refresh para reportes en ejecución
  useEffect(() => {
    const hasRunningReports = executions.some(
      (e) => e.status === 'running' || e.status === 'pending'
    );

    const shouldStartRefresh = hasRunningReports && !refreshInterval;
    const shouldStopRefresh = !hasRunningReports && refreshInterval;

    if (shouldStartRefresh) {
      const interval = setInterval(loadExecutions, 5000);
      setRefreshInterval(interval);
    } else if (shouldStopRefresh) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [executions, loadExecutions, refreshInterval]);

  const filteredExecutions = useMemo(() => {
    return filterExecutionsByTab(executions, activeTab);
  }, [executions, activeTab]);

  const paginatedExecutions = useMemo(() => {
    const startIndex = (state.page - 1) * state.pageSize;
    const endIndex = startIndex + state.pageSize;
    return filteredExecutions.slice(startIndex, endIndex);
  }, [filteredExecutions, state.page, state.pageSize]);

  const totalPages = useMemo(
    () => Math.ceil(filteredExecutions.length / state.pageSize),
    [filteredExecutions.length, state.pageSize]
  );

  const updateState = (updates: Partial<HistoryState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleSort = (field: string) => {
    const newDirection = state.sortBy === field && state.sortDirection === 'asc' ? 'desc' : 'asc';
    updateState({
      sortBy: field,
      sortDirection: newDirection,
      page: 1,
    });
  };

  const handleDownload = async (execution: ReportExecution) => {
    const canDownload = execution.status === 'completed' && execution.outputFile;

    if (!canDownload) {
      showNotification(
        'Descarga no disponible',
        'El reporte debe estar completado para poder descargarlo',
        'orange'
      );
      return;
    }

    try {
      const blob = await reportService.downloadReportExecution(execution.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = execution.outputFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onReportDownload?.(execution);
      showNotification('Descarga iniciada', `Descargando ${execution.outputFile.name}`, 'green');
    } catch (error) {
      showNotification('Error de descarga', 'No se pudo descargar el archivo', 'red');
    }
  };

  const handleRerun = async (execution: ReportExecution) => {
    try {
      await reportService.rerunReportExecution(execution.id);
      onReportRerun?.(execution.reportDefinitionId);
      loadExecutions();

      showNotification('Reporte re-ejecutado', 'El reporte se está ejecutando nuevamente', 'green');
    } catch (error) {
      showNotification('Error', 'No se pudo re-ejecutar el reporte', 'red');
    }
  };

  const handleCancel = async (execution: ReportExecution) => {
    try {
      await reportService.cancelReportExecution(execution.id);
      loadExecutions();

      showNotification('Reporte cancelado', 'La ejecución del reporte ha sido cancelada', 'orange');
    } catch (error) {
      showNotification('Error', 'No se pudo cancelar el reporte', 'red');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedExecutions.length === 0) return;

    try {
      setLoading(true);
      await executeBulkAction(
        action,
        selectedExecutions,
        executions,
        handleDownload,
        loadExecutions
      );
      setSelectedExecutions([]);
      closeBulkModal();
    } catch (error) {
      showNotification('Error', 'No se pudo completar la acción', 'red');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectionChange = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedExecutions((prev) => [...prev, id]);
    } else {
      setSelectedExecutions((prev) => prev.filter((execId) => execId !== id));
    }
  };

  const handleDetailModalOpen = (execution: ReportExecution) => {
    setSelectedExecution(execution);
    openDetailModal();
  };

  const renderDetailModal = () => {
    if (!selectedExecution) return null;

    const reportDefinition = reportDefinitions.find(
      (r) => r.id === selectedExecution.reportDefinitionId
    );

    return (
      <Modal
        opened={detailModalOpened}
        onClose={closeDetailModal}
        title="Detalles de Ejecución"
        size="lg"
      >
        <Stack gap="md">
          {renderExecutionDetails(
            selectedExecution,
            reportDefinition,
            getStatusBadge,
            getFormatIcon
          )}
          <Divider />
          {renderExecutionTiming(selectedExecution, formatDuration)}
          {renderExecutionFile(selectedExecution, formatFileSize)}
          {renderExecutionError(selectedExecution)}
          {renderExecutionParameters(selectedExecution)}
        </Stack>

        <Group justify="flex-end" mt="xl">
          <Button variant="light" onClick={closeDetailModal}>
            Cerrar
          </Button>
          {selectedExecution.status === 'completed' && selectedExecution.outputFile && (
            <Button
              leftSection={<IconDownload size={16} />}
              onClick={() => {
                handleDownload(selectedExecution);
                closeDetailModal();
              }}
            >
              Descargar
            </Button>
          )}
        </Group>
      </Modal>
    );
  };

  const renderFilterModal = () => {
    const handlers = createFilterModalHandlers(
      state,
      updateState,
      reportDefinitions,
      closeFilterModal
    );

    return (
      <Modal
        opened={filterModalOpened}
        onClose={closeFilterModal}
        title="Filtros Avanzados"
        size="md"
      >
        <Stack gap="md">
          <Grid>
            <Grid.Col span={6}>
              <Select
                label="Reporte"
                placeholder="Todos los reportes"
                data={reportDefinitions.map((r) => ({ value: r.id, label: r.name }))}
                value={state.filters.reportId}
                onChange={handlers.handleReportChange}
                clearable
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Estado"
                placeholder="Todos los estados"
                data={STATUS_OPTIONS}
                value={state.filters.status}
                onChange={handlers.handleStatusChange}
                clearable
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Formato"
                placeholder="Todos los formatos"
                data={FORMAT_OPTIONS}
                value={state.filters.format}
                onChange={handlers.handleFormatChange}
                clearable
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Usuario"
                placeholder="Filtrar por usuario"
                value={state.filters.createdBy || ''}
                onChange={handlers.handleUserChange}
              />
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={6}>
              <DatePickerInput
                label="Fecha Desde"
                placeholder="Seleccionar fecha"
                value={state.filters.startDate}
                onChange={handlers.handleStartDateChange}
                clearable
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <DatePickerInput
                label="Fecha Hasta"
                placeholder="Seleccionar fecha"
                value={state.filters.endDate}
                onChange={handlers.handleEndDateChange}
                clearable
              />
            </Grid.Col>
          </Grid>

          <Group justify="space-between" mt="md">
            <Button variant="light" onClick={handlers.handleClearFilters}>
              Limpiar Filtros
            </Button>
            <Group>
              <Button variant="light" onClick={closeFilterModal}>
                Cancelar
              </Button>
              <Button onClick={closeFilterModal}>Aplicar</Button>
            </Group>
          </Group>
        </Stack>
      </Modal>
    );
  };

  const executionStats = useMemo(() => {
    const completed = executions.filter((e) => e.status === 'completed');
    const running = executions.filter((e) => e.status === 'running' || e.status === 'pending');
    const failed = executions.filter((e) => e.status === 'failed');
    const withFiles = executions.filter((e) => e.outputFile);

    return {
      total: executions.length,
      completed: completed.length,
      running: running.length,
      failed: failed.length,
      totalSize: withFiles.reduce((sum, e) => sum + (e.outputFile?.size || 0), 0),
    };
  }, [executions]);

  const renderHeader = () => (
    <Group justify="space-between">
      <div>
        <Title order={3}>Historial de Reportes</Title>
        <Text c="dimmed" size="sm">
          Gestión y descarga de reportes ejecutados
        </Text>
      </div>

      <Group>
        <Badge variant="light">{executionStats.total} reportes</Badge>
        <Button
          variant="light"
          leftSection={<IconRefresh size={16} />}
          onClick={loadExecutions}
          loading={loading}
        >
          Actualizar
        </Button>
      </Group>
    </Group>
  );

  const renderStats = () => (
    <Grid>
      <Grid.Col span={3}>
        <Card withBorder p="sm">
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                Total
              </Text>
              <Text size="lg" fw={700}>
                {executionStats.total}
              </Text>
            </div>
            <IconDatabase size={24} color="var(--mantine-color-blue-6)" />
          </Group>
        </Card>
      </Grid.Col>
      <Grid.Col span={3}>
        <Card withBorder p="sm">
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                Completados
              </Text>
              <Text size="lg" fw={700} c="green">
                {executionStats.completed}
              </Text>
            </div>
            <IconCheck size={24} color="var(--mantine-color-green-6)" />
          </Group>
        </Card>
      </Grid.Col>
      <Grid.Col span={3}>
        <Card withBorder p="sm">
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                En Progreso
              </Text>
              <Text size="lg" fw={700} c="blue">
                {executionStats.running}
              </Text>
            </div>
            <IconClock size={24} color="var(--mantine-color-blue-6)" />
          </Group>
        </Card>
      </Grid.Col>
      <Grid.Col span={3}>
        <Card withBorder p="sm">
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                Fallidos
              </Text>
              <Text size="lg" fw={700} c="red">
                {executionStats.failed}
              </Text>
            </div>
            <IconAlertCircle size={24} color="var(--mantine-color-red-6)" />
          </Group>
        </Card>
      </Grid.Col>
    </Grid>
  );

  const renderTableBody = () => {
    if (loading) {
      return Array.from({ length: 5 }).map((_, index) => (
        <Table.Tr key={index}>
          <Table.Td>
            <Skeleton height={20} />
          </Table.Td>
          <Table.Td>
            <Skeleton height={20} />
          </Table.Td>
          <Table.Td>
            <Skeleton height={20} />
          </Table.Td>
          <Table.Td>
            <Skeleton height={20} />
          </Table.Td>
          <Table.Td>
            <Skeleton height={20} />
          </Table.Td>
          <Table.Td>
            <Skeleton height={20} />
          </Table.Td>
          <Table.Td>
            <Skeleton height={20} />
          </Table.Td>
          <Table.Td>
            <Skeleton height={20} />
          </Table.Td>
        </Table.Tr>
      ));
    }

    if (paginatedExecutions.length === 0) {
      return (
        <Table.Tr>
          <Table.Td colSpan={8}>
            <Center py="xl">
              <Stack align="center" gap="md">
                <IconHistory size={48} color="gray" />
                <div style={{ textAlign: 'center' }}>
                  <Text fw={500}>No hay reportes en el historial</Text>
                  <Text size="sm" c="dimmed">
                    Los reportes ejecutados aparecerán aquí
                  </Text>
                </div>
              </Stack>
            </Center>
          </Table.Td>
        </Table.Tr>
      );
    }

    return paginatedExecutions.map((execution) =>
      renderExecutionRow(
        execution,
        reportDefinitions,
        selectedExecutions,
        handleSelectionChange,
        handleDetailModalOpen,
        handleDownload,
        handleCancel,
        handleRerun
      )
    );
  };

  const renderControls = () => (
    <Group justify="space-between">
      <Group>
        <TextInput
          placeholder="Buscar reportes..."
          leftSection={<IconSearch size={16} />}
          value={state.filters.searchTerm}
          onChange={(e) =>
            updateState({
              filters: { ...state.filters, searchTerm: e.target.value },
              page: 1,
            })
          }
          w={300}
        />
        <Button variant="light" leftSection={<IconFilter size={16} />} onClick={openFilterModal}>
          Filtros
        </Button>
      </Group>

      <Group>
        {selectedExecutions.length > 0 && (
          <Group>
            <Text size="sm" c="dimmed">
              {selectedExecutions.length} seleccionados
            </Text>
            <Button
              variant="light"
              leftSection={<IconSettings size={16} />}
              onClick={openBulkModal}
            >
              Acciones
            </Button>
          </Group>
        )}
        <Select
          placeholder="Filas por página"
          data={[
            { value: '10', label: '10 filas' },
            { value: '25', label: '25 filas' },
            { value: '50', label: '50 filas' },
            { value: '100', label: '100 filas' },
          ]}
          value={String(state.pageSize)}
          onChange={(value: string | null) =>
            updateState({
              pageSize: Number(value || '25'),
              page: 1,
            })
          }
          w={120}
        />
      </Group>
    </Group>
  );

  return (
    <Container size="xl">
      <Stack gap="md">
        {renderHeader()}

        {renderStats()}

        {renderControls()}

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'all')}>
          <Tabs.List>
            <Tabs.Tab value="all">Todos ({executionStats.total})</Tabs.Tab>
            <Tabs.Tab value="completed" color="green">
              Completados ({executionStats.completed})
            </Tabs.Tab>
            <Tabs.Tab value="running" color="blue">
              En Progreso ({executionStats.running})
            </Tabs.Tab>
            <Tabs.Tab value="failed" color="red">
              Fallidos ({executionStats.failed})
            </Tabs.Tab>
            <Tabs.Tab value="scheduled" color="orange">
              Programados
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value={activeTab} pt="md">
            {/* Tabla */}
            <Card withBorder>
              <ScrollArea>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th w={40}>
                        <Checkbox
                          checked={
                            selectedExecutions.length === paginatedExecutions.length &&
                            paginatedExecutions.length > 0
                          }
                          indeterminate={
                            selectedExecutions.length > 0 &&
                            selectedExecutions.length < paginatedExecutions.length
                          }
                          onChange={(e) => {
                            const newSelection = e.currentTarget.checked
                              ? paginatedExecutions.map((e) => e.id)
                              : [];
                            setSelectedExecutions(newSelection);
                          }}
                        />
                      </Table.Th>
                      <Table.Th
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('reportDefinitionId')}
                      >
                        <Group gap="xs" wrap="nowrap">
                          <Text size="sm" fw={500}>
                            Reporte
                          </Text>
                          {state.sortBy === 'reportDefinitionId' &&
                            (state.sortDirection === 'asc' ? (
                              <IconSortAscending size={12} />
                            ) : (
                              <IconSortDescending size={12} />
                            ))}
                        </Group>
                      </Table.Th>
                      <Table.Th style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>
                        <Group gap="xs" wrap="nowrap">
                          <Text size="sm" fw={500}>
                            Estado
                          </Text>
                          {state.sortBy === 'status' &&
                            (state.sortDirection === 'asc' ? (
                              <IconSortAscending size={12} />
                            ) : (
                              <IconSortDescending size={12} />
                            ))}
                        </Group>
                      </Table.Th>
                      <Table.Th
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('startTime')}
                      >
                        <Group gap="xs" wrap="nowrap">
                          <Text size="sm" fw={500}>
                            Fecha
                          </Text>
                          {state.sortBy === 'startTime' &&
                            (state.sortDirection === 'asc' ? (
                              <IconSortAscending size={12} />
                            ) : (
                              <IconSortDescending size={12} />
                            ))}
                        </Group>
                      </Table.Th>
                      <Table.Th>
                        <Text size="sm" fw={500}>
                          Usuario
                        </Text>
                      </Table.Th>
                      <Table.Th>
                        <Text size="sm" fw={500}>
                          Duración
                        </Text>
                      </Table.Th>
                      <Table.Th>
                        <Text size="sm" fw={500}>
                          Archivo
                        </Text>
                      </Table.Th>
                      <Table.Th>
                        <Text size="sm" fw={500}>
                          Acciones
                        </Text>
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>{renderTableBody()}</Table.Tbody>
                </Table>
              </ScrollArea>

              {/* Paginación */}
              {totalPages > 1 && (
                <Group justify="center" mt="md">
                  <Pagination
                    total={totalPages}
                    value={state.page}
                    onChange={(page) => updateState({ page })}
                    size="sm"
                  />
                </Group>
              )}
            </Card>
          </Tabs.Panel>
        </Tabs>

        {/* Modales */}
        {renderDetailModal()}
        {renderFilterModal()}

        {/* Modal de acciones masivas */}
        <Modal opened={bulkModalOpened} onClose={closeBulkModal} title="Acciones Masivas" size="sm">
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              {selectedExecutions.length} reportes seleccionados
            </Text>

            <Stack gap="xs">
              <Button
                leftSection={<IconDownload size={16} />}
                onClick={() => handleBulkAction('download')}
                fullWidth
              >
                Descargar Todos
              </Button>
              <Button
                leftSection={<IconArchive size={16} />}
                onClick={() => handleBulkAction('archive')}
                variant="light"
                fullWidth
              >
                Archivar
              </Button>
              <Button
                leftSection={<IconTrash size={16} />}
                onClick={() => handleBulkAction('delete')}
                color="red"
                variant="light"
                fullWidth
              >
                Eliminar
              </Button>
            </Stack>

            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={closeBulkModal}>
                Cancelar
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
};
