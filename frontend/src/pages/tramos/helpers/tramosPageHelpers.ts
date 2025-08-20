import { Tramo } from '../../../types';

// Interfaz para los filtros de tramos
export interface TramoFilters {
  searchTerm: string;
  selectedCliente: string;
  selectedOrigen: string;
  selectedDestino: string;
  activeTab: string;
}

// Funciones de filtrado
export const applyTramoFilters = (tramos: Tramo[], filters: TramoFilters): Tramo[] => {
  return tramos.filter((tramo) => {
    // Validar que el tramo tenga las propiedades necesarias
    if (!tramo || !tramo.origen || !tramo.destino || !tramo.cliente) {
      return false;
    }

    const matchesSearch = matchesSearchTerm(tramo, filters.searchTerm);
    const matchesCliente = matchesClienteFilter(tramo, filters.selectedCliente);
    const matchesOrigen = matchesOrigenFilter(tramo, filters.selectedOrigen);
    const matchesDestino = matchesDestinoFilter(tramo, filters.selectedDestino);
    const matchesTab = matchesTabFilter(tramo, filters.activeTab);

    return matchesSearch && matchesCliente && matchesOrigen && matchesDestino && matchesTab;
  });
};

export const matchesSearchTerm = (tramo: Tramo, searchTerm: string): boolean => {
  if (searchTerm === '') return true;

  const lowerSearchTerm = searchTerm.toLowerCase();

  return !!(
    (tramo.origen.nombre && tramo.origen.nombre.toLowerCase().includes(lowerSearchTerm)) ||
    (tramo.destino.nombre && tramo.destino.nombre.toLowerCase().includes(lowerSearchTerm)) ||
    (tramo.cliente.nombre && tramo.cliente.nombre.toLowerCase().includes(lowerSearchTerm))
  );
};

export const matchesClienteFilter = (tramo: Tramo, selectedCliente: string): boolean => {
  return selectedCliente === '' || tramo.cliente._id === selectedCliente;
};

export const matchesOrigenFilter = (tramo: Tramo, selectedOrigen: string): boolean => {
  return selectedOrigen === '' || tramo.origen._id === selectedOrigen;
};

export const matchesDestinoFilter = (tramo: Tramo, selectedDestino: string): boolean => {
  return selectedDestino === '' || tramo.destino._id === selectedDestino;
};

export const matchesTabFilter = (tramo: Tramo, activeTab: string): boolean => {
  if (activeTab === 'con-tarifa') {
    return !!(tramo.tipo || tramo.tarifaVigente);
  }
  if (activeTab === 'sin-tarifa') {
    return !(tramo.tipo || tramo.tarifaVigente);
  }
  return true; // Para 'todos' y otros tabs
};

// Funciones de estadísticas
export const calculateTramosStats = (tramos: Tramo[]) => {
  return {
    total: tramos.length,
    conTarifa: tramos.filter((t) => t.tipo || t.tarifaVigente).length,
    sinTarifa: tramos.filter((t) => !(t.tipo || t.tarifaVigente)).length,
  };
};

// Funciones de tarifa
export const getTarifaData = (tramo: Tramo) => {
  return {
    tipo: tramo.tipo || tramo.tarifaVigente?.tipo,
    metodoCalculo: tramo.metodoCalculo || tramo.tarifaVigente?.metodoCalculo,
    valor: tramo.valor || tramo.tarifaVigente?.valor,
    valorPeaje: tramo.valorPeaje || tramo.tarifaVigente?.valorPeaje,
    vigenciaDesde: tramo.vigenciaDesde || tramo.tarifaVigente?.vigenciaDesde,
    vigenciaHasta: tramo.vigenciaHasta || tramo.tarifaVigente?.vigenciaHasta,
  };
};

export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const isDateExpired = (dateString: string | undefined): boolean => {
  return dateString ? new Date(dateString) < new Date() : false;
};

export const isDateExpiringSoon = (dateString: string | undefined): boolean => {
  if (!dateString) return false;
  const expirationDate = new Date(dateString);
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return expirationDate < thirtyDaysFromNow;
};

export const hasTarifa = (tramo: Tramo): boolean => {
  const tarifaData = getTarifaData(tramo);
  return !!(tarifaData.tipo && tarifaData.metodoCalculo && tarifaData.valor !== undefined);
};

// Helpers para TarifaStatus component
export const getTarifaStatusColors = (isExpired: boolean, isExpiringSoon: boolean) => {
  if (isExpired) return 'red';
  if (isExpiringSoon) return 'orange';
  return 'dimmed';
};

export const getTarifaStatusWeight = (isExpired: boolean, isExpiringSoon: boolean) => {
  return isExpired || isExpiringSoon ? 500 : 400;
};

export const getTarifaStatusSuffix = (isExpired: boolean, isExpiringSoon: boolean) => {
  if (isExpired) return ' (VENCIDA)';
  if (isExpiringSoon && !isExpired) return ' (Próx. vencimiento)';
  return '';
};
