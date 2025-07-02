import React, { useState, useEffect, useMemo } from 'react';
import {
  Paper,
  Title,
  Grid,
  Button,
  Badge,
  Group,
  Stack,
  Text,
  Divider,
  Alert,
  Card,
  Code,
  Textarea,
  Select,
  NumberInput,
  ActionIcon,
  Collapse,
  Box,
  JsonInput
} from '@mantine/core';
import { 
  IconMath, 
  IconCode,
  IconChevronDown, 
  IconChevronUp,
  IconCalculator,
  IconVariable,
  IconFunction,
  IconAlertTriangle
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { evaluate } from 'mathjs';

interface FormulaPersonalizada {
  _id: string;
  cliente: string;
  nombre: string;
  descripcion?: string;
  formula: string;
  variables: string[];
  vigenciaDesde: string;
  vigenciaHasta?: string;
  activa: boolean;
}

interface VariableValue {
  name: string;
  value: number;
  description?: string;
}

interface FormulaProcessorProps {
  formulas?: FormulaPersonalizada[];
  formulaSeleccionada?: string;
  variables?: VariableValue[];
  onFormulaSelect?: (formulaId: string) => void;
  onResult?: (result: FormulaResult) => void;
  readonly?: boolean;
  showEditor?: boolean;
}

interface FormulaResult {
  resultado: number;
  formula: string;
  variables: VariableValue[];
  error?: string;
  evaluacion: {
    expresion: string;
    pasos?: string[];
    tiempoEjecucion: number;
  };
}

export const FormulaProcessor: React.FC<FormulaProcessorProps> = ({
  formulas = [],
  formulaSeleccionada,
  variables = [],
  onFormulaSelect,
  onResult,
  readonly = false,
  showEditor = false
}) => {
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>(formulaSeleccionada || '');
  const [formulaVariables, setFormulaVariables] = useState<VariableValue[]>(variables);
  const [customFormula, setCustomFormula] = useState<string>('');
  const [useCustom, setUseCustom] = useState<boolean>(false);
  const [result, setResult] = useState<FormulaResult | null>(null);
  const [editorOpened, { toggle: toggleEditor }] = useDisclosure(showEditor);

  // Fórmula actualmente seleccionada
  const selectedFormula = useMemo(() => {
    return formulas.find(f => f._id === selectedFormulaId);
  }, [formulas, selectedFormulaId]);

  // Variables predefinidas disponibles
  const availableVariables = useMemo(() => {
    return [
      { name: 'palets', description: 'Cantidad de palets' },
      { name: 'distancia', description: 'Distancia en kilómetros' },
      { name: 'peso', description: 'Peso total en toneladas' },
      { name: 'volumen', description: 'Volumen en metros cúbicos' },
      { name: 'tiempo', description: 'Tiempo estimado en horas' },
      { name: 'combustible', description: 'Costo de combustible' },
      { name: 'peaje', description: 'Costo de peajes' },
      { name: 'tarifaBase', description: 'Tarifa base del tramo' },
      { name: 'multiplicador', description: 'Multiplicador de ajuste' }
    ];
  }, []);

  // Inicializar variables cuando se selecciona una fórmula
  useEffect(() => {
    if (selectedFormula && selectedFormula.variables) {
      const newVariables = selectedFormula.variables.map(varName => {
        const existing = formulaVariables.find(v => v.name === varName);
        const definition = availableVariables.find(v => v.name === varName);
        
        return {
          name: varName,
          value: existing?.value || 0,
          description: definition?.description || varName
        };
      });
      
      setFormulaVariables(newVariables);
    }
  }, [selectedFormula, availableVariables]);

  // Procesar fórmula
  const processFormula = () => {
    const formulaToUse = useCustom ? customFormula : selectedFormula?.formula;
    
    if (!formulaToUse) {
      setResult({
        resultado: 0,
        formula: '',
        variables: formulaVariables,
        error: 'No hay fórmula seleccionada',
        evaluacion: {
          expresion: '',
          tiempoEjecucion: 0
        }
      });
      return;
    }

    const startTime = performance.now();
    
    try {
      // Crear scope con variables
      const scope: Record<string, number> = {};
      formulaVariables.forEach(variable => {
        scope[variable.name] = variable.value;
      });

      // Evaluar la fórmula
      const resultado = evaluate(formulaToUse, scope);
      const endTime = performance.now();

      const formulaResult: FormulaResult = {
        resultado: Number(resultado),
        formula: formulaToUse,
        variables: formulaVariables,
        evaluacion: {
          expresion: formulaToUse,
          tiempoEjecucion: endTime - startTime
        }
      };

      setResult(formulaResult);
      onResult?.(formulaResult);

    } catch (error) {
      const endTime = performance.now();
      
      const formulaResult: FormulaResult = {
        resultado: 0,
        formula: formulaToUse,
        variables: formulaVariables,
        error: error instanceof Error ? error.message : 'Error en la evaluación',
        evaluacion: {
          expresion: formulaToUse,
          tiempoEjecucion: endTime - startTime
        }
      };

      setResult(formulaResult);
      onResult?.(formulaResult);
    }
  };

  const handleFormulaChange = (formulaId: string | null) => {
    if (!formulaId) return;
    
    setSelectedFormulaId(formulaId);
    setUseCustom(false);
    onFormulaSelect?.(formulaId);
  };

  const handleVariableChange = (variableName: string, value: number) => {
    setFormulaVariables(prev => 
      prev.map(variable => 
        variable.name === variableName 
          ? { ...variable, value }
          : variable
      )
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  // Auto-calcular cuando cambian las variables
  useEffect(() => {
    if ((selectedFormula || useCustom) && formulaVariables.length > 0) {
      processFormula();
    }
  }, [formulaVariables, selectedFormula, customFormula, useCustom]);

  return (
    <Paper p="md">
      <Group justify="space-between" mb="md">
        <Title order={4}>
          <Group gap="xs">
            <IconMath size={20} />
            Procesador de Fórmulas
          </Group>
        </Title>
        <Group gap="sm">
          {result && !result.error && (
            <Badge size="lg" color="green">
              {formatCurrency(result.resultado)}
            </Badge>
          )}
          {showEditor && (
            <ActionIcon
              variant="subtle"
              onClick={toggleEditor}
              aria-label="Toggle editor"
            >
              {editorOpened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </ActionIcon>
          )}
        </Group>
      </Group>

      <Grid>
        {/* Selector de fórmulas */}
        <Grid.Col span={6}>
          <Card withBorder>
            <Title order={5} mb="md">Selección de Fórmula</Title>
            
            <Stack gap="sm">
              <Select
                label="Fórmula Personalizada"
                placeholder="Seleccionar fórmula"
                value={useCustom ? '' : selectedFormulaId}
                onChange={handleFormulaChange}
                data={formulas.map(formula => ({
                  value: formula._id,
                  label: `${formula.nombre} - ${formula.descripcion || 'Sin descripción'}`
                }))}
                disabled={readonly || useCustom}
                clearable
              />

              {selectedFormula && !useCustom && (
                <Box p="xs" bg="gray.0" style={{ borderRadius: 4 }}>
                  <Text size="sm" fw={500} mb="xs">{selectedFormula.nombre}</Text>
                  <Code block>{selectedFormula.formula}</Code>
                  {selectedFormula.descripcion && (
                    <Text size="xs" c="dimmed" mt="xs">
                      {selectedFormula.descripcion}
                    </Text>
                  )}
                </Box>
              )}

              <Divider label="O usar fórmula personalizada" />

              <Button
                variant={useCustom ? "filled" : "light"}
                onClick={() => setUseCustom(!useCustom)}
                disabled={readonly}
                leftSection={<IconCode size={16} />}
              >
                {useCustom ? 'Usar fórmula seleccionada' : 'Usar fórmula personalizada'}
              </Button>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Variables */}
        <Grid.Col span={6}>
          <Card withBorder>
            <Title order={5} mb="md">Variables</Title>
            
            <Stack gap="sm">
              {formulaVariables.map(variable => (
                <Group key={variable.name} align="end">
                  <NumberInput
                    label={variable.name}
                    description={variable.description}
                    value={variable.value}
                    onChange={(value) => handleVariableChange(variable.name, Number(value) || 0)}
                    disabled={readonly}
                    placeholder="0"
                    decimalScale={2}
                    step={0.01}
                    style={{ flex: 1 }}
                  />
                  <ActionIcon variant="light" size="lg">
                    <IconVariable size={16} />
                  </ActionIcon>
                </Group>
              ))}

              {formulaVariables.length === 0 && (
                <Alert color="blue" variant="light">
                  <Text size="sm">
                    Seleccione una fórmula para ver las variables requeridas
                  </Text>
                </Alert>
              )}
            </Stack>
          </Card>
        </Grid.Col>

        {/* Editor personalizado */}
        <Collapse in={useCustom || editorOpened} style={{ gridColumn: '1 / -1' }}>
          <Grid.Col span={12}>
            <Card withBorder>
              <Title order={5} mb="md">Editor de Fórmula Personalizada</Title>
              
              <Textarea
                label="Fórmula"
                placeholder="Ejemplo: palets * distancia * 0.5 + tarifaBase"
                value={customFormula}
                onChange={(event) => setCustomFormula(event.currentTarget.value)}
                disabled={readonly || !useCustom}
                minRows={3}
                autosize
              />
              
              <Text size="xs" c="dimmed" mt="xs">
                Variables disponibles: {availableVariables.map(v => v.name).join(', ')}
              </Text>
            </Card>
          </Grid.Col>
        </Collapse>

        {/* Resultado */}
        <Grid.Col span={12}>
          <Card withBorder>
            <Title order={5} mb="md">Resultado</Title>
            
            {result ? (
              <Stack gap="sm">
                {result.error ? (
                  <Alert color="red" icon={<IconAlertTriangle size={16} />}>
                    <Text fw={500}>Error en la evaluación:</Text>
                    <Text size="sm">{result.error}</Text>
                  </Alert>
                ) : (
                  <>
                    <Group justify="space-between">
                      <Text fw={500}>Resultado:</Text>
                      <Text size="xl" fw={700} c="green">
                        {formatCurrency(result.resultado)}
                      </Text>
                    </Group>

                    <Divider />

                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Fórmula evaluada:</Text>
                      <Code>{result.evaluacion.expresion}</Code>
                    </Group>

                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Tiempo de ejecución:</Text>
                      <Badge variant="light" size="sm">
                        {result.evaluacion.tiempoEjecucion.toFixed(2)} ms
                      </Badge>
                    </Group>

                    {/* Variables utilizadas */}
                    <Box>
                      <Text size="sm" fw={500} mb="xs">Variables utilizadas:</Text>
                      <Group gap="xs">
                        {result.variables.map(variable => (
                          <Badge key={variable.name} variant="light" size="sm">
                            {variable.name}: {variable.value}
                          </Badge>
                        ))}
                      </Group>
                    </Box>
                  </>
                )}
              </Stack>
            ) : (
              <Alert color="blue" variant="light">
                <Text>
                  Configure una fórmula y sus variables para ver el resultado
                </Text>
              </Alert>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      {/* Botón de cálculo manual */}
      {!readonly && (
        <Group justify="center" mt="md">
          <Button
            onClick={processFormula}
            disabled={!selectedFormula && !useCustom}
            leftSection={<IconCalculator size={16} />}
          >
            Recalcular
          </Button>
        </Group>
      )}
    </Paper>
  );
};