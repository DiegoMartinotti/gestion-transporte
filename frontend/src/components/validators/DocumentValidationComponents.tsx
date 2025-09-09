import React from 'react';
import {
  Stack,
  Group,
  Text,
  Badge,
  Alert,
  Card,
  ActionIcon,
  Table,
  Box,
  SimpleGrid,
  ThemeIcon,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconTruck,
  IconUser,
  IconEdit,
  IconEye,
} from '@tabler/icons-react';
import {
  ValidationStatsProps,
  ValidationSummaryComponentProps,
  DocumentValidationResult,
} from './DocumentValidationTypes';

// Componente para mostrar estadísticas de validación
export const ValidationStats: React.FC<ValidationStatsProps> = ({ stats }) => (
  <SimpleGrid cols={4} spacing="md" mb="md">
    <Card withBorder p="sm">
      <Text ta="center" fw={700} size="xl">
        {stats.total}
      </Text>
      <Text ta="center" size="sm" c="dimmed">
        Total
      </Text>
    </Card>

    <Card withBorder p="sm" bg="red.0">
      <Text ta="center" fw={700} size="xl" c="red">
        {stats.errors}
      </Text>
      <Text ta="center" size="sm" c="red">
        Errores
      </Text>
    </Card>

    <Card withBorder p="sm" bg="yellow.0">
      <Text ta="center" fw={700} size="xl" c="orange">
        {stats.warnings}
      </Text>
      <Text ta="center" size="sm" c="orange">
        Advertencias
      </Text>
    </Card>

    <Card withBorder p="sm" bg="blue.0">
      <Text ta="center" fw={700} size="xl" c="blue">
        {stats.infos}
      </Text>
      <Text ta="center" size="sm" c="blue">
        Información
      </Text>
    </Card>
  </SimpleGrid>
);

// Componente para renderizar alertas de validación
const ValidationAlert: React.FC<{
  stats: { total: number; errors: number; warnings: number; infos: number };
}> = ({ stats }) => {
  if (stats.total === 0) {
    return (
      <Alert icon={<IconCheck />} color="green">
        <Text fw={500}>✅ Validación Exitosa</Text>
        <Text size="sm">Todos los documentos cumplen con las reglas de validación</Text>
      </Alert>
    );
  }

  return (
    <Alert icon={<IconAlertTriangle />} color={stats.errors > 0 ? 'red' : 'yellow'}>
      <Text fw={500}>
        Se encontraron {stats.total} problema{stats.total > 1 ? 's' : ''}
      </Text>
      <Text size="sm">
        {stats.errors > 0 && `${stats.errors} error${stats.errors > 1 ? 'es' : ''}`}
        {stats.warnings > 0 && ` ${stats.warnings} advertencia${stats.warnings > 1 ? 's' : ''}`}
        {stats.infos > 0 && ` ${stats.infos} información`}
      </Text>
    </Alert>
  );
};

// Componente para mostrar problemas individuales
const ValidationProblemCard: React.FC<{
  result: DocumentValidationResult;
  onEditDocument?: (documentoId: string) => void;
}> = ({ result, onEditDocument }) => (
  <Card withBorder p="sm">
    <Group justify="space-between">
      <Group>
        <ThemeIcon size="sm" color="red">
          <IconX size={14} />
        </ThemeIcon>

        <Box>
          <Text size="sm" fw={500}>
            {result.entidadNombre}
          </Text>
          <Text size="xs" c="dimmed">
            {result.message}
          </Text>
        </Box>
      </Group>

      {onEditDocument && (
        <ActionIcon size="sm" variant="subtle" onClick={() => onEditDocument(result.documentoId)}>
          <IconEdit size={14} />
        </ActionIcon>
      )}
    </Group>
  </Card>
);

// Componente principal para mostrar el resumen de validación
export const ValidationSummaryComponent: React.FC<ValidationSummaryComponentProps> = ({
  stats,
  detailedResults,
  onEditDocument,
}) => (
  <Stack gap="md">
    <ValidationAlert stats={stats} />

    {/* Lista de problemas principales */}
    {detailedResults.slice(0, 5).map((result, index) => (
      <ValidationProblemCard key={index} result={result} onEditDocument={onEditDocument} />
    ))}

    {detailedResults.length > 5 && (
      <Text size="sm" c="dimmed" ta="center">
        ... y {detailedResults.length - 5} problema{detailedResults.length - 5 > 1 ? 's' : ''} más
      </Text>
    )}
  </Stack>
);

// Componente para renderizar resultados por categoría
export const ValidationByCategory: React.FC<{
  resultsByCategory: Record<string, DocumentValidationResult[]>;
  onEditDocument?: (documentoId: string) => void;
}> = ({ resultsByCategory, onEditDocument }) => (
  <Stack gap="md">
    {Object.entries(resultsByCategory).map(([category, results]) => (
      <Card key={category} withBorder>
        <Group justify="space-between" mb="md">
          <Text fw={500} tt="capitalize">
            {category}
          </Text>
          <Badge>{results.length}</Badge>
        </Group>

        <Stack gap="xs">
          {results.map((result, index) => (
            <Group key={index} justify="space-between">
              <Group>
                <ThemeIcon size="xs" color="red" variant="light">
                  <IconX size={12} />
                </ThemeIcon>

                <Text size="sm">
                  {result.entidadNombre}: {result.mensaje}
                </Text>
              </Group>

              {onEditDocument && (
                <ActionIcon
                  size="xs"
                  variant="light"
                  onClick={() => onEditDocument(result.documentoId)}
                >
                  <IconEye size={12} />
                </ActionIcon>
              )}
            </Group>
          ))}
        </Stack>
      </Card>
    ))}
  </Stack>
);

// Componente para la tabla detallada
export const ValidationDetailsTable: React.FC<{
  detailedResults: DocumentValidationResult[];
  onEditDocument?: (documentoId: string) => void;
  onAutoFix?: (result: DocumentValidationResult) => void;
}> = ({ detailedResults, onEditDocument, onAutoFix }) => (
  <Table>
    <Table.Thead>
      <Table.Tr>
        <Table.Th>Entidad</Table.Th>
        <Table.Th>Problema</Table.Th>
        <Table.Th>Severidad</Table.Th>
        <Table.Th>Sugerencia</Table.Th>
        <Table.Th>Acciones</Table.Th>
      </Table.Tr>
    </Table.Thead>
    <Table.Tbody>
      {detailedResults.map((result, index) => (
        <Table.Tr key={index}>
          <Table.Td>
            <Group gap="xs">
              {result.entidadTipo === 'vehiculo' ? <IconTruck size={14} /> : <IconUser size={14} />}
              <Text size="sm">{result.entidadNombre}</Text>
            </Group>
          </Table.Td>
          <Table.Td>
            <Text size="sm">{result.mensaje}</Text>
            {result.detalles && (
              <Text size="xs" c="dimmed">
                {result.detalles}
              </Text>
            )}
          </Table.Td>
          <Table.Td>
            <Badge color="red" size="sm">
              error
            </Badge>
          </Table.Td>
          <Table.Td>
            <Text size="xs">{result.sugerencia}</Text>
          </Table.Td>
          <Table.Td>
            <Group gap="xs">
              {onEditDocument && (
                <ActionIcon
                  size="sm"
                  variant="light"
                  onClick={() => onEditDocument(result.documentoId)}
                >
                  <IconEdit size={14} />
                </ActionIcon>
              )}

              {result.autoFix && onAutoFix && (
                <ActionIcon
                  size="sm"
                  variant="light"
                  color="green"
                  onClick={() => onAutoFix(result)}
                >
                  <IconCheck size={14} />
                </ActionIcon>
              )}
            </Group>
          </Table.Td>
        </Table.Tr>
      ))}
    </Table.Tbody>
  </Table>
);
