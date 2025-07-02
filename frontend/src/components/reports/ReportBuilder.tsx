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
  Select,
  TextInput,
  Textarea,
  Divider,
  ActionIcon,
  Badge,
  Alert,
  Tabs,
  MultiSelect,
  NumberInput,
  Switch,
  Modal,
  Checkbox,
  Accordion,
  ScrollArea
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus,
  IconTrash,
  IconFilter,
  IconEye,
  IconDeviceFloppy,
  IconSettings,
  IconChartBar,
  IconTable,
  IconRefresh,
  IconTemplate,
  IconAlertCircle,
  IconChevronDown,
  IconChevronUp
} from '@tabler/icons-react';
import {
  ReportDefinition,
  ReportField,
  ReportFilter,
  ReportGroupBy,
  ReportAggregation,
  ReportSorting,
  ChartConfig,
  FilterOperator,
  AggregationFunction,
  ChartType,
  DataSource,
  ReportType,
  ReportTemplate,
  DateRange
} from '../../types/reports';
import { reportService } from '../../services/reportService';

interface ReportBuilderProps {
  reportId?: string;
  template?: ReportTemplate;
  onSave?: (report: ReportDefinition) => void;
  onPreview?: (definition: Partial<ReportDefinition>) => void;
}

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'financial', label: 'Financiero' },
  { value: 'operations', label: 'Operaciones' },
  { value: 'vehicle', label: 'Vehículos' },
  { value: 'client', label: 'Clientes' },
  { value: 'partidas', label: 'Partidas' },
  { value: 'trips', label: 'Viajes' },
  { value: 'routes', label: 'Rutas' },
  { value: 'custom', label: 'Personalizado' }
];

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: 'bar', label: 'Barras' },
  { value: 'line', label: 'Líneas' },
  { value: 'area', label: 'Área' },
  { value: 'pie', label: 'Circular' },
  { value: 'radar', label: 'Radar' },
  { value: 'scatter', label: 'Dispersión' }
];

const FILTER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'equals', label: 'Igual a' },
  { value: 'contains', label: 'Contiene' },
  { value: 'greaterThan', label: 'Mayor que' },
  { value: 'lessThan', label: 'Menor que' },
  { value: 'between', label: 'Entre' },
  { value: 'in', label: 'En' },
  { value: 'not_in', label: 'No en' },
  { value: 'is_null', label: 'Es nulo' },
  { value: 'is_not_null', label: 'No es nulo' }
];

const AGGREGATION_FUNCTIONS: { value: AggregationFunction; label: string }[] = [
  { value: 'sum', label: 'Suma' },
  { value: 'avg', label: 'Promedio' },
  { value: 'count', label: 'Contar' },
  { value: 'min', label: 'Mínimo' },
  { value: 'max', label: 'Máximo' },
  { value: 'median', label: 'Mediana' },
  { value: 'distinct_count', label: 'Contar distintos' }
];

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'last7days', label: 'Últimos 7 días' },
  { value: 'last30days', label: 'Últimos 30 días' },
  { value: 'thisMonth', label: 'Este mes' },
  { value: 'lastMonth', label: 'Mes pasado' },
  { value: 'thisYear', label: 'Este año' },
  { value: 'lastYear', label: 'Año pasado' },
  { value: 'custom', label: 'Personalizado' }
];

export const ReportBuilder: React.FC<ReportBuilderProps> = ({ 
  reportId, 
  template, 
  onSave, 
  onPreview 
}) => {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  const [availableFields, setAvailableFields] = useState<ReportField[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [previewModalOpened, { open: openPreviewModal, close: closePreviewModal }] = useDisclosure(false);

  const form = useForm<Partial<ReportDefinition>>({
    initialValues: {
      name: template?.name || '',
      description: template?.description || '',
      type: template?.type || 'custom',
      dataSource: template?.definition.dataSource || '',
      fields: template?.definition.fields || [],
      filters: template?.definition.filters || [],
      groupBy: template?.definition.groupBy || [],
      aggregations: template?.definition.aggregations || [],
      sorting: template?.definition.sorting || [],
      charts: template?.definition.charts || [],
      defaultDateRange: template?.definition.defaultDateRange || 'last30days',
      limit: template?.definition.limit || 1000,
      tags: template?.tags || []
    },
    validate: {
      name: (value) => (!value ? 'El nombre es requerido' : null),
      dataSource: (value) => (!value ? 'Debe seleccionar una fuente de datos' : null),
      fields: (value) => (!value || value.length === 0 ? 'Debe seleccionar al menos un campo' : null)
    }
  });

  const loadDataSources = useCallback(async () => {
    try {
      setLoading(true);
      const sources = await reportService.getDataSources();
      setDataSources(sources);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudieron cargar las fuentes de datos',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReport = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const report = await reportService.getReportDefinition(id);
      form.setValues(report);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudo cargar el reporte',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    loadDataSources();
    if (reportId) {
      loadReport(reportId);
    }
  }, [loadDataSources, loadReport, reportId]);

  useEffect(() => {
    const source = dataSources.find(ds => ds.key === form.values.dataSource);
    if (source) {
      setSelectedDataSource(source);
      setAvailableFields(source.fields);
    }
  }, [form.values.dataSource, dataSources]);

  const addFilter = () => {
    const newFilter: ReportFilter = {
      id: `filter_${Date.now()}`,
      field: availableFields[0]?.key || '',
      operator: 'equals',
      value: '',
      label: `Filtro ${(form.values.filters?.length || 0) + 1}`
    };
    form.setFieldValue('filters', [...(form.values.filters || []), newFilter]);
  };

  const removeFilter = (index: number) => {
    const filters = [...(form.values.filters || [])];
    filters.splice(index, 1);
    form.setFieldValue('filters', filters);
  };

  const updateFilter = (index: number, updates: Partial<ReportFilter>) => {
    const filters = [...(form.values.filters || [])];
    filters[index] = { ...filters[index], ...updates };
    form.setFieldValue('filters', filters);
  };

  const addGroupBy = () => {
    const newGroupBy: ReportGroupBy = {
      field: availableFields[0]?.key || '',
      label: availableFields[0]?.label || ''
    };
    form.setFieldValue('groupBy', [...(form.values.groupBy || []), newGroupBy]);
  };

  const removeGroupBy = (index: number) => {
    const groupBy = [...(form.values.groupBy || [])];
    groupBy.splice(index, 1);
    form.setFieldValue('groupBy', groupBy);
  };

  const addAggregation = () => {
    const numericFields = availableFields.filter(f => f.type === 'number' || f.type === 'currency');
    const newAggregation: ReportAggregation = {
      field: numericFields[0]?.key || availableFields[0]?.key || '',
      function: 'sum',
      label: `${AGGREGATION_FUNCTIONS[0].label} de ${numericFields[0]?.label || availableFields[0]?.label || ''}`
    };
    form.setFieldValue('aggregations', [...(form.values.aggregations || []), newAggregation]);
  };

  const removeAggregation = (index: number) => {
    const aggregations = [...(form.values.aggregations || [])];
    aggregations.splice(index, 1);
    form.setFieldValue('aggregations', aggregations);
  };

  const addChart = () => {
    const newChart: ChartConfig = {
      type: 'bar',
      title: `Gráfico ${(form.values.charts?.length || 0) + 1}`,
      xAxis: availableFields[0]?.key || '',
      yAxis: [availableFields.find(f => f.type === 'number')?.key || availableFields[1]?.key || ''],
      showLegend: true,
      showGrid: true,
      showTooltip: true,
      height: 300
    };
    form.setFieldValue('charts', [...(form.values.charts || []), newChart]);
  };

  const removeChart = (index: number) => {
    const charts = [...(form.values.charts || [])];
    charts.splice(index, 1);
    form.setFieldValue('charts', charts);
  };

  const handleSave = async () => {
    if (!form.validate().hasErrors) {
      try {
        setLoading(true);
        if (reportId) {
          const updated = await reportService.updateReportDefinition(reportId, form.values);
          onSave?.(updated);
        } else {
          const created = await reportService.createReportDefinition(form.values as any);
          onSave?.(created);
        }
        notifications.show({
          title: 'Éxito',
          message: `Reporte ${reportId ? 'actualizado' : 'creado'} correctamente`,
          color: 'green'
        });
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: `No se pudo ${reportId ? 'actualizar' : 'crear'} el reporte`,
          color: 'red'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePreview = () => {
    if (form.values.dataSource && form.values.fields && form.values.fields.length > 0) {
      onPreview?.(form.values);
      openPreviewModal();
    } else {
      notifications.show({
        title: 'Vista previa no disponible',
        message: 'Debe seleccionar una fuente de datos y al menos un campo',
        color: 'orange'
      });
    }
  };

  const getFieldsByType = (type: string) => {
    return availableFields.filter(field => field.type === type);
  };

  const getFieldOptions = () => {
    return availableFields.map(field => ({
      value: field.key,
      label: field.label
    }));
  };

  return (
    <Paper p="md" shadow="sm">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <IconSettings size={20} />
          <Title order={4}>
            {reportId ? 'Editar Reporte' : 'Crear Nuevo Reporte'}
          </Title>
        </Group>
        <Group gap="xs">
          <Button
            variant="light"
            leftSection={<IconEye size={16} />}
            onClick={handlePreview}
            disabled={!form.values.dataSource || !form.values.fields?.length}
          >
            Vista Previa
          </Button>
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={handleSave}
            loading={loading}
          >
            Guardar
          </Button>
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={(value: string | null) => setActiveTab(value || 'basic')}>
        <Tabs.List>
          <Tabs.Tab value="basic" leftSection={<IconSettings size={16} />}>
            Configuración Básica
          </Tabs.Tab>
          <Tabs.Tab value="fields" leftSection={<IconTable size={16} />}>
            Campos y Filtros
          </Tabs.Tab>
          <Tabs.Tab value="grouping" leftSection={<IconFilter size={16} />}>
            Agrupación y Agregación
          </Tabs.Tab>
          <Tabs.Tab value="charts" leftSection={<IconChartBar size={16} />}>
            Gráficos
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="basic" pt="md">
          <Stack gap="md">
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="Nombre del Reporte"
                  placeholder="Ingrese el nombre del reporte"
                  {...form.getInputProps('name')}
                  required
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select
                  label="Tipo de Reporte"
                  placeholder="Seleccione el tipo"
                  data={REPORT_TYPES}
                  {...form.getInputProps('type')}
                  required
                />
              </Grid.Col>
            </Grid>

            <Textarea
              label="Descripción"
              placeholder="Descripción opcional del reporte"
              {...form.getInputProps('description')}
              minRows={3}
            />

            <Grid>
              <Grid.Col span={6}>
                <Select
                  label="Fuente de Datos"
                  placeholder="Seleccione la fuente de datos"
                  data={dataSources.map(ds => ({ value: ds.key, label: ds.name }))}
                  {...form.getInputProps('dataSource')}
                  required
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select
                  label="Rango de Fechas por Defecto"
                  placeholder="Seleccione el rango"
                  data={DATE_RANGES}
                  {...form.getInputProps('defaultDateRange')}
                />
              </Grid.Col>
            </Grid>

            <Grid>
              <Grid.Col span={6}>
                <NumberInput
                  label="Límite de Registros"
                  placeholder="Máximo número de registros"
                  min={1}
                  max={10000}
                  {...form.getInputProps('limit')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <MultiSelect
                  label="Etiquetas"
                  placeholder="Agregue etiquetas para organizar"
                  data={form.values.tags || []}
                  searchable
                  {...form.getInputProps('tags')}
                />
              </Grid.Col>
            </Grid>

            {selectedDataSource && (
              <Alert icon={<IconAlertCircle size={16} />} title="Fuente de Datos Seleccionada">
                <Text size="sm">{selectedDataSource.description}</Text>
                <Text size="xs" c="dimmed" mt="xs">
                  Campos disponibles: {selectedDataSource.fields.length}
                </Text>
              </Alert>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="fields" pt="md">
          <Stack gap="md">
            <Card withBorder>
              <Title order={6} mb="sm">Campos Seleccionados</Title>
              <MultiSelect
                label="Seleccionar Campos"
                placeholder="Elija los campos a incluir en el reporte"
                data={getFieldOptions()}
                value={form.values.fields?.map(f => f.key) || []}
                onChange={(values) => {
                  const selectedFields = values.map(value => 
                    availableFields.find(f => f.key === value)!
                  ).filter(Boolean);
                  form.setFieldValue('fields', selectedFields);
                }}
                searchable
              />
            </Card>

            <Card withBorder>
              <Group justify="space-between" mb="sm">
                <Title order={6}>Filtros</Title>
                <Button
                  size="xs"
                  leftSection={<IconPlus size={14} />}
                  onClick={addFilter}
                  disabled={!availableFields.length}
                >
                  Agregar Filtro
                </Button>
              </Group>

              {form.values.filters?.map((filter, index) => (
                <Card key={filter.id} withBorder mb="sm">
                  <Grid align="end">
                    <Grid.Col span={3}>
                      <Select
                        label="Campo"
                        data={getFieldOptions()}
                        value={filter.field}
                        onChange={(value: string | null) => updateFilter(index, { field: value || '' })}
                      />
                    </Grid.Col>
                    <Grid.Col span={3}>
                      <Select
                        label="Operador"
                        data={FILTER_OPERATORS}
                        value={filter.operator}
                        onChange={(value: string | null) => updateFilter(index, { operator: value as FilterOperator })}
                      />
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <TextInput
                        label="Valor"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, { value: e.target.value })}
                        placeholder="Ingrese el valor del filtro"
                      />
                    </Grid.Col>
                    <Grid.Col span={2}>
                      <ActionIcon
                        color="red"
                        variant="light"
                        onClick={() => removeFilter(index)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Grid.Col>
                  </Grid>
                </Card>
              ))}

              {(!form.values.filters || form.values.filters.length === 0) && (
                <Text size="sm" c="dimmed" ta="center" py="md">
                  No hay filtros configurados. Haga clic en "Agregar Filtro" para comenzar.
                </Text>
              )}
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="grouping" pt="md">
          <Stack gap="md">
            <Card withBorder>
              <Group justify="space-between" mb="sm">
                <Title order={6}>Agrupar Por</Title>
                <Button
                  size="xs"
                  leftSection={<IconPlus size={14} />}
                  onClick={addGroupBy}
                  disabled={!availableFields.length}
                >
                  Agregar Agrupación
                </Button>
              </Group>

              {form.values.groupBy?.map((groupBy, index) => (
                <Group key={index} gap="xs" mb="sm">
                  <Select
                    placeholder="Seleccionar campo"
                    data={getFieldOptions()}
                    value={groupBy.field}
                    onChange={(value: string | null) => {
                      const groupByFields = [...(form.values.groupBy || [])];
                      const field = availableFields.find(f => f.key === value);
                      groupByFields[index] = {
                        ...groupByFields[index],
                        field: value || '',
                        label: field?.label || ''
                      };
                      form.setFieldValue('groupBy', groupByFields);
                    }}
                    style={{ flex: 1 }}
                  />
                  <ActionIcon
                    color="red"
                    variant="light"
                    onClick={() => removeGroupBy(index)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              ))}
            </Card>

            <Card withBorder>
              <Group justify="space-between" mb="sm">
                <Title order={6}>Agregaciones</Title>
                <Button
                  size="xs"
                  leftSection={<IconPlus size={14} />}
                  onClick={addAggregation}
                  disabled={!availableFields.length}
                >
                  Agregar Agregación
                </Button>
              </Group>

              {form.values.aggregations?.map((aggregation, index) => (
                <Card key={index} withBorder mb="sm">
                  <Grid align="end">
                    <Grid.Col span={4}>
                      <Select
                        label="Campo"
                        data={getFieldOptions()}
                        value={aggregation.field}
                        onChange={(value: string | null) => {
                          const aggregations = [...(form.values.aggregations || [])];
                          aggregations[index] = { ...aggregations[index], field: value || '' };
                          form.setFieldValue('aggregations', aggregations);
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={3}>
                      <Select
                        label="Función"
                        data={AGGREGATION_FUNCTIONS}
                        value={aggregation.function}
                        onChange={(value: string | null) => {
                          const aggregations = [...(form.values.aggregations || [])];
                          aggregations[index] = { ...aggregations[index], function: value as AggregationFunction };
                          form.setFieldValue('aggregations', aggregations);
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <TextInput
                        label="Etiqueta"
                        value={aggregation.label}
                        onChange={(e) => {
                          const aggregations = [...(form.values.aggregations || [])];
                          aggregations[index] = { ...aggregations[index], label: e.target.value };
                          form.setFieldValue('aggregations', aggregations);
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={1}>
                      <ActionIcon
                        color="red"
                        variant="light"
                        onClick={() => removeAggregation(index)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Grid.Col>
                  </Grid>
                </Card>
              ))}
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="charts" pt="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={6}>Configuración de Gráficos</Title>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={addChart}
                disabled={!availableFields.length}
              >
                Agregar Gráfico
              </Button>
            </Group>

            {form.values.charts?.map((chart, index) => (
              <Card key={index} withBorder>
                <Group justify="space-between" mb="md">
                  <Text fw={500}>Gráfico {index + 1}</Text>
                  <ActionIcon
                    color="red"
                    variant="light"
                    onClick={() => removeChart(index)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>

                <Grid>
                  <Grid.Col span={6}>
                    <TextInput
                      label="Título"
                      value={chart.title}
                      onChange={(e) => {
                        const charts = [...(form.values.charts || [])];
                        charts[index] = { ...charts[index], title: e.target.value };
                        form.setFieldValue('charts', charts);
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Select
                      label="Tipo de Gráfico"
                      data={CHART_TYPES}
                      value={chart.type}
                      onChange={(value: string | null) => {
                        const charts = [...(form.values.charts || [])];
                        charts[index] = { ...charts[index], type: value as ChartType };
                        form.setFieldValue('charts', charts);
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Select
                      label="Eje X"
                      data={getFieldOptions()}
                      value={chart.xAxis}
                      onChange={(value: string | null) => {
                        const charts = [...(form.values.charts || [])];
                        charts[index] = { ...charts[index], xAxis: value || '' };
                        form.setFieldValue('charts', charts);
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <MultiSelect
                      label="Eje Y"
                      data={getFieldOptions()}
                      value={chart.yAxis}
                      onChange={(values) => {
                        const charts = [...(form.values.charts || [])];
                        charts[index] = { ...charts[index], yAxis: values };
                        form.setFieldValue('charts', charts);
                      }}
                    />
                  </Grid.Col>
                </Grid>

                <Group mt="md" gap="md">
                  <Checkbox
                    label="Mostrar Leyenda"
                    checked={chart.showLegend}
                    onChange={(e) => {
                      const charts = [...(form.values.charts || [])];
                      charts[index] = { ...charts[index], showLegend: e.target.checked };
                      form.setFieldValue('charts', charts);
                    }}
                  />
                  <Checkbox
                    label="Mostrar Grilla"
                    checked={chart.showGrid}
                    onChange={(e) => {
                      const charts = [...(form.values.charts || [])];
                      charts[index] = { ...charts[index], showGrid: e.target.checked };
                      form.setFieldValue('charts', charts);
                    }}
                  />
                  <Checkbox
                    label="Mostrar Tooltip"
                    checked={chart.showTooltip}
                    onChange={(e) => {
                      const charts = [...(form.values.charts || [])];
                      charts[index] = { ...charts[index], showTooltip: e.target.checked };
                      form.setFieldValue('charts', charts);
                    }}
                  />
                </Group>
              </Card>
            ))}

            {(!form.values.charts || form.values.charts.length === 0) && (
              <Card withBorder>
                <Text size="sm" c="dimmed" ta="center" py="md">
                  No hay gráficos configurados. Haga clic en "Agregar Gráfico" para comenzar.
                </Text>
              </Card>
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Modal
        opened={previewModalOpened}
        onClose={closePreviewModal}
        title="Vista Previa del Reporte"
        size="xl"
      >
        <Text>La vista previa se mostrará aquí</Text>
      </Modal>
    </Paper>
  );
};