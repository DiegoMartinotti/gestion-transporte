import React from 'react';
import {
  Alert,
  Button,
  Card,
  Text,
  Badge,
  Group,
  ActionIcon,
  Tooltip,
  Progress,
  Flex,
  Paper,
  TextInput,
  Select,
  Table,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCalendar,
  IconFileText,
  IconDownload,
  IconUpload,
  IconEdit,
  IconTrash,
  IconSearch,
  IconLicense,
  IconTruck,
  IconUser,
} from '@tabler/icons-react';
import {
  DocumentoGenerico,
  TIPOS_DOCUMENTO,
  COLORS,
  SIZES,
  VARIANTS,
  FILTER_ALL_VALUE,
} from './types';
import { getDocumentStatus, calculateDocumentStats } from './helpers';

// Componente de alertas de documentos
export const DocumentAlerts: React.FC<{
  vencidosCount: number;
  porVencerCount: number;
}> = ({ vencidosCount, porVencerCount }) => (
  <>
    {vencidosCount > 0 && (
      <Alert
        icon={<IconAlertTriangle size={16} />}
        color={COLORS.RED}
        mb="md"
        variant={VARIANTS.LIGHT}
      >
        <Text size={SIZES.SMALL}>
          {vencidosCount} documento{vencidosCount > 1 ? 's' : ''} vencido
          {vencidosCount > 1 ? 's' : ''}
        </Text>
      </Alert>
    )}
    {porVencerCount > 0 && (
      <Alert
        icon={<IconCalendar size={16} />}
        color={COLORS.ORANGE}
        mb="md"
        variant={VARIANTS.LIGHT}
      >
        <Text size={SIZES.SMALL}>
          {porVencerCount} documento{porVencerCount > 1 ? 's' : ''} por vencer en 30 días
        </Text>
      </Alert>
    )}
  </>
);

// Componente de estadísticas
export const DocumentStats: React.FC<{ documentos: DocumentoGenerico[] }> = ({ documentos }) => {
  const stats = calculateDocumentStats(documentos);

  if (stats.total === 0) return null;

  return (
    <Card withBorder mb="md">
      <Group justify="space-between" mb="xs">
        <Text size="sm" fw={500}>
          Estadísticas de Documentos
        </Text>
        <Badge variant={VARIANTS.LIGHT}>{stats.total} total</Badge>
      </Group>

      <Group gap="xs">
        <Text size="xs" c={COLORS.RED}>
          {stats.vencidos} vencidos
        </Text>
        <Text size="xs" c={COLORS.ORANGE}>
          {stats.porVencer} por vencer
        </Text>
        <Text size="xs" c={COLORS.GREEN}>
          {stats.vigentes} vigentes
        </Text>
        <Text size="xs" c="gray">
          {stats.sinFecha} sin fecha
        </Text>
      </Group>

      <Group gap={2} mt="xs">
        {stats.vencidos > 0 && (
          <Progress
            size="xs"
            value={(stats.vencidos / stats.total) * 100}
            color={COLORS.RED}
            style={{ flex: stats.vencidos / stats.total }}
          />
        )}
        {stats.porVencer > 0 && (
          <Progress
            size="xs"
            value={(stats.porVencer / stats.total) * 100}
            color={COLORS.ORANGE}
            style={{ flex: stats.porVencer / stats.total }}
          />
        )}
        {stats.vigentes > 0 && (
          <Progress
            size="xs"
            value={(stats.vigentes / stats.total) * 100}
            color={COLORS.GREEN}
            style={{ flex: stats.vigentes / stats.total }}
          />
        )}
        {stats.sinFecha > 0 && (
          <Progress
            size="xs"
            value={(stats.sinFecha / stats.total) * 100}
            color="gray"
            style={{ flex: stats.sinFecha / stats.total }}
          />
        )}
      </Group>
    </Card>
  );
};

// Componente de filtros
export const DocumentFilters: React.FC<{
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterTipo: string;
  setFilterTipo: (value: string) => void;
  filterEstado: string;
  setFilterEstado: (value: string) => void;
  filterEntidad: string;
  setFilterEntidad: (value: string) => void;
  allowedTypes?: string[];
  entidades: Array<{ value: string; label: string }>;
  readOnly: boolean;
  onAddDocument: () => void;
}> = ({
  searchTerm,
  setSearchTerm,
  filterTipo,
  setFilterTipo,
  filterEstado,
  setFilterEstado,
  filterEntidad,
  setFilterEntidad,
  allowedTypes,
  entidades,
  readOnly,
  onAddDocument,
}) => {
  const tiposDisponibles = allowedTypes
    ? Object.entries(TIPOS_DOCUMENTO).filter(([key]) => allowedTypes.includes(key))
    : Object.entries(TIPOS_DOCUMENTO);

  return (
    <Paper p="md" mb="md" withBorder>
      <Flex gap="md" align="end" wrap="wrap">
        <TextInput
          placeholder="Buscar documentos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          flex={1}
          miw={200}
        />

        <Select
          placeholder="Tipo"
          value={filterTipo}
          onChange={(value) => setFilterTipo(value || FILTER_ALL_VALUE)}
          data={[
            { value: FILTER_ALL_VALUE, label: 'Todos los tipos' },
            ...tiposDisponibles.map(([key, label]) => ({ value: key, label })),
          ]}
          w={200}
          clearable
        />

        <Select
          placeholder="Estado"
          value={filterEstado}
          onChange={(value) => setFilterEstado(value || FILTER_ALL_VALUE)}
          data={[
            { value: FILTER_ALL_VALUE, label: 'Todos los estados' },
            { value: 'vigente', label: 'Vigente' },
            { value: 'por-vencer', label: 'Por vencer' },
            { value: 'vencido', label: 'Vencido' },
            { value: 'sin-fecha', label: 'Sin fecha' },
          ]}
          w={150}
          clearable
        />

        {entidades.length > 1 && (
          <Select
            placeholder="Entidad"
            value={filterEntidad}
            onChange={(value) => setFilterEntidad(value || FILTER_ALL_VALUE)}
            data={[{ value: FILTER_ALL_VALUE, label: 'Todas las entidades' }, ...entidades]}
            w={200}
            clearable
          />
        )}

        {!readOnly && (
          <Button onClick={onAddDocument} leftSection={<IconFileText size={16} />}>
            Agregar
          </Button>
        )}
      </Flex>
    </Paper>
  );
};

// Función para obtener el ícono de entidad
export const getEntityIcon = (entidadTipo?: string, size = 16) => {
  switch (entidadTipo) {
    case 'vehiculo':
      return <IconTruck size={size} />;
    case 'personal':
      return <IconUser size={size} />;
    case 'empresa':
      return <IconLicense size={size} />;
    default:
      return <IconFileText size={size} />;
  }
};

// Helper para manejar upload de archivos
const handleFileUpload = (
  documento: DocumentoGenerico,
  onUpload?: (doc: DocumentoGenerico, file: File) => void
) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.pdf,.jpg,.jpeg,.png';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) onUpload?.(documento, file);
  };
  input.click();
};

// Componente para acciones de documento
const DocumentActions: React.FC<{
  documento: DocumentoGenerico;
  readOnly: boolean;
  onEdit: (doc: DocumentoGenerico) => void;
  onDelete: (id: string) => void;
  onDownload?: (doc: DocumentoGenerico) => void;
  onUpload?: (doc: DocumentoGenerico, file: File) => void;
}> = ({ documento, readOnly, onEdit, onDelete, onDownload, onUpload }) => (
  <Group gap="xs">
    {onDownload && documento.archivo && (
      <Tooltip label="Descargar">
        <ActionIcon
          variant={VARIANTS.SUBTLE}
          color="blue"
          size={SIZES.SMALL}
          onClick={() => onDownload(documento)}
        >
          <IconDownload size={14} />
        </ActionIcon>
      </Tooltip>
    )}

    {onUpload && !readOnly && (
      <Tooltip label="Subir archivo">
        <ActionIcon
          variant={VARIANTS.SUBTLE}
          color={COLORS.GREEN}
          size={SIZES.SMALL}
          onClick={() => handleFileUpload(documento, onUpload)}
        >
          <IconUpload size={14} />
        </ActionIcon>
      </Tooltip>
    )}

    {!readOnly && (
      <Tooltip label="Editar">
        <ActionIcon
          variant={VARIANTS.SUBTLE}
          color="blue"
          size={SIZES.SMALL}
          onClick={() => onEdit(documento)}
        >
          <IconEdit size={14} />
        </ActionIcon>
      </Tooltip>
    )}

    {!readOnly && (
      <Tooltip label="Eliminar">
        <ActionIcon
          variant={VARIANTS.SUBTLE}
          color={COLORS.RED}
          size={SIZES.SMALL}
          onClick={() => documento._id && onDelete(documento._id)}
        >
          <IconTrash size={14} />
        </ActionIcon>
      </Tooltip>
    )}
  </Group>
);

// Componente de fila de documento
export const DocumentRow: React.FC<{
  documento: DocumentoGenerico;
  showEntidadInfo: boolean;
  readOnly: boolean;
  onEdit: (doc: DocumentoGenerico) => void;
  onDelete: (id: string) => void;
  onDownload?: (doc: DocumentoGenerico) => void;
  onUpload?: (doc: DocumentoGenerico, file: File) => void;
}> = ({ documento, showEntidadInfo, readOnly, onEdit, onDelete, onDownload, onUpload }) => {
  const status = getDocumentStatus(documento.fechaVencimiento);

  return (
    <Table.Tr key={documento._id}>
      <Table.Td>
        <Group gap="xs">
          <IconFileText size={16} />
          <Text size={SIZES.SMALL} fw={500}>
            {TIPOS_DOCUMENTO[documento.tipo] || documento.tipo}
          </Text>
        </Group>
      </Table.Td>

      <Table.Td>
        <Text size={SIZES.SMALL}>{documento.numero || '-'}</Text>
      </Table.Td>

      <Table.Td>
        <Text size={SIZES.SMALL}>
          {documento.fechaVencimiento
            ? new Date(documento.fechaVencimiento).toLocaleDateString('es-AR')
            : '-'}
        </Text>
        {documento.fechaVencimiento && (
          <Badge size={SIZES.EXTRA_SMALL} color={status.color} variant={VARIANTS.LIGHT} mt={4}>
            {status.label}
          </Badge>
        )}
      </Table.Td>

      {showEntidadInfo && (
        <Table.Td>
          <Group gap="xs">
            {getEntityIcon(documento.entidadTipo, 14)}
            <Text size={SIZES.SMALL}>{documento.entidadNombre || '-'}</Text>
          </Group>
        </Table.Td>
      )}

      <Table.Td>
        <DocumentActions
          documento={documento}
          readOnly={readOnly}
          onEdit={onEdit}
          onDelete={onDelete}
          onDownload={onDownload}
          onUpload={onUpload}
        />
      </Table.Td>
    </Table.Tr>
  );
};
