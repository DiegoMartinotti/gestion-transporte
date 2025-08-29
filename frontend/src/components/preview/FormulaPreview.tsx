import React, { useState, useEffect, useCallback } from 'react';
import { Card, Text, Group, Stack, Button, Divider } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { formulaService } from '../../services/formulaService';
import { CustomCalculator, ScenariosTable, ComparisonSection } from './FormulaPreviewHelpers';

interface FormulaPreviewProps {
  formula: string;
  clienteNombre?: string;
  tipoUnidad: string;
}

interface EscenarioPrueba {
  nombre: string;
  valor: number;
  palets: number;
  peaje: number;
  esperado?: number;
  descripcion: string;
}

const ESCENARIOS_BASE: EscenarioPrueba[] = [
  {
    nombre: 'Básico',
    valor: 1000,
    palets: 10,
    peaje: 500,
    descripcion: 'Escenario estándar',
  },
  {
    nombre: 'Volumen alto',
    valor: 1000,
    palets: 25,
    peaje: 500,
    descripcion: 'Muchos palets',
  },
  {
    nombre: 'Volumen bajo',
    valor: 1000,
    palets: 3,
    peaje: 500,
    descripcion: 'Pocos palets',
  },
  {
    nombre: 'Sin peaje',
    valor: 1500,
    palets: 15,
    peaje: 0,
    descripcion: 'Ruta sin peaje',
  },
  {
    nombre: 'Valor alto',
    valor: 2500,
    palets: 12,
    peaje: 800,
    descripcion: 'Tramo costoso',
  },
];

export const FormulaPreview: React.FC<FormulaPreviewProps> = ({
  formula,
  clienteNombre,
  tipoUnidad,
}) => {
  const [escenarios, setEscenarios] = useState<EscenarioPrueba[]>(ESCENARIOS_BASE);
  const [loading, setLoading] = useState(false);
  const [customValues, setCustomValues] = useState({
    valor: 1000,
    palets: 10,
    peaje: 500,
  });
  const [customResult, setCustomResult] = useState<number | null>(null);

  const calculateEscenarios = useCallback(async () => {
    setLoading(true);
    try {
      const promises = escenarios.map(async (escenario) => {
        try {
          const result = await formulaService.calculate(formula, {
            valor: escenario.valor,
            palets: escenario.palets,
            peaje: escenario.peaje,
          });
          return { ...escenario, esperado: result.resultado };
        } catch (error) {
          return { ...escenario, esperado: undefined };
        }
      });

      const resultados = await Promise.all(promises);
      setEscenarios(resultados);
    } catch (error) {
      console.error('Error al calcular escenarios:', error);
    } finally {
      setLoading(false);
    }
  }, [formula, escenarios]);

  const calculateCustom = useCallback(async () => {
    try {
      const result = await formulaService.calculate(formula, customValues);
      setCustomResult(result.resultado);
    } catch (error) {
      setCustomResult(null);
    }
  }, [formula, customValues]);

  useEffect(() => {
    calculateEscenarios();
  }, [formula]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    calculateCustom();
  }, [formula, customValues]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Card withBorder padding="lg">
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Text fw={600} size="lg">
              Vista Previa de Fórmula
            </Text>
            {clienteNombre && (
              <Text size="sm" c="dimmed">
                Cliente: {clienteNombre}
              </Text>
            )}
            <Text size="xs" c="dimmed">
              Tipo: {tipoUnidad}
            </Text>
          </div>
          <Button
            leftSection={<IconRefresh size={16} />}
            variant="light"
            size="sm"
            onClick={calculateEscenarios}
            loading={loading}
          >
            Recalcular
          </Button>
        </Group>

        {/* Custom Calculator */}
        <CustomCalculator
          customValues={customValues}
          setCustomValues={setCustomValues}
          customResult={customResult}
        />

        <Divider />

        {/* Test Scenarios */}
        <div>
          <Text fw={500} mb="sm">
            Escenarios de Prueba
          </Text>
          <ScenariosTable escenarios={escenarios} loading={loading} />
        </div>

        {/* Comparison */}
        <ComparisonSection customValues={customValues} customResult={customResult} />
      </Stack>
    </Card>
  );
};
