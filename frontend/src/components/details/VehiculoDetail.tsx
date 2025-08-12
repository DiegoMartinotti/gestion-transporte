import { Modal, Text, Group, Stack, Badge, ActionIcon, Tooltip } from '@mantine/core';
import { IconTruck, IconEdit } from '@tabler/icons-react';
import { Vehiculo } from '../../types/vehiculo';
import { VehiculoDetailInfo } from './VehiculoDetailInfo';
import { VehiculoDetailCaracteristicas } from './VehiculoDetailCaracteristicas';
import { VehiculoDetailDocumentacion } from './VehiculoDetailDocumentacion';
import { getDocumentosInfo, getEstadoGeneral } from './VehiculoDetailHelpers';

interface VehiculoDetailProps {
  vehiculo: Vehiculo | null;
  opened: boolean;
  onClose: () => void;
  onEdit?: (vehiculo: Vehiculo) => void;
}

export const VehiculoDetail: React.FC<VehiculoDetailProps> = ({
  vehiculo,
  opened,
  onClose,
  onEdit,
}) => {
  if (!vehiculo) return null;

  const documentos = getDocumentosInfo(vehiculo);
  const estadoGeneral = getEstadoGeneral(documentos);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group justify="space-between" style={{ width: '100%' }}>
          <Group>
            <IconTruck size={24} />
            <Text size="lg" fw={600}>
              {vehiculo.dominio}
            </Text>
            <Badge color={vehiculo.activo ? 'green' : 'red'} variant="light">
              {vehiculo.activo ? 'Activo' : 'Inactivo'}
            </Badge>
          </Group>
          {onEdit && (
            <Tooltip label="Editar vehículo">
              <ActionIcon variant="light" color="blue" onClick={() => onEdit(vehiculo)}>
                <IconEdit size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      }
      size="xl"
      centered
    >
      <Stack gap="lg">
        <VehiculoDetailInfo vehiculo={vehiculo} />
        <VehiculoDetailCaracteristicas vehiculo={vehiculo} />
        <VehiculoDetailDocumentacion documentos={documentos} estadoGeneral={estadoGeneral} />
      </Stack>
    </Modal>
  );
};
