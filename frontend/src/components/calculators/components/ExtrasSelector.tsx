import React from 'react';
import { Paper, Text, Group, Badge, Select, Button, Alert } from '@mantine/core';
import { IconPlus, IconList } from '@tabler/icons-react';
import { Extra } from '../../../services/extraService';

interface ExtrasSelectorProps {
  extrasDisponibles: Extra[];
  loading: boolean;
  error: string;
  readonly?: boolean;
  onAddExtra: (extraId: string) => void;
}

export const ExtrasSelector: React.FC<ExtrasSelectorProps> = ({
  extrasDisponibles,
  loading,
  error,
  readonly = false,
  onAddExtra,
}) => {
  const [selectedExtraId, setSelectedExtraId] = React.useState<string>('');

  const extrasOptions = extrasDisponibles
    .filter((extra): extra is Extra & { _id: string } => Boolean(extra._id))
    .map((extra) => ({
      value: extra._id,
      label: `${extra.tipo} - ${new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
      }).format(extra.valor)}`,
    }));

  const handleAddExtra = () => {
    if (selectedExtraId) {
      onAddExtra(selectedExtraId);
      setSelectedExtraId('');
    }
  };

  if (error) {
    return (
      <Alert color="red" title="Error">
        {error}
      </Alert>
    );
  }

  return (
    <Paper p="md" withBorder>
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <IconList size={16} />
          <Text fw={500}>Agregar Extras</Text>
        </Group>
        <Badge color="gray" variant="light">
          {extrasDisponibles.length} disponibles
        </Badge>
      </Group>

      {!readonly && (
        <Group gap="sm">
          <Select
            placeholder="Seleccionar extra"
            data={extrasOptions}
            value={selectedExtraId}
            onChange={(value) => setSelectedExtraId(value || '')}
            searchable
            disabled={loading || extrasDisponibles.length === 0}
            style={{ flex: 1 }}
          />
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleAddExtra}
            disabled={!selectedExtraId || loading}
          >
            Agregar
          </Button>
        </Group>
      )}

      {extrasDisponibles.length === 0 && !loading && (
        <Text size="sm" c="dimmed" ta="center">
          No hay extras disponibles para este cliente
        </Text>
      )}
    </Paper>
  );
};
