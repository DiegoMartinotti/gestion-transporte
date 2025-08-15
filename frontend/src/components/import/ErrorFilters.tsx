import React, { useState } from 'react';
import {
  Paper,
  Stack,
  Group,
  TextInput,
  Select,
  Button,
  Collapse,
  Alert,
  Text,
} from '@mantine/core';
import { IconSearch, IconFilter, IconWand, IconBulb, IconInfoCircle } from '@tabler/icons-react';

interface ErrorFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterSeverity: string;
  setFilterSeverity: (value: string) => void;
  onBulkFix: () => void;
}

export const ErrorFilters: React.FC<ErrorFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterSeverity,
  setFilterSeverity,
  onBulkFix,
}) => {
  const [showBulkActions, setShowBulkActions] = useState(false);

  return (
    <Paper p="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Group>
            <TextInput
              placeholder="Buscar errores..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              style={{ width: 300 }}
            />

            <Select
              placeholder="Filtrar por severidad"
              leftSection={<IconFilter size={16} />}
              value={filterSeverity}
              onChange={(value) => setFilterSeverity(value || 'all')}
              data={[
                { value: 'all', label: 'Todos' },
                { value: 'error', label: 'Solo errores' },
                { value: 'warning', label: 'Solo advertencias' },
              ]}
              style={{ width: 200 }}
            />
          </Group>

          <Group>
            <Button variant="light" leftSection={<IconWand size={16} />} onClick={onBulkFix}>
              Corrección automática
            </Button>

            <Button
              variant="light"
              leftSection={<IconBulb size={16} />}
              onClick={() => setShowBulkActions(!showBulkActions)}
            >
              Acciones masivas
            </Button>
          </Group>
        </Group>

        <Collapse in={showBulkActions}>
          <Alert icon={<IconInfoCircle size={16} />} color="blue">
            <Stack gap="xs">
              <Text size="sm">
                Las acciones masivas permiten corregir automáticamente errores comunes:
              </Text>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>Corrección de formato de emails</li>
                <li>Limpieza de números de teléfono</li>
                <li>Conversión de formatos de fecha</li>
                <li>Eliminación de espacios y caracteres especiales</li>
              </ul>
            </Stack>
          </Alert>
        </Collapse>
      </Stack>
    </Paper>
  );
};
