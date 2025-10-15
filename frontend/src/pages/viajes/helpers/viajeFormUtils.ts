import { Viaje, ViajeFormData } from '../../../types/viaje';

// Helper function for initial vehicle mapping
export const getInitialVehiculos = (viaje?: Viaje): string[] => {
  return (
    viaje?.vehiculos?.map((v) => (typeof v.vehiculo === 'object' ? v.vehiculo._id : v.vehiculo)) ||
    []
  );
};

// Helper function for calculation simulation
export const simulateCalculation = (formValues: ViajeFormData) => {
  const result = {
    montoBase: 15000,
    desglose: {
      tarifaBase: 12000,
      incrementoPeso: 2000,
      incrementoDistancia: 1000,
    },
    formula: 'tarifaBase + (peso * 0.5) + (distancia * 10)',
    montoExtras: formValues.extras.reduce((sum, extra) => sum + (extra.monto || 0), 0),
    montoTotal: 0,
  };

  result.montoTotal = result.montoBase + result.montoExtras;
  return result;
};

// Helper function for initial chofer mapping
const getInitialChoferes = (viaje?: Viaje): string[] => {
  if (!viaje?.choferes) {
    return [];
  }

  return viaje.choferes
    .map((chofer) => {
      const withPersonal = chofer as {
        personal?: string | { _id?: string };
      };

      if (withPersonal.personal) {
        return typeof withPersonal.personal === 'string'
          ? withPersonal.personal
          : withPersonal.personal?._id;
      }

      return chofer._id;
    })
    .filter((id): id is string => Boolean(id));
};

// Helper function for initial ayudantes mapping
const getInitialAyudantes = (viaje?: Viaje): string[] => {
  if (!viaje?.ayudantes) {
    return [];
  }

  return viaje.ayudantes.map((ayudante) => ayudante._id).filter((id): id is string => Boolean(id));
};

// Helper function for initial carga mapping
const getInitialCarga = (viaje?: Viaje) => ({
  peso: viaje?.carga?.peso || 0,
  volumen: viaje?.carga?.volumen || 0,
  descripcion: viaje?.carga?.descripcion || '',
  peligrosa: viaje?.carga?.peligrosa ?? false,
  refrigerada: viaje?.carga?.refrigerada ?? false,
});

const resolveReferenceId = (value?: string | { _id: string; [key: string]: unknown }): string => {
  if (!value) {
    return '';
  }

  return typeof value === 'string' ? value : value._id || '';
};

const resolveNumeroViaje = (numero?: string): number => {
  if (!numero) {
    return 0;
  }

  const parsed = Number(numero);
  return Number.isFinite(parsed) ? parsed : 0;
};

const resolveDistancia = (viaje?: Viaje): number => {
  if (!viaje) {
    return 0;
  }

  return viaje.distanciaKm ?? viaje.tramo?.distanciaKm ?? 0;
};

const resolveTiempoEstimado = (viaje?: Viaje): number => {
  if (!viaje) {
    return 0;
  }

  return viaje.tiempoEstimadoHoras ?? viaje.tramo?.tiempoEstimadoHoras ?? 0;
};

// Helper function for basic viaje data
const getBasicViajeData = (viaje?: Viaje) => ({
  fecha: viaje?.fecha ? new Date(viaje.fecha) : new Date(),
  cliente: resolveReferenceId(viaje?.cliente),
  tramo: resolveReferenceId(viaje?.tramo),
  numeroViaje: resolveNumeroViaje(viaje?.numeroViaje),
  distanciaKm: resolveDistancia(viaje),
  tiempoEstimadoHoras: resolveTiempoEstimado(viaje),
  estado: viaje?.estado || 'Pendiente',
  observaciones: viaje?.observaciones || '',
  extras: viaje?.extras || [],
  ordenCompra: viaje?.ordenCompra || '',
  montoBase: viaje?.montoBase ?? 0,
  montoExtras: viaje?.montoExtras ?? 0,
  montoTotal: viaje?.montoTotal ?? viaje?.total ?? 0,
});

// Helper function to get default form values
export const getDefaultFormValues = (viaje?: Viaje): ViajeFormData => {
  return {
    ...getBasicViajeData(viaje),
    vehiculos: getInitialVehiculos(viaje),
    choferes: getInitialChoferes(viaje),
    ayudantes: getInitialAyudantes(viaje),
    carga: getInitialCarga(viaje),
  };
};
