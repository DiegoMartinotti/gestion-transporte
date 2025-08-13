import React from 'react';
import { Personal } from '../../../types';
import { personalService } from '../../../services/personalService';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';

// Document validation helpers
export const isDocumentExpiring = (vencimiento: Date | null, days = 30): boolean => {
  if (!vencimiento) return false;
  const now = new Date();
  const diffTime = vencimiento.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= days && diffDays >= 0;
};

export const isDocumentExpired = (vencimiento: Date | null): boolean => {
  if (!vencimiento) return false;
  return vencimiento < new Date();
};

export const getDocumentBadgeColor = (vencimiento: Date | null): string => {
  if (isDocumentExpired(vencimiento)) return 'red';
  if (isDocumentExpiring(vencimiento)) return 'yellow';
  return 'green';
};

export const getDocumentStatus = (vencimiento: Date | null): string => {
  if (isDocumentExpired(vencimiento)) return 'Vencida';
  if (isDocumentExpiring(vencimiento)) return 'Por Vencer';
  return 'Vigente';
};

// Date conversion helper
export const safeToDate = (dateValue: any): Date | null => {
  return dateValue ? new Date(dateValue) : null;
};

// Document data extraction
export const getDocumentData = (doc: any) => ({
  numero: doc?.numero || '',
  categoria: doc?.categoria || '',
  vencimiento: safeToDate(doc?.vencimiento),
  fecha: safeToDate(doc?.fecha),
  resultado: doc?.resultado || '',
});

// Initial values helpers
export const getInitialDireccion = (personal?: Personal) => ({
  calle: personal?.direccion?.calle || '',
  numero: personal?.direccion?.numero || '',
  localidad: personal?.direccion?.localidad || '',
  provincia: personal?.direccion?.provincia || '',
  codigoPostal: personal?.direccion?.codigoPostal || '',
});

export const getInitialContacto = (personal?: Personal) => ({
  telefono: personal?.contacto?.telefono || '',
  telefonoEmergencia: personal?.contacto?.telefonoEmergencia || '',
  email: personal?.contacto?.email || '',
});

export const getInitialPeriodosEmpleo = (personal?: Personal) =>
  personal?.periodosEmpleo?.map((periodo) => ({
    fechaIngreso: new Date(periodo.fechaIngreso),
    fechaEgreso: periodo.fechaEgreso ? new Date(periodo.fechaEgreso) : null,
    motivo: periodo.motivo || '',
    categoria: periodo.categoria || '',
  })) || [{ fechaIngreso: new Date(), fechaEgreso: null, motivo: '', categoria: '' }];

export const getInitialDocumentacion = (personal?: Personal) => {
  const docs = personal?.documentacion;
  return {
    licenciaConducir: getDocumentData(docs?.licenciaConducir),
    carnetProfesional: getDocumentData(docs?.carnetProfesional),
    evaluacionMedica: getDocumentData(docs?.evaluacionMedica),
    psicofisico: getDocumentData(docs?.psicofisico),
  };
};

export const getInitialDatosLaborales = (personal?: Personal) => ({
  categoria: personal?.datosLaborales?.categoria || '',
  obraSocial: personal?.datosLaborales?.obraSocial || '',
  art: personal?.datosLaborales?.art || '',
});

export const getInitialCapacitaciones = (personal?: Personal) =>
  personal?.capacitaciones?.map((cap) => ({
    nombre: cap.nombre || '',
    fecha: cap.fecha ? new Date(cap.fecha) : null,
    vencimiento: cap.vencimiento ? new Date(cap.vencimiento) : null,
    institucion: cap.institucion || '',
    certificado: cap.certificado || '',
  })) || [];

export const getInitialIncidentes = (personal?: Personal) =>
  personal?.incidentes?.map((inc) => ({
    fecha: inc.fecha ? new Date(inc.fecha) : null,
    tipo: inc.tipo || 'Otro',
    descripcion: inc.descripcion || '',
    consecuencias: inc.consecuencias || '',
  })) || [];

// Data processing for submit
export const processDocumentacionForSubmit = (documentacion: any) => {
  // Helper function to process individual document with numero requirement
  const processDocumentWithNumero = (doc: any) => {
    if (!doc.numero) return undefined;

    return {
      ...doc,
      vencimiento: doc.vencimiento || undefined,
    };
  };

  // Helper function to process document with fecha requirement
  const processDocumentWithFecha = (doc: any) => {
    if (!doc.fecha) return undefined;

    return {
      ...doc,
      fecha: doc.fecha,
      vencimiento: doc.vencimiento || undefined,
    };
  };

  return {
    licenciaConducir: processDocumentWithNumero(documentacion.licenciaConducir),
    carnetProfesional: processDocumentWithNumero(documentacion.carnetProfesional),
    evaluacionMedica: processDocumentWithFecha(documentacion.evaluacionMedica),
    psicofisico: processDocumentWithFecha(documentacion.psicofisico),
  };
};

export const processPeriodosEmpleoForSubmit = (periodos: any[]) =>
  periodos.map((periodo) => ({
    ...periodo,
    fechaIngreso: periodo.fechaIngreso,
    fechaEgreso: periodo.fechaEgreso || undefined,
  }));

export const processCapacitacionesForSubmit = (capacitaciones: any[]) =>
  capacitaciones
    .filter((cap) => cap.nombre)
    .map((cap) => ({
      ...cap,
      fecha: cap.fecha || undefined,
      vencimiento: cap.vencimiento || undefined,
    }));

export const processIncidentesForSubmit = (incidentes: any[]) =>
  incidentes
    .filter((inc) => inc.descripcion)
    .map((inc) => ({
      ...inc,
      fecha: inc.fecha || undefined,
    }));

export const hasDatosLaborales = (datosLaborales: any) =>
  Object.values(datosLaborales).some((v) => v);

// Build personal data for submission
export const buildPersonalData = (
  values: any,
  helpers: {
    processPeriodosEmpleoForSubmit: typeof processPeriodosEmpleoForSubmit;
    processDocumentacionForSubmit: typeof processDocumentacionForSubmit;
    hasDatosLaborales: typeof hasDatosLaborales;
    processCapacitacionesForSubmit: typeof processCapacitacionesForSubmit;
    processIncidentesForSubmit: typeof processIncidentesForSubmit;
  }
) => ({
  ...values,
  fechaNacimiento: values.fechaNacimiento || undefined,
  periodosEmpleo: helpers.processPeriodosEmpleoForSubmit(values.periodosEmpleo),
  documentacion: helpers.processDocumentacionForSubmit(values.documentacion),
  datosLaborales: helpers.hasDatosLaborales(values.datosLaborales)
    ? values.datosLaborales
    : undefined,
  capacitaciones: helpers.processCapacitacionesForSubmit(values.capacitaciones),
  incidentes: helpers.processIncidentesForSubmit(values.incidentes),
});

// Save personal
export const savePersonal = async (personalData: any, personalId?: string) => {
  if (personalId) {
    return await personalService.update(personalId, personalData);
  }
  return await personalService.create(personalData);
};

// Notifications
export const showSuccessNotification = (isEdit: boolean) => {
  notifications.show({
    title: isEdit ? 'Personal actualizado' : 'Personal creado',
    message: isEdit
      ? 'El personal ha sido actualizado correctamente'
      : 'El personal ha sido creado correctamente',
    color: 'green',
    icon: <IconCheck size={16} />,
  });
};

export const showErrorNotification = (error: any) => {
  notifications.show({
    title: 'Error',
    message: error.response?.data?.message || error.message || 'Error al guardar personal',
    color: 'red',
    icon: <IconX size={16} />,
  });
};

// Helper function to get empresa ID from personal data
const getEmpresaId = (personal?: Personal): string => {
  if (!personal?.empresa) return '';
  return typeof personal.empresa === 'string' ? personal.empresa : personal.empresa._id || '';
};

// Helper function to get fecha nacimiento
const getFechaNacimiento = (personal?: Personal): Date | null => {
  return personal?.fechaNacimiento ? new Date(personal.fechaNacimiento) : null;
};

// Create form validation rules
export const createFormValidationRules = () => ({
  nombre: (value: string) => (!value ? 'El nombre es obligatorio' : null),
  apellido: (value: string) => (!value ? 'El apellido es obligatorio' : null),
  dni: (value: string) => (!value ? 'El DNI es obligatorio' : null),
  cuil: (value: string) =>
    value && !/^[0-9]{2}-[0-9]{8}-[0-9]$/.test(value)
      ? 'CUIL debe tener formato XX-XXXXXXXX-X'
      : null,
  tipo: (value: string) => (!value ? 'El tipo de personal es obligatorio' : null),
  empresa: (value: string) => (!value ? 'La empresa es obligatoria' : null),
});

// Create form initial values
export const createFormInitialValues = (personal: Personal | undefined) => ({
  // Datos básicos
  nombre: personal?.nombre || '',
  apellido: personal?.apellido || '',
  dni: personal?.dni || '',
  cuil: personal?.cuil || '',
  tipo: personal?.tipo || 'Conductor',
  fechaNacimiento: getFechaNacimiento(personal),
  empresa: getEmpresaId(personal),
  activo: personal?.activo ?? true,
  observaciones: personal?.observaciones || '',

  // Sections using helper functions
  direccion: getInitialDireccion(personal),
  contacto: getInitialContacto(personal),
  periodosEmpleo: getInitialPeriodosEmpleo(personal),
  documentacion: getInitialDocumentacion(personal),
  datosLaborales: getInitialDatosLaborales(personal),
  capacitaciones: getInitialCapacitaciones(personal),
  incidentes: getInitialIncidentes(personal),
});
