import { Alert, Text } from '@mantine/core';
import {
  IconAlertTriangle,
  IconCalendar,
  IconX,
  IconCheck,
  IconTruck,
  IconUser,
} from '@tabler/icons-react';
import { differenceInDays, parseISO, isValid } from 'date-fns';
import { useState } from 'react';
import { useDocumentExpiration } from './hooks/useDocumentExpiration';
import { DocumentModal } from './components/DocumentModal';
import { DocumentDetailedView } from './components/DocumentDetailedView';
import { CompactDocumentView } from './components/CompactDocumentView';

interface DocumentoVencimiento {
  id: string;
  entidad: 'vehiculo' | 'personal';
  entidadId: string;
  entidadNombre: string;
  tipoDocumento: string;
  numeroDocumento?: string;
  fechaVencimiento: Date;
  diasRestantes: number;
  estado: 'vencido' | 'proximo' | 'vigente';
  empresa?: string;
}

interface Vehiculo {
  _id: string;
  dominio: string;
  empresa?: { nombre: string };
  documentacion?: Record<string, { vencimiento?: string; numero?: string }>;
}

interface Personal {
  _id: string;
  nombre: string;
  apellido: string;
  empresa?: { nombre: string };
  documentacion?: Record<string, { vencimiento?: string; numero?: string }>;
}

interface DocumentExpirationProps {
  vehiculos?: Vehiculo[];
  personal?: Personal[];
  diasAlerta?: number;
  mostrarVencidos?: boolean;
  mostrarProximos?: boolean;
  mostrarVigentes?: boolean;
  onEditVehiculo?: (vehiculoId: string) => void;
  onEditPersonal?: (personalId: string) => void;
  compact?: boolean;
}

// Funciones auxiliares para reducir complejidad
const calcularEstadoDocumento = (
  diasRestantes: number,
  diasAlerta: number
): DocumentoVencimiento['estado'] => {
  if (diasRestantes < 0) return 'vencido';
  if (diasRestantes <= diasAlerta) return 'proximo';
  return 'vigente';
};

// Fixed: Reduce parameters using object parameter pattern
interface ProcessDocumentParams {
  tipo: string;
  doc: { vencimiento?: string; numero?: string } | undefined;
  entidad: {
    id: string;
    nombre: string;
    tipo: 'vehiculo' | 'personal';
    empresaNombre?: string;
  };
  diasAlerta: number;
}

const procesarDocumentoGenerico = (params: ProcessDocumentParams): DocumentoVencimiento | null => {
  const { tipo, doc, entidad, diasAlerta } = params;
  if (!doc?.vencimiento) return null;

  try {
    const fecha = parseISO(doc.vencimiento);
    if (!isValid(fecha)) return null;

    const diasRestantes = differenceInDays(fecha, new Date());
    const estado = calcularEstadoDocumento(diasRestantes, diasAlerta);

    return {
      id: `${entidad.tipo}-${entidad.id}-${tipo}`,
      entidad: entidad.tipo,
      entidadId: entidad.id,
      entidadNombre: entidad.nombre,
      tipoDocumento:
        entidad.tipo === 'vehiculo'
          ? tipo.toUpperCase()
          : tipo
              .replace(/([A-Z])/g, ' $1')
              .trim()
              .toUpperCase(),
      numeroDocumento: doc.numero,
      fechaVencimiento: fecha,
      diasRestantes,
      estado,
      empresa: entidad.empresaNombre,
    };
  } catch (error) {
    console.warn(`Error procesando documento ${tipo} de ${entidad.nombre}:`, error);
    return null;
  }
};

const procesarDocumentosVehiculos = (
  vehiculos: Vehiculo[],
  diasAlerta = 30
): DocumentoVencimiento[] => {
  const documentos: DocumentoVencimiento[] = [];
  const tiposDocumentos = ['vtv', 'seguro', 'ruta', 'senasa'];

  vehiculos.forEach((vehiculo) => {
    const docs = vehiculo.documentacion || {};

    tiposDocumentos.forEach((tipo) => {
      const doc = procesarDocumentoGenerico({
        tipo,
        doc: docs[tipo],
        entidad: {
          id: vehiculo._id,
          nombre: vehiculo.dominio,
          tipo: 'vehiculo',
          empresaNombre: vehiculo.empresa?.nombre,
        },
        diasAlerta,
      });
      if (doc) documentos.push(doc);
    });
  });

  return documentos;
};

const procesarDocumentosPersonal = (
  personal: Personal[],
  diasAlerta = 30
): DocumentoVencimiento[] => {
  const documentos: DocumentoVencimiento[] = [];
  const tiposDocumentos = [
    'licenciaConducir',
    'aptitudPsicofisica',
    'cargaPeligrosa',
    'cursoDefensivo',
  ];

  personal.forEach((persona) => {
    const docs = persona.documentacion || {};
    const nombreCompleto = `${persona.nombre} ${persona.apellido}`;

    tiposDocumentos.forEach((tipo) => {
      const doc = procesarDocumentoGenerico({
        tipo,
        doc: docs[tipo],
        entidad: {
          id: persona._id,
          nombre: nombreCompleto,
          tipo: 'personal',
          empresaNombre: persona.empresa?.nombre,
        },
        diasAlerta,
      });
      if (doc) documentos.push(doc);
    });
  });

  return documentos;
};

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'vencido':
      return 'red';
    case 'proximo':
      return 'yellow';
    case 'vigente':
      return 'green';
    default:
      return 'gray';
  }
};

const getEstadoIcon = (estado: string) => {
  switch (estado) {
    case 'vencido':
      return <IconX size={16} />;
    case 'proximo':
      return <IconAlertTriangle size={16} />;
    case 'vigente':
      return <IconCheck size={16} />;
    default:
      return <IconCalendar size={16} />;
  }
};

const getEntidadIcon = (entidad: string) => {
  return entidad === 'vehiculo' ? <IconTruck size={16} /> : <IconUser size={16} />;
};

// Hook personalizado para la lógica de documentos

export const DocumentExpiration: React.FC<DocumentExpirationProps> = ({
  vehiculos = [],
  personal = [],
  diasAlerta = 30,
  mostrarVencidos = true,
  mostrarProximos = true,
  mostrarVigentes = false,
  onEditVehiculo,
  onEditPersonal,
  compact = false,
}) => {
  const [detailModalOpened, setDetailModalOpened] = useState(false);

  const { documentos, vencidos, proximos, alertasHabilitadas, setAlertasHabilitadas } =
    useDocumentExpiration({
      vehiculos,
      personal,
      diasAlerta,
      mostrarVencidos,
      mostrarProximos,
      mostrarVigentes,
      procesarDocumentosVehiculos,
      procesarDocumentosPersonal,
    });

  if (documentos.length === 0) {
    return (
      <Alert icon={<IconCheck />} color="green" variant="light">
        <Text size="sm">No hay documentos próximos a vencer o vencidos.</Text>
      </Alert>
    );
  }

  if (compact) {
    return (
      <>
        <CompactDocumentView
          vencidos={vencidos}
          proximos={proximos}
          alertasHabilitadas={alertasHabilitadas}
          setAlertasHabilitadas={setAlertasHabilitadas}
          setDetailModalOpened={setDetailModalOpened}
        />

        <DocumentModal
          opened={detailModalOpened}
          onClose={() => setDetailModalOpened(false)}
          vencidos={vencidos}
          proximos={proximos}
          documentos={documentos}
          getEstadoIcon={getEstadoIcon}
          getEstadoColor={getEstadoColor}
          getEntidadIcon={getEntidadIcon}
        />
      </>
    );
  }

  return (
    <DocumentDetailedView
      documentos={documentos}
      vencidos={vencidos}
      proximos={proximos}
      alertasHabilitadas={alertasHabilitadas}
      setAlertasHabilitadas={setAlertasHabilitadas}
      getEstadoIcon={getEstadoIcon}
      getEstadoColor={getEstadoColor}
      getEntidadIcon={getEntidadIcon}
      onEditVehiculo={onEditVehiculo}
      onEditPersonal={onEditPersonal}
    />
  );
};
