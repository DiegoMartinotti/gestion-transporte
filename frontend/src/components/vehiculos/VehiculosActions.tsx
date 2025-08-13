import { Group, Title, Button, Menu } from '@mantine/core';
import { IconTruck, IconPlus, IconFileExport, IconDownload } from '@tabler/icons-react';
import { ExcelOperationsResult } from '../../types/excel';

interface VehiculosActionsProps {
  onCreateVehicle: () => void;
  excelOperations: ExcelOperationsResult;
}

export const VehiculosActions = ({ onCreateVehicle, excelOperations }: VehiculosActionsProps) => (
  <Group justify="space-between" mb="md">
    <Title order={2}>
      <Group gap="sm">
        <IconTruck size={28} />
        Gestión de Vehículos
      </Group>
    </Title>
    <Group gap="sm">
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <Button variant="light" leftSection={<IconFileExport size={16} />}>
            Excel
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            leftSection={<IconDownload size={14} />}
            onClick={() => excelOperations.handleGetTemplate()}
            disabled={excelOperations.isGettingTemplate}
          >
            Descargar Plantilla
          </Menu.Item>
          <Menu.Item
            leftSection={<IconFileExport size={14} />}
            onClick={() => excelOperations.handleExport()}
            disabled={excelOperations.isExporting}
          >
            Exportar Lista
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <Button leftSection={<IconPlus size={16} />} onClick={onCreateVehicle}>
        Nuevo Vehículo
      </Button>
    </Group>
  </Group>
);
