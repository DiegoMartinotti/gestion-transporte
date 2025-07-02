import React, { useState, useEffect, useMemo } from 'react';
import {
  Paper,
  Title,
  Grid,
  NumberInput,
  Button,
  Badge,
  Group,
  Stack,
  Text,
  Divider,
  Alert,
  Card,
  SimpleGrid,
  ActionIcon,
  Collapse,
  Box
} from '@mantine/core';
import { 
  IconCalculator, 
  IconCurrency, 
  IconChevronDown, 
  IconChevronUp,
  IconPlus,
  IconMinus,
  IconTruck,
  IconReceipt
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';

interface Extra {
  _id: string;
  descripcion: string;
  valor: number;
  tipo: 'FIJO' | 'VARIABLE';
  unidad?: string;
  cantidad?: number;
}

interface TarifaBase {
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

interface TotalCalculatorProps {
  tarifaBase?: TarifaBase;
  extrasDisponibles?: Extra[];
  extrasSeleccionados?: { extra: Extra; cantidad: number }[];
  onTotalChange?: (total: CalculationTotal) => void;
  readonly?: boolean;
  showDetails?: boolean;
}

interface CalculationTotal {
  subtotalTarifa: number;
  subtotalExtras: number;
  total: number;
  extrasAplicados: { extra: Extra; cantidad: number; subtotal: number }[];
  desglose: {
    concepto: string;
    valor: number;
    tipo: 'tarifa' | 'extra';
  }[];
}

export const TotalCalculator: React.FC<TotalCalculatorProps> = ({
  tarifaBase,
  extrasDisponibles = [],
  extrasSeleccionados = [],
  onTotalChange,
  readonly = false,
  showDetails = true
}) => {
  const [extrasAplicados, setExtrasAplicados] = useState<{ extra: Extra; cantidad: number }[]>(
    extrasSeleccionados
  );
  const [detailsOpened, { toggle: toggleDetails }] = useDisclosure(showDetails);

  // Calcular totales de manera reactiva
  const calculationResult = useMemo<CalculationTotal>(() => {
    const subtotalTarifa = tarifaBase?.total || 0;
    
    let subtotalExtras = 0;
    const extrasConSubtotal = extrasAplicados.map(({ extra, cantidad }) => {
      const subtotal = extra.tipo === 'FIJO' ? extra.valor : extra.valor * cantidad;
      subtotalExtras += subtotal;
      return { extra, cantidad, subtotal };
    });

    const total = subtotalTarifa + subtotalExtras;

    // Crear desglose detallado
    const desglose = [
      ...(tarifaBase?.desglose?.map(item => ({
        concepto: item.concepto,
        valor: item.valor,
        tipo: 'tarifa' as const
      })) || []),
      ...extrasConSubtotal.map(({ extra, cantidad, subtotal }) => ({
        concepto: `${extra.descripcion}${extra.tipo === 'VARIABLE' ? ` (x${cantidad})` : ''}`,
        valor: subtotal,
        tipo: 'extra' as const
      }))
    ];

    return {
      subtotalTarifa,
      subtotalExtras,
      total,
      extrasAplicados: extrasConSubtotal,
      desglose
    };
  }, [tarifaBase, extrasAplicados]);

  // Notificar cambios al componente padre
  useEffect(() => {
    onTotalChange?.(calculationResult);
  }, [calculationResult, onTotalChange]);

  const handleExtraQuantityChange = (extraId: string, cantidad: number) => {
    if (readonly) return;

    setExtrasAplicados(prev => {
      if (cantidad <= 0) {
        return prev.filter(item => item.extra._id !== extraId);
      }

      const existingIndex = prev.findIndex(item => item.extra._id === extraId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], cantidad };
        return updated;
      }

      const extra = extrasDisponibles.find(e => e._id === extraId);
      if (extra) {
        return [...prev, { extra, cantidad }];
      }

      return prev;
    });
  };

  const handleAddExtra = (extra: Extra) => {
    if (readonly) return;
    const cantidad = extra.tipo === 'FIJO' ? 1 : 1;
    handleExtraQuantityChange(extra._id, cantidad);
  };

  const handleRemoveExtra = (extraId: string) => {
    if (readonly) return;
    setExtrasAplicados(prev => prev.filter(item => item.extra._id !== extraId));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const getExtraQuantity = (extraId: string) => {
    return extrasAplicados.find(item => item.extra._id === extraId)?.cantidad || 0;
  };

  const isExtraSelected = (extraId: string) => {
    return extrasAplicados.some(item => item.extra._id === extraId);
  };

  return (
    <Paper p="md">
      <Group justify="space-between" mb="md">
        <Title order={4}>
          <Group gap="xs">
            <IconReceipt size={20} />
            Calculadora de Totales
          </Group>
        </Title>
        <Group gap="sm">
          <Badge size="lg" color="blue" variant="light">
            Total: {formatCurrency(calculationResult.total)}
          </Badge>
          {showDetails && (
            <ActionIcon
              variant="subtle"
              onClick={toggleDetails}
              aria-label="Toggle details"
            >
              {detailsOpened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </ActionIcon>
          )}
        </Group>
      </Group>

      <Grid>
        {/* Resumen de totales */}
        <Grid.Col span={12}>
          <Card withBorder>
            <SimpleGrid cols={3}>
              <Box ta="center">
                <Text size="sm" c="dimmed">Tarifa Base</Text>
                <Text size="lg" fw={600}>
                  {formatCurrency(calculationResult.subtotalTarifa)}
                </Text>
              </Box>
              
              <Box ta="center">
                <Text size="sm" c="dimmed">Extras</Text>
                <Text size="lg" fw={600} c="orange">
                  {formatCurrency(calculationResult.subtotalExtras)}
                </Text>
              </Box>
              
              <Box ta="center">
                <Text size="sm" c="dimmed">Total Final</Text>
                <Text size="xl" fw={700} c="green">
                  {formatCurrency(calculationResult.total)}
                </Text>
              </Box>
            </SimpleGrid>
          </Card>
        </Grid.Col>

        {/* Extras disponibles */}
        {!readonly && extrasDisponibles.length > 0 && (
          <Grid.Col span={6}>
            <Card withBorder>
              <Title order={5} mb="md">Extras Disponibles</Title>
              
              <Stack gap="xs">
                {extrasDisponibles.map(extra => (
                  <Group key={extra._id} justify="space-between" p="xs" style={{ border: '1px solid #e9ecef', borderRadius: 4 }}>
                    <Box style={{ flex: 1 }}>
                      <Text size="sm" fw={500}>{extra.descripcion}</Text>
                      <Text size="xs" c="dimmed">
                        {extra.tipo === 'FIJO' ? 'Valor fijo' : `Por ${extra.unidad || 'unidad'}`}: {formatCurrency(extra.valor)}
                      </Text>
                    </Box>
                    
                    <Group gap="xs">
                      {isExtraSelected(extra._id) ? (
                        <>
                          <NumberInput
                            size="xs"
                            w={80}
                            min={extra.tipo === 'FIJO' ? 1 : 0}
                            value={getExtraQuantity(extra._id)}
                            onChange={(value) => handleExtraQuantityChange(extra._id, Number(value) || 0)}
                            hideControls
                          />
                          <ActionIcon
                            size="sm"
                            color="red"
                            variant="light"
                            onClick={() => handleRemoveExtra(extra._id)}
                          >
                            <IconMinus size={12} />
                          </ActionIcon>
                        </>
                      ) : (
                        <ActionIcon
                          size="sm"
                          color="blue"
                          variant="light"
                          onClick={() => handleAddExtra(extra)}
                        >
                          <IconPlus size={12} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Group>
                ))}
              </Stack>
            </Card>
          </Grid.Col>
        )}

        {/* Extras aplicados */}
        <Grid.Col span={readonly ? 12 : 6}>
          <Card withBorder>
            <Title order={5} mb="md">Extras Aplicados</Title>
            
            {calculationResult.extrasAplicados.length > 0 ? (
              <Stack gap="xs">
                {calculationResult.extrasAplicados.map(({ extra, cantidad, subtotal }) => (
                  <Group key={extra._id} justify="space-between" p="xs" bg="gray.0" style={{ borderRadius: 4 }}>
                    <Box>
                      <Text size="sm" fw={500}>{extra.descripcion}</Text>
                      <Text size="xs" c="dimmed">
                        {extra.tipo === 'FIJO' 
                          ? 'Valor fijo' 
                          : `${formatCurrency(extra.valor)} x ${cantidad}`
                        }
                      </Text>
                    </Box>
                    
                    <Text size="sm" fw={600}>
                      {formatCurrency(subtotal)}
                    </Text>
                  </Group>
                ))}
                
                <Divider />
                
                <Group justify="space-between">
                  <Text fw={600}>Subtotal Extras:</Text>
                  <Text fw={600} c="orange">
                    {formatCurrency(calculationResult.subtotalExtras)}
                  </Text>
                </Group>
              </Stack>
            ) : (
              <Alert color="gray" variant="light">
                <Text size="sm">No hay extras aplicados</Text>
              </Alert>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      {/* Desglose detallado */}
      <Collapse in={detailsOpened} mt="md">
        <Card withBorder>
          <Title order={5} mb="md">Desglose Detallado</Title>
          
          <Stack gap="xs">
            {calculationResult.desglose.map((item, index) => (
              <Group key={index} justify="space-between">
                <Group gap="xs">
                  {item.tipo === 'tarifa' ? (
                    <IconTruck size={14} color="blue" />
                  ) : (
                    <IconPlus size={14} color="orange" />
                  )}
                  <Text size="sm">{item.concepto}</Text>
                </Group>
                <Text size="sm" fw={500}>
                  {formatCurrency(item.valor)}
                </Text>
              </Group>
            ))}
            
            <Divider />
            
            <Group justify="space-between">
              <Text fw={700} size="lg">TOTAL FINAL:</Text>
              <Text fw={700} size="lg" c="green">
                {formatCurrency(calculationResult.total)}
              </Text>
            </Group>
          </Stack>
        </Card>
      </Collapse>

      {/* Error state */}
      {!tarifaBase && (
        <Alert color="yellow" mt="md">
          <Text>
            No hay una tarifa base calculada. Complete los datos del tramo para obtener el cálculo.
          </Text>
        </Alert>
      )}
    </Paper>
  );
};