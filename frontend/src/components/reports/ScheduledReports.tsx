import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
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
  Alert,
  Modal,
  TextInput,
  Select,
  MultiSelect,
  Switch,
  Divider,
  Tabs,
  Container,
  Box,
  Tooltip,
  Menu,
  NumberInput,
  Checkbox,
  Code,
  Timeline,
  Center,
  Skeleton
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconClock,
  IconPlus,
  IconEdit,
  IconTrash,
  IconPlayerPlay,
  IconPlayerPause,
  IconCalendar,
  IconMail,
  IconRefresh,
  IconSettings,
  IconEye,
  IconDots,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconCalendarStats,
  IconClockHour12,
  IconUsers,
  IconFileExport,
  IconBell,
  IconHistory,
  IconChevronRight
} from '@tabler/icons-react';
import { format, addDays, addWeeks, addMonths, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ScheduledReport,
  ReportDefinition,
  ScheduleFrequency,
  ExportFormat
} from '../../types/reports';
import { reportService } from '../../services/reportService';

interface ScheduledReportsProps {
  reportDefinitions: ReportDefinition[];
  onScheduleCreate?: (schedule: ScheduledReport) => void;
  onScheduleUpdate?: (schedule: ScheduledReport) => void;
  onScheduleDelete?: (scheduleId: string) => void;
}

interface ScheduleFormData {
  reportDefinitionId: string;
  name: string;
  description: string;
  frequency: ScheduleFrequency;
  scheduleConfig: {
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    timezone: string;
  };
  recipients: string[];
  exportFormats: ExportFormat[];
  isActive: boolean;
}

const FREQUENCY_OPTIONS = [
  { value: 'daily' as ScheduleFrequency, label: 'Diario', description: 'Ejecuta todos los días' },
  { value: 'weekly' as ScheduleFrequency, label: 'Semanal', description: 'Ejecuta una vez por semana' },
  { value: 'monthly' as ScheduleFrequency, label: 'Mensual', description: 'Ejecuta una vez por mes' },
  { value: 'quarterly' as ScheduleFrequency, label: 'Trimestral', description: 'Ejecuta cada 3 meses' }
];

const EXPORT_FORMAT_OPTIONS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel' },
  { value: 'csv', label: 'CSV' }
];

const DAYS_OF_WEEK = [
  { value: '1', label: 'Lunes' },
  { value: '2', label: 'Martes' },
  { value: '3', label: 'Miércoles' },
  { value: '4', label: 'Jueves' },
  { value: '5', label: 'Viernes' },
  { value: '6', label: 'Sábado' },
  { value: '0', label: 'Domingo' }
];

const TIMEZONE_OPTIONS = [
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },
  { value: 'America/Santiago', label: 'Santiago (GMT-3/-4)' },
  { value: 'America/Montevideo', label: 'Montevideo (GMT-3)' }
];

export const ScheduledReports: React.FC<ScheduledReportsProps> = ({
  reportDefinitions,
  onScheduleCreate,
  onScheduleUpdate,
  onScheduleDelete
}) => {
  const [schedules, setSchedules] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduledReport | null>(null);
  const [activeTab, setActiveTab] = useState<string>('list');

  const form = useForm<ScheduleFormData>({
    initialValues: {
      reportDefinitionId: '',
      name: '',
      description: '',
      frequency: 'daily',
      scheduleConfig: {
        time: '09:00',
        timezone: 'America/Argentina/Buenos_Aires'
      },
      recipients: [],
      exportFormats: ['pdf'],
      isActive: true
    },
    validate: {
      reportDefinitionId: (value) => !value ? 'Debe seleccionar un reporte' : null,
      name: (value) => !value?.trim() ? 'Debe especificar un nombre' : null,
      recipients: (value) => !value?.length ? 'Debe especificar al menos un destinatario' : null,
      exportFormats: (value) => !value?.length ? 'Debe seleccionar al menos un formato' : null
    }
  });

  // Load scheduled reports
  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const data = await reportService.getScheduledReports();
      setSchedules(data);
    } catch (error) {
      console.error('Error loading scheduled reports:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudieron cargar los reportes programados',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleSubmit = async (values: ScheduleFormData) => {
    try {
      if (editingSchedule) {
        const updatedSchedule = await reportService.updateScheduledReport(editingSchedule.id, values);
        setSchedules(prev => prev.map(s => s.id === editingSchedule.id ? updatedSchedule : s));
        onScheduleUpdate?.(updatedSchedule);
        notifications.show({
          title: 'Reporte actualizado',
          message: 'El reporte programado se actualizó correctamente',
          color: 'green'
        });
      } else {
        const newSchedule = await reportService.createScheduledReport(values);
        setSchedules(prev => [newSchedule, ...prev]);
        onScheduleCreate?.(newSchedule);
        notifications.show({
          title: 'Reporte programado',
          message: 'El reporte se programó correctamente',
          color: 'green'
        });
      }
      
      closeModal();
      form.reset();
      setEditingSchedule(null);
    } catch (error) {
      console.error('Error saving scheduled report:', error);
      notifications.show({
        title: 'Error',
        message: editingSchedule ? 'No se pudo actualizar el reporte' : 'No se pudo programar el reporte',
        color: 'red'
      });
    }
  };

  const handleEdit = (schedule: ScheduledReport) => {
    setEditingSchedule(schedule);
    form.setValues({
      reportDefinitionId: schedule.reportDefinitionId,
      name: schedule.name,
      description: schedule.description || '',
      frequency: schedule.frequency,
      scheduleConfig: schedule.scheduleConfig,
      recipients: schedule.recipients,
      exportFormats: schedule.exportFormats,
      isActive: schedule.isActive
    });
    openModal();
  };

  const handleDelete = async (schedule: ScheduledReport) => {
    try {
      await reportService.deleteScheduledReport(schedule.id);
      setSchedules(prev => prev.filter(s => s.id !== schedule.id));
      onScheduleDelete?.(schedule.id);
      notifications.show({
        title: 'Reporte eliminado',
        message: 'El reporte programado se eliminó correctamente',
        color: 'green'
      });
    } catch (error) {
      console.error('Error deleting scheduled report:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudo eliminar el reporte programado',
        color: 'red'
      });
    }
  };

  const handleToggleActive = async (schedule: ScheduledReport) => {
    try {
      const updatedSchedule = await reportService.updateScheduledReport(schedule.id, {
        ...schedule,
        isActive: !schedule.isActive
      });
      setSchedules(prev => prev.map(s => s.id === schedule.id ? updatedSchedule : s));
      notifications.show({
        title: schedule.isActive ? 'Reporte pausado' : 'Reporte activado',
        message: `El reporte se ${schedule.isActive ? 'pausó' : 'activó'} correctamente`,
        color: 'green'
      });
    } catch (error) {
      console.error('Error toggling schedule:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudo cambiar el estado del reporte',
        color: 'red'
      });
    }
  };

  const getNextRunDate = (schedule: ScheduledReport): Date => {
    const now = new Date();
    const { time, dayOfWeek, dayOfMonth } = schedule.scheduleConfig;
    const [hours, minutes] = time.split(':').map(Number);
    
    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);
    
    switch (schedule.frequency) {
      case 'daily':
        if (nextRun <= now) {
          nextRun = addDays(nextRun, 1);
        }
        break;
      case 'weekly':
        if (dayOfWeek !== undefined) {
          const daysUntilTarget = (dayOfWeek - nextRun.getDay() + 7) % 7;
          nextRun = addDays(nextRun, daysUntilTarget);
          if (nextRun <= now) {
            nextRun = addWeeks(nextRun, 1);
          }
        }
        break;
      case 'monthly':
        if (dayOfMonth !== undefined) {
          nextRun.setDate(dayOfMonth);
          if (nextRun <= now) {
            nextRun = addMonths(nextRun, 1);
          }
        }
        break;
      case 'quarterly':
        if (dayOfMonth !== undefined) {
          nextRun.setDate(dayOfMonth);
          if (nextRun <= now) {
            nextRun = addMonths(nextRun, 3);
          }
        }
        break;
    }
    
    return nextRun;
  };

  const getScheduleStatus = (schedule: ScheduledReport): string => {
    if (!schedule.isActive) return 'Pausado';
    
    const now = new Date();
    const nextRun = getNextRunDate(schedule);
    
    if (isBefore(nextRun, now)) return 'Vencido';
    return 'Activo';
  };

  const renderScheduleForm = () => (
    <Stack gap="md">
      <Grid>
        <Grid.Col span={6}>
          <Select
            label="Reporte"
            placeholder="Seleccione el reporte a programar"
            data={reportDefinitions.map(report => ({
              value: report.id,
              label: report.name
            }))}
            {...form.getInputProps('reportDefinitionId')}
            required
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput
            label="Nombre del Programa"
            placeholder="Ej: Reporte Diario de Ventas"
            {...form.getInputProps('name')}
            required
          />
        </Grid.Col>
      </Grid>

      <TextInput
        label="Descripción (Opcional)"
        placeholder="Descripción del programa de reportes"
        {...form.getInputProps('description')}
      />

      <Divider label="Configuración de Frecuencia" />

      <Grid>
        <Grid.Col span={6}>
          <Select
            label="Frecuencia"
            data={FREQUENCY_OPTIONS}
            {...form.getInputProps('frequency')}
            required
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TimeInput
            label="Hora de Ejecución"
            {...form.getInputProps('scheduleConfig.time')}
            required
          />
        </Grid.Col>
      </Grid>

      {form.values.frequency === 'weekly' && (
        <Select
          label="Día de la Semana"
          data={DAYS_OF_WEEK}
          {...form.getInputProps('scheduleConfig.dayOfWeek')}
          required
        />
      )}

      {(form.values.frequency === 'monthly' || form.values.frequency === 'quarterly') && (
        <NumberInput
          label="Día del Mes"
          min={1}
          max={31}
          {...form.getInputProps('scheduleConfig.dayOfMonth')}
          required
        />
      )}

      <Select
        label="Zona Horaria"
        data={TIMEZONE_OPTIONS}
        {...form.getInputProps('scheduleConfig.timezone')}
        required
      />

      <Divider label="Destinatarios y Formatos" />

      <MultiSelect
        label="Destinatarios de Email"
        placeholder="Agregue direcciones de email"
        data={[]}
        searchable
        {...form.getInputProps('recipients')}
        required
      />

      <MultiSelect
        label="Formatos de Exportación"
        data={EXPORT_FORMAT_OPTIONS}
        {...form.getInputProps('exportFormats')}
        required
      />

      <Switch
        label="Activo"
        description="El reporte se ejecutará según la programación configurada"
        {...form.getInputProps('isActive', { type: 'checkbox' })}
      />
    </Stack>
  );

  const renderSchedulesList = () => {
    if (loading) {
      return (
        <Stack gap="md">
          {[...Array(3)].map((_, index) => (
            <Card key={index} withBorder p="md">
              <Skeleton height={20} mb="md" />
              <Skeleton height={16} width="70%" mb="sm" />
              <Skeleton height={14} width="50%" />
            </Card>
          ))}
        </Stack>
      );
    }

    if (schedules.length === 0) {
      return (
        <Center py="xl">
          <Stack align="center" gap="md">
            <IconCalendarStats size={64} color="var(--mantine-color-gray-5)" />
            <div style={{ textAlign: 'center' }}>
              <Text size="lg" fw={500}>No hay reportes programados</Text>
              <Text c="dimmed" size="sm">
                Comience creando su primer reporte programado
              </Text>
            </div>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => {
                setEditingSchedule(null);
                form.reset();
                openModal();
              }}
            >
              Programar Reporte
            </Button>
          </Stack>
        </Center>
      );
    }

    return (
      <Stack gap="md">
        {schedules.map((schedule) => {
          const reportDef = reportDefinitions.find(r => r.id === schedule.reportDefinitionId);
          const nextRun = getNextRunDate(schedule);
          const status = getScheduleStatus(schedule);
          
          return (
            <Card key={schedule.id} withBorder p="md">
              <Group justify="space-between" mb="sm">
                <div>
                  <Group gap="sm">
                    <Text fw={500} size="lg">{schedule.name}</Text>
                    <Badge
                      color={
                        status === 'Activo' ? 'green' :
                        status === 'Pausado' ? 'gray' : 'red'
                      }
                      variant="light"
                    >
                      {status}
                    </Badge>
                  </Group>
                  <Text c="dimmed" size="sm">
                    {reportDef?.name || 'Reporte no encontrado'}
                  </Text>
                </div>
                
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <ActionIcon variant="subtle">
                      <IconDots size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IconEye size={14} />}
                      onClick={() => handleEdit(schedule)}
                    >
                      Ver/Editar
                    </Menu.Item>
                    <Menu.Item
                      leftSection={schedule.isActive ? <IconPlayerPause size={14} /> : <IconPlayerPlay size={14} />}
                      onClick={() => handleToggleActive(schedule)}
                    >
                      {schedule.isActive ? 'Pausar' : 'Activar'}
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      color="red"
                      leftSection={<IconTrash size={14} />}
                      onClick={() => handleDelete(schedule)}
                    >
                      Eliminar
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
              
              {schedule.description && (
                <Text size="sm" c="dimmed" mb="sm">
                  {schedule.description}
                </Text>
              )}
              
              <Grid>
                <Grid.Col span={6}>
                  <Stack gap="xs">
                    <Group gap="xs">
                      <IconClock size={14} />
                      <Text size="sm">
                        {FREQUENCY_OPTIONS.find(f => f.value === schedule.frequency)?.label} a las {schedule.scheduleConfig.time}
                      </Text>
                    </Group>
                    <Group gap="xs">
                      <IconCalendar size={14} />
                      <Text size="sm">
                        Próxima ejecución: {format(nextRun, 'dd/MM/yyyy HH:mm', { locale: es })}
                      </Text>
                    </Group>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Stack gap="xs">
                    <Group gap="xs">
                      <IconMail size={14} />
                      <Text size="sm">
                        {schedule.recipients.length} destinatario{schedule.recipients.length !== 1 ? 's' : ''}
                      </Text>
                    </Group>
                    <Group gap="xs">
                      <IconFileExport size={14} />
                      <Text size="sm">
                        Formatos: {schedule.exportFormats.join(', ').toUpperCase()}
                      </Text>
                    </Group>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Card>
          );
        })}
      </Stack>
    );
  };

  const renderExecutionHistory = () => (
    <Alert color="blue" icon={<IconHistory size={16} />}>
      El historial de ejecuciones estará disponible próximamente. 
      Podrá ver todas las ejecuciones pasadas, estados y archivos generados.
    </Alert>
  );

  return (
    <Container size="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Title order={2}>Reportes Programados</Title>
            <Text c="dimmed" size="sm">
              Configure y gestione la ejecución automática de reportes
            </Text>
          </div>
          
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              setEditingSchedule(null);
              form.reset();
              openModal();
            }}
          >
            Programar Reporte
          </Button>
        </Group>

        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'list')}>
          <Tabs.List>
            <Tabs.Tab value="list" leftSection={<IconCalendarStats size={16} />}>
              Programaciones
            </Tabs.Tab>
            <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
              Historial
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="list" pt="md">
            {renderSchedulesList()}
          </Tabs.Panel>

          <Tabs.Panel value="history" pt="md">
            {renderExecutionHistory()}
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Modal de Programación */}
      <Modal
        opened={modalOpened}
        onClose={() => {
          closeModal();
          form.reset();
          setEditingSchedule(null);
        }}
        title={editingSchedule ? 'Editar Reporte Programado' : 'Programar Nuevo Reporte'}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          {renderScheduleForm()}
          
          <Group justify="flex-end" mt="md">
            <Button
              variant="light"
              onClick={() => {
                closeModal();
                form.reset();
                setEditingSchedule(null);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingSchedule ? 'Actualizar' : 'Programar'}
            </Button>
          </Group>
        </form>
      </Modal>
    </Container>
  );
};