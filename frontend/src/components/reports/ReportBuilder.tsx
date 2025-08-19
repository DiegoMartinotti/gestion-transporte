import React, { useCallback } from 'react';
import { Title, Group, Button, Card, Text, Tabs, Modal, Paper } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconEye,
  IconDeviceFloppy,
  IconSettings,
  IconTable,
  IconFilter,
  IconChartBar,
} from '@tabler/icons-react';
import { ReportDefinition, ReportTemplate } from '../../types/reports';
import { reportService } from '../../services/reportService';
import { useReportBuilderLogic, ReportFormData } from './hooks/useReportBuilderLogic';
import { useReportBuilderHandlers } from './hooks/useReportBuilderHandlers';
import BasicConfigTab from './components/BasicConfigTab';
import FieldsFiltersTab from './components/FieldsFiltersTab';
import GroupingTab from './components/GroupingTab';
import ChartsTab from './components/ChartsTab';

interface ReportBuilderProps {
  reportId?: string;
  template?: ReportTemplate;
  onSave?: (report: ReportDefinition) => void;
  onPreview?: (definition: ReportFormData) => void;
}

export const ReportBuilder: React.FC<ReportBuilderProps> = ({
  reportId,
  template,
  onSave,
  onPreview,
}) => {
  const {
    dataSources,
    selectedDataSource,
    availableFields,
    loading,
    setLoading,
    activeTab,
    setActiveTab,
    previewModalOpened,
    openPreviewModal,
    closePreviewModal,
    form,
  } = useReportBuilderLogic(reportId, template);

  const { filterHandlers, groupByHandlers, aggregationHandlers, chartHandlers } =
    useReportBuilderHandlers(form, availableFields);

  const handleSave = useCallback(async () => {
    if (!form.validate().hasErrors) {
      try {
        setLoading(true);
        if (reportId) {
          const updated = await reportService.updateReportDefinition(reportId, form.values);
          onSave?.(updated);
        } else {
          // Crear el objeto con solo los campos necesarios para la creación
          const reportDefinition: Omit<
            ReportDefinition,
            'id' | 'createdAt' | 'updatedAt' | 'createdBy'
          > = {
            name: form.values.name,
            description: form.values.description,
            type: form.values.type,
            dataSource: form.values.dataSource,
            fields: form.values.fields,
            filters: form.values.filters || [],
            groupBy: form.values.groupBy,
            aggregations: form.values.aggregations,
            sorting: form.values.sorting,
            charts: form.values.charts,
            defaultDateRange: form.values.defaultDateRange,
            limit: form.values.limit,
            tags: form.values.tags,
            isTemplate: false,
          };
          const created = await reportService.createReportDefinition(reportDefinition);
          onSave?.(created);
        }
        notifications.show({
          title: 'Éxito',
          message: `Reporte ${reportId ? 'actualizado' : 'creado'} correctamente`,
          color: 'green',
        });
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: `No se pudo ${reportId ? 'actualizar' : 'crear'} el reporte`,
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    }
  }, [form, reportId, onSave, setLoading]);

  const handlePreview = useCallback(() => {
    if (form.values.dataSource && form.values.fields && form.values.fields.length > 0) {
      onPreview?.(form.values);
      openPreviewModal();
    } else {
      notifications.show({
        title: 'Información incompleta',
        message: 'Debe seleccionar una fuente de datos y al menos un campo para previsualizar',
        color: 'orange',
      });
    }
  }, [form.values, onPreview, openPreviewModal]);

  return (
    <Paper p="md" shadow="sm">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2}>{reportId ? 'Editar Reporte' : 'Crear Nuevo Reporte'}</Title>
          <Text size="sm" c="dimmed" mt="xs">
            {reportId
              ? 'Modifique la configuración del reporte existente'
              : 'Configure los parámetros para su nuevo reporte personalizado'}
          </Text>
        </div>
        <Group>
          <Button
            variant="outline"
            leftSection={<IconEye size={16} />}
            onClick={handlePreview}
            disabled={loading}
          >
            Previsualizar
          </Button>
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={handleSave}
            loading={loading}
          >
            {reportId ? 'Actualizar' : 'Guardar'}
          </Button>
        </Group>
      </Group>

      <Tabs
        value={activeTab}
        onChange={(value: string | null) => setActiveTab(value || 'basic')}
        keepMounted={false}
      >
        <Tabs.List>
          <Tabs.Tab value="basic" leftSection={<IconSettings size={16} />}>
            Configuración Básica
          </Tabs.Tab>
          <Tabs.Tab value="fields" leftSection={<IconTable size={16} />}>
            Campos y Filtros
          </Tabs.Tab>
          <Tabs.Tab value="grouping" leftSection={<IconFilter size={16} />}>
            Agrupación
          </Tabs.Tab>
          <Tabs.Tab value="charts" leftSection={<IconChartBar size={16} />}>
            Gráficos
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="basic" pt="md">
          <BasicConfigTab
            form={form}
            dataSources={dataSources}
            selectedDataSource={selectedDataSource}
          />
        </Tabs.Panel>

        <Tabs.Panel value="fields" pt="md">
          <FieldsFiltersTab
            form={form}
            availableFields={availableFields}
            onAddFilter={filterHandlers.add}
            onRemoveFilter={filterHandlers.remove}
            onUpdateFilter={filterHandlers.update}
          />
        </Tabs.Panel>

        <Tabs.Panel value="grouping" pt="md">
          <GroupingTab
            form={form}
            availableFields={availableFields}
            onAddGroupBy={groupByHandlers.add}
            onRemoveGroupBy={groupByHandlers.remove}
            onAddAggregation={aggregationHandlers.add}
            onRemoveAggregation={aggregationHandlers.remove}
          />
        </Tabs.Panel>

        <Tabs.Panel value="charts" pt="md">
          <ChartsTab
            form={form}
            availableFields={availableFields}
            onAddChart={chartHandlers.add}
            onRemoveChart={chartHandlers.remove}
          />
        </Tabs.Panel>
      </Tabs>

      <Modal
        opened={previewModalOpened}
        onClose={closePreviewModal}
        title="Vista Previa del Reporte"
        size="xl"
        centered
      >
        <Card>
          <Text size="sm" c="dimmed" ta="center">
            La vista previa del reporte se mostrará aquí
          </Text>
        </Card>
      </Modal>
    </Paper>
  );
};
