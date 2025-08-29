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
  return viaje?.choferes?.map((c) => 
    typeof c.personal === 'object' ? c.personal._id : c.personal
  ) || [];
};

// Helper function for initial carga mapping
const getInitialCarga = (viaje?: Viaje) => ({
  peso: viaje?.carga?.peso || 0,
  volumen: viaje?.carga?.volumen || 0,
  descripcion: viaje?.carga?.descripcion || '',
});

// Helper function for basic viaje data
const getBasicViajeData = (viaje?: Viaje) => ({
  fecha: viaje?.fecha || new Date().toISOString().split('T')[0],
  cliente: viaje?.cliente || '',
  tramo: viaje?.tramo || '',
  distanciaKm: viaje?.distanciaKm || 0,
  tiempoEstimado: viaje?.tiempoEstimado || 0,
  estado: viaje?.estado || 'pendiente',
  observaciones: viaje?.observaciones || '',
  extras: viaje?.extras || [],
  total: viaje?.total || 0,
});

// Helper function to get default form values
export const getDefaultFormValues = (viaje?: Viaje): ViajeFormData => {
  return {
    ...getBasicViajeData(viaje),
    vehiculos: getInitialVehiculos(viaje),
    choferes: getInitialChoferes(viaje),
    carga: getInitialCarga(viaje),
  };
};