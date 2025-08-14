import { Modal } from '@mantine/core';
import { DocumentViewer } from '../../../components/base/DocumentViewer';
import { TarifaCalculator } from '../../../components/calculation/TarifaCalculator';

import { Viaje } from '../../../types/viaje';

interface ViajeDetailModalsProps {
  viaje: Viaje;
  showCalculationDetails: boolean;
  showDocuments: boolean;
  onCloseCalculationDetails: () => void;
  onCloseDocuments: () => void;
}

export function ViajeDetailModals({
  viaje,
  showCalculationDetails,
  showDocuments,
  onCloseCalculationDetails,
  onCloseDocuments,
}: ViajeDetailModalsProps) {
  return (
    <>
      <Modal
        opened={showCalculationDetails}
        onClose={onCloseCalculationDetails}
        title="Detalles del Cálculo de Tarifa"
        size="xl"
      >
        <TarifaCalculator
          cliente={viaje.cliente}
          tramo={viaje.tramo}
          datos={{
            peso: viaje.carga?.peso || 0,
            volumen: viaje.carga?.volumen || 0,
            distancia: viaje.distanciaKm || 0,
            vehiculos: viaje.vehiculos?.length || 0,
          }}
          resultado={{
            montoBase: viaje.montoBase || 0,
            montoExtras: viaje.montoExtras || 0,
            montoTotal: viaje.montoTotal || 0,
          }}
        />
      </Modal>

      <Modal
        opened={showDocuments}
        onClose={onCloseDocuments}
        title="Documentos del Viaje"
        size="lg"
      >
        {viaje.documentos && <DocumentViewer documentos={viaje.documentos} />}
      </Modal>
    </>
  );
}
