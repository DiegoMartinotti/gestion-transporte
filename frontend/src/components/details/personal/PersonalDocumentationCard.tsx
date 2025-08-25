import React from 'react';
import { Title, Text, Badge, Stack, Group, Card } from '@mantine/core';
import { IconLicense } from '@tabler/icons-react';
import type { PersonalCardProps } from './PersonalDetailTypes';
import { getDocumentStatus, formatDate, getStatusText } from './PersonalDetailHelpers';

const DocumentItem: React.FC<{
  title: string;
  document: { vencimiento?: Date | string };
  fields: Array<{ label: string; value?: string }>;
}> = ({ title, document, fields }) => {
  const status = getDocumentStatus(document.vencimiento);

  return (
    <div>
      <Group justify="space-between" mb="xs">
        <Text size="sm" fw={500}>
          {title}
        </Text>
        {document.vencimiento && (
          <Badge color={status?.color} variant="light">
            {getStatusText(status)}
          </Badge>
        )}
      </Group>
      <Group gap="md">
        {fields.map(
          (field, index) =>
            field.value && (
              <Text key={index} size="xs" c="dimmed">
                {field.label}: {field.value}
              </Text>
            )
        )}
      </Group>
    </div>
  );
};

export const PersonalDocumentationCard: React.FC<PersonalCardProps> = ({ personal }) => {
  if (personal.tipo !== 'Conductor' || !personal.documentacion) return null;

  const { documentacion } = personal;

  return (
    <Card withBorder p="md">
      <Title order={4} mb="md">
        <IconLicense size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        Documentación
      </Title>
      <Stack gap="md">
        {documentacion.licenciaConducir?.numero && (
          <DocumentItem
            title="Licencia de Conducir"
            document={documentacion.licenciaConducir}
            fields={[
              { label: 'Número', value: documentacion.licenciaConducir.numero },
              { label: 'Categoría', value: documentacion.licenciaConducir.categoria },
              {
                label: 'Vencimiento',
                value: formatDate(documentacion.licenciaConducir.vencimiento),
              },
            ]}
          />
        )}

        {documentacion.carnetProfesional?.numero && (
          <DocumentItem
            title="Carnet Profesional"
            document={documentacion.carnetProfesional}
            fields={[
              { label: 'Número', value: documentacion.carnetProfesional.numero },
              {
                label: 'Vencimiento',
                value: formatDate(documentacion.carnetProfesional.vencimiento),
              },
            ]}
          />
        )}

        {documentacion.evaluacionMedica?.fecha && (
          <DocumentItem
            title="Evaluación Médica"
            document={documentacion.evaluacionMedica}
            fields={[
              { label: 'Fecha', value: formatDate(documentacion.evaluacionMedica.fecha) },
              { label: 'Resultado', value: documentacion.evaluacionMedica.resultado },
              {
                label: 'Vencimiento',
                value: formatDate(documentacion.evaluacionMedica.vencimiento),
              },
            ]}
          />
        )}

        {documentacion.psicofisico?.fecha && (
          <DocumentItem
            title="Psicofísico"
            document={documentacion.psicofisico}
            fields={[
              { label: 'Fecha', value: formatDate(documentacion.psicofisico.fecha) },
              { label: 'Resultado', value: documentacion.psicofisico.resultado },
              { label: 'Vencimiento', value: formatDate(documentacion.psicofisico.vencimiento) },
            ]}
          />
        )}
      </Stack>
    </Card>
  );
};
