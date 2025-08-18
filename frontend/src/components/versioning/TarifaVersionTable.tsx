import React from 'react';
import { Table, Badge, ActionIcon, Group, Text, Stack } from '@mantine/core';
import { IconEdit, IconEye } from '@tabler/icons-react';
import { TarifaVersion } from '../../services/tarifaService';

interface TarifaVersionTableProps {
  versions: TarifaVersion[];
  onVersionSelect?: (version: TarifaVersion) => void;
  onEditVersion: (version: TarifaVersion) => void;
  formatDate: (dateString: string) => string;
  formatCurrency: (amount: number) => string;
  getVersionStatus: (version: TarifaVersion) => { color: string; label: string };
}

export const TarifaVersionTable: React.FC<TarifaVersionTableProps> = ({
  versions,
  onVersionSelect,
  onEditVersion,
  formatDate,
  formatCurrency,
  getVersionStatus,
}) => {
  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Versión</Table.Th>
          <Table.Th>Vigencia</Table.Th>
          <Table.Th>Tipo Cálculo</Table.Th>
          <Table.Th>Tarifas</Table.Th>
          <Table.Th>Estado</Table.Th>
          <Table.Th>Acciones</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {versions.map((version) => {
          const status = getVersionStatus(version);
          return (
            <Table.Tr key={version._id}>
              <Table.Td>
                <Text fw={500}>v{version.version}</Text>
              </Table.Td>
              <Table.Td>
                <Stack gap={2}>
                  <Text size="sm">Desde: {formatDate(version.fechaVigenciaInicio)}</Text>
                  {version.fechaVigenciaFin && (
                    <Text size="sm">Hasta: {formatDate(version.fechaVigenciaFin)}</Text>
                  )}
                </Stack>
              </Table.Td>
              <Table.Td>
                <Badge variant="light">{version.tipoCalculo.toUpperCase()}</Badge>
              </Table.Td>
              <Table.Td>
                <Stack gap={2}>
                  <Text size="xs">Semi: {formatCurrency(version.tarifasPorTipo.semi)}</Text>
                  <Text size="xs">Acoplado: {formatCurrency(version.tarifasPorTipo.acoplado)}</Text>
                </Stack>
              </Table.Td>
              <Table.Td>
                <Badge color={status.color} size="sm">
                  {status.label}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <ActionIcon
                    variant="light"
                    color="blue"
                    onClick={() => onVersionSelect?.(version)}
                  >
                    <IconEye size={16} />
                  </ActionIcon>
                  <ActionIcon variant="light" color="orange" onClick={() => onEditVersion(version)}>
                    <IconEdit size={16} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
};
