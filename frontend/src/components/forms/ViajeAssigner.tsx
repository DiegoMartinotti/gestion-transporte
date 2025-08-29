import type { Viaje } from '../../types/viaje';
import type { ViajeItem } from '../../types/ordenCompra';
import { useViajeAssignerLogic } from './hooks/useViajeAssignerLogic';
import { ViajeAssignerContent } from './components/ViajeAssignerContent';

interface ViajeAssignerProps {
  opened: boolean;
  onClose: () => void;
  clienteId: string;
  viajesDisponibles: Viaje[];
  viajesExcluidos: string[];
  onAssign: (viajes: ViajeItem[]) => void;
}

export function ViajeAssigner({
  opened,
  onClose,
  _clienteId,
  viajesDisponibles,
  viajesExcluidos,
  onAssign,
}: ViajeAssignerProps) {
  const {
    selectedViajes,
    importes,
    searchTerm,
    filteredViajes,
    handleViajeSelect,
    handleImporteChange,
    handleAssign,
    handleCancel,
    getTotalSelected,
    setSearchTerm,
  } = useViajeAssignerLogic(viajesDisponibles, viajesExcluidos, onAssign, onClose);

  return (
    <ViajeAssignerContent
      opened={opened}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      filteredViajes={filteredViajes}
      viajesDisponibles={viajesDisponibles}
      selectedViajes={selectedViajes}
      importes={importes}
      handleViajeSelect={handleViajeSelect}
      handleImporteChange={handleImporteChange}
      handleCancel={handleCancel}
      handleAssign={handleAssign}
      getTotalSelected={getTotalSelected}
    />
  );
}
