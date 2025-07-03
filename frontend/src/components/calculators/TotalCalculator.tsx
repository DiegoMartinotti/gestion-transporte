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
  Box,
  Tabs
} from '@mantine/core';
import { 
  IconCalculator, 
  IconCurrency, 
  IconChevronDown, 
  IconChevronUp,
  IconPlus,
  IconMinus,
  IconTruck,
  IconReceipt,
  IconList,
  IconRefresh
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { CalculatorBase } from './CalculatorBase';
import { useCalculatorBase, type CalculationItem } from '../../hooks/useCalculatorBase';
import { extraService, type Extra } from '../../services/extraService';

// Tipos actualizados para usar el patrón CalculatorBase
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
  clienteId?: string;
  extrasIniciales?: { extraId: string; cantidad: number }[];
  onTotalChange?: (total: CalculationTotal) => void;
  readonly?: boolean;
  variant?: 'compact' | 'detailed';
  showTarifaBase?: boolean;
  showExtras?: boolean;
}

interface CalculationTotal {
  subtotalTarifa: number;
  subtotalExtras: number;
  total: number;
  extrasAplicados: CalculationItem[];
  desglose: {
    concepto: string;
    valor: number;
    tipo: 'tarifa' | 'extra';
  }[];
}

export const TotalCalculator: React.FC<TotalCalculatorProps> = ({
  tarifaBase,
  clienteId,
  extrasIniciales = [],
  onTotalChange,
  readonly = false,
  variant = 'detailed',
  showTarifaBase = true,
  showExtras = true
}) => {
  // Estados locales
  const [selectedTab, setSelectedTab] = useState('resumen');
  const [extrasDisponibles, setExtrasDisponibles] = useState<Extra[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Usar el hook base para manejar los cálculos de extras
  const [calculatorState, calculatorActions] = useCalculatorBase({
    allowNegative: false,
    autoCalculate: true,
    precision: 2
  });

  // Cargar extras disponibles del cliente
  useEffect(() => {
    if (clienteId) {
      loadExtrasDisponibles();
    }
  }, [clienteId]);

  // Cargar extras iniciales
  useEffect(() => {
    if (extrasIniciales.length > 0) {
      loadExtrasIniciales();
    }
  }, [extrasIniciales]);

  const loadExtrasDisponibles = async () => {
    try {
      setLoading(true);
      setError('');
      const extras = await extraService.getExtras({ cliente: clienteId!, vigente: true });
      setExtrasDisponibles(extras as Extra[]);
    } catch (err) {
      console.error('Error cargando extras:', err);
      setError('Error cargando extras disponibles');
    } finally {
      setLoading(false);
    }
  };

  const loadExtrasIniciales = async () => {
    try {
      for (const { extraId, cantidad } of extrasIniciales) {
        const extra = await extraService.getExtraById(extraId) as Extra;
        calculatorActions.addItem({
          concepto: extra.tipo,
          valor: extra.valor,
          tipo: 'FIJO',
          cantidad
        });
      }
    } catch (err) {
      console.error('Error cargando extras iniciales:', err);
    }
  };

  // Calcular totales de manera reactiva
  const calculationResult = useMemo<CalculationTotal>(() => {
    const subtotalTarifa = tarifaBase?.total || 0;
    const subtotalExtras = calculatorState.result.total;
    const total = subtotalTarifa + subtotalExtras;

    // Crear desglose detallado
    const desglose = [
      ...(tarifaBase?.desglose?.map(item => ({
        concepto: item.concepto,
        valor: item.valor,
        tipo: 'tarifa' as const
      })) || []),
      ...calculatorState.items.map(item => ({
        concepto: `${item.concepto}${item.tipo === 'VARIABLE' ? ` (x${item.cantidad || 1})` : ''}`,
        valor: item.valor * (item.cantidad || 1),
        tipo: 'extra' as const
      }))
    ];

    return {
      subtotalTarifa,
      subtotalExtras,
      total,
      extrasAplicados: calculatorState.items,
      desglose
    };
  }, [tarifaBase, calculatorState]);

  // Notificar cambios al componente padre
  useEffect(() => {
    onTotalChange?.(calculationResult);
  }, [calculationResult, onTotalChange]);

  const handleAddExtra = (extra: Extra) => {
    if (readonly) return;
    
    calculatorActions.addItem({
      concepto: extra.tipo,
      valor: extra.valor,
      tipo: 'FIJO',
      cantidad: 1
    });
  };

  const handleRefreshExtras = () => {
    if (clienteId) {
      loadExtrasDisponibles();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const isExtraSelected = (extraId: string) => {
    return calculatorState.items.some(item => item.id === extraId);
  };

  const getVigenciaStatus = (extra: Extra) => {
    const now = new Date();
    const desde = new Date(extra.vigenciaDesde);
    const hasta = new Date(extra.vigenciaHasta);
    
    if (now < desde) return { color: 'blue', text: 'Pendiente' };
    if (now > hasta) return { color: 'red', text: 'Vencido' };
    return { color: 'green', text: 'Vigente' };
  };

  // Render vista compacta
  if (variant === 'compact') {
    return (
      <Card withBorder p="sm">
        <Group justify="space-between">
          <Group gap="xs">
            <IconReceipt size={18} />
            <Box>
              <Text fw={500} size="sm">Total Calculado</Text>
              <Text size="xs" c="dimmed">
                {calculatorState.items.length} extra{calculatorState.items.length !== 1 ? 's' : ''}
              </Text>
            </Box>
          </Group>
          
          <Badge size="lg" color="green">
            {formatCurrency(calculationResult.total)}
          </Badge>
        </Group>
      </Card>
    );
  }

  // Render vista detallada
  return (
    <Paper p="md" withBorder>
      <Group justify="space-between" mb="md">
        <Title order={4}>
          <Group gap="xs">
            <IconReceipt size={20} />
            Calculadora de Totales
          </Group>
        </Title>
        <Group gap="sm">
          <Badge size="lg" color="green" variant="light">
            Total: {formatCurrency(calculationResult.total)}
          </Badge>
          {!readonly && (
            <ActionIcon
              variant="light"
              onClick={handleRefreshExtras}
              loading={loading}
            >
              <IconRefresh size={16} />
            </ActionIcon>
          )}
        </Group>
      </Group>

      {/* Error handling */}
      {error && (
        <Alert color="red" mb="md">
          {error}
        </Alert>
      )}

      {/* Resumen de totales */}
      <Card withBorder mb="md">
        <SimpleGrid cols={showTarifaBase && showExtras ? 3 : 2}>
          {showTarifaBase && (
            <Box ta="center">
              <Text size="sm" c="dimmed">Tarifa Base</Text>
              <Text size="lg" fw={600}>
                {formatCurrency(calculationResult.subtotalTarifa)}
              </Text>
            </Box>
          )}
          
          {showExtras && (
            <Box ta="center">
              <Text size="sm" c="dimmed">Extras</Text>
              <Text size="lg" fw={600} c="orange">
                {formatCurrency(calculationResult.subtotalExtras)}
              </Text>
            </Box>
          )}
          
          <Box ta="center">
            <Text size="sm" c="dimmed">Total Final</Text>
            <Text size="xl" fw={700} c="green">
              {formatCurrency(calculationResult.total)}
            </Text>
          </Box>
        </SimpleGrid>
      </Card>

      {/* Tabs para organizar el contenido */}
      <Tabs value={selectedTab} onChange={(value) => setSelectedTab(value || 'resumen')}>
        <Tabs.List>
          <Tabs.Tab value="resumen" leftSection={<IconCalculator size={16} />}>
            Resumen
          </Tabs.Tab>
          {showExtras && !readonly && (
            <Tabs.Tab value="extras" leftSection={<IconPlus size={16} />}>
              Extras Disponibles ({extrasDisponibles.length})
            </Tabs.Tab>
          )}
          <Tabs.Tab value="desglose" leftSection={<IconList size={16} />}>
            Desglose
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="resumen" pt="md">
          <Grid>
            {/* Extras aplicados usando CalculatorBase */}
            <Grid.Col span={12}>
              <CalculatorBase
                title="Extras Aplicados"
                initialItems={calculatorState.items}
                readonly={readonly}
                variant="compact"
                allowAddItems={false}
              />
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        {showExtras && !readonly && (
          <Tabs.Panel value="extras" pt="md">
            <Card withBorder>
              <Title order={5} mb="md">Extras Disponibles</Title>
              
              {extrasDisponibles.length > 0 ? (
                <Stack gap="xs">
                  {extrasDisponibles.map(extra => {
                    const vigencia = getVigenciaStatus(extra);
                    
                    return (
                      <Group key={extra._id} justify="space-between" p="xs" style={{ border: '1px solid #e9ecef', borderRadius: 4 }}>
                        <Box style={{ flex: 1 }}>
                          <Group gap="xs">
                            <Text size="sm" fw={500}>{extra.tipo}</Text>
                            <Badge size="xs" color={vigencia.color} variant="outline">
                              {vigencia.text}
                            </Badge>
                          </Group>
                          {extra.descripcion && (
                            <Text size="xs" c="dimmed">{extra.descripcion}</Text>
                          )}
                          <Text size="xs" c="dimmed">
                            Valor: {formatCurrency(extra.valor)}
                          </Text>
                        </Box>
                        
                        <Group gap="xs">
                          {!isExtraSelected(extra._id || '') && (
                            <ActionIcon
                              size="sm"
                              color="blue"
                              variant="light"
                              onClick={() => handleAddExtra(extra)}
                              disabled={vigencia.color === 'red'}
                            >
                              <IconPlus size={12} />
                            </ActionIcon>
                          )}
                        </Group>
                      </Group>
                    );
                  })}
                </Stack>
              ) : (
                <Text size="sm" c="dimmed" ta="center" py="md">
                  {loading ? 'Cargando extras...' : 'No hay extras disponibles'}
                </Text>
              )}
            </Card>
          </Tabs.Panel>
        )}

        <Tabs.Panel value="desglose" pt="md">
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
        </Tabs.Panel>
      </Tabs>

      {/* Error state */}
      {!tarifaBase && showTarifaBase && (
        <Alert color="yellow" mt="md">
          <Text>
            No hay una tarifa base calculada. Complete los datos del tramo para obtener el cálculo.
          </Text>
        </Alert>
      )}
    </Paper>
  );
};