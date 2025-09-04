import React from 'react';
import { Modal, Stack, Text, Alert, Grid } from '@mantine/core';
import { ReportTemplate } from '../../types/reports';
import { ReportTemplateCard } from './ReportTemplateCard';

interface TemplatesModalProps {
  opened: boolean;
  onClose: () => void;
  templates: ReportTemplate[];
  onUseTemplate: (template: ReportTemplate) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  opened,
  onClose,
  templates,
  onUseTemplate,
}) => (
  <Modal opened={opened} onClose={onClose} title="Plantillas de Reportes" size="xl">
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Seleccione una plantilla para crear un nuevo reporte basado en configuraciones predefinidas.
      </Text>

      {templates.length === 0 ? (
        <Alert color="blue">No hay plantillas disponibles en este momento.</Alert>
      ) : (
        <Grid>
          {templates.map((template) => (
            <Grid.Col key={template.id} span={6}>
              <ReportTemplateCard template={template} onUse={onUseTemplate} />
            </Grid.Col>
          ))}
        </Grid>
      )}
    </Stack>
  </Modal>
);
