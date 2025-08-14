import { FC } from 'react';
import { Stack, Card, Text } from '@mantine/core';
import { Viaje } from '../../types/viaje';
import {
  renderProgressCard,
  renderActionButtons,
  renderDocumentsCard,
} from './ViajeSidebarHelpers';

interface ViajeSidebarProps {
  viaje: Viaje;
  getProgressValue: (estado: string) => number;
  getEstadoBadgeColor: (estado: string) => string;
  onChangeEstado: (estado: string) => void;
  onShowDocuments: () => void;
}

export const ViajeSidebar: FC<ViajeSidebarProps> = ({
  viaje,
  getProgressValue,
  getEstadoBadgeColor,
  onChangeEstado,
  onShowDocuments,
}) => {
  const progressValue = getProgressValue(viaje.estado);
  const badgeColor = getEstadoBadgeColor(viaje.estado);

  return (
    <Stack>
      {renderProgressCard(progressValue, badgeColor)}

      <Card>
        <Text size="sm" fw={600} mb="md">
          ACCIONES RÁPIDAS
        </Text>
        {renderActionButtons(viaje.estado, onChangeEstado)}
      </Card>

      {viaje.documentos &&
        viaje.documentos.length > 0 &&
        renderDocumentsCard(viaje.documentos, onShowDocuments)}
    </Stack>
  );
};
