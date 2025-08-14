import { Group, Title, Badge, Button, ActionIcon } from '@mantine/core';
import { IconEdit, IconPrinter, IconDownload, IconX } from '@tabler/icons-react';
import { getEstadoBadgeColor } from '../helpers/viajeDetailHelpers';

interface ViajeDetailHeaderProps {
  viaje: any;
  onEdit: () => void;
  onClose: () => void;
  onPrint: () => void;
  onExport: () => void;
}

export function ViajeDetailHeader({
  viaje,
  onEdit,
  onClose,
  onPrint,
  onExport,
}: ViajeDetailHeaderProps) {
  return (
    <Group justify="space-between">
      <Group>
        <Title order={2}>Viaje #{viaje.numeroViaje}</Title>
        <Badge color={getEstadoBadgeColor(viaje.estado)} variant="filled" size="lg">
          {viaje.estado}
        </Badge>
      </Group>
      <Group>
        <Button variant="light" leftSection={<IconPrinter />} onClick={onPrint}>
          Imprimir
        </Button>
        <Button variant="light" leftSection={<IconDownload />} onClick={onExport}>
          Exportar PDF
        </Button>
        <Button leftSection={<IconEdit />} onClick={onEdit}>
          Editar
        </Button>
        <ActionIcon variant="light" color="gray" onClick={onClose}>
          <IconX />
        </ActionIcon>
      </Group>
    </Group>
  );
}
