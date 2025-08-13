import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Stack,
  Group,
  Text,
  Textarea,
  Paper,
  Badge,
  ScrollArea,
  Alert,
  Collapse,
  ActionIcon,
  Tooltip,
  Modal,
  Divider,
  Code,
} from '@mantine/core';
import {
  IconCode,
  IconVariable,
  IconFunction,
  IconCheck,
  IconX,
  IconHelp,
  IconChevronDown,
  IconChevronRight,
  IconPlus,
  IconAlertCircle,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { IVariableDefinition, IValidacionFormula, FUNCIONES_FORMULA } from '../../types/tarifa';

interface FormulaEditorProps {
  value: string;
  onChange: (value: string) => void;
  variables: IVariableDefinition[];
  readonly?: boolean;
  height?: number | string;
  placeholder?: string;
  onValidate?: (validacion: IValidacionFormula) => void;
  showValidation?: boolean;
  showVariablePicker?: boolean;
  showFunctionHelper?: boolean;
}

// eslint-disable-next-line complexity
const FormulaEditor: React.FC<FormulaEditorProps> = (props) => {
  const {
    value,
    onChange,
    variables,
    readonly = false,
    height = 120,
    placeholder = 'Ingrese la fórmula de cálculo...',
    onValidate,
    showValidation = true,
    showVariablePicker = true,
    showFunctionHelper = true,
  } = props;
  const [validacion, setValidacion] = useState<IValidacionFormula | null>(null);
  const [variablesOpen, { toggle: toggleVariables }] = useDisclosure(false);
  const [funcionesOpen, { toggle: toggleFunciones }] = useDisclosure(false);
  const [helpModalOpen, { open: openHelp, close: closeHelp }] = useDisclosure(false);

  // Validar fórmula
  // eslint-disable-next-line complexity, sonarjs/cognitive-complexity
  const validarFormula = useCallback(
    (formula: string): IValidacionFormula => {
      const errores: string[] = [];
      const advertencias: string[] = [];
      const variablesUsadas: string[] = [];
      const funcionesUsadas: string[] = [];

      try {
        if (!formula.trim()) {
          return {
            valida: false,
            errores: ['La fórmula no puede estar vacía'],
            advertencias,
            variablesUsadas,
            funcionesUsadas,
          };
        }

        // Extraer variables de la fórmula
        const variablesEnFormula = formula.match(/\b[A-Za-z][A-Za-z0-9_]*\b/g) || [];

        // Separar funciones conocidas de variables
        const funcionesConocidas = FUNCIONES_FORMULA.map((f) => f.nombre);

        for (const item of variablesEnFormula) {
          const upperItem = item.toUpperCase();
          if (funcionesConocidas.includes(upperItem as any)) {
            if (!funcionesUsadas.includes(upperItem)) {
              funcionesUsadas.push(upperItem);
            }
          } else {
            if (!variablesUsadas.includes(item)) {
              variablesUsadas.push(item);
            }
          }
        }

        // Validar variables
        const variablesDefinidas = variables.map((v) => v.nombre);
        const variablesEstandar = ['Valor', 'Peaje', 'Cantidad'];
        const todasLasVariables = [...variablesDefinidas, ...variablesEstandar];

        for (const variable of variablesUsadas) {
          if (!todasLasVariables.includes(variable)) {
            errores.push(`Variable no definida: ${variable}`);
          }
        }

        // Validar paréntesis balanceados
        let parentesisBalance = 0;
        for (const char of formula) {
          if (char === '(') parentesisBalance++;
          if (char === ')') parentesisBalance--;
          if (parentesisBalance < 0) {
            errores.push('Paréntesis no balanceados');
            break;
          }
        }
        if (parentesisBalance !== 0) {
          errores.push('Paréntesis no balanceados');
        }

        // Validar caracteres permitidos
        const caracteresPermitidos = /^[A-Za-z0-9_+\-*/().>, <>=!&|%\s]+$/;
        if (!caracteresPermitidos.test(formula)) {
          errores.push('La fórmula contiene caracteres no permitidos');
        }

        // Advertencias
        if (variablesUsadas.length === 0) {
          advertencias.push('La fórmula no utiliza ninguna variable');
        }

        return {
          valida: errores.length === 0,
          errores,
          advertencias,
          variablesUsadas,
          funcionesUsadas,
        };
      } catch (error) {
        return {
          valida: false,
          errores: [`Error de sintaxis: ${error}`],
          advertencias,
          variablesUsadas,
          funcionesUsadas,
        };
      }
    },
    [variables]
  );

  // Efecto para validar cuando cambia la fórmula
  React.useEffect(() => {
    if (showValidation && value) {
      const resultado = validarFormula(value);
      setValidacion(resultado);
      onValidate?.(resultado);
    }
  }, [value, validarFormula, showValidation, onValidate]);

  // Insertar variable en la fórmula
  const insertarVariable = useCallback(
    (nombreVariable: string) => {
      const textarea = document.querySelector(
        'textarea[data-formula-editor]'
      ) as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = value.slice(0, start) + nombreVariable + value.slice(end);
        onChange(newValue);

        // Restaurar posición del cursor
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + nombreVariable.length, start + nombreVariable.length);
        }, 0);
      } else {
        onChange(value + nombreVariable);
      }
    },
    [value, onChange]
  );

  // Insertar función en la fórmula
  const insertarFuncion = useCallback(
    (funcion: (typeof FUNCIONES_FORMULA)[0]) => {
      const plantilla = funcion.sintaxis.replace(funcion.nombre, funcion.nombre);
      insertarVariable(plantilla);
    },
    [insertarVariable]
  );

  // Agrupar variables por origen
  const variablesPorOrigen = useMemo(() => {
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
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <IconCode size={16} />
          <Text size="sm" fw={600}>
            Editor de Fórmulas
          </Text>
        </Group>

        <Group gap="xs">
          {showValidation && validacion && (
            <Badge
              color={validacion.valida ? 'green' : 'red'}
              variant="light"
              leftSection={validacion.valida ? <IconCheck size={12} /> : <IconX size={12} />}
            >
              {validacion.valida ? 'Válida' : 'Con errores'}
            </Badge>
          )}

          {showFunctionHelper && (
            <Tooltip label="Ayuda de funciones">
              <ActionIcon variant="light" onClick={openHelp}>
                <IconHelp size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      <Group align="flex-start" gap="md">
        {/* Editor principal */}
        <Box style={{ flex: 1 }}>
          <Textarea
            data-formula-editor
            value={value}
            onChange={(e) => onChange(e.currentTarget.value)}
            placeholder={placeholder}
            readOnly={readonly}
            rows={typeof height === 'number' ? Math.floor(height / 24) : 5}
            styles={{
              input: {
                fontFamily: 'monospace',
                fontSize: '14px',
              },
            }}
          />

          {/* Validación */}
          {showValidation && validacion && (
            <Stack gap="xs" mt="xs">
              {validacion.errores.length > 0 && (
                <Alert color="red" variant="light" icon={<IconX size={16} />}>
                  <Stack gap="xs">
                    {validacion.errores.map((error, index) => (
                      <Text key={index} size="sm">
                        {error}
                      </Text>
                    ))}
                  </Stack>
                </Alert>
              )}

              {validacion.advertencias.length > 0 && (
                <Alert color="yellow" variant="light" icon={<IconAlertCircle size={16} />}>
                  <Stack gap="xs">
                    {validacion.advertencias.map((advertencia, index) => (
                      <Text key={index} size="sm">
                        {advertencia}
                      </Text>
                    ))}
                  </Stack>
                </Alert>
              )}

              {validacion.valida && (
                <Group gap="xs">
                  <Text size="xs" c="dimmed">
                    Variables:
                  </Text>
                  {validacion.variablesUsadas.map((variable) => (
                    <Badge key={variable} size="xs" variant="light">
                      {variable}
                    </Badge>
                  ))}

                  {validacion.funcionesUsadas.length > 0 && (
                    <>
                      <Text size="xs" c="dimmed">
                        Funciones:
                      </Text>
                      {validacion.funcionesUsadas.map((funcion) => (
                        <Badge key={funcion} size="xs" variant="light" color="blue">
                          {funcion}
                        </Badge>
                      ))}
                    </>
                  )}
                </Group>
              )}
            </Stack>
          )}
        </Box>

        {/* Panel lateral de variables y funciones */}
        {(showVariablePicker || showFunctionHelper) && !readonly && (
          <Box style={{ minWidth: 280 }}>
            <Stack gap="sm">
              {/* Variables */}
              {showVariablePicker && (
                <Paper p="sm" withBorder>
                  <Group
                    justify="space-between"
                    style={{ cursor: 'pointer' }}
                    onClick={toggleVariables}
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
                                    onClick={() => insertarVariable(variable.nombre)}
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
              )}

              {/* Funciones */}
              {showFunctionHelper && (
                <Paper p="sm" withBorder>
                  <Group
                    justify="space-between"
                    style={{ cursor: 'pointer' }}
                    onClick={toggleFunciones}
                  >
                    <Group gap="xs">
                      <IconFunction size={16} />
                      <Text size="sm" fw={600}>
                        Funciones
                      </Text>
                    </Group>
                    {funcionesOpen ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                  </Group>

                  <Collapse in={funcionesOpen}>
                    <ScrollArea h={200} mt="sm">
                      <Stack gap="xs">
                        {FUNCIONES_FORMULA.map((funcion) => (
                          <Group key={funcion.nombre} justify="space-between" wrap="nowrap">
                            <Box style={{ minWidth: 0, flex: 1 }}>
                              <Text size="xs" fw={600}>
                                {funcion.nombre}
                              </Text>
                              <Text size="xs" c="dimmed" truncate>
                                {funcion.descripcion}
                              </Text>
                            </Box>
                            <ActionIcon
                              size="sm"
                              variant="light"
                              color="blue"
                              onClick={() =>
                                insertarFuncion(funcion as (typeof FUNCIONES_FORMULA)[0])
                              }
                            >
                              <IconPlus size={12} />
                            </ActionIcon>
                          </Group>
                        ))}
                      </Stack>
                    </ScrollArea>
                  </Collapse>
                </Paper>
              )}
            </Stack>
          </Box>
        )}
      </Group>

      {/* Modal de ayuda */}
      <Modal opened={helpModalOpen} onClose={closeHelp} title="Guía de Funciones" size="lg">
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Lista completa de funciones disponibles para usar en las fórmulas de cálculo:
          </Text>

          {FUNCIONES_FORMULA.map((funcion) => (
            <Paper key={funcion.nombre} p="md" withBorder>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text fw={600} color="blue">
                    {funcion.nombre}
                  </Text>
                  <Badge variant="light">{funcion.sintaxis}</Badge>
                </Group>

                <Text size="sm">{funcion.descripcion}</Text>

                <Box>
                  <Text size="xs" fw={600} mb="xs">
                    Ejemplo:
                  </Text>
                  <Code block>{funcion.ejemplo}</Code>
                </Box>
              </Stack>
            </Paper>
          ))}

          <Divider />

          <Box>
            <Text fw={600} mb="sm">
              Operadores Disponibles:
            </Text>
            <Group gap="xs">
              {['+', '-', '*', '/', '(', ')', '>', '<', '>=', '<=', '==', '!=', '&&', '||'].map(
                (op) => (
                  <Badge key={op} variant="outline" size="sm">
                    {op}
                  </Badge>
                )
              )}
            </Group>
          </Box>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default FormulaEditor;
