import { differenceInDays, parseISO, isValid } from 'date-fns';
import { IconX, IconAlertTriangle, IconCheck, IconInfoCircle } from '@tabler/icons-react';
import { Vehiculo } from '../../types/vehiculo';

export interface DocumentoInfo {
  nombre: string;
  numero?: string;
  vencimiento?: string;
  estado: 'vencido' | 'proximo' | 'vigente' | 'no_disponible';
  diasRestantes: number;
}

export const getDocumentosInfo = (vehiculo: Vehiculo): DocumentoInfo[] => {
  const hoy = new Date();
  const docs = vehiculo.documentacion;

  const checkDocumento = (
    nombre: string,
    doc: { numero?: string; vencimiento?: string; compania?: string } | undefined
  ): DocumentoInfo => {
    if (!doc?.vencimiento) {
      return {
        nombre,
        numero: doc?.numero as string | undefined,
        vencimiento: undefined,
        estado: 'no_disponible',
        diasRestantes: 0,
      };
    }

    try {
      const fecha = parseISO(doc.vencimiento as string);
      if (!isValid(fecha)) {
        return {
          nombre,
          numero: doc.numero as string | undefined,
          vencimiento: doc.vencimiento as string,
          estado: 'no_disponible',
          diasRestantes: 0,
        };
      }

      const diasRestantes = differenceInDays(fecha, hoy);

      let estado: DocumentoInfo['estado'];
      if (diasRestantes < 0) {
        estado = 'vencido';
      } else if (diasRestantes <= 30) {
        estado = 'proximo';
      } else {
        estado = 'vigente';
      }

      return {
        nombre,
        numero: doc.numero as string | undefined,
        vencimiento: doc.vencimiento as string,
        estado,
        diasRestantes,
      };
    } catch {
      return {
        nombre,
        numero: doc?.numero as string | undefined,
        vencimiento: doc?.vencimiento as string,
        estado: 'no_disponible',
        diasRestantes: 0,
      };
    }
  };

  return [
    checkDocumento('VTV', docs?.vtv),
    checkDocumento('Seguro', docs?.seguro),
    checkDocumento('Ruta', docs?.ruta),
    checkDocumento('SENASA', docs?.senasa),
  ];
};

export const getEstadoColor = (estado: DocumentoInfo['estado']) => {
  const colors = {
    vencido: 'red',
    proximo: 'yellow',
    vigente: 'green',
    no_disponible: 'gray',
  };
  return colors[estado] || 'gray';
};

export const getEstadoIcon = (estado: DocumentoInfo['estado']) => {
  const icons = {
    vencido: <IconX size={16} />,
    proximo: <IconAlertTriangle size={16} />,
    vigente: <IconCheck size={16} />,
    no_disponible: <IconInfoCircle size={16} />,
  };
  return icons[estado] || <IconInfoCircle size={16} />;
};

export const getEstadoGeneral = (
  documentos: DocumentoInfo[]
): { estado: string; color: string; porcentaje: number } => {
  const vencidos = documentos.filter((doc) => doc.estado === 'vencido').length;
  const proximos = documentos.filter((doc) => doc.estado === 'proximo').length;
  const vigentes = documentos.filter((doc) => doc.estado === 'vigente').length;
  const total = documentos.filter((doc) => doc.estado !== 'no_disponible').length;

  if (total === 0) {
    return { estado: 'Sin Documentación', color: 'gray', porcentaje: 0 };
  }

  if (vencidos > 0) {
    return {
      estado: `${vencidos} documento${vencidos > 1 ? 's' : ''} vencido${vencidos > 1 ? 's' : ''}`,
      color: 'red',
      porcentaje: ((vigentes + proximos) / total) * 100,
    };
  }

  if (proximos > 0) {
    return {
      estado: `${proximos} documento${proximos > 1 ? 's' : ''} próximo${proximos > 1 ? 's' : ''} a vencer`,
      color: 'yellow',
      porcentaje: (vigentes / total) * 100,
    };
  }

  return { estado: 'Toda la documentación vigente', color: 'green', porcentaje: 100 };
};
