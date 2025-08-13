export const tramoValidationRules = {
  cliente: (value: string) => (!value ? 'Cliente es requerido' : null),
  origen: (value: string) => (!value ? 'Origen es requerido' : null),
  destino: (value: string) => (!value ? 'Destino es requerido' : null),
  distancia: (value: number) => (value <= 0 ? 'Distancia debe ser mayor a 0' : null),
};

export const getInitialTramoValues = (tramo: any) => ({
  cliente: tramo?.cliente._id || '',
  origen: tramo?.origen._id || '',
  destino: tramo?.destino._id || '',
  distancia: tramo?.distancia || 0,
  tarifasHistoricas: tramo?.tarifasHistoricas || [],
});

export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
