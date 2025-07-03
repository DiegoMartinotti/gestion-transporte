import React, { useState, useEffect, useCallback } from 'react';
import { 
  Alert, 
  Stack, 
  Group, 
  Text, 
  Badge, 
  ActionIcon, 
  Card,
  Button,
  Modal,
  Divider,
  Box,
  Tooltip,
  Paper,
  Title,
  Collapse,
  ThemeIcon
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
  IconChevronDown,
  IconChevronUp,
  IconRefresh,
  IconFileText
} from '@tabler/icons-react';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import dayjs from 'dayjs';

// Interfaces unificadas
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
  prioridad: 'alta' | 'media' | 'baja';
  empresa?: string;
}

interface DocumentExpirationSystemProps {
  // Datos de vehículos y personal con documentación
  vehiculos?: any[];
  personal?: any[];
  // Configuración de alertas
  diasAlerta?: number;
  mostrarVencidos?: boolean;
  mostrarProximos?: boolean;
  mostrarVigentes?: boolean;
  // Callbacks
  onEditVehiculo?: (vehiculoId: string) => void;
  onEditPersonal?: (personalId: string) => void;
  onRefresh?: () => void;
  // Configuración visual
  compact?: boolean;
  autoRefresh?: boolean;
  showNotifications?: boolean;
  // Configuración avanzada de prioridades
  diasPrioridadAlta?: number;
  diasPrioridadMedia?: number;
  diasPrioridadBaja?: number;
}

const DIAS_ALERTA_DEFAULT = {
  alta: 7,    // Alerta crítica
  media: 15,  // Alerta importante
  baja: 30    // Alerta preventiva
};

const TIPOS_DOCUMENTO_LABELS: Record<string, string> = {
  'vtv': 'VTV',
  'seguro': 'Seguro',
  'ruta': 'RUTA',
  'senasa': 'SENASA',
  'licenciaConducir': 'Licencia de Conducir',
  'aptitudPsicofisica': 'Aptitud Psicofísica',
  'cargaPeligrosa': 'Carga Peligrosa',
  'cursoDefensivo': 'Curso Defensivo',
  'rto': 'RTO',
  'patente': 'Patente',
  'habilitacion_municipal': 'Habilitación Municipal',
  'habilitacion_provincial': 'Habilitación Provincial',
  'habilitacion_nacional': 'Habilitación Nacional',
};

const procesarDocumentosUnificado = (
  vehiculos: any[], 
  personal: any[], 
  diasConfig: typeof DIAS_ALERTA_DEFAULT
): DocumentoVencimiento[] => {
  const documentos: DocumentoVencimiento[] = [];
  const hoy = new Date();

  // Procesar vehículos
  vehiculos.forEach(vehiculo => {
    const docs = vehiculo.documentacion || {};
    
    const procesarDoc = (tipo: string, doc: any) => {
      if (!doc?.vencimiento) return;
      
      try {
        const fecha = parseISO(doc.vencimiento);
        if (!isValid(fecha)) return;
        
        const diasRestantes = differenceInDays(fecha, hoy);
        
        let estado: DocumentoVencimiento['estado'];
        let prioridad: DocumentoVencimiento['prioridad'];
        
        if (diasRestantes < 0) {
          estado = 'vencido';
          prioridad = 'alta';
        } else if (diasRestantes <= diasConfig.alta) {
          estado = 'proximo';
          prioridad = 'alta';
        } else if (diasRestantes <= diasConfig.media) {
          estado = 'proximo';
          prioridad = 'media';
        } else if (diasRestantes <= diasConfig.baja) {
          estado = 'proximo';
          prioridad = 'baja';
        } else {
          estado = 'vigente';
          prioridad = 'baja';
        }
        
        documentos.push({
          id: `vehiculo-${vehiculo._id}-${tipo}`,
          entidad: 'vehiculo',
          entidadId: vehiculo._id,
          entidadNombre: vehiculo.dominio || vehiculo.patente,
          tipoDocumento: TIPOS_DOCUMENTO_LABELS[tipo] || tipo.toUpperCase(),
          numeroDocumento: doc.numero,
          fechaVencimiento: fecha,
          diasRestantes,
          estado,
          prioridad,
          empresa: vehiculo.empresa?.nombre
        });
      } catch (error) {
        console.warn(`Error procesando documento ${tipo} del vehículo:`, error);
      }
    };

    procesarDoc('vtv', docs.vtv);
    procesarDoc('seguro', docs.seguro);
    procesarDoc('ruta', docs.ruta);
    procesarDoc('senasa', docs.senasa);
  });

  // Procesar personal
  personal.forEach(persona => {
    const docs = persona.documentacion || {};
    
    const procesarDoc = (tipo: string, doc: any) => {
      if (!doc?.vencimiento) return;
      
      try {
        const fecha = parseISO(doc.vencimiento);
        if (!isValid(fecha)) return;
        
        const diasRestantes = differenceInDays(fecha, hoy);
        
        let estado: DocumentoVencimiento['estado'];
        let prioridad: DocumentoVencimiento['prioridad'];
        
        if (diasRestantes < 0) {
          estado = 'vencido';
          prioridad = 'alta';
        } else if (diasRestantes <= diasConfig.alta) {
          estado = 'proximo';
          prioridad = 'alta';
        } else if (diasRestantes <= diasConfig.media) {
          estado = 'proximo';
          prioridad = 'media';
        } else if (diasRestantes <= diasConfig.baja) {
          estado = 'proximo';
          prioridad = 'baja';
        } else {
          estado = 'vigente';
          prioridad = 'baja';
        }
        
        documentos.push({
          id: `personal-${persona._id}-${tipo}`,
          entidad: 'personal',
          entidadId: persona._id,
          entidadNombre: `${persona.nombre} ${persona.apellido}`,
          tipoDocumento: TIPOS_DOCUMENTO_LABELS[tipo] || tipo.replace(/([A-Z])/g, ' $1').trim().toUpperCase(),
          numeroDocumento: doc.numero,
          fechaVencimiento: fecha,
          diasRestantes,
          estado,
          prioridad,
          empresa: persona.empresa?.nombre
        });
      } catch (error) {
        console.warn(`Error procesando documento ${tipo} del personal:`, error);
      }
    };

    procesarDoc('licenciaConducir', docs.licenciaConducir);
    procesarDoc('aptitudPsicofisica', docs.aptitudPsicofisica);
    procesarDoc('cargaPeligrosa', docs.cargaPeligrosa);
    procesarDoc('cursoDefensivo', docs.cursoDefensivo);
  });

  return documentos;
};

const getEstadoColor = (estado: DocumentoVencimiento['estado'], prioridad?: DocumentoVencimiento['prioridad']) => {
  switch (estado) {
    case 'vencido': return 'red';
    case 'proximo': 
      switch (prioridad) {
        case 'alta': return 'orange';
        case 'media': return 'yellow';
        case 'baja': return 'blue';
        default: return 'yellow';
      }
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

export const DocumentExpirationSystem: React.FC<DocumentExpirationSystemProps> = ({
  vehiculos = [],
  personal = [],
  diasAlerta = 30,
  mostrarVencidos = true,
  mostrarProximos = true,
  mostrarVigentes = false,
  onEditVehiculo,
  onEditPersonal,
  onRefresh,
  compact = false,
  autoRefresh = false,
  showNotifications = true,
  diasPrioridadAlta = 7,
  diasPrioridadMedia = 15,
  diasPrioridadBaja = 30
}) => {
  const [documentos, setDocumentos] = useState<DocumentoVencimiento[]>([]);
  const [alertasHabilitadas, setAlertasHabilitadas] = useState(showNotifications);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [detailModalOpened, setDetailModalOpened] = useState(false);
  
  const [openedVencidos, { toggle: toggleVencidos }] = useDisclosure(true);
  const [openedProximos, { toggle: toggleProximos }] = useDisclosure(true);

  const diasConfig = {
    alta: diasPrioridadAlta,
    media: diasPrioridadMedia,
    baja: diasPrioridadBaja
  };

  const calcularDocumentos = useCallback(() => {
    const todosDocumentos = procesarDocumentosUnificado(vehiculos, personal, diasConfig)
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
    setLastUpdate(new Date());

    // Mostrar notificaciones automáticas si están habilitadas
    if (alertasHabilitadas) {
      const vencidos = todosDocumentos.filter(doc => doc.estado === 'vencido').length;
      const proximosAlta = todosDocumentos.filter(doc => doc.estado === 'proximo' && doc.prioridad === 'alta').length;

      if (vencidos > 0) {
        notifications.show({
          title: 'Documentos Vencidos',
          message: `${vencidos} documento${vencidos > 1 ? 's' : ''} vencido${vencidos > 1 ? 's' : ''}`,
          color: 'red',
          icon: <IconAlertTriangle />,
          autoClose: 5000,
        });
      } else if (proximosAlta > 0) {
        notifications.show({
          title: 'Documentos Críticos',
          message: `${proximosAlta} documento${proximosAlta > 1 ? 's' : ''} vence${proximosAlta > 1 ? 'n' : ''} en menos de 7 días`,
          color: 'orange',
          icon: <IconAlertTriangle />,
          autoClose: 5000,
        });
      }
    }
  }, [vehiculos, personal, diasConfig, mostrarVencidos, mostrarProximos, mostrarVigentes, alertasHabilitadas]);

  useEffect(() => {
    calcularDocumentos();
  }, [calcularDocumentos]);

  // Auto-refresh cada 5 minutos si está habilitado
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      calcularDocumentos();
      onRefresh?.();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, calcularDocumentos, onRefresh]);

  const vencidos = documentos.filter(doc => doc.estado === 'vencido');
  const proximos = documentos.filter(doc => doc.estado === 'proximo');
  const proximosAlta = proximos.filter(doc => doc.prioridad === 'alta');
  const proximosMedia = proximos.filter(doc => doc.prioridad === 'media');
  const proximosBaja = proximos.filter(doc => doc.prioridad === 'baja');

  const renderDocumento = (doc: DocumentoVencimiento, showActions = true) => (
    <Card key={doc.id} padding="sm" withBorder>
      <Group justify="space-between">
        <Group>
          <ThemeIcon 
            size="lg" 
            variant="light" 
            color={doc.entidad === 'vehiculo' ? 'blue' : 'green'}
          >
            {getEntidadIcon(doc.entidad)}
          </ThemeIcon>
          
          <Box>
            <Group gap="xs">
              <Text fw={500} size="sm">{doc.entidadNombre}</Text>
              <Badge size="xs" variant="light">{doc.tipoDocumento}</Badge>
            </Group>
            <Text size="xs" c="dimmed">
              Vence: {format(doc.fechaVencimiento, 'dd/MM/yyyy', { locale: es })}
            </Text>
            {doc.numeroDocumento && (
              <Text size="xs" c="dimmed">N°: {doc.numeroDocumento}</Text>
            )}
            {doc.empresa && (
              <Text size="xs" c="dimmed">Empresa: {doc.empresa}</Text>
            )}
          </Box>
        </Group>
        
        <Group gap="xs">
          <Badge color={getEstadoColor(doc.estado, doc.prioridad)} variant="light">
            {doc.estado === 'vencido' 
              ? `Vencido hace ${Math.abs(doc.diasRestantes)} días`
              : doc.estado === 'proximo'
              ? `${doc.diasRestantes} días restantes`
              : 'Vigente'
            }
          </Badge>
          {showActions && (
            <ActionIcon
              size="sm"
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
              <IconEdit size={14} />
            </ActionIcon>
          )}
        </Group>
      </Group>
    </Card>
  );

  if (documentos.length === 0) {
    return (
      <Paper p="md" withBorder>
        <Group justify="space-between" mb="md">
          <Group>
            <IconFileText size={18} />
            <Title order={4}>Estado de Documentación</Title>
          </Group>
          <Group gap="xs">
            <Tooltip label={alertasHabilitadas ? "Deshabilitar alertas" : "Habilitar alertas"}>
              <ActionIcon 
                variant="light" 
                color={alertasHabilitadas ? "green" : "gray"}
                onClick={() => setAlertasHabilitadas(!alertasHabilitadas)}
              >
                {alertasHabilitadas ? <IconBell size={16} /> : <IconBellOff size={16} />}
              </ActionIcon>
            </Tooltip>
            {onRefresh && (
              <Tooltip label="Actualizar">
                <ActionIcon variant="light" onClick={onRefresh}>
                  <IconRefresh size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>
        
        <Alert color="green" icon={<IconCheck />}>
          <Text>✅ Todos los documentos están al día</Text>
          <Text size="xs" c="dimmed" mt={4}>
            Última actualización: {dayjs(lastUpdate).format('DD/MM/YYYY HH:mm')}
          </Text>
        </Alert>
      </Paper>
    );
  }

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
          
          {proximosAlta.length > 0 && (
            <Alert icon={<IconAlertTriangle />} color="orange" variant="light">
              <Text size="sm" fw={500}>{proximosAlta.length} documento{proximosAlta.length > 1 ? 's' : ''} crítico{proximosAlta.length > 1 ? 's' : ''}</Text>
            </Alert>
          )}

          {proximosMedia.length > 0 && (
            <Alert icon={<IconAlertTriangle />} color="yellow" variant="light">
              <Text size="sm" fw={500}>{proximosMedia.length} documento{proximosMedia.length > 1 ? 's' : ''} importante{proximosMedia.length > 1 ? 's' : ''}</Text>
            </Alert>
          )}

          {vencidos.length === 0 && proximosAlta.length === 0 && proximosMedia.length === 0 && (
            <Alert icon={<IconCheck />} color="green" variant="light">
              <Text size="sm">Sin alertas críticas</Text>
            </Alert>
          )}
        </Stack>
      </Card>
    );
  }

  return (
    <Stack>
      {/* Resumen de alertas */}
      <Paper p="md" withBorder>
        <Group justify="space-between" mb="md">
          <Group>
            <IconCalendar size={18} />
            <Title order={4}>Alertas de Documentación</Title>
          </Group>
          <Group gap="xs">
            <Tooltip label={alertasHabilitadas ? "Deshabilitar alertas" : "Habilitar alertas"}>
              <ActionIcon 
                variant="light" 
                color={alertasHabilitadas ? "green" : "gray"}
                onClick={() => setAlertasHabilitadas(!alertasHabilitadas)}
              >
                {alertasHabilitadas ? <IconBell size={16} /> : <IconBellOff size={16} />}
              </ActionIcon>
            </Tooltip>
            {onRefresh && (
              <Tooltip label="Actualizar">
                <ActionIcon variant="light" onClick={onRefresh}>
                  <IconRefresh size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>

        <Group grow>
          <Card padding="sm" withBorder bg="red.0">
            <Text ta="center" fw={700} size="xl" c="red">{vencidos.length}</Text>
            <Text ta="center" size="sm" c="red">Vencidos</Text>
          </Card>
          
          <Card padding="sm" withBorder bg="orange.0">
            <Text ta="center" fw={700} size="xl" c="orange">{proximosAlta.length}</Text>
            <Text ta="center" size="sm" c="orange">Críticos (≤{diasConfig.alta} días)</Text>
          </Card>
          
          <Card padding="sm" withBorder bg="yellow.0">
            <Text ta="center" fw={700} size="xl" c="yellow.8">{proximosMedia.length}</Text>
            <Text ta="center" size="sm" c="yellow.8">Importantes (≤{diasConfig.media} días)</Text>
          </Card>
          
          <Card padding="sm" withBorder bg="blue.0">
            <Text ta="center" fw={700} size="xl" c="blue">{proximosBaja.length}</Text>
            <Text ta="center" size="sm" c="blue">Preventivos (≤{diasConfig.baja} días)</Text>
          </Card>
        </Group>

        <Text size="xs" c="dimmed" ta="center" mt="md">
          Última actualización: {dayjs(lastUpdate).format('DD/MM/YYYY HH:mm')}
        </Text>
      </Paper>

      {/* Documentos vencidos */}
      {vencidos.length > 0 && (
        <Paper p="md" withBorder>
          <Group justify="space-between" mb="md" style={{ cursor: 'pointer' }} onClick={toggleVencidos}>
            <Group>
              <IconAlertTriangle size={20} color="red" />
              <Title order={5} c="red">
                Documentos Vencidos ({vencidos.length})
              </Title>
            </Group>
            <ActionIcon variant="light" color="red">
              {openedVencidos ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </ActionIcon>
          </Group>

          <Collapse in={openedVencidos}>
            <Stack>
              {vencidos.map(doc => renderDocumento(doc))}
            </Stack>
          </Collapse>
        </Paper>
      )}

      {/* Documentos próximos a vencer */}
      {proximos.length > 0 && (
        <Paper p="md" withBorder>
          <Group justify="space-between" mb="md" style={{ cursor: 'pointer' }} onClick={toggleProximos}>
            <Group>
              <IconCalendar size={20} color="orange" />
              <Title order={5} c="orange">
                Documentos por Vencer ({proximos.length})
              </Title>
            </Group>
            <ActionIcon variant="light" color="orange">
              {openedProximos ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </ActionIcon>
          </Group>

          <Collapse in={openedProximos}>
            <Stack>
              {proximos
                .sort((a, b) => a.diasRestantes - b.diasRestantes)
                .map(doc => renderDocumento(doc))}
            </Stack>
          </Collapse>
        </Paper>
      )}

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
              <Text size="xl" fw={700} c="orange">{proximosAlta.length}</Text>
              <Text size="sm" c="dimmed">Críticos</Text>
            </Stack>
            <Stack align="center" gap="xs">
              <Text size="xl" fw={700} c="yellow">{proximosMedia.length}</Text>
              <Text size="sm" c="dimmed">Importantes</Text>
            </Stack>
            <Stack align="center" gap="xs">
              <Text size="xl" fw={700} c="blue">{proximosBaja.length}</Text>
              <Text size="sm" c="dimmed">Preventivos</Text>
            </Stack>
          </Group>

          <Divider />

          {/* Lista detallada */}
          <Box style={{ maxHeight: 400, overflowY: 'auto' }}>
            <Stack>
              {documentos.map(doc => renderDocumento(doc, false))}
            </Stack>
          </Box>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default DocumentExpirationSystem;