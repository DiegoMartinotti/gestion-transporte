import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Title,
  Grid,
  NumberInput,
  Select,
  Button,
  Badge,
  Group,
  Stack,
  Text,
  Divider,
  Alert,
  Card,
  SimpleGrid,
  TextInput,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconCalculator, IconTruck, IconClock } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { calculateTarifa } from '../../services/tarifaService';

interface TarifaCalculatorProps {
  tramoId?: string;
  tramo?: any; // Información completa del tramo
  onCalculationChange?: (calculation: CalculationResult) => void;
  readonly?: boolean;
}

interface CalculationParams {
  cliente: string;
  origen: string;
  destino: string;
  fecha: string;
  palets: number;
  tipoUnidad?: string;
  tipoTramo: string;
  metodoCalculo?: string;
  permitirTramoNoVigente?: boolean;
  tramoId?: string;
  tarifaHistoricaId?: string;
}

interface CalculationResult {
  tarifaBase: number;
  extrasTotal: number;
  total: number;
  metodCalculo: string;
  desglose: {
    concepto: string;
    valor: number;
    formula?: string;
  }[];
}

// Helper functions
const getClienteId = (tramo: any) => {
  return typeof tramo?.cliente === 'string' ? tramo.cliente : tramo?.cliente?._id || '';
};

const getSiteId = (site: any) => {
  return site?._id || site || '';
};

const initializeParams = (tramo: any, tramoId?: string): CalculationParams => {
  return {
    cliente: getClienteId(tramo),
    origen: getSiteId(tramo?.origen),
    destino: getSiteId(tramo?.destino),
    fecha: new Date().toISOString().split('T')[0],
    palets: 1,
    tipoTramo: 'TRMC',
    tramoId: tramoId,
  };
};

const updateAvailableTypes = (tramo: any, setAvailableTypes: any, setParams: any) => {
  if (
    tramo.tarifasHistoricas &&
    Array.isArray(tramo.tarifasHistoricas) &&
    tramo.tarifasHistoricas.length > 0
  ) {
    const tipos = Array.from(
      new Set(tramo.tarifasHistoricas.map((t: any) => t.tipo).filter(Boolean))
    ) as string[];
    if (tipos.length > 0) {
      setAvailableTypes(tipos);
      setParams((prev: any) => {
        if (!tipos.includes(prev.tipoTramo)) {
          return { ...prev, tipoTramo: tipos[0] };
        }
        return prev;
      });
    }
  }
};

// Component for calculation parameters
const ParametersSection: React.FC<{
  tramo: any;
  params: CalculationParams;
  availableTypes: string[];
  readonly: boolean;
  onParamChange: (field: keyof CalculationParams, value: any) => void;
  onCalculate: () => void;
  isLoading: boolean;
  tramoId?: string;
}> = ({
  tramo,
  params,
  availableTypes,
  readonly,
  onParamChange,
  onCalculate,
  isLoading,
  tramoId,
}) => (
  <Card withBorder>
    <Title order={5} mb="md">
      Parámetros de Cálculo
    </Title>

    <Stack gap="sm">
      <SimpleGrid cols={2}>
        <TextInput
          label="Cliente"
          placeholder="Nombre del cliente"
          value={tramo?.cliente?.nombre || params.cliente}
          onChange={(event) => onParamChange('cliente', event.currentTarget.value)}
          disabled={readonly || !!tramo}
          readOnly={!!tramo}
        />

        <DateInput
          label="Fecha"
          placeholder="Fecha del cálculo"
          value={new Date(params.fecha)}
          onChange={(value) =>
            onParamChange(
              'fecha',
              value ? new Date(value).toISOString().split('T')[0] : params.fecha
            )
          }
          disabled={readonly}
        />
      </SimpleGrid>

      <SimpleGrid cols={2}>
        <TextInput
          label="Origen"
          placeholder="Sitio de origen"
          value={tramo?.origen?.nombre || params.origen}
          onChange={(event) => onParamChange('origen', event.currentTarget.value)}
          disabled={readonly || !!tramo}
          readOnly={!!tramo}
        />

        <TextInput
          label="Destino"
          placeholder="Sitio de destino"
          value={tramo?.destino?.nombre || params.destino}
          onChange={(event) => onParamChange('destino', event.currentTarget.value)}
          disabled={readonly || !!tramo}
          readOnly={!!tramo}
        />
      </SimpleGrid>

      <SimpleGrid cols={2}>
        <NumberInput
          label="Palets"
          placeholder="1"
          value={params.palets}
          onChange={(value) => onParamChange('palets', value)}
          min={1}
          disabled={readonly}
        />

        <Select
          label="Tipo de Tramo"
          placeholder="Seleccionar tipo"
          value={params.tipoTramo}
          onChange={(value) => onParamChange('tipoTramo', value)}
          data={availableTypes?.map((tipo) => ({ value: tipo, label: tipo })) || []}
          disabled={readonly}
        />
      </SimpleGrid>

      {!readonly && (
        <Button
          onClick={onCalculate}
          loading={isLoading}
          disabled={!tramoId}
          leftSection={<IconCalculator size={16} />}
          fullWidth
        >
          Calcular Tarifa
        </Button>
      )}
    </Stack>
  </Card>
);

// Component for calculation results
const ResultsSection: React.FC<{
  result: CalculationResult | null;
  params: CalculationParams;
  formatCurrency: (amount: number) => string;
}> = ({ result, params, formatCurrency }) => (
  <Card withBorder>
    <Title order={5} mb="md">
      Resultado del Cálculo
    </Title>

    {result ? (
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={500}>Método de Cálculo:</Text>
          <Badge variant="light">{result.metodCalculo}</Badge>
        </Group>

        <Divider />

        <Stack gap="xs">
          {result.desglose &&
            Array.isArray(result.desglose) &&
            result.desglose.map((item, index) => (
              <Group key={index} justify="space-between">
                <Text size="sm">{item.concepto}</Text>
                <Text size="sm" fw={500}>
                  {formatCurrency(item.valor)}
                </Text>
              </Group>
            ))}
        </Stack>

        <Divider />

        <Group justify="space-between">
          <Text fw={500}>Tarifa Base:</Text>
          <Text fw={500}>{formatCurrency(result.tarifaBase)}</Text>
        </Group>

        <Group justify="space-between">
          <Text fw={500}>Extras:</Text>
          <Text fw={500}>{formatCurrency(result.extrasTotal)}</Text>
        </Group>

        <Group justify="space-between">
          <Text size="lg" fw={700} c="green">
            TOTAL:
          </Text>
          <Text size="lg" fw={700} c="green">
            {formatCurrency(result.total)}
          </Text>
        </Group>

        <SimpleGrid cols={2} mt="md">
          <Card withBorder p="xs">
            <Group gap="xs">
              <IconTruck size={16} />
              <Text size="xs">Por Palet</Text>
            </Group>
            <Text fw={500} size="sm">
              {formatCurrency(result.total / (params.palets || 1))}
            </Text>
          </Card>

          <Card withBorder p="xs">
            <Group gap="xs">
              <IconClock size={16} />
              <Text size="xs">Método</Text>
            </Group>
            <Text fw={500} size="sm">
              {result.metodCalculo}
            </Text>
          </Card>
        </SimpleGrid>
      </Stack>
    ) : (
      <Alert color="blue" variant="light">
        <Text>Complete los parámetros de cálculo para ver el resultado</Text>
      </Alert>
    )}
  </Card>
);

const TarifaCalculator: React.FC<TarifaCalculatorProps> = ({
  tramoId,
  tramo,
  onCalculationChange,
  readonly = false,
}) => {
  const [params, setParams] = useState<CalculationParams>(() => initializeParams(tramo, tramoId));

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [availableTypes, setAvailableTypes] = useState<string[]>(['TRMC', 'TRMI']);

  const calculationMutation = useMutation({
    mutationFn: (data: { tramoId: string; params: CalculationParams }) =>
      calculateTarifa(data.tramoId, data.params),
    onSuccess: (data) => {
      setResult(data);
      onCalculationChange?.(data);
    },
  });

  const handleCalculate = useCallback(() => {
    if (!tramoId) return;
    console.log('Calculando tarifa con:', { tramoId, params, tramo });
    // Extraer solo el ID real del tramo (sin el sufijo del tipo)
    const realTramoId = tramoId.split('-')[0];
    console.log('ID real del tramo:', realTramoId);
    calculationMutation.mutate({ tramoId: realTramoId, params });
  }, [tramoId, params, tramo, calculationMutation]);

  const handleParamChange = (field: keyof CalculationParams, value: any) => {
    setParams((prev) => ({ ...prev, [field]: value }));
  };

  // Actualizar parámetros cuando cambia el tramo
  useEffect(() => {
    if (tramo) {
      setParams((prev) => ({
        ...prev,
        cliente: getClienteId(tramo),
        origen: getSiteId(tramo.origen),
        destino: getSiteId(tramo.destino),
        tramoId: tramoId,
      }));

      updateAvailableTypes(tramo, setAvailableTypes, setParams);
    }
  }, [tramo, tramoId]);

  // Calcular automáticamente cuando hay datos suficientes
  useEffect(() => {
    const hasRequiredData =
      tramoId && params.palets && params.cliente && params.origen && params.destino;
    if (hasRequiredData) {
      handleCalculate();
    }
  }, [
    tramoId,
    params.palets,
    params.cliente,
    params.origen,
    params.destino,
    params.tipoTramo,
    handleCalculate,
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  return (
    <Paper p="md">
      <Group justify="space-between" mb="md">
        <Title order={4}>
          <Group gap="xs">
            <IconCalculator size={20} />
            Calculadora de Tarifas
          </Group>
        </Title>
        {result && (
          <Badge size="lg" color="green">
            {formatCurrency(result.total)}
          </Badge>
        )}
      </Group>

      <Grid>
        <Grid.Col span={6}>
          <ParametersSection
            tramo={tramo}
            params={params}
            availableTypes={availableTypes}
            readonly={readonly}
            onParamChange={handleParamChange}
            onCalculate={handleCalculate}
            isLoading={calculationMutation.isPending}
            tramoId={tramoId}
          />
        </Grid.Col>

        <Grid.Col span={6}>
          <ResultsSection result={result} params={params} formatCurrency={formatCurrency} />
        </Grid.Col>
      </Grid>

      {calculationMutation.isError && (
        <Alert color="red" mt="md">
          Error al calcular la tarifa. Verifique los datos ingresados.
        </Alert>
      )}
    </Paper>
  );
};

// Comparador para React.memo
const arePropsEqual = (
  prevProps: TarifaCalculatorProps,
  nextProps: TarifaCalculatorProps
): boolean => {
  return (
    prevProps.tramoId === nextProps.tramoId &&
    prevProps.readonly === nextProps.readonly &&
    // Comparación profunda del objeto tramo
    JSON.stringify(prevProps.tramo) === JSON.stringify(nextProps.tramo)
  );
};

export default React.memo(TarifaCalculator, arePropsEqual);
