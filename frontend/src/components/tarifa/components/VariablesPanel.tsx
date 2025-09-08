import React from 'react';
import {
  Paper,
  Group,
  Text,
  Collapse,
  ScrollArea,
  Stack,
  Box,
  Badge,
  ActionIcon,
} from '@mantine/core';
import { IconVariable, IconChevronDown, IconChevronRight, IconPlus } from '@tabler/icons-react';
import { IVariableDefinition } from '../../../types/tarifa';

interface VariablesPanelProps {
  variables: IVariableDefinition[];
  variablesOpen: boolean;
  onToggleVariables: () => void;
  onInsertVariable: (nombre: string) => void;
}

const VARIABLES_ESTANDAR: IVariableDefinition[] = [
  {
    nombre: 'Valor',
    descripcion: 'Valor base de la tarifa',
    tipo: 'number',
    origen: 'tramo',
    requerido: true,
  },
  {
    nombre: 'Peaje',
    descripcion: 'Valor del peaje',
    tipo: 'number',
    origen: 'tramo',
    requerido: false,
  },
  {
    nombre: 'Cantidad',
    descripcion: 'Cantidad para el cálculo',
    tipo: 'number',
    origen: 'viaje',
    requerido: false,
  },
];

const ORIGEN_LABELS: Record<string, string> = {
  estandar: 'Variables Estándar',
  tramo: 'Tramo',
  viaje: 'Viaje',
  cliente: 'Cliente',
  vehiculo: 'Vehículo',
  calculado: 'Calculado',
  constante: 'Constante',
};

const ORIGEN_COLORS: Record<string, string> = {
  estandar: 'blue',
  tramo: 'green',
  viaje: 'orange',
  cliente: 'purple',
  vehiculo: 'red',
  calculado: 'yellow',
  constante: 'gray',
};

const getOrigenLabel = (origen: string): string => ORIGEN_LABELS[origen] || origen;
const getOrigenColor = (origen: string): string => ORIGEN_COLORS[origen] || 'gray';

const useVariablesGrouped = (variables: IVariableDefinition[]) => {
  return React.useMemo(() => {
    const grupos = variables.reduce(
      (acc, variable) => {
        if (!acc[variable.origen]) {
          acc[variable.origen] = [];
        }
        acc[variable.origen].push(variable);
        return acc;
      },
      {} as Record<string, IVariableDefinition[]>
    );

    grupos['estandar'] = VARIABLES_ESTANDAR;
    return grupos;
  }, [variables]);
};

interface VariableItemProps {
  variable: IVariableDefinition;
  onInsert: (nombre: string) => void;
}

const VariableItem: React.FC<VariableItemProps> = ({ variable, onInsert }) => (
  <Group justify="space-between" wrap="nowrap">
    <Box style={{ minWidth: 0, flex: 1 }}>
      <Group gap="xs" wrap="nowrap">
        <Badge size="xs" color={getOrigenColor(variable.origen)} variant="dot">
          {variable.tipo}
        </Badge>
        <Text size="xs" fw={600} truncate>
          {variable.nombre}
        </Text>
      </Group>
      <Text size="xs" c="dimmed" truncate>
        {variable.descripcion}
      </Text>
    </Box>
    <ActionIcon size="sm" variant="light" onClick={() => onInsert(variable.nombre)}>
      <IconPlus size={12} />
    </ActionIcon>
  </Group>
);

interface VariableGroupProps {
  origen: string;
  variables: IVariableDefinition[];
  onInsert: (nombre: string) => void;
}

const VariableGroup: React.FC<VariableGroupProps> = ({ origen, variables, onInsert }) => (
  <Box>
    <Text size="xs" fw={600} c="dimmed" mb="xs">
      {getOrigenLabel(origen)}
    </Text>
    <Stack gap="xs" pl="sm">
      {variables.map((variable) => (
        <VariableItem key={variable.nombre} variable={variable} onInsert={onInsert} />
      ))}
    </Stack>
  </Box>
);

const VariablesPanel: React.FC<VariablesPanelProps> = ({
  variables,
  variablesOpen,
  onToggleVariables,
  onInsertVariable,
}) => {
  const variablesPorOrigen = useVariablesGrouped(variables);

  return (
    <Paper p="sm" withBorder>
      <Group justify="space-between" style={{ cursor: 'pointer' }} onClick={onToggleVariables}>
        <Group gap="xs">
          <IconVariable size={16} />
          <Text size="sm" fw={600}>
            Variables
          </Text>
        </Group>
        {variablesOpen ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
      </Group>

      <Collapse in={variablesOpen}>
        <ScrollArea h={200} mt="sm">
          <Stack gap="xs">
            {Object.entries(variablesPorOrigen).map(([origen, vars]) => (
              <VariableGroup
                key={origen}
                origen={origen}
                variables={vars}
                onInsert={onInsertVariable}
              />
            ))}
          </Stack>
        </ScrollArea>
      </Collapse>
    </Paper>
  );
};

export default VariablesPanel;
