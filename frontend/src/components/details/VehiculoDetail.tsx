import { 
  Modal, 
  Text, 
  Group, 
  Stack, 
  Badge, 
  Card, 
  Grid, 
  Progress,
  Timeline,
  Box,
  ActionIcon,
  Tooltip,
  Alert
} from '@mantine/core';
import { 
  IconCalendar, 
  IconTruck, 
  IconGasStation, 
  IconScale, 
  IconRuler,
  IconAlertTriangle,
  IconInfoCircle,
  IconEdit,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { Vehiculo } from '../../types/vehiculo';

interface VehiculoDetailProps {
  vehiculo: Vehiculo | null;
  opened: boolean;
  onClose: () => void;
  onEdit?: (vehiculo: Vehiculo) => void;
}

interface DocumentoInfo {
  nombre: string;
  numero?: string;
  vencimiento?: string;
  estado: 'vencido' | 'proximo' | 'vigente' | 'no_disponible';
  diasRestantes: number;
}

const getDocumentosInfo = (vehiculo: Vehiculo): DocumentoInfo[] => {
  const hoy = new Date();
  const docs = vehiculo.documentacion;
  
  const checkDocumento = (nombre: string, doc: any): DocumentoInfo => {
    if (!doc?.vencimiento) {
      return {
        nombre,
        numero: doc?.numero || undefined,
        vencimiento: undefined,
        estado: 'no_disponible',
        diasRestantes: 0
      };
    }
    
    try {
      const fecha = parseISO(doc.vencimiento);
      if (!isValid(fecha)) {
        return {
          nombre,
          numero: doc.numero || undefined,
          vencimiento: doc.vencimiento,
          estado: 'no_disponible',
          diasRestantes: 0
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
        numero: doc.numero || undefined,
        vencimiento: doc.vencimiento,
        estado,
        diasRestantes
      };
    } catch {
      return {
        nombre,
        numero: doc?.numero || undefined,
        vencimiento: doc?.vencimiento,
        estado: 'no_disponible',
        diasRestantes: 0
      };
    }
  };

  return [
    checkDocumento('VTV', docs?.vtv),
    checkDocumento('Seguro', docs?.seguro),
    checkDocumento('Ruta', docs?.ruta),
    checkDocumento('SENASA', docs?.senasa)
  ];
};

const getEstadoColor = (estado: DocumentoInfo['estado']) => {
  switch (estado) {
    case 'vencido': return 'red';
    case 'proximo': return 'yellow';
    case 'vigente': return 'green';
    case 'no_disponible': return 'gray';
    default: return 'gray';
  }
};

const getEstadoIcon = (estado: DocumentoInfo['estado']) => {
  switch (estado) {
    case 'vencido': return <IconX size={16} />;
    case 'proximo': return <IconAlertTriangle size={16} />;
    case 'vigente': return <IconCheck size={16} />;
    case 'no_disponible': return <IconInfoCircle size={16} />;
    default: return <IconInfoCircle size={16} />;
  }
};

const getEstadoGeneral = (documentos: DocumentoInfo[]): { estado: string; color: string; porcentaje: number } => {
  const vencidos = documentos.filter(doc => doc.estado === 'vencido').length;
  const proximos = documentos.filter(doc => doc.estado === 'proximo').length;
  const vigentes = documentos.filter(doc => doc.estado === 'vigente').length;
  const total = documentos.filter(doc => doc.estado !== 'no_disponible').length;
  
  if (total === 0) {
    return { estado: 'Sin Documentación', color: 'gray', porcentaje: 0 };
  }
  
  if (vencidos > 0) {
    return { 
      estado: `${vencidos} documento${vencidos > 1 ? 's' : ''} vencido${vencidos > 1 ? 's' : ''}`, 
      color: 'red', 
      porcentaje: ((vigentes + proximos) / total) * 100 
    };
  } else if (proximos > 0) {
    return { 
      estado: `${proximos} documento${proximos > 1 ? 's' : ''} próximo${proximos > 1 ? 's' : ''} a vencer`, 
      color: 'yellow', 
      porcentaje: (vigentes / total) * 100 
    };
  } else {
    return { estado: 'Toda la documentación vigente', color: 'green', porcentaje: 100 };
  }
};

export const VehiculoDetail: React.FC<VehiculoDetailProps> = ({ 
  vehiculo, 
  opened, 
  onClose, 
  onEdit 
}) => {
  if (!vehiculo) return null;

  const documentos = getDocumentosInfo(vehiculo);
  const estadoGeneral = getEstadoGeneral(documentos);
  const caracteristicas = vehiculo.caracteristicas;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group justify="space-between" style={{ width: '100%' }}>
          <Group>
            <IconTruck size={24} />
            <Text size="lg" fw={600}>{vehiculo.dominio}</Text>
            <Badge color={vehiculo.activo ? 'green' : 'red'} variant="light">
              {vehiculo.activo ? 'Activo' : 'Inactivo'}
            </Badge>
          </Group>
          {onEdit && (
            <Tooltip label="Editar vehículo">
              <ActionIcon 
                variant="light" 
                color="blue" 
                onClick={() => onEdit(vehiculo)}
              >
                <IconEdit size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      }
      size="xl"
      centered
    >
      <Stack gap="lg">
        {/* Información Básica */}
        <Card withBorder>
          <Card.Section withBorder inheritPadding py="xs">
            <Text fw={500}>Información Básica</Text>
          </Card.Section>
          <Card.Section inheritPadding py="md">
            <Grid>
              <Grid.Col span={6}>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Dominio</Text>
                    <Text size="sm" fw={500}>{vehiculo.dominio}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Tipo</Text>
                    <Text size="sm">{vehiculo.tipo}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Marca</Text>
                    <Text size="sm">{vehiculo.marca || 'No especificado'}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Modelo</Text>
                    <Text size="sm">{vehiculo.modelo || 'No especificado'}</Text>
                  </Group>
                </Stack>
              </Grid.Col>
              <Grid.Col span={6}>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Año</Text>
                    <Text size="sm">{vehiculo.año || 'No especificado'}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Estado</Text>
                    <Badge color={vehiculo.activo ? 'green' : 'red'} variant="light">
                      {vehiculo.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Empresa</Text>
                    <Text size="sm">{typeof vehiculo.empresa === 'object' && vehiculo.empresa && 'nombre' in vehiculo.empresa ? vehiculo.empresa.nombre : 'No asignada'}</Text>
                  </Group>
                </Stack>
              </Grid.Col>
            </Grid>
          </Card.Section>
        </Card>

        {/* Características Técnicas */}
        {caracteristicas && (
          <Card withBorder>
            <Card.Section withBorder inheritPadding py="xs">
              <Group>
                <IconRuler size={18} />
                <Text fw={500}>Características Técnicas</Text>
              </Group>
            </Card.Section>
            <Card.Section inheritPadding py="md">
              <Grid>
                <Grid.Col span={6}>
                  <Stack gap="xs">
                    {caracteristicas.capacidadCarga && (
                      <Group justify="space-between">
                        <Group gap="xs">
                          <IconScale size={14} />
                          <Text size="sm" c="dimmed">Capacidad de Carga</Text>
                        </Group>
                        <Text size="sm">{caracteristicas.capacidadCarga} kg</Text>
                      </Group>
                    )}
                    {caracteristicas.capacidadCombustible && (
                      <Group justify="space-between">
                        <Group gap="xs">
                          <IconGasStation size={14} />
                          <Text size="sm" c="dimmed">Capacidad Combustible</Text>
                        </Group>
                        <Text size="sm">{caracteristicas.capacidadCombustible} L</Text>
                      </Group>
                    )}
                    {caracteristicas.tipoCombustible && (
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Tipo Combustible</Text>
                        <Text size="sm">{caracteristicas.tipoCombustible}</Text>
                      </Group>
                    )}
                  </Stack>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Stack gap="xs">
                    {caracteristicas.dimensiones?.largo && (
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Largo</Text>
                        <Text size="sm">{caracteristicas.dimensiones.largo} m</Text>
                      </Group>
                    )}
                    {caracteristicas.dimensiones?.ancho && (
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Ancho</Text>
                        <Text size="sm">{caracteristicas.dimensiones.ancho} m</Text>
                      </Group>
                    )}
                    {caracteristicas.dimensiones?.alto && (
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Alto</Text>
                        <Text size="sm">{caracteristicas.dimensiones.alto} m</Text>
                      </Group>
                    )}
                  </Stack>
                </Grid.Col>
              </Grid>
            </Card.Section>
          </Card>
        )}

        {/* Estado de Documentación */}
        <Card withBorder>
          <Card.Section withBorder inheritPadding py="xs">
            <Group justify="space-between">
              <Group>
                <IconCalendar size={18} />
                <Text fw={500}>Estado de Documentación</Text>
              </Group>
              <Badge color={estadoGeneral.color} variant="light">
                {estadoGeneral.estado}
              </Badge>
            </Group>
          </Card.Section>
          <Card.Section inheritPadding py="md">
            <Stack gap="md">
              <Box>
                <Progress 
                  value={estadoGeneral.porcentaje} 
                  color={estadoGeneral.color}
                  size="md"
                  radius="xl"
                />
                <Text size="xs" ta="center" mt={4}>
                  {Math.round(estadoGeneral.porcentaje)}% vigente
                </Text>
              </Box>

              {/* Alertas de vencimiento */}
              {documentos.some(doc => doc.estado === 'vencido' || doc.estado === 'proximo') && (
                <Alert 
                  icon={<IconAlertTriangle size={16} />} 
                  color={documentos.some(doc => doc.estado === 'vencido') ? 'red' : 'yellow'}
                  variant="light"
                >
                  <Text size="sm">
                    {documentos.some(doc => doc.estado === 'vencido') 
                      ? 'Este vehículo tiene documentos vencidos. Regularice la situación antes de utilizarlo.'
                      : 'Este vehículo tiene documentos próximos a vencer. Planifique la renovación.'}
                  </Text>
                </Alert>
              )}

              {/* Timeline de documentos */}
              <Timeline active={-1} bulletSize={24} lineWidth={2}>
                {documentos.map((doc) => (
                  <Timeline.Item 
                    key={doc.nombre}
                    bullet={getEstadoIcon(doc.estado)}
                    color={getEstadoColor(doc.estado)}
                  >
                    <Group justify="space-between" mb="xs">
                      <Text fw={500}>{doc.nombre}</Text>
                      <Badge color={getEstadoColor(doc.estado)} variant="light" size="sm">
                        {doc.estado === 'no_disponible' ? 'No registrado' : 
                         doc.estado === 'vencido' ? `Vencido (${Math.abs(doc.diasRestantes)} días)` :
                         doc.estado === 'proximo' ? `Vence en ${doc.diasRestantes} días` :
                         'Vigente'}
                      </Badge>
                    </Group>
                    
                    {doc.numero && (
                      <Text size="sm" c="dimmed" mb={5}>
                        Número: {doc.numero}
                      </Text>
                    )}
                    
                    {doc.vencimiento && (
                      <Text size="sm" c="dimmed">
                        Vencimiento: {format(parseISO(doc.vencimiento), 'dd/MM/yyyy', { locale: es })}
                      </Text>
                    )}
                    
                    {!doc.vencimiento && (
                      <Text size="sm" c="dimmed" fs="italic">
                        Fecha de vencimiento no registrada
                      </Text>
                    )}
                  </Timeline.Item>
                ))}
              </Timeline>
            </Stack>
          </Card.Section>
        </Card>

        {/* Historial - Placeholder para futuras implementaciones */}
        <Card withBorder>
          <Card.Section withBorder inheritPadding py="xs">
            <Text fw={500}>Historial de Actividad</Text>
          </Card.Section>
          <Card.Section inheritPadding py="md">
            <Text size="sm" c="dimmed" fs="italic">
              El historial de actividad estará disponible en futuras versiones.
              Aquí se mostrará el historial de viajes, mantenimientos y actualizaciones del vehículo.
            </Text>
          </Card.Section>
        </Card>
      </Stack>
    </Modal>
  );
};