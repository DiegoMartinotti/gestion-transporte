import React from 'react';
import {
  Paper,
  Text,
  Badge,
  Group,
  Collapse,
  Table,
  ScrollArea,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { IconChevronDown, IconChevronRight, IconCheck, IconEye } from '@tabler/icons-react';
import { ValidationError } from './ExcelValidationReport';

interface ExcelValidationTableProps {
  items: ValidationError[];
  title: string;
  color: string;
  isExpanded: boolean;
  onToggle: () => void;
  onFixSuggestion?: (error: ValidationError) => void;
}

// Componentes auxiliares
interface ValidationTableHeaderProps {
  title: string;
  color: string;
  itemCount: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const ValidationTableHeader: React.FC<ValidationTableHeaderProps> = ({
  title,
  color,
  itemCount,
  isExpanded,
  onToggle,
}) => (
  <Group
    justify="space-between"
    align="center"
    style={{ cursor: 'pointer' }}
    onClick={onToggle}
    mb="sm"
  >
    <Group gap="sm">
      <ActionIcon variant="subtle" size="sm">
        {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
      </ActionIcon>
      <Text fw={500} size="sm">
        {title}
      </Text>
      <Badge color={color} variant="light" size="sm">
        {itemCount}
      </Badge>
    </Group>
  </Group>
);

interface ValidationErrorRowProps {
  error: ValidationError;
  onFixSuggestion?: (error: ValidationError) => void;
}

const ValidationErrorRow: React.FC<ValidationErrorRowProps> = ({ error, onFixSuggestion }) => (
  <Table.Tr>
    <Table.Td>
      <Badge size="sm" variant="outline">
        {error.row}
      </Badge>
    </Table.Td>
    <Table.Td>
      <Text size="sm" fw={500}>
        {error.field}
      </Text>
      <Text size="xs" c="dimmed">
        {error.column}
      </Text>
    </Table.Td>
    <Table.Td>
      <Text size="sm" c={error.value ? 'inherit' : 'dimmed'}>
        {error.value ? String(error.value) : '(vacío)'}
      </Text>
    </Table.Td>
    <Table.Td>
      <Text size="sm">{error.message}</Text>
      {error.suggestion && (
        <Text size="xs" c="dimmed" mt={2}>
          Sugerencia: {error.suggestion}
        </Text>
      )}
    </Table.Td>
    <Table.Td>
      <Group gap="xs">
        {error.suggestion && onFixSuggestion && (
          <Tooltip label="Aplicar sugerencia">
            <ActionIcon
              size="sm"
              variant="light"
              color="blue"
              onClick={() => onFixSuggestion(error)}
            >
              <IconCheck size={12} />
            </ActionIcon>
          </Tooltip>
        )}
        <Tooltip label="Ver fila en archivo">
          <ActionIcon size="sm" variant="light" color="gray">
            <IconEye size={12} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Table.Td>
  </Table.Tr>
);

export const ExcelValidationTable: React.FC<ExcelValidationTableProps> = ({
  items,
  title,
  color,
  isExpanded,
  onToggle,
  onFixSuggestion,
}) => {
  if (items.length === 0) return null;

  return (
    <Paper p="md" withBorder>
      <ValidationTableHeader
        title={title}
        color={color}
        itemCount={items.length}
        isExpanded={isExpanded}
        onToggle={onToggle}
      />
      <Collapse in={isExpanded}>
        <ScrollArea h={300}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Fila</Table.Th>
                <Table.Th>Campo</Table.Th>
                <Table.Th>Valor</Table.Th>
                <Table.Th>Problema</Table.Th>
                <Table.Th>Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((error, index) => (
                <ValidationErrorRow key={index} error={error} onFixSuggestion={onFixSuggestion} />
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Collapse>
    </Paper>
  );
};
