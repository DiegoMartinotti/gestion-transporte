import React from 'react';
import { Paper, Group, Text, Collapse, ScrollArea, Stack, Box, Badge, ActionIcon } from '@mantine/core';
import { IconVariable, IconChevronDown, IconChevronRight, IconPlus } from '@tabler/icons-react';
import { IVariableDefinition } from '../../../types/tarifa';

interface VariablesPanelProps {
  variables: IVariableDefinition[];
  variablesOpen: boolean;
  onToggleVariables: () => void;
  onInsertVariable: (nombre: string) => void;
}

const VariablesPanel: React.FC<VariablesPanelProps> = ({
  variables,
  variablesOpen,
  onToggleVariables,
  onInsertVariable,
}) => {
  // Agrupar variables por origen
  const variablesPorOrigen = React.useMemo(() => {
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

    // Agregar variables estándar
    grupos['estandar'] = [
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

    return grupos;
  }, [variables]);

  const getOrigenLabel = (origen: string): string => {
    const labels: Record<string, string> = {
      estandar: 'Variables Estándar',
      tramo: 'Tramo',
      viaje: 'Viaje',
      cliente: 'Cliente',
      vehiculo: 'Vehículo',
      calculado: 'Calculado',
      constante: 'Constante',
    };
    return labels[origen] || origen;
  };

  const getOrigenColor = (origen: string): string => {
    const colors: Record<string, string> = {
      estandar: 'blue',
      tramo: 'green',
      viaje: 'orange',
      cliente: 'purple',
      vehiculo: 'red',
      calculado: 'yellow',
      constante: 'gray',
    };
    return colors[origen] || 'gray';
  };

  return (
    <Paper p="sm" withBorder>
      <Group
        justify="space-between"
        style={{ cursor: 'pointer' }}
        onClick={onToggleVariables}
      >
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
              <Box key={origen}>
                <Text size="xs" fw={600} c="dimmed" mb="xs">
                  {getOrigenLabel(origen)}
                </Text>
                <Stack gap="xs" pl="sm">
                  {vars.map((variable) => (
                    <Group key={variable.nombre} justify="space-between" wrap="nowrap">
                      <Box style={{ minWidth: 0, flex: 1 }}>
                        <Group gap="xs" wrap="nowrap">
                          <Badge
                            size="xs"
                            color={getOrigenColor(variable.origen)}
                            variant="dot"
                          >
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
                      <ActionIcon
                        size="sm"
                        variant="light"
                        onClick={() => onInsertVariable(variable.nombre)}
                      >
                        <IconPlus size={12} />
                      </ActionIcon>
                    </Group>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        </ScrollArea>
      </Collapse>
    </Paper>
  );
};

export default VariablesPanel;