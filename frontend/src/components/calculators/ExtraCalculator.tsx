import { useState, useEffect } from 'react';
import {
  Stack,
  Group,
  Text,
  Paper,
  Badge,
  Table,
  Divider,
  ActionIcon,
  Tooltip,
  NumberInput,
  Button,
  Alert,
  Box
} from '@mantine/core';
import {
  IconCoin,
  IconCalculator,
  IconPlus,
  IconMinus,
  IconTrash,
  IconRefresh,
  IconInfoCircle
} from '@tabler/icons-react';
import { extraService, type Extra } from '../../services/extraService';

interface ExtraCalculatorItem {
  extra: Extra;
  cantidad: number;
  subtotal: number;
}

interface ExtraCalculatorProps {
  clienteId?: string;
  extrasSeleccionados?: { extraId: string; cantidad: number }[];
  onChange?: (total: number, desglose: ExtraCalculatorItem[]) => void;
  readonly?: boolean;
  showDesglose?: boolean;
  title?: string;
}

export function ExtraCalculator({
  clienteId,
  extrasSeleccionados = [],
  onChange,
  readonly = false,
  showDesglose = true,
  title = "Calculadora de Extras"
}: ExtraCalculatorProps) {
  const [items, setItems] = useState<ExtraCalculatorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (extrasSeleccionados.length > 0) {
      loadExtrasData();
    } else {
      setItems([]);
      notifyChange([], 0);
    }
  }, [extrasSeleccionados]);

  const loadExtrasData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const nuevosItems: ExtraCalculatorItem[] = [];
      
      for (const sel of extrasSeleccionados) {
        try {
          const extra = await extraService.getExtraById(sel.extraId) as Extra;
          nuevosItems.push({
            extra,
            cantidad: sel.cantidad,
            subtotal: extra.valor * sel.cantidad
          });
        } catch (err) {
          console.error(`Error cargando extra ${sel.extraId}:`, err);
          setError(`Error cargando algunos extras`);
        }
      }
      
      setItems(nuevosItems);
      const total = nuevosItems.reduce((sum, item) => sum + item.subtotal, 0);
      notifyChange(nuevosItems, total);
      
    } catch (err) {
      console.error('Error general cargando extras:', err);
      setError('Error cargando datos de extras');
    } finally {
      setLoading(false);
    }
  };

  const updateCantidad = (extraId: string, nuevaCantidad: number) => {
    if (readonly) return;
    
    const nuevosItems = items.map(item => {
      if (item.extra._id === extraId) {
        const cantidad = Math.max(0, nuevaCantidad);
        return {
          ...item,
          cantidad,
          subtotal: item.extra.valor * cantidad
        };
      }
      return item;
    }).filter(item => item.cantidad > 0); // Remover items con cantidad 0
    
    setItems(nuevosItems);
    const total = nuevosItems.reduce((sum, item) => sum + item.subtotal, 0);
    notifyChange(nuevosItems, total);
  };

  const removeItem = (extraId: string) => {
    if (readonly) return;
    
    const nuevosItems = items.filter(item => item.extra._id !== extraId);
    setItems(nuevosItems);
    const total = nuevosItems.reduce((sum, item) => sum + item.subtotal, 0);
    notifyChange(nuevosItems, total);
  };

  const notifyChange = (itemsActualizados: ExtraCalculatorItem[], total: number) => {
    onChange?.(total, itemsActualizados);
  };

  const recalcular = () => {
    loadExtrasData();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value);
  };

  const getVigenciaStatus = (extra: Extra) => {
    const now = new Date();
    const desde = new Date(extra.vigenciaDesde);
    const hasta = new Date(extra.vigenciaHasta);
    
    if (now < desde) return { color: 'blue', text: 'Pendiente' };
    if (now > hasta) return { color: 'red', text: 'Vencido' };
    return { color: 'green', text: 'Vigente' };
  };

  const totalGeneral = items.reduce((sum, item) => sum + item.subtotal, 0);
  const cantidadTotal = items.reduce((sum, item) => sum + item.cantidad, 0);

  if (!clienteId && items.length === 0) {
    return (
      <Paper p="md" withBorder>
        <Group gap="xs">
          <IconInfoCircle size={16} />
          <Text size="sm" c="dimmed">
            Selecciona un cliente y extras para ver los cálculos
          </Text>
        </Group>
      </Paper>
    );
  }

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Group gap="xs">
            <IconCalculator size={20} />
            <Text fw={600}>{title}</Text>
          </Group>
          
          {!readonly && (
            <Group gap="xs">
              <Tooltip label="Recalcular">
                <ActionIcon
                  variant="subtle"
                  onClick={recalcular}
                  loading={loading}
                >
                  <IconRefresh size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          )}
        </Group>

        {/* Error */}
        {error && (
          <Alert color="red" variant="light">
            {error}
          </Alert>
        )}

        {/* Resumen */}
        <Group justify="space-between">
          <Group gap="md">
            <Box>
              <Text size="xs" c="dimmed">Items</Text>
              <Text fw={600}>{items.length}</Text>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Cantidad Total</Text>
              <Text fw={600}>{cantidadTotal}</Text>
            </Box>
          </Group>
          
          <Box ta="right">
            <Text size="xs" c="dimmed">Total Extras</Text>
            <Text size="xl" fw={700} c="blue">
              {formatCurrency(totalGeneral)}
            </Text>
          </Box>
        </Group>

        {/* Desglose detallado */}
        {showDesglose && items.length > 0 && (
          <>
            <Divider />
            
            <Stack gap="sm">
              <Text size="sm" fw={500}>Desglose</Text>
              
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Extra</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th>Valor Unit.</Table.Th>
                    <Table.Th>Cantidad</Table.Th>
                    <Table.Th>Subtotal</Table.Th>
                    {!readonly && <Table.Th>Acciones</Table.Th>}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {items.map((item) => {
                    const vigencia = getVigenciaStatus(item.extra);
                    
                    return (
                      <Table.Tr key={item.extra._id}>
                        <Table.Td>
                          <Box>
                            <Text size="sm" fw={500}>
                              {item.extra.tipo}
                            </Text>
                            {item.extra.descripcion && (
                              <Text size="xs" c="dimmed" lineClamp={1}>
                                {item.extra.descripcion}
                              </Text>
                            )}
                          </Box>
                        </Table.Td>
                        
                        <Table.Td>
                          <Badge 
                            color={vigencia.color} 
                            size="xs" 
                            variant="outline"
                          >
                            {vigencia.text}
                          </Badge>
                        </Table.Td>
                        
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            {formatCurrency(item.extra.valor)}
                          </Text>
                        </Table.Td>
                        
                        <Table.Td>
                          {readonly ? (
                            <Text fw={500}>{item.cantidad}</Text>
                          ) : (
                            <Group gap={0}>
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                onClick={() => updateCantidad(item.extra._id!, item.cantidad - 1)}
                              >
                                <IconMinus size={12} />
                              </ActionIcon>
                              
                              <NumberInput
                                value={item.cantidad}
                                onChange={(val) => updateCantidad(item.extra._id!, Number(val) || 0)}
                                min={0}
                                max={999}
                                w={60}
                                size="xs"
                                styles={{
                                  input: { textAlign: 'center', padding: '0 4px' }
                                }}
                              />
                              
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                onClick={() => updateCantidad(item.extra._id!, item.cantidad + 1)}
                              >
                                <IconPlus size={12} />
                              </ActionIcon>
                            </Group>
                          )}
                        </Table.Td>
                        
                        <Table.Td>
                          <Text fw={600} c="blue">
                            {formatCurrency(item.subtotal)}
                          </Text>
                        </Table.Td>
                        
                        {!readonly && (
                          <Table.Td>
                            <ActionIcon
                              color="red"
                              variant="subtle"
                              onClick={() => removeItem(item.extra._id!)}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Table.Td>
                        )}
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Stack>
          </>
        )}

        {/* Estado vacío */}
        {items.length === 0 && !loading && (
          <Text size="sm" c="dimmed" ta="center" py="md">
            No hay extras seleccionados
          </Text>
        )}
      </Stack>
    </Paper>
  );
}