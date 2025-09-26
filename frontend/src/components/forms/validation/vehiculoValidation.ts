import {
  Vehiculo,
  VehiculoTipo,
  VehiculoDocumentacion,
  VehiculoCaracteristicas,
} from '../../../types/vehiculo';

export const vehiculoValidationRules = {
  dominio: (value: string) => {
    if (!value) return 'El dominio es obligatorio';
    if (!/^[A-Z]{3}[0-9]{3}$|^[A-Z]{2}[0-9]{3}[A-Z]{2}$/.test(value.toUpperCase())) {
      return 'Formato de patente inválido';
    }
    return null;
  },
  empresa: (value: string | unknown) => (!value ? 'La empresa es obligatoria' : null),
  año: (value: number | undefined) => {
    if (value && (value < 1950 || value > new Date().getFullYear() + 1)) {
      return 'Año inválido';
    }
    return null;
  },
};

export const getInitialVehiculoValues = (vehiculo?: Vehiculo | null): Vehiculo => {
  const defaultValues = createDefaultVehiculo();

  if (!vehiculo) {
    return defaultValues;
  }

  return {
    ...vehiculo,
    documentacion: createDocumentacionDefaults(vehiculo.documentacion),
    caracteristicas: createCaracteristicasDefaults(vehiculo.caracteristicas),
  };
};

const createDefaultVehiculo = (): Vehiculo => ({
  dominio: '',
  tipo: 'Camión' as VehiculoTipo,
  marca: '',
  modelo: '',
  año: new Date().getFullYear(),
  numeroChasis: '',
  numeroMotor: '',
  empresa: '',
  documentacion: {
    seguro: { numero: '', vencimiento: '', compania: '' },
    vtv: { numero: '', vencimiento: '' },
    ruta: { numero: '', vencimiento: '' },
    senasa: { numero: '', vencimiento: '' },
  },
  caracteristicas: {
    capacidadCarga: 0,
    tara: 0,
    largo: 0,
    ancho: 0,
    alto: 0,
    configuracionEjes: '',
    tipoCarroceria: '',
  },
  mantenimiento: [],
  activo: true,
  observaciones: '',
});

const createDocumentacionDefaults = (doc?: VehiculoDocumentacion | Record<string, unknown>) => {
  const docData = doc as VehiculoDocumentacion | undefined;
  return {
    seguro: {
      numero: docData?.seguro?.numero || '',
      vencimiento: docData?.seguro?.vencimiento || '',
      compania: docData?.seguro?.compania || '',
    },
    vtv: {
      numero: docData?.vtv?.numero || '',
      vencimiento: docData?.vtv?.vencimiento || '',
    },
    ruta: {
      numero: docData?.ruta?.numero || '',
      vencimiento: docData?.ruta?.vencimiento || '',
    },
    senasa: {
      numero: docData?.senasa?.numero || '',
      vencimiento: docData?.senasa?.vencimiento || '',
    },
  };
};

const createCaracteristicasDefaults = (car?: VehiculoCaracteristicas | Record<string, unknown>) => {
  const carData = car as VehiculoCaracteristicas | undefined;
  return {
    capacidadCarga: carData?.capacidadCarga || 0,
    tara: carData?.tara || 0,
    largo: carData?.largo || 0,
    ancho: carData?.ancho || 0,
    alto: carData?.alto || 0,
    configuracionEjes: carData?.configuracionEjes || '',
    tipoCarroceria: carData?.tipoCarroceria || '',
  };
};

export function normalizeVehiculoData(values: Vehiculo): Vehiculo {
  return {
    ...values,
    dominio: values.dominio.toUpperCase(),
    numeroChasis: values.numeroChasis ? values.numeroChasis.toUpperCase() : values.numeroChasis,
    numeroMotor: values.numeroMotor ? values.numeroMotor.toUpperCase() : values.numeroMotor,
  };
}
