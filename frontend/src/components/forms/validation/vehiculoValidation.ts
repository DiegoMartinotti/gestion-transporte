import { Vehiculo, VehiculoTipo } from '../../../types/vehiculo';

export const vehiculoValidationRules = {
  dominio: (value: string) => {
    if (!value) return 'El dominio es obligatorio';
    if (!/^[A-Z]{3}[0-9]{3}$|^[A-Z]{2}[0-9]{3}[A-Z]{2}$/.test(value.toUpperCase())) {
      return 'Formato de patente inválido';
    }
    return null;
  },
  empresa: (value: string | any) => (!value ? 'La empresa es obligatoria' : null),
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

const createDocumentacionDefaults = (doc?: any) => ({
  seguro: {
    numero: doc?.seguro?.numero || '',
    vencimiento: doc?.seguro?.vencimiento || '',
    compania: doc?.seguro?.compania || '',
  },
  vtv: {
    numero: doc?.vtv?.numero || '',
    vencimiento: doc?.vtv?.vencimiento || '',
  },
  ruta: {
    numero: doc?.ruta?.numero || '',
    vencimiento: doc?.ruta?.vencimiento || '',
  },
  senasa: {
    numero: doc?.senasa?.numero || '',
    vencimiento: doc?.senasa?.vencimiento || '',
  },
});

const createCaracteristicasDefaults = (car?: any) => ({
  capacidadCarga: car?.capacidadCarga || 0,
  tara: car?.tara || 0,
  largo: car?.largo || 0,
  ancho: car?.ancho || 0,
  alto: car?.alto || 0,
  configuracionEjes: car?.configuracionEjes || '',
  tipoCarroceria: car?.tipoCarroceria || '',
});

export function normalizeVehiculoData(values: Vehiculo): Vehiculo {
  return {
    ...values,
    dominio: values.dominio.toUpperCase(),
    numeroChasis: values.numeroChasis ? values.numeroChasis.toUpperCase() : values.numeroChasis,
    numeroMotor: values.numeroMotor ? values.numeroMotor.toUpperCase() : values.numeroMotor,
  };
}
