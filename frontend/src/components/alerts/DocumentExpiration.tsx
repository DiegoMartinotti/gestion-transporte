import {
  Alert,
  Stack,
  Group,
  Text,
  Badge,
  ActionIcon,
  Card,
  Timeline,
  Button,
  Modal,
  Divider,
  Box,
  Progress,
  Tooltip,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCalendar,
  IconX,
  IconCheck,
  IconEye,
  IconEdit,
  IconTruck,
  IconUser,
  IconBell,
  IconBellOff,
} from '@tabler/icons-react';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useEffect, useRef, useMemo } from 'react';
import { notifications } from '@mantine/notifications';

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

const getEstadoColor = (estado: DocumentoVencimiento['estado']) => {
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

const getEstadoIcon = (estado: DocumentoVencimiento['estado']) => {
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

const getEntidadIcon = (entidad: DocumentoVencimiento['entidad']) => {
  return entidad === 'vehiculo' ? <IconTruck size={16} /> : <IconUser size={16} />;
};

// Componente auxiliar para alertas de estado
const DocumentAlert: React.FC<{
  count: number;
  icon: React.ReactNode;
  color: string;
  messageKey: 'vencidos' | 'proximos' | 'vigente';
}> = ({ count, icon, color, messageKey }) => {
  const messages = {
    vencidos: `${count} documento${count > 1 ? 's' : ''} vencido${count > 1 ? 's' : ''}`,
    proximos: `${count} documento${count > 1 ? 's' : ''} próximo${count > 1 ? 's' : ''} a vencer`,
    vigente: 'Toda la documentación está vigente',
  };

  return (
    <Alert icon={icon} color={color} variant="light">
      <Text size="sm" fw={500}>
        {messages[messageKey]}
      </Text>
    </Alert>
  );
};

// Componente auxiliar para botones de acción
const CompactActions: React.FC<{
  alertasHabilitadas: boolean;
  setAlertasHabilitadas: (value: boolean) => void;
  setDetailModalOpened: (value: boolean) => void;
}> = ({ alertasHabilitadas, setAlertasHabilitadas, setDetailModalOpened }) => (
  <Group gap="xs">
    <Tooltip label={alertasHabilitadas ? 'Deshabilitar alertas' : 'Habilitar alertas'}>
      <ActionIcon
        variant="light"
        color={alertasHabilitadas ? 'blue' : 'gray'}
        onClick={() => setAlertasHabilitadas(!alertasHabilitadas)}
      >
        {alertasHabilitadas ? <IconBell size={16} /> : <IconBellOff size={16} />}
      </ActionIcon>
    </Tooltip>
    <Button
      variant="light"
      size="xs"
      leftSection={<IconEye size={14} />}
      onClick={() => setDetailModalOpened(true)}
    >
      Ver Detalle
    </Button>
  </Group>
);

// Componente simplificado para vista compacta
const CompactDocumentView: React.FC<{
  vencidos: DocumentoVencimiento[];
  proximos: DocumentoVencimiento[];
  alertasHabilitadas: boolean;
  setAlertasHabilitadas: (value: boolean) => void;
  setDetailModalOpened: (value: boolean) => void;
}> = ({ vencidos, proximos, alertasHabilitadas, setAlertasHabilitadas, setDetailModalOpened }) => {
  const hasExpired = vencidos.length > 0;
  const hasUpcoming = proximos.length > 0;
  const allCurrent = !hasExpired && !hasUpcoming;

  return (
    <Card withBorder>
      <Group justify="space-between" mb="md">
        <Group>
          <IconCalendar size={18} />
          <Text fw={500}>Estado de Documentación</Text>
        </Group>
        <CompactActions
          alertasHabilitadas={alertasHabilitadas}
          setAlertasHabilitadas={setAlertasHabilitadas}
          setDetailModalOpened={setDetailModalOpened}
        />
      </Group>

      <Stack gap="xs">
        {hasExpired && (
          <DocumentAlert
            count={vencidos.length}
            icon={<IconX />}
            color="red"
            messageKey="vencidos"
          />
        )}
        {hasUpcoming && (
          <DocumentAlert
            count={proximos.length}
            icon={<IconAlertTriangle />}
            color="yellow"
            messageKey="proximos"
          />
        )}
        {allCurrent && (
          <DocumentAlert count={0} icon={<IconCheck />} color="green" messageKey="vigente" />
        )}
      </Stack>
    </Card>
  );
};

// Hook personalizado para la lógica de documentos
const useDocumentExpiration = (
  vehiculos: Vehiculo[],
  personal: Personal[],
  diasAlerta: number,
  mostrarVencidos: boolean,
  mostrarProximos: boolean,
  mostrarVigentes: boolean
) => {
  const [alertasHabilitadas, setAlertasHabilitadas] = useState(true);
  const notificationShownRef = useRef(false);

  const documentos = useMemo(() => {
    const docsVehiculos = procesarDocumentosVehiculos(vehiculos, diasAlerta);
    const docsPersonal = procesarDocumentosPersonal(personal, diasAlerta);
    const todosDocumentos = [...docsVehiculos, ...docsPersonal];

    return todosDocumentos
      .filter((doc) => {
        if (doc.estado === 'vencido' && !mostrarVencidos) return false;
        if (doc.estado === 'proximo' && !mostrarProximos) return false;
        if (doc.estado === 'vigente' && !mostrarVigentes) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.estado !== b.estado) {
          const orden = { vencido: 0, proximo: 1, vigente: 2 };
          return orden[a.estado] - orden[b.estado];
        }
        return a.diasRestantes - b.diasRestantes;
      });
  }, [vehiculos, personal, diasAlerta, mostrarVencidos, mostrarProximos, mostrarVigentes]);

  const { vencidos, proximos } = useMemo(
    () => ({
      vencidos: documentos.filter((doc) => doc.estado === 'vencido'),
      proximos: documentos.filter((doc) => doc.estado === 'proximo'),
    }),
    [documentos]
  );

  useEffect(() => {
    notificationShownRef.current = false;
  }, [vehiculos, personal, diasAlerta, mostrarVencidos, mostrarProximos, mostrarVigentes]);

  useEffect(() => {
    if (!alertasHabilitadas || notificationShownRef.current) return;

    const vencidosCount = vencidos.length;
    const proximosCount = proximos.length;

    if (vencidosCount > 0) {
      notifications.show({
        title: 'Documentos Vencidos',
        message: `${vencidosCount} documento${vencidosCount > 1 ? 's' : ''} vencido${vencidosCount > 1 ? 's' : ''}`,
        color: 'red',
        icon: <IconAlertTriangle />,
        autoClose: 5000,
      });
      notificationShownRef.current = true;
    } else if (proximosCount > 0) {
      notifications.show({
        title: 'Documentos por Vencer',
        message: `${proximosCount} documento${proximosCount > 1 ? 's' : ''} próximo${proximosCount > 1 ? 's' : ''} a vencer`,
        color: 'yellow',
        icon: <IconAlertTriangle />,
        autoClose: 5000,
      });
      notificationShownRef.current = true;
    }
  }, [documentos, alertasHabilitadas, vencidos.length, proximos.length]);

  return {
    documentos,
    vencidos,
    proximos,
    alertasHabilitadas,
    setAlertasHabilitadas,
  };
};

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
    useDocumentExpiration(
      vehiculos,
      personal,
      diasAlerta,
      mostrarVencidos,
      mostrarProximos,
      mostrarVigentes
    );

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

        <Modal
          opened={detailModalOpened}
          onClose={() => setDetailModalOpened(false)}
          title="Detalle de Vencimientos"
          size="lg"
          centered
        >
          <Stack gap="md">
            <Group justify="space-around">
              <Stack align="center" gap="xs">
                <Text size="xl" fw={700} c="red">
                  {vencidos.length}
                </Text>
                <Text size="sm" c="dimmed">
                  Vencidos
                </Text>
              </Stack>
              <Stack align="center" gap="xs">
                <Text size="xl" fw={700} c="yellow">
                  {proximos.length}
                </Text>
                <Text size="sm" c="dimmed">
                  Próximos
                </Text>
              </Stack>
              <Stack align="center" gap="xs">
                <Text size="xl" fw={700} c="blue">
                  {documentos.length}
                </Text>
                <Text size="sm" c="dimmed">
                  Total
                </Text>
              </Stack>
            </Group>
            <Divider />
            <Box style={{ maxHeight: 400, overflowY: 'auto' }}>
              <Timeline active={-1} bulletSize={16} lineWidth={1}>
                {documentos.map((doc) => (
                  <Timeline.Item
                    key={doc.id}
                    bullet={getEstadoIcon(doc.estado)}
                    color={getEstadoColor(doc.estado)}
                  >
                    <Group justify="space-between" align="flex-start">
                      <Stack gap={2}>
                        <Group gap="xs">
                          {getEntidadIcon(doc.entidad)}
                          <Text fw={500} size="sm">
                            {doc.entidadNombre}
                          </Text>
                          <Badge size="xs" variant="light">
                            {doc.tipoDocumento}
                          </Badge>
                        </Group>
                        <Text size="xs" c="dimmed">
                          Vence: {format(doc.fechaVencimiento, 'dd/MM/yyyy', { locale: es })}
                        </Text>
                        {doc.numeroDocumento && (
                          <Text size="xs" c="dimmed">
                            Número: {doc.numeroDocumento}
                          </Text>
                        )}
                        {doc.empresa && (
                          <Text size="xs" c="dimmed">
                            Empresa: {doc.empresa}
                          </Text>
                        )}
                      </Stack>
                      <Badge color={getEstadoColor(doc.estado)} variant="light" size="xs">
                        {doc.estado === 'vencido'
                          ? `${Math.abs(doc.diasRestantes)} días vencido`
                          : doc.estado === 'proximo'
                            ? `${doc.diasRestantes} días`
                            : 'Vigente'}
                      </Badge>
                    </Group>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Box>
          </Stack>
        </Modal>
      </>
    );
  }

  // Vista expandida (implementación existente simplificada)
  return (
    <Card withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Group>
            <IconCalendar size={18} />
            <Text fw={500}>Alertas de Vencimiento</Text>
          </Group>
          <Group gap="xs">
            <Tooltip label={alertasHabilitadas ? 'Deshabilitar alertas' : 'Habilitar alertas'}>
              <ActionIcon
                variant="light"
                color={alertasHabilitadas ? 'blue' : 'gray'}
                onClick={() => setAlertasHabilitadas(!alertasHabilitadas)}
              >
                {alertasHabilitadas ? <IconBell size={16} /> : <IconBellOff size={16} />}
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Card.Section>

      <Card.Section inheritPadding py="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Total de alertas
            </Text>
            <Badge
              color={vencidos.length > 0 ? 'red' : proximos.length > 0 ? 'yellow' : 'green'}
              variant="light"
            >
              {documentos.length} documento{documentos.length !== 1 ? 's' : ''}
            </Badge>
          </Group>

          <Progress.Root size="lg">
            <Progress.Section value={(vencidos.length / documentos.length) * 100} color="red">
              <Progress.Label>Vencidos: {vencidos.length}</Progress.Label>
            </Progress.Section>
            <Progress.Section value={(proximos.length / documentos.length) * 100} color="yellow">
              <Progress.Label>Próximos: {proximos.length}</Progress.Label>
            </Progress.Section>
          </Progress.Root>

          <Divider />

          <Timeline active={-1} bulletSize={20} lineWidth={2}>
            {documentos.map((doc) => (
              <Timeline.Item
                key={doc.id}
                bullet={getEstadoIcon(doc.estado)}
                color={getEstadoColor(doc.estado)}
              >
                <Group justify="space-between" mb="xs">
                  <Group gap="xs">
                    {getEntidadIcon(doc.entidad)}
                    <Text fw={500} size="sm">
                      {doc.entidadNombre}
                    </Text>
                    <Badge size="xs" variant="light">
                      {doc.tipoDocumento}
                    </Badge>
                  </Group>
                  <Group gap="xs">
                    <Badge color={getEstadoColor(doc.estado)} variant="light" size="xs">
                      {doc.estado === 'vencido'
                        ? `${Math.abs(doc.diasRestantes)} días vencido`
                        : `${doc.diasRestantes} días restantes`}
                    </Badge>
                    <ActionIcon
                      size="xs"
                      variant="light"
                      color="blue"
                      onClick={() => {
                        if (doc.entidad === 'vehiculo' && onEditVehiculo) {
                          onEditVehiculo(doc.entidadId);
                        } else if (doc.entidad === 'personal' && onEditPersonal) {
                          onEditPersonal(doc.entidadId);
                        }
                      }}
                    >
                      <IconEdit size={12} />
                    </ActionIcon>
                  </Group>
                </Group>

                <Text size="xs" c="dimmed" mb={5}>
                  Vence: {format(doc.fechaVencimiento, 'dd/MM/yyyy', { locale: es })}
                </Text>

                {doc.numeroDocumento && (
                  <Text size="xs" c="dimmed">
                    Número: {doc.numeroDocumento}
                  </Text>
                )}

                {doc.empresa && (
                  <Text size="xs" c="dimmed">
                    Empresa: {doc.empresa}
                  </Text>
                )}
              </Timeline.Item>
            ))}
          </Timeline>
        </Stack>
      </Card.Section>
    </Card>
  );
};
