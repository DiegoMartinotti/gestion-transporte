import React from 'react';
import { Stack, Title, Text, Select, Alert } from '@mantine/core';
import { IconDatabase, IconAlertCircle } from '@tabler/icons-react';
import { ENTITY_TYPES } from '../types';

interface EntitySelectionStepProps {
  entityType: string;
  onChange: (value: string) => void;
}

export const EntitySelectionStep: React.FC<EntitySelectionStepProps> = ({
  entityType,
  onChange,
}) => (
  <Stack>
    <Title order={3}>Seleccionar tipo de entidad</Title>
    <Text c="dimmed">Seleccione el tipo de datos que desea importar</Text>

    <Select
      label="Tipo de entidad"
      placeholder="Seleccione una opción"
      data={ENTITY_TYPES}
      value={entityType}
      onChange={(value) => onChange(value || '')}
      size="md"
      required
      leftSection={<IconDatabase size={20} />}
    />

    {entityType && (
      <Alert icon={<IconAlertCircle size={16} />} color="blue">
        Asegúrese de que el archivo Excel contenga las columnas requeridas para{' '}
        {ENTITY_TYPES.find((e) => e.value === entityType)?.label}. Puede descargar una plantilla
        desde el botón de plantillas en la sección de cada entidad.
      </Alert>
    )}
  </Stack>
);