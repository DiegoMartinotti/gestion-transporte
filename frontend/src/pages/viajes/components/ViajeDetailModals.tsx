import { Modal } from '@mantine/core';
import { DocumentViewer } from '../../../components/base/DocumentViewer';
import { TarifaCalculator } from '../../../components/calculation/TarifaCalculator';

import { Viaje } from '../../../types/viaje';

interface ViajeDetailModalsProps {
  readonly viaje: Viaje;
  readonly showCalculationDetails: boolean;
  readonly showDocuments: boolean;
  readonly onCloseCalculationDetails: () => void;
  readonly onCloseDocuments: () => void;
}

interface TarifaCalculatorModalProps {
  readonly opened: boolean;
  readonly onClose: () => void;
  readonly cliente: {
    readonly nombre?: string;
  } | null;
  readonly tramo: {
    readonly denominacion?: string;
  } | null;
  readonly viaje: Viaje;
}

const TarifaCalculatorModal = ({
  opened,
  onClose,
  cliente,
  tramo,
  viaje,
}: TarifaCalculatorModalProps) => (
  <Modal opened={opened} onClose={onClose} title="Detalles del Cálculo de Tarifa" size="xl">
    <TarifaCalculator
      cliente={cliente}
      tramo={tramo}
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
);

interface DocumentosModalProps {
  readonly opened: boolean;
  readonly onClose: () => void;
  readonly documentos: Viaje['documentos'];
}

const DocumentosModal = ({ opened, onClose, documentos }: DocumentosModalProps) => (
  <Modal opened={opened} onClose={onClose} title="Documentos del Viaje" size="lg">
    {documentos && <DocumentViewer documentos={documentos} />}
  </Modal>
);

export function ViajeDetailModals({
  viaje,
  showCalculationDetails,
  showDocuments,
  onCloseCalculationDetails,
  onCloseDocuments,
}: ViajeDetailModalsProps) {
  const clienteInfo =
    typeof viaje.cliente === 'object' && viaje.cliente !== null
      ? { nombre: viaje.cliente.nombre }
      : null;

  const tramoInfo =
    typeof viaje.tramo === 'object' && viaje.tramo !== null
      ? { denominacion: viaje.tramo.denominacion }
      : null;

  return (
    <>
      <TarifaCalculatorModal
        opened={showCalculationDetails}
        onClose={onCloseCalculationDetails}
        cliente={clienteInfo}
        tramo={tramoInfo}
        viaje={viaje}
      />
      <DocumentosModal
        opened={showDocuments}
        onClose={onCloseDocuments}
        documentos={viaje.documentos}
      />
    </>
  );
}
