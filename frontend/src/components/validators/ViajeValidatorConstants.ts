// Constantes para el ViajeValidator - elimina strings duplicados
export const VALIDATION_MESSAGES = {
  DATOS_BASICOS: 'Datos Básicos',
  DEBE_SELECCIONAR: 'Debe seleccionar un cliente',
  DEBE_ASIGNAR_PERSONAL: 'Debe asignar personal al viaje',
  DEBE_ASIGNAR_CHOFER: 'Debe asignar al menos un chofer',
} as const;

export const VALIDATION_CATEGORIES = {
  DATOS_BASICOS: 'Datos Básicos',
  VEHICULOS: 'Vehículos',
  PERSONAL: 'Personal',
  PROGRAMACION: 'Programación',
  CALCULOS: 'Cálculos',
  COMPATIBILIDAD: 'Compatibilidad',
} as const;

export const VALIDATION_SUGGESTIONS = {
  SELECCIONE_CLIENTE: 'Seleccione un cliente de la lista',
  SELECCIONE_TRAMO: 'Seleccione un tramo de la lista de rutas disponibles',
  ESTABLEZCA_FECHA: 'Seleccione la fecha programada del viaje',
  ESPECIFIQUE_PALETS: 'Ingrese la cantidad de palets a transportar (mayor a 0)',
  ASIGNE_VEHICULOS: 'Seleccione los vehículos que realizarán el viaje',
  REVISE_DOCUMENTACION: 'Revise y actualice la documentación de los vehículos',
  ASIGNE_CHOFER_PRINCIPAL: 'Asigne un chofer principal para el viaje',
  VERIFIQUE_FECHA_PASADA: 'Verifique si es correcto programar un viaje en fecha pasada',
  VERIFIQUE_FECHA_LEJANA: 'Verifique la fecha del viaje',
  CALCULE_TARIFA: 'Calcule la tarifa del viaje',
  SELECCIONE_TRAMO_COMPATIBLE: 'Seleccione un tramo que pertenezca al cliente elegido',
} as const;

export const TIPO_PERSONAL = {
  CHOFER: 'CHOFER',
} as const;

export const LIMITE_DIAS_FUTURO = 365;
