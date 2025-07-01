import React, { useState, useEffect } from 'react';
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
  TextInput
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconCalculator, IconCurrency, IconTruck, IconClock } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { calculateTarifa } from '../../services/tarifaService';

interface TarifaCalculatorProps {
  tramoId?: string;
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

export const TarifaCalculator: React.FC<TarifaCalculatorProps> = ({
  tramoId,
  onCalculationChange,
  readonly = false
}) => {
  const [params, setParams] = useState<CalculationParams>({
    cliente: '',
    origen: '',
    destino: '',
    fecha: new Date().toISOString().split('T')[0],
    palets: 1,
    tipoTramo: 'Sider',
    tramoId: tramoId
  });

  const [result, setResult] = useState<CalculationResult | null>(null);

  const calculationMutation = useMutation({
    mutationFn: (data: { tramoId: string; params: CalculationParams }) =>
      calculateTarifa(data.tramoId, data.params),
    onSuccess: (data) => {
      setResult(data);
      onCalculationChange?.(data);
    }
  });

  const handleCalculate = () => {
    if (!tramoId) return;
    calculationMutation.mutate({ tramoId, params });
  };

  const handleParamChange = (field: keyof CalculationParams, value: any) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (tramoId && params.palets && params.cliente && params.origen && params.destino) {
      setParams(prev => ({ ...prev, tramoId }));
      handleCalculate();
    }
  }, [tramoId, params.palets, params.cliente, params.origen, params.destino]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
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
        {/* Parámetros de entrada */}
        <Grid.Col span={6}>
          <Card withBorder>
            <Title order={5} mb="md">Parámetros de Cálculo</Title>
            
            <Stack gap="sm">
              <SimpleGrid cols={2}>
                <TextInput
                  label="Cliente"
                  placeholder="Nombre del cliente"
                  value={params.cliente}
                  onChange={(event) => handleParamChange('cliente', event.currentTarget.value)}
                  disabled={readonly}
                />
                
                <DateInput
                  label="Fecha"
                  placeholder="Fecha del cálculo"
                  value={new Date(params.fecha)}
                  onChange={(value) => handleParamChange('fecha', value ? new Date(value).toISOString().split('T')[0] : params.fecha)}
                  disabled={readonly}
                />
              </SimpleGrid>

              <SimpleGrid cols={2}>
                <TextInput
                  label="Origen"
                  placeholder="Sitio de origen"
                  value={params.origen}
                  onChange={(event) => handleParamChange('origen', event.currentTarget.value)}
                  disabled={readonly}
                />
                
                <TextInput
                  label="Destino"
                  placeholder="Sitio de destino"
                  value={params.destino}
                  onChange={(event) => handleParamChange('destino', event.currentTarget.value)}
                  disabled={readonly}
                />
              </SimpleGrid>

              <SimpleGrid cols={2}>
                <NumberInput
                  label="Palets"
                  placeholder="1"
                  value={params.palets}
                  onChange={(value) => handleParamChange('palets', value)}
                  min={1}
                  disabled={readonly}
                />
                
                <Select
                  label="Tipo de Tramo"
                  placeholder="Seleccionar tipo"
                  value={params.tipoTramo}
                  onChange={(value) => handleParamChange('tipoTramo', value)}
                  data={[
                    { value: 'Sider', label: 'Sider' },
                    { value: 'Bitren', label: 'Bitrén' },
                    { value: 'General', label: 'General' }
                  ]}
                  disabled={readonly}
                />
              </SimpleGrid>

              {!readonly && (
                <Button
                  onClick={handleCalculate}
                  loading={calculationMutation.isPending}
                  disabled={!tramoId}
                  leftSection={<IconCalculator size={16} />}
                  fullWidth
                >
                  Calcular Tarifa
                </Button>
              )}
            </Stack>
          </Card>
        </Grid.Col>

        {/* Resultado del cálculo */}
        <Grid.Col span={6}>
          <Card withBorder>
            <Title order={5} mb="md">Resultado del Cálculo</Title>
            
            {result ? (
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text fw={500}>Método de Cálculo:</Text>
                  <Badge variant="light">{result.metodCalculo}</Badge>
                </Group>

                <Divider />

                {/* Desglose detallado */}
                <Stack gap="xs">
                  {result.desglose.map((item, index) => (
                    <Group key={index} justify="space-between">
                      <Text size="sm">{item.concepto}</Text>
                      <Text size="sm" fw={500}>
                        {formatCurrency(item.valor)}
                      </Text>
                    </Group>
                  ))}
                </Stack>

                <Divider />

                {/* Totales */}
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

                {/* Indicadores adicionales */}
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
                <Text>
                  Complete los parámetros de cálculo para ver el resultado
                </Text>
              </Alert>
            )}
          </Card>
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