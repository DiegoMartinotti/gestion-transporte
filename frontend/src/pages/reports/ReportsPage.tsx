import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import {
  Container,
  Title,
  Tabs,
  Paper,
  Group,
  Button,
  Stack,
  Grid,
  Card,
  Text,
  Badge,
  ActionIcon,
  Modal,
  Alert,
  Loader,
  Menu
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconReportAnalytics,
  IconPlus,
  IconTemplate,
  IconClock,
  IconHistory,
  IconEye,
  IconEdit,
  IconTrash,
  IconDots,
  IconSettings,
  IconRefresh
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExportOptions } from '../../components/reports/ExportOptions';
import { ScheduledReports } from '../../components/reports/ScheduledReports';
import { ReportHistory } from '../../components/reports/ReportHistory';
import {
  ReportDefinition,
  ReportData,
  ReportTemplate,
  ExportConfig,
  ReportExecution
} from '../../types/reports';
import { reportService } from '../../services/reportService';

// Lazy load de componentes complejos de reportes
const ReportBuilder = lazy(() => import('../../components/reports/ReportBuilder').then(module => ({ default: module.ReportBuilder })));
const ReportViewer = lazy(() => import('../../components/reports/ReportViewer').then(module => ({ default: module.ReportViewer })));

interface ReportTemplateCardProps {
  template: ReportTemplate;
  onUse: (template: ReportTemplate) => void;
}

const ReportTemplateCard: React.FC<ReportTemplateCardProps> = ({ template, onUse }) => (
  <Card withBorder p="md" style={{ cursor: 'pointer' }} onClick={() => onUse(template)}>
    <Stack gap="sm">
      <Group justify="space-between">
        <Badge variant="light" size="sm">{template.category}</Badge>
        {template.isPopular && <Badge color="yellow" size="sm">Popular</Badge>}
      </Group>
      <Title order={5}>{template.name}</Title>
      <Text size="sm" c="dimmed" lineClamp={2}>
        {template.description}
      </Text>
      <Group gap="xs">
        {template.tags.map(tag => (
          <Badge key={tag} variant="outline" size="xs">{tag}</Badge>
        ))}
      </Group>
    </Stack>
  </Card>
);

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reportDefinitions, setReportDefinitions] = useState<ReportDefinition[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  // Modals
  const [templatesModalOpened, { open: openTemplatesModal, close: closeTemplatesModal }] = useDisclosure(false);

  // Load data
  const loadReportDefinitions = useCallback(async () => {
    try {
      setLoading(true);
      const definitions = await reportService.getReportDefinitions();
      setReportDefinitions(definitions);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudieron cargar las definiciones de reportes',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      const templatesData = await reportService.getReportTemplates();
      setTemplates(templatesData);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudieron cargar las plantillas',
        color: 'red'
      });
    }
  }, []);

  useEffect(() => {
    loadReportDefinitions();
    loadTemplates();
  }, [loadReportDefinitions, loadTemplates]);

  // Report actions
  const handleExecuteReport = async (definition: ReportDefinition) => {
    try {
      setReportLoading(true);
      setSelectedReport(definition);
      
      const data = await reportService.executeReport(definition.id);
      setReportData(data);
      setActiveTab('viewer');
      
      notifications.show({
        title: 'Reporte generado',
        message: `Reporte "${definition.name}" ejecutado correctamente`,
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudo ejecutar el reporte',
        color: 'red'
      });
    } finally {
      setReportLoading(false);
    }
  };

  const handleEditReport = (definition: ReportDefinition) => {
    setSelectedReport(definition);
    setActiveTab('builder');
  };

  const handleDeleteReport = async (definition: ReportDefinition) => {
    try {
      await reportService.deleteReportDefinition(definition.id);
      await loadReportDefinitions();
      
      notifications.show({
        title: 'Eliminado',
        message: `Reporte "${definition.name}" eliminado correctamente`,
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudo eliminar el reporte',
        color: 'red'
      });
    }
  };

  const handleUseTemplate = async (template: ReportTemplate) => {
    try {
      const newReport = await reportService.createReportFromTemplate(template.id);
      await loadReportDefinitions();
      setSelectedReport(newReport);
      setActiveTab('builder');
      closeTemplatesModal();
      
      notifications.show({
        title: 'Plantilla aplicada',
        message: `Reporte creado desde la plantilla "${template.name}"`,
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudo crear el reporte desde la plantilla',
        color: 'red'
      });
    }
  };

  const handleCreateNew = () => {
    setSelectedReport(null);
    setActiveTab('builder');
  };

  const handleReportSaved = (report: ReportDefinition) => {
    loadReportDefinitions();
    setActiveTab('dashboard');
    
    notifications.show({
      title: 'Guardado',
      message: `Reporte "${report.name}" guardado correctamente`,
      color: 'green'
    });
  };

  const handleExport = async (config: ExportConfig) => {
    if (!selectedReport || !reportData) return;
    
    try {
      const blob = await reportService.exportReportData(reportData, config);
      const fileName = config.fileName || reportService.generateFileName(selectedReport.name, config.format);
      reportService.downloadBlob(blob, fileName);
      
      notifications.show({
        title: 'Exportación exitosa',
        message: `Archivo descargado: ${fileName}`,
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Error de exportación',
        message: 'No se pudo exportar el reporte',
        color: 'red'
      });
    }
  };

  const getReportTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'financial': 'green',
      'operations': 'blue',
      'vehicle': 'orange',
      'client': 'purple',
      'partidas': 'red',
      'trips': 'cyan',
      'routes': 'yellow',
      'custom': 'gray'
    };
    return colors[type] || 'gray';
  };

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'financial': 'Financiero',
      'operations': 'Operaciones',
      'vehicle': 'Vehículos',
      'client': 'Clientes',
      'partidas': 'Partidas',
      'trips': 'Viajes',
      'routes': 'Rutas',
      'custom': 'Personalizado'
    };
    return labels[type] || type;
  };

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="xl">
        <Group gap="xs">
          <IconReportAnalytics size={28} />
          <Title order={2}>Sistema de Reportes</Title>
        </Group>
        <Group gap="xs">
          <Button
            variant="light"
            leftSection={<IconTemplate size={16} />}
            onClick={openTemplatesModal}
          >
            Plantillas
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleCreateNew}
          >
            Nuevo Reporte
          </Button>
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'dashboard')}>
        <Tabs.List>
          <Tabs.Tab value="dashboard" leftSection={<IconReportAnalytics size={16} />}>
            Dashboard
          </Tabs.Tab>
          <Tabs.Tab value="builder" leftSection={<IconSettings size={16} />}>
            Constructor
          </Tabs.Tab>
          <Tabs.Tab value="viewer" leftSection={<IconEye size={16} />}>
            Visualizador
          </Tabs.Tab>
          <Tabs.Tab value="scheduled" leftSection={<IconClock size={16} />}>
            Programados
          </Tabs.Tab>
          <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
            Historial
          </Tabs.Tab>
        </Tabs.List>

        {/* Dashboard Tab */}
        <Tabs.Panel value="dashboard" pt="md">
          <Stack gap="lg">
            {/* Summary Cards */}
            <Grid>
              <Grid.Col span={3}>
                <Card withBorder>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Total de Reportes
                  </Text>
                  <Text size="xl" fw={700}>
                    {reportDefinitions.length}
                  </Text>
                </Card>
              </Grid.Col>
              <Grid.Col span={3}>
                <Card withBorder>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Plantillas Disponibles
                  </Text>
                  <Text size="xl" fw={700} c="blue">
                    {templates.length}
                  </Text>
                </Card>
              </Grid.Col>
              <Grid.Col span={3}>
                <Card withBorder>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Reportes Activos
                  </Text>
                  <Text size="xl" fw={700} c="green">
                    {reportDefinitions.filter(r => !r.isTemplate).length}
                  </Text>
                </Card>
              </Grid.Col>
              <Grid.Col span={3}>
                <Card withBorder>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Tipos Únicos
                  </Text>
                  <Text size="xl" fw={700} c="orange">
                    {new Set(reportDefinitions.map(r => r.type)).size}
                  </Text>
                </Card>
              </Grid.Col>
            </Grid>

            {/* Reports List */}
            <Paper p="md" withBorder>
              <Group justify="space-between" mb="md">
                <Title order={4}>Mis Reportes</Title>
                <Group gap="xs">
                  <Button
                    variant="light"
                    leftSection={<IconRefresh size={16} />}
                    onClick={loadReportDefinitions}
                    loading={loading}
                  >
                    Actualizar
                  </Button>
                </Group>
              </Group>

              {loading ? (
                <Group justify="center" py="xl">
                  <Loader />
                  <Text>Cargando reportes...</Text>
                </Group>
              ) : reportDefinitions.length === 0 ? (
                <Alert color="blue" title="Sin reportes">
                  No hay reportes creados. Haga clic en "Nuevo Reporte" o use una plantilla para comenzar.
                </Alert>
              ) : (
                <Grid>
                  {reportDefinitions.map((report) => (
                    <Grid.Col key={report.id} span={6}>
                      <Card withBorder>
                        <Stack gap="sm">
                          <Group justify="space-between">
                            <Badge color={getReportTypeColor(report.type)} size="sm">
                              {getReportTypeLabel(report.type)}
                            </Badge>
                            <Menu>
                              <Menu.Target>
                                <ActionIcon variant="light">
                                  <IconDots size={16} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Item
                                  leftSection={<IconEye size={14} />}
                                  onClick={() => handleExecuteReport(report)}
                                >
                                  Ejecutar
                                </Menu.Item>
                                <Menu.Item
                                  leftSection={<IconEdit size={14} />}
                                  onClick={() => handleEditReport(report)}
                                >
                                  Editar
                                </Menu.Item>
                                <Menu.Divider />
                                <Menu.Item
                                  leftSection={<IconTrash size={14} />}
                                  color="red"
                                  onClick={() => handleDeleteReport(report)}
                                >
                                  Eliminar
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          </Group>

                          <div>
                            <Title order={5}>{report.name}</Title>
                            {report.description && (
                              <Text size="sm" c="dimmed" lineClamp={2}>
                                {report.description}
                              </Text>
                            )}
                          </div>

                          <Group gap="xs">
                            <Text size="xs" c="dimmed">
                              Actualizado: {format(report.updatedAt, 'dd/MM/yyyy', { locale: es })}
                            </Text>
                          </Group>

                          <Group gap="xs">
                            {report.tags?.map(tag => (
                              <Badge key={tag} variant="outline" size="xs">
                                {tag}
                              </Badge>
                            ))}
                          </Group>

                          <Group justify="space-between">
                            <Group gap="xs">
                              <Text size="xs" c="dimmed">
                                {report.fields?.length || 0} campos
                              </Text>
                              <Text size="xs" c="dimmed">
                                {report.charts?.length || 0} gráficos
                              </Text>
                            </Group>
                            <Button
                              size="xs"
                              leftSection={<IconEye size={14} />}
                              onClick={() => handleExecuteReport(report)}
                              loading={reportLoading && selectedReport?.id === report.id}
                            >
                              Ejecutar
                            </Button>
                          </Group>
                        </Stack>
                      </Card>
                    </Grid.Col>
                  ))}
                </Grid>
              )}
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* Builder Tab */}
        <Tabs.Panel value="builder" pt="md">
          <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Cargando constructor de reportes...</div>}>
            <ReportBuilder
              reportId={selectedReport?.id}
              onSave={handleReportSaved}
            />
          </Suspense>
        </Tabs.Panel>

        {/* Viewer Tab */}
        <Tabs.Panel value="viewer" pt="md">
          {selectedReport && reportData ? (
            <Stack gap="md">
              <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Cargando visualizador de reportes...</div>}>
                <ReportViewer
                  reportDefinition={selectedReport}
                  data={reportData}
                  loading={reportLoading}
                  onRefresh={() => handleExecuteReport(selectedReport)}
                  onExport={handleExport}
                />
              </Suspense>
              
              <ExportOptions
                reportDefinition={selectedReport}
                reportData={reportData}
                onExportComplete={(_, filename) => {
                  notifications.show({
                    title: 'Exportación completada',
                    message: `Archivo ${filename} descargado correctamente`,
                    color: 'green'
                  });
                }}
              />
            </Stack>
          ) : (
            <Alert color="blue" title="Seleccione un reporte">
              Ejecute un reporte desde el dashboard para visualizar los datos aquí.
            </Alert>
          )}
        </Tabs.Panel>

        {/* Scheduled Tab */}
        <Tabs.Panel value="scheduled" pt="md">
          <ScheduledReports
            reportDefinitions={reportDefinitions}
            onScheduleCreate={(schedule) => {
              notifications.show({
                title: 'Programación creada',
                message: `Reporte "${schedule.name}" programado correctamente`,
                color: 'green'
              });
            }}
          />
        </Tabs.Panel>

        {/* History Tab */}
        <Tabs.Panel value="history" pt="md">
          <ReportHistory
            reportDefinitions={reportDefinitions}
            onReportDownload={(execution: ReportExecution) => {
              notifications.show({
                title: 'Descarga iniciada',
                message: `Descargando reporte: ${execution.reportDefinitionId}`,
                color: 'blue'
              });
            }}
          />
        </Tabs.Panel>
      </Tabs>

      {/* Templates Modal */}
      <Modal
        opened={templatesModalOpened}
        onClose={closeTemplatesModal}
        title="Plantillas de Reportes"
        size="xl"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Seleccione una plantilla para crear un nuevo reporte basado en configuraciones predefinidas.
          </Text>
          
          {templates.length === 0 ? (
            <Alert color="blue">
              No hay plantillas disponibles en este momento.
            </Alert>
          ) : (
            <Grid>
              {templates.map((template) => (
                <Grid.Col key={template.id} span={6}>
                  <ReportTemplateCard
                    template={template}
                    onUse={handleUseTemplate}
                  />
                </Grid.Col>
              ))}
            </Grid>
          )}
        </Stack>
      </Modal>
    </Container>
  );
};