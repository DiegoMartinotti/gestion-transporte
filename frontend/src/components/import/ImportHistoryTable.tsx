// Tabla separada para ImportHistory
import React from 'react';
import {
  Table,
  ScrollArea,
  Group,
  Text,
  Badge,
  ActionIcon,
  Menu,
  Progress,
  Divider,
} from '@mantine/core';
import {
  IconEye,
  IconRefresh,
  IconTrash,
  IconClock,
  IconCheck,
  IconX,
  IconDots,
  IconFileExport,
  IconSortAscending,
  IconSortDescending,
} from '@tabler/icons-react';
import { ImportRecord } from './ImportHistoryTypes';
import {
  formatDuration,
  getProgressColor,
  getStatusText,
  formatFileSize,
} from './ImportHistoryHelpers';

interface ImportHistoryTableProps {
  imports: ImportRecord[];
  onViewDetails: (importRecord: ImportRecord) => void;
  onRetryImport?: (importId: string) => void;
  onExportReport?: (importId: string) => void;
  onDeleteImport?: (importId: string) => void;
  sortField: keyof ImportRecord;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof ImportRecord) => void;
}

// Componente para encabezado de columna con ordenación
const SortableHeader: React.FC<{
  field: keyof ImportRecord;
  label: string;
  currentSort: keyof ImportRecord;
  direction: 'asc' | 'desc';
  onSort: (field: keyof ImportRecord) => void;
}> = ({ field, label, currentSort, direction, onSort }) => (
  <Group gap={4}>
    <Text>{label}</Text>
    <ActionIcon variant="transparent" size="sm" onClick={() => onSort(field)}>
      {currentSort === field ? (
        direction === 'asc' ? (
          <IconSortAscending size={14} />
        ) : (
          <IconSortDescending size={14} />
        )
      ) : (
        <IconSortAscending size={14} style={{ opacity: 0.3 }} />
      )}
    </ActionIcon>
  </Group>
);

// Componente para badge de estado
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { color: 'yellow', icon: IconClock },
      processing: { color: 'blue', icon: IconRefresh },
      completed: { color: 'green', icon: IconCheck },
      failed: { color: 'red', icon: IconX },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  return (
    <Badge color={config.color} variant="light" leftSection={<IconComponent size={14} />} size="sm">
      {getStatusText(status)}
    </Badge>
  );
};

// Componente para badge de entidad
const EntityBadge: React.FC<{ entityType: string }> = ({ entityType }) => {
  const colors: Record<string, string> = {
    clientes: 'blue',
    sites: 'green',
    tramos: 'orange',
    viajes: 'purple',
    vehiculos: 'cyan',
    empresas: 'teal',
    personal: 'pink',
    extras: 'gray',
  };

  return (
    <Badge color={colors[entityType] || 'gray'} variant="outline" size="sm">
      {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
    </Badge>
  );
};

// Componente para información del archivo
const FileInfo: React.FC<{ fileName: string; fileSize?: number }> = ({ fileName, fileSize }) => (
  <div>
    <Text size="sm" fw={500} style={{ wordBreak: 'break-word' }}>
      {fileName}
    </Text>
    {fileSize && (
      <Text size="xs" c="dimmed">
        {formatFileSize(fileSize)}
      </Text>
    )}
  </div>
);

// Componente para progreso de éxito
const SuccessProgress: React.FC<{
  successfulRecords: number;
  totalRecords: number;
  failedRecords: number;
}> = ({ successfulRecords, totalRecords, failedRecords }) => {
  const successRate = totalRecords > 0 ? Math.round((successfulRecords / totalRecords) * 100) : 0;

  return (
    <div>
      <Text size="sm">
        {successfulRecords}/{totalRecords}
      </Text>
      {failedRecords > 0 && (
        <Text size="xs" c="red">
          {failedRecords} errores
        </Text>
      )}
      <Group gap={8} mt={4}>
        <Progress
          value={successRate}
          color={getProgressColor(successRate)}
          size="sm"
          style={{ flex: 1, minWidth: 60 }}
        />
        <Text size="xs" c="dimmed" style={{ minWidth: 30 }}>
          {successRate}%
        </Text>
      </Group>
    </div>
  );
};

// Componente para menú de acciones
const ActionsMenu: React.FC<{
  import: ImportRecord;
  onViewDetails: (importRecord: ImportRecord) => void;
  onRetryImport?: (importId: string) => void;
  onExportReport?: (importId: string) => void;
  onDeleteImport?: (importId: string) => void;
}> = ({ import: imp, onViewDetails, onRetryImport, onExportReport, onDeleteImport }) => (
  <Group gap={4}>
    <ActionIcon variant="subtle" size="sm" onClick={() => onViewDetails(imp)} title="Ver detalles">
      <IconEye size={16} />
    </ActionIcon>

    <Menu shadow="md" width={200}>
      <Menu.Target>
        <ActionIcon variant="subtle" size="sm">
          <IconDots size={16} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<IconEye size={14} />} onClick={() => onViewDetails(imp)}>
          Ver detalles
        </Menu.Item>
        {onExportReport && (
          <Menu.Item
            leftSection={<IconFileExport size={14} />}
            onClick={() => onExportReport(imp.id)}
          >
            Exportar reporte
          </Menu.Item>
        )}
        {imp.status === 'failed' && onRetryImport && (
          <Menu.Item leftSection={<IconRefresh size={14} />} onClick={() => onRetryImport(imp.id)}>
            Reintentar importación
          </Menu.Item>
        )}
        <Divider />
        {onDeleteImport && (
          <Menu.Item
            color="red"
            leftSection={<IconTrash size={14} />}
            onClick={() => onDeleteImport(imp.id)}
          >
            Eliminar registro
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  </Group>
);

// Componente para encabezado de tabla
const TableHeader: React.FC<{
  sortField: keyof ImportRecord;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof ImportRecord) => void;
}> = ({ sortField, sortDirection, onSort }) => (
  <Table.Thead>
    <Table.Tr>
      <Table.Th>
        <SortableHeader
          field="fileName"
          label="Archivo"
          currentSort={sortField}
          direction={sortDirection}
          onSort={onSort}
        />
      </Table.Th>
      <Table.Th>
        <SortableHeader
          field="entityType"
          label="Entidad"
          currentSort={sortField}
          direction={sortDirection}
          onSort={onSort}
        />
      </Table.Th>
      <Table.Th>
        <SortableHeader
          field="status"
          label="Estado"
          currentSort={sortField}
          direction={sortDirection}
          onSort={onSort}
        />
      </Table.Th>
      <Table.Th>Registros</Table.Th>
      <Table.Th>
        <SortableHeader
          field="timestamp"
          label="Fecha"
          currentSort={sortField}
          direction={sortDirection}
          onSort={onSort}
        />
      </Table.Th>
      <Table.Th>Duración</Table.Th>
      <Table.Th>Usuario</Table.Th>
      <Table.Th style={{ width: 120 }}>Acciones</Table.Th>
    </Table.Tr>
  </Table.Thead>
);

// Componente para fila de la tabla
const TableRow: React.FC<{
  import: ImportRecord;
  onViewDetails: (importRecord: ImportRecord) => void;
  onRetryImport?: (importId: string) => void;
  onExportReport?: (importId: string) => void;
  onDeleteImport?: (importId: string) => void;
}> = ({ import: imp, onViewDetails, onRetryImport, onExportReport, onDeleteImport }) => (
  <Table.Tr key={imp.id}>
    <Table.Td style={{ maxWidth: 200 }}>
      <FileInfo fileName={imp.fileName} fileSize={imp.fileSize} />
    </Table.Td>
    <Table.Td>
      <EntityBadge entityType={imp.entityType} />
    </Table.Td>
    <Table.Td>
      <StatusBadge status={imp.status} />
    </Table.Td>
    <Table.Td style={{ minWidth: 120 }}>
      <SuccessProgress
        successfulRecords={imp.successfulRecords}
        totalRecords={imp.totalRecords}
        failedRecords={imp.failedRecords}
      />
    </Table.Td>
    <Table.Td>
      <Text size="sm">
        {imp.timestamp.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </Table.Td>
    <Table.Td>
      <Text size="sm">{formatDuration(imp.startTime, imp.endTime || null)}</Text>
    </Table.Td>
    <Table.Td>
      <Text size="sm">{imp.user}</Text>
    </Table.Td>
    <Table.Td>
      <ActionsMenu
        import={imp}
        onViewDetails={onViewDetails}
        onRetryImport={onRetryImport}
        onExportReport={onExportReport}
        onDeleteImport={onDeleteImport}
      />
    </Table.Td>
  </Table.Tr>
);

// Componente para cuerpo de la tabla
const TableBody: React.FC<{
  imports: ImportRecord[];
  onViewDetails: (importRecord: ImportRecord) => void;
  onRetryImport?: (importId: string) => void;
  onExportReport?: (importId: string) => void;
  onDeleteImport?: (importId: string) => void;
}> = ({ imports, onViewDetails, onRetryImport, onExportReport, onDeleteImport }) => (
  <Table.Tbody>
    {imports.map((imp) => (
      <TableRow
        key={imp.id}
        import={imp}
        onViewDetails={onViewDetails}
        onRetryImport={onRetryImport}
        onExportReport={onExportReport}
        onDeleteImport={onDeleteImport}
      />
    ))}
  </Table.Tbody>
);

export const ImportHistoryTable: React.FC<ImportHistoryTableProps> = ({
  imports,
  onViewDetails,
  onRetryImport,
  onExportReport,
  onDeleteImport,
  sortField,
  sortDirection,
  onSort,
}) => {
  if (imports.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        No hay importaciones que mostrar
      </Text>
    );
  }

  return (
    <ScrollArea>
      <Table striped highlightOnHover withTableBorder>
        <TableHeader sortField={sortField} sortDirection={sortDirection} onSort={onSort} />
        <TableBody
          imports={imports}
          onViewDetails={onViewDetails}
          onRetryImport={onRetryImport}
          onExportReport={onExportReport}
          onDeleteImport={onDeleteImport}
        />
      </Table>
    </ScrollArea>
  );
};
