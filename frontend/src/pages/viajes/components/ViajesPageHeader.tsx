import { Group, Title, Button, NumberInput, Select } from '@mantine/core';
import { IconPlus, IconFilter, IconDownload, IconFileSpreadsheet } from '@tabler/icons-react';

interface ViajesPageHeaderProps {
  onCreateViaje: () => void;
  onExportExcel: () => void;
  onExportTemplate: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedEstado: string;
  onEstadoChange: (value: string) => void;
  selectedCliente: string;
  onClienteChange: (value: string) => void;
  estadoOptions: Array<{ value: string; label: string }>;
  clienteOptions: Array<{ value: string; label: string }>;
}

export const ViajesPageHeader = ({
  onCreateViaje,
  onExportExcel,
  onExportTemplate,
  searchTerm,
  onSearchChange,
  selectedEstado,
  onEstadoChange,
  selectedCliente,
  onClienteChange,
  estadoOptions,
  clienteOptions,
}: ViajesPageHeaderProps) => {
  return (
    <>
      <Group justify="space-between">
        <Title order={1}>Gestión de Viajes</Title>
        <Group>
          <Button
            leftSection={<IconDownload size="1rem" />}
            variant="outline"
            onClick={onExportExcel}
          >
            Exportar Excel
          </Button>
          <Button
            leftSection={<IconFileSpreadsheet size="1rem" />}
            variant="outline"
            onClick={onExportTemplate}
          >
            Plantilla Excel
          </Button>
          <Button leftSection={<IconPlus size="1rem" />} onClick={onCreateViaje}>
            Nuevo Viaje
          </Button>
        </Group>
      </Group>

      <Group align="center">
        <IconFilter size={20} />
        <Title order={3}>Filtros</Title>
      </Group>

      <Group>
        <NumberInput
          placeholder="Buscar por DT..."
          value={searchTerm}
          onChange={(value) => onSearchChange(String(value || ''))}
          style={{ minWidth: 200 }}
        />
        <Select
          placeholder="Filtrar por estado"
          data={estadoOptions}
          value={selectedEstado}
          onChange={(value) => onEstadoChange(value || '')}
          clearable
          style={{ minWidth: 180 }}
        />
        <Select
          placeholder="Filtrar por cliente"
          data={clienteOptions}
          value={selectedCliente}
          onChange={(value) => onClienteChange(value || '')}
          clearable
          style={{ minWidth: 200 }}
        />
      </Group>
    </>
  );
};