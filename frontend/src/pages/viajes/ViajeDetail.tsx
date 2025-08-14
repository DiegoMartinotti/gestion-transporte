import { useState } from 'react';
import { Card, Stack, Grid, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import LoadingOverlay from '../../components/base/LoadingOverlay';
import { useViaje } from '../../hooks/useViaje';
import { ViajeSidebar } from '../../components/viajes/ViajeSidebar';
import { ViajeDetailHeader } from './components/ViajeDetailHeader';
import { ViajeDetailTabs } from './components/ViajeDetailTabs';
import { ViajeDetailModals } from './components/ViajeDetailModals';
import {
  getProgressValue,
  getEstadoBadgeColor,
  createHandleChangeEstado,
  handlePrint,
  handleExport,
} from './helpers/viajeDetailHelpers';

interface ViajeDetailProps {
  viajeId: string;
  onEdit: () => void;
  onClose: () => void;
}

export function ViajeDetail({ viajeId, onEdit, onClose }: ViajeDetailProps) {
  const { viaje, loading, error, updateEstado } = useViaje(viajeId);
  const [showCalculationDetails, setShowCalculationDetails] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('general');

  const handleChangeEstado = createHandleChangeEstado(updateEstado);

  if (loading) {
    return (
      <Card>
        <LoadingOverlay loading>
          <div style={{ height: 400 }} />
        </LoadingOverlay>
      </Card>
    );
  }

  if (error || !viaje) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
        {error || 'No se pudo cargar el viaje'}
      </Alert>
    );
  }

  return (
    <Stack>
      <ViajeDetailHeader
        viaje={viaje}
        onEdit={onEdit}
        onClose={onClose}
        onPrint={handlePrint}
        onExport={handleExport}
      />

      <Grid>
        <Grid.Col span={8}>
          <Card>
            <ViajeDetailTabs
              viaje={viaje}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onShowCalculationDetails={() => setShowCalculationDetails(true)}
              onChangeEstado={handleChangeEstado}
            />
          </Card>
        </Grid.Col>

        <Grid.Col span={4}>
          <ViajeSidebar
            viaje={viaje}
            getProgressValue={getProgressValue}
            getEstadoBadgeColor={getEstadoBadgeColor}
            onChangeEstado={handleChangeEstado}
            onShowDocuments={() => setShowDocuments(true)}
          />
        </Grid.Col>
      </Grid>

      <ViajeDetailModals
        viaje={viaje}
        showCalculationDetails={showCalculationDetails}
        showDocuments={showDocuments}
        onCloseCalculationDetails={() => setShowCalculationDetails(false)}
        onCloseDocuments={() => setShowDocuments(false)}
      />
    </Stack>
  );
}
