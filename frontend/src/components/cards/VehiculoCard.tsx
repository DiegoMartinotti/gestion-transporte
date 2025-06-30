import { Card, Badge, Text, Group, Stack, ActionIcon, Tooltip, Progress, Box } from '@mantine/core';
import { IconCalendar, IconEdit, IconTrash, IconAlertTriangle, IconCheck, IconX } from '@tabler/icons-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Vehiculo } from '../../types/vehiculo';

interface VehiculoCardProps {
  vehiculo: Vehiculo;
  onEdit?: (vehiculo: Vehiculo) => void;
  onDelete?: (id: string) => void;
}

interface DocumentoEstado {
  nombre: string;
  fecha: Date | null;
  estado: 'vencido' | 'proximo' | 'vigente' | 'no_disponible';
  diasRestantes: number;
}

const getDocumentosEstado = (vehiculo: Vehiculo): DocumentoEstado[] => {
  const hoy = new Date();
  const docs = vehiculo.documentacion;
  
  const checkDocumento = (nombre: string, fechaStr: string | undefined): DocumentoEstado => {
    if (!fechaStr) {
      return {
        nombre,
        fecha: null,
        estado: 'no_disponible',
        diasRestantes: 0
      };
    }
    
    try {
      const fecha = parseISO(fechaStr);
      const diasRestantes = differenceInDays(fecha, hoy);
      
      let estado: DocumentoEstado['estado'];
      if (diasRestantes < 0) {
        estado = 'vencido';
      } else if (diasRestantes <= 30) {
        estado = 'proximo';
      } else {
        estado = 'vigente';
      }
      
      return {
        nombre,
        fecha,
        estado,
        diasRestantes
      };
    } catch {
      return {
        nombre,
        fecha: null,
        estado: 'no_disponible',
        diasRestantes: 0
      };
    }
  };

  return [
    checkDocumento('VTV', docs?.vtv?.vencimiento),
    checkDocumento('Seguro', docs?.seguro?.vencimiento),
    checkDocumento('Ruta', docs?.ruta?.vencimiento),
    checkDocumento('SENASA', docs?.senasa?.vencimiento)
  ];
};

const getEstadoColor = (estado: DocumentoEstado['estado']) => {
  switch (estado) {
    case 'vencido': return 'red';
    case 'proximo': return 'yellow';
    case 'vigente': return 'green';
    case 'no_disponible': return 'gray';
    default: return 'gray';
  }
};

const getEstadoIcon = (estado: DocumentoEstado['estado']) => {
  switch (estado) {
    case 'vencido': return <IconX size={14} />;
    case 'proximo': return <IconAlertTriangle size={14} />;
    case 'vigente': return <IconCheck size={14} />;
    case 'no_disponible': return <IconCalendar size={14} />;
    default: return <IconCalendar size={14} />;
  }
};

const getEstadoGeneral = (documentos: DocumentoEstado[]): { estado: string; color: string; porcentaje: number } => {
  const vencidos = documentos.filter(doc => doc.estado === 'vencido').length;
  const proximos = documentos.filter(doc => doc.estado === 'proximo').length;
  const vigentes = documentos.filter(doc => doc.estado === 'vigente').length;
  const total = documentos.filter(doc => doc.estado !== 'no_disponible').length;
  
  if (vencidos > 0) {
    return { estado: 'Documentos Vencidos', color: 'red', porcentaje: ((vigentes + proximos) / total) * 100 };
  } else if (proximos > 0) {
    return { estado: 'Próximo a Vencer', color: 'yellow', porcentaje: (vigentes / total) * 100 };
  } else if (vigentes === total && total > 0) {
    return { estado: 'Documentación Vigente', color: 'green', porcentaje: 100 };
  } else {
    return { estado: 'Sin Documentación', color: 'gray', porcentaje: 0 };
  }
};

export const VehiculoCard: React.FC<VehiculoCardProps> = ({ vehiculo, onEdit, onDelete }) => {
  const documentos = getDocumentosEstado(vehiculo);
  const estadoGeneral = getEstadoGeneral(documentos);

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Group>
            <Text fw={500} size="lg">{vehiculo.dominio}</Text>
            <Badge color={vehiculo.activo ? 'green' : 'red'} variant="light">
              {vehiculo.activo ? 'Activo' : 'Inactivo'}
            </Badge>
          </Group>
          <Group gap="xs">
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
            {onDelete && (
              <Tooltip label="Eliminar vehículo">
                <ActionIcon 
                  variant="light" 
                  color="red" 
                  onClick={() => onDelete(vehiculo._id!)}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>
      </Card.Section>

      <Stack gap="md" mt="md">
        {/* Información básica */}
        <Group justify="space-between">
          <Text size="sm" c="dimmed">Tipo</Text>
          <Text size="sm">{vehiculo.tipo}</Text>
        </Group>

        <Group justify="space-between">
          <Text size="sm" c="dimmed">Modelo</Text>
          <Text size="sm">{vehiculo.modelo || 'No especificado'}</Text>
        </Group>

        <Group justify="space-between">
          <Text size="sm" c="dimmed">Año</Text>
          <Text size="sm">{vehiculo.año || 'No especificado'}</Text>
        </Group>

        {/* Estado general de documentación */}
        <Box>
          <Group justify="space-between" mb={5}>
            <Text size="sm" c="dimmed">Estado Documentación</Text>
            <Badge color={estadoGeneral.color} variant="light" size="sm">
              {estadoGeneral.estado}
            </Badge>
          </Group>
          <Progress 
            value={estadoGeneral.porcentaje} 
            color={estadoGeneral.color}
            size="sm"
            radius="xl"
          />
        </Box>

        {/* Detalle de documentos */}
        <Stack gap="xs">
          <Text size="sm" fw={500}>Documentos</Text>
          {documentos.map((doc) => (
            <Group key={doc.nombre} justify="space-between">
              <Group gap="xs">
                {getEstadoIcon(doc.estado)}
                <Text size="xs">{doc.nombre}</Text>
              </Group>
              <Group gap="xs">
                {doc.fecha ? (
                  <>
                    <Text size="xs" c="dimmed">
                      {format(doc.fecha, 'dd/MM/yyyy', { locale: es })}
                    </Text>
                    {doc.estado !== 'no_disponible' && (
                      <Badge 
                        color={getEstadoColor(doc.estado)} 
                        variant="light" 
                        size="xs"
                      >
                        {doc.estado === 'vencido' 
                          ? `${Math.abs(doc.diasRestantes)} días vencido`
                          : doc.estado === 'proximo'
                          ? `${doc.diasRestantes} días`
                          : 'Vigente'
                        }
                      </Badge>
                    )}
                  </>
                ) : (
                  <Badge color="gray" variant="light" size="xs">
                    No registrado
                  </Badge>
                )}
              </Group>
            </Group>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
};