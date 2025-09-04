import { useState, useCallback } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { ReportDefinition, ReportTemplate } from '../types/reports';
import { reportService } from '../services/reportService';

export const useTemplateManagement = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [templatesModalOpened, { open: openTemplatesModal, close: closeTemplatesModal }] =
    useDisclosure(false);

  const loadTemplates = useCallback(async () => {
    try {
      const templatesData = await reportService.getReportTemplates();
      setTemplates(templatesData);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudieron cargar las plantillas',
        color: 'red',
      });
    }
  }, []);

  const handleUseTemplate = async (
    template: ReportTemplate,
    onReportCreated: (report: ReportDefinition) => void
  ) => {
    try {
      const newReport = await reportService.createReportFromTemplate(template.id);
      onReportCreated(newReport);
      closeTemplatesModal();

      notifications.show({
        title: 'Plantilla aplicada',
        message: `Reporte creado desde la plantilla "${template.name}"`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudo crear el reporte desde la plantilla',
        color: 'red',
      });
    }
  };

  return {
    templates,
    templatesModalOpened,
    openTemplatesModal,
    closeTemplatesModal,
    loadTemplates,
    handleUseTemplate,
  };
};
