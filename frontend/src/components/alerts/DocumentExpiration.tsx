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
  Tooltip
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
  IconBellOff
} from '@tabler/icons-react';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useEffect } from 'react';
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

interface DocumentExpirationProps {
  // Datos de vehículos y personal con documentación
  vehiculos?: any[];
  personal?: any[];
  // Configuración de alertas
  diasAlerta?: number; // días antes del vencimiento para alertar
  mostrarVencidos?: boolean;
  mostrarProximos?: boolean;
  mostrarVigentes?: boolean;
  // Callbacks
  onEditVehiculo?: (vehiculoId: string) => void;
  onEditPersonal?: (personalId: string) => void;
  // Vista compacta o expandida
  compact?: boolean;
}

const procesarDocumentosVehiculos = (vehiculos: any[], diasAlerta: number = 30): DocumentoVencimiento[] => {
  const documentos: DocumentoVencimiento[] = [];
  const hoy = new Date();

  vehiculos.forEach(vehiculo => {
    const docs = vehiculo.documentacion || {};
    
    const procesarDoc = (tipo: string, doc: any) => {
      if (!doc?.vencimiento) return;
      
      try {
        const fecha = parseISO(doc.vencimiento);
        if (!isValid(fecha)) return;
        
        const diasRestantes = differenceInDays(fecha, hoy);
        
        let estado: DocumentoVencimiento['estado'];
        if (diasRestantes < 0) {
          estado = 'vencido';
        } else if (diasRestantes <= diasAlerta) {
          estado = 'proximo';
        } else {
          estado = 'vigente';
        }
        
        documentos.push({
          id: `vehiculo-${vehiculo._id}-${tipo}`,
          entidad: 'vehiculo',
          entidadId: vehiculo._id,
          entidadNombre: vehiculo.dominio,
          tipoDocumento: tipo.toUpperCase(),
          numeroDocumento: doc.numero,
          fechaVencimiento: fecha,
          diasRestantes,
          estado,
          empresa: vehiculo.empresa?.nombre
        });
      } catch (error) {
        console.warn(`Error procesando documento ${tipo} del vehículo ${vehiculo.dominio}:`, error);
      }
    };

    procesarDoc('vtv', docs.vtv);
    procesarDoc('seguro', docs.seguro);
    procesarDoc('ruta', docs.ruta);
    procesarDoc('senasa', docs.senasa);
  });

  return documentos;
};

const procesarDocumentosPersonal = (personal: any[], diasAlerta: number = 30): DocumentoVencimiento[] => {
  const documentos: DocumentoVencimiento[] = [];
  const hoy = new Date();

  personal.forEach(persona => {
    const docs = persona.documentacion || {};
    
    const procesarDoc = (tipo: string, doc: any) => {
      if (!doc?.vencimiento) return;
      
      try {
        const fecha = parseISO(doc.vencimiento);
        if (!isValid(fecha)) return;
        
        const diasRestantes = differenceInDays(fecha, hoy);
        
        let estado: DocumentoVencimiento['estado'];
        if (diasRestantes < 0) {
          estado = 'vencido';
        } else if (diasRestantes <= diasAlerta) {
          estado = 'proximo';
        } else {
          estado = 'vigente';
        }
        
        documentos.push({
          id: `personal-${persona._id}-${tipo}`,
          entidad: 'personal',
          entidadId: persona._id,
          entidadNombre: `${persona.nombre} ${persona.apellido}`,
          tipoDocumento: tipo.replace(/([A-Z])/g, ' $1').trim().toUpperCase(),
          numeroDocumento: doc.numero,
          fechaVencimiento: fecha,
          diasRestantes,
          estado,
          empresa: persona.empresa?.nombre
        });
      } catch (error) {
        console.warn(`Error procesando documento ${tipo} del personal ${persona.nombre}:`, error);
      }
    };

    procesarDoc('licenciaConducir', docs.licenciaConducir);
    procesarDoc('aptitudPsicofisica', docs.aptitudPsicofisica);
    procesarDoc('cargaPeligrosa', docs.cargaPeligrosa);
    procesarDoc('cursoDefensivo', docs.cursoDefensivo);
  });

  return documentos;
};

const getEstadoColor = (estado: DocumentoVencimiento['estado']) => {
  switch (estado) {
    case 'vencido': return 'red';
    case 'proximo': return 'yellow';
    case 'vigente': return 'green';
    default: return 'gray';
  }
};

const getEstadoIcon = (estado: DocumentoVencimiento['estado']) => {
  switch (estado) {
    case 'vencido': return <IconX size={16} />;
    case 'proximo': return <IconAlertTriangle size={16} />;
    case 'vigente': return <IconCheck size={16} />;
    default: return <IconCalendar size={16} />;
  }
};

const getEntidadIcon = (entidad: DocumentoVencimiento['entidad']) => {
  return entidad === 'vehiculo' ? <IconTruck size={16} /> : <IconUser size={16} />;
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
  compact = false
}) => {
  const [documentos, setDocumentos] = useState<DocumentoVencimiento[]>([]);
  const [detailModalOpened, setDetailModalOpened] = useState(false);
  const [alertasHabilitadas, setAlertasHabilitadas] = useState(true);

  useEffect(() => {
    const docsVehiculos = procesarDocumentosVehiculos(vehiculos, diasAlerta);
    const docsPersonal = procesarDocumentosPersonal(personal, diasAlerta);
    
    const todosDocumentos = [...docsVehiculos, ...docsPersonal]
      .filter(doc => {
        if (doc.estado === 'vencido' && !mostrarVencidos) return false;
        if (doc.estado === 'proximo' && !mostrarProximos) return false;
        if (doc.estado === 'vigente' && !mostrarVigentes) return false;
        return true;
      })
      .sort((a, b) => {
        // Ordenar por estado (vencidos primero, luego próximos) y luego por días restantes
        if (a.estado !== b.estado) {
          const orden = { 'vencido': 0, 'proximo': 1, 'vigente': 2 };
          return orden[a.estado] - orden[b.estado];
        }
        return a.diasRestantes - b.diasRestantes;
      });

    setDocumentos(todosDocumentos);

    // Mostrar notificación automática si hay documentos vencidos o próximos a vencer
    if (alertasHabilitadas) {
      const vencidos = todosDocumentos.filter(doc => doc.estado === 'vencido').length;
      const proximos = todosDocumentos.filter(doc => doc.estado === 'proximo').length;

      if (vencidos > 0) {
        notifications.show({
          title: 'Documentos Vencidos',
          message: `${vencidos} documento${vencidos > 1 ? 's' : ''} vencido${vencidos > 1 ? 's' : ''}`,
          color: 'red',
          icon: <IconAlertTriangle />,
          autoClose: 5000,
        });
      } else if (proximos > 0) {
        notifications.show({
          title: 'Documentos por Vencer',
          message: `${proximos} documento${proximos > 1 ? 's' : ''} próximo${proximos > 1 ? 's' : ''} a vencer`,
          color: 'yellow',
          icon: <IconAlertTriangle />,
          autoClose: 5000,
        });
      }
    }
  }, [vehiculos, personal, diasAlerta, mostrarVencidos, mostrarProximos, mostrarVigentes, alertasHabilitadas]);

  if (documentos.length === 0) {
    return (
      <Alert icon={<IconCheck />} color="green" variant="light">
        <Text size="sm">No hay documentos próximos a vencer o vencidos.</Text>
      </Alert>
    );
  }

  const vencidos = documentos.filter(doc => doc.estado === 'vencido');
  const proximos = documentos.filter(doc => doc.estado === 'proximo');

  if (compact) {
    return (
      <Card withBorder>
        <Group justify="space-between" mb="md">
          <Group>
            <IconCalendar size={18} />
            <Text fw={500}>Estado de Documentación</Text>
          </Group>
          <Group gap="xs">
            <Tooltip label={alertasHabilitadas ? "Deshabilitar alertas" : "Habilitar alertas"}>
              <ActionIcon 
                variant="light" 
                color={alertasHabilitadas ? "blue" : "gray"}
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
        </Group>

        <Stack gap="xs">
          {vencidos.length > 0 && (
            <Alert icon={<IconX />} color="red" variant="light">
              <Text size="sm" fw={500}>{vencidos.length} documento{vencidos.length > 1 ? 's' : ''} vencido{vencidos.length > 1 ? 's' : ''}</Text>
            </Alert>
          )}
          
          {proximos.length > 0 && (
            <Alert icon={<IconAlertTriangle />} color="yellow" variant="light">
              <Text size="sm" fw={500}>{proximos.length} documento{proximos.length > 1 ? 's' : ''} próximo{proximos.length > 1 ? 's' : ''} a vencer</Text>
            </Alert>
          )}

          {vencidos.length === 0 && proximos.length === 0 && (
            <Alert icon={<IconCheck />} color="green" variant="light">
              <Text size="sm">Toda la documentación está vigente</Text>
            </Alert>
          )}
        </Stack>
      </Card>
    );
  }

  return (
    <>
      <Card withBorder>
        <Card.Section withBorder inheritPadding py="xs">
          <Group justify="space-between">
            <Group>
              <IconCalendar size={18} />
              <Text fw={500}>Alertas de Vencimiento</Text>
            </Group>
            <Group gap="xs">
              <Tooltip label={alertasHabilitadas ? "Deshabilitar alertas" : "Habilitar alertas"}>
                <ActionIcon 
                  variant="light" 
                  color={alertasHabilitadas ? "blue" : "gray"}
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
            {/* Resumen */}
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Total de alertas</Text>
              <Badge color={vencidos.length > 0 ? 'red' : proximos.length > 0 ? 'yellow' : 'green'} variant="light">
                {documentos.length} documento{documentos.length !== 1 ? 's' : ''}
              </Badge>
            </Group>

            <Progress.Root size="lg">
              <Progress.Section 
                value={(vencidos.length / documentos.length) * 100} 
                color="red"
              >
                <Progress.Label>Vencidos: {vencidos.length}</Progress.Label>
              </Progress.Section>
              <Progress.Section 
                value={(proximos.length / documentos.length) * 100} 
                color="yellow"
              >
                <Progress.Label>Próximos: {proximos.length}</Progress.Label>
              </Progress.Section>
            </Progress.Root>

            <Divider />

            {/* Lista de documentos */}
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
                      <Text fw={500} size="sm">{doc.entidadNombre}</Text>
                      <Badge size="xs" variant="light">{doc.tipoDocumento}</Badge>
                    </Group>
                    <Group gap="xs">
                      <Badge color={getEstadoColor(doc.estado)} variant="light" size="xs">
                        {doc.estado === 'vencido' 
                          ? `${Math.abs(doc.diasRestantes)} días vencido`
                          : doc.estado === 'proximo'
                          ? `${doc.diasRestantes} días restantes`
                          : 'Vigente'
                        }
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

      {/* Modal de detalle */}
      <Modal
        opened={detailModalOpened}
        onClose={() => setDetailModalOpened(false)}
        title="Detalle de Vencimientos"
        size="lg"
        centered
      >
        <Stack gap="md">
          {/* Estadísticas */}
          <Group justify="space-around">
            <Stack align="center" gap="xs">
              <Text size="xl" fw={700} c="red">{vencidos.length}</Text>
              <Text size="sm" c="dimmed">Vencidos</Text>
            </Stack>
            <Stack align="center" gap="xs">
              <Text size="xl" fw={700} c="yellow">{proximos.length}</Text>
              <Text size="sm" c="dimmed">Próximos</Text>
            </Stack>
            <Stack align="center" gap="xs">
              <Text size="xl" fw={700} c="blue">{documentos.length}</Text>
              <Text size="sm" c="dimmed">Total</Text>
            </Stack>
          </Group>

          <Divider />

          {/* Lista detallada */}
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
                        <Text fw={500} size="sm">{doc.entidadNombre}</Text>
                        <Badge size="xs" variant="light">{doc.tipoDocumento}</Badge>
                      </Group>
                      <Text size="xs" c="dimmed">
                        Vence: {format(doc.fechaVencimiento, 'dd/MM/yyyy', { locale: es })}
                      </Text>
                      {doc.numeroDocumento && (
                        <Text size="xs" c="dimmed">Número: {doc.numeroDocumento}</Text>
                      )}
                      {doc.empresa && (
                        <Text size="xs" c="dimmed">Empresa: {doc.empresa}</Text>
                      )}
                    </Stack>
                    <Badge color={getEstadoColor(doc.estado)} variant="light" size="xs">
                      {doc.estado === 'vencido' 
                        ? `${Math.abs(doc.diasRestantes)} días vencido`
                        : doc.estado === 'proximo'
                        ? `${doc.diasRestantes} días`
                        : 'Vigente'
                      }
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
};