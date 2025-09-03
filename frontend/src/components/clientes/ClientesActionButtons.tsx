import { Group, Button } from '@mantine/core';
import { IconPlus, IconDownload, IconUpload } from '@tabler/icons-react';

interface ClientesActionButtonsProps {
  onImport: () => void;
  onExport: () => void;
  onNew: () => void;
  isExporting?: boolean;
}

export function ClientesActionButtons({
  onImport,
  onExport,
  onNew,
  isExporting = false,
}: ClientesActionButtonsProps) {
  return (
    <Group gap="sm">
      <Button variant="outline" leftSection={<IconUpload size="1rem" />} onClick={onImport}>
        Importar
      </Button>

      <Button
        variant="outline"
        leftSection={<IconDownload size="1rem" />}
        onClick={onExport}
        loading={isExporting}
      >
        Exportar
      </Button>

      <Button leftSection={<IconPlus size="1rem" />} onClick={onNew}>
        Nuevo Cliente
      </Button>
    </Group>
  );
}
