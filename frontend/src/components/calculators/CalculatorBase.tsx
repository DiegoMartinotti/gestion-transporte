import React from 'react';
import {
  Paper,
  Title,
  Stack,
  Group,
  Text,
  Badge,
  Button,
  ActionIcon,
  Table,
  Alert,
  LoadingOverlay,
  Card,
  SimpleGrid,
  NumberInput,
  Select,
  TextInput,
  Collapse,
  Box
} from '@mantine/core';
import {
  IconCalculator,
  IconPlus,
  IconTrash,
  IconChevronDown,
  IconChevronUp,
  IconRefresh,
  IconAlertTriangle
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { 
  useCalculatorBase, 
  type CalculationItem, 
  type CalculationConfig,
  type CalculatorBaseState,
  type CalculatorBaseActions
} from '../../hooks/useCalculatorBase';

interface CalculatorBaseProps {
  // Configuración del calculador
  config?: CalculationConfig;
  
  // Personalización visual
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'compact' | 'detailed';
  
  // Funcionalidades habilitadas
  allowAddItems?: boolean;
  allowEditItems?: boolean;
  allowRemoveItems?: boolean;
  showDesglose?: boolean;
  showMetadatos?: boolean;
  
  // Datos iniciales
  initialItems?: CalculationItem[];
  
  // Callbacks
  onResultChange?: (result: any) => void;
  onItemAdd?: (item: CalculationItem) => void;
  onItemEdit?: (item: CalculationItem) => void;
  onItemRemove?: (itemId: string) => void;
  
  // Personalización de tipos
  availableTypes?: Array<{ value: string; label: string }>;
  
  // Estados externos
  readonly?: boolean;
  loading?: boolean;
}

const DEFAULT_TYPES = [
  { value: 'FIJO', label: 'Valor Fijo' },
  { value: 'VARIABLE', label: 'Variable por Cantidad' },
  { value: 'PORCENTAJE', label: 'Porcentaje' }
];

export const CalculatorBase: React.FC<CalculatorBaseProps> = ({
  config = {},
  title = 'Calculadora',
  subtitle,
  variant = 'default',
  allowAddItems = true,
  allowEditItems = true,
  allowRemoveItems = true,
  showDesglose = true,
  showMetadatos = false,
  initialItems = [],
  onResultChange,
  onItemAdd,
  onItemEdit,
  onItemRemove,
  availableTypes = DEFAULT_TYPES,
  readonly = false,
  loading: externalLoading = false
}) => {
  const [state, actions] = useCalculatorBase(config);
  const [desgloseOpened, { toggle: toggleDesglose }] = useDisclosure(true);
  const [addItemOpened, { open: openAddItem, close: closeAddItem }] = useDisclosure(false);
  
  // Estados para el formulario de agregar item
  const [newItem, setNewItem] = React.useState<Partial<CalculationItem>>({
    concepto: '',
    valor: 0,
    tipo: 'FIJO',
    cantidad: 1
  });

  // Inicializar items si se proporcionan
  React.useEffect(() => {
    if (initialItems.length > 0 && state.items.length === 0) {
      actions.setItems(initialItems);
    }
  }, [initialItems, state.items.length, actions]);

  // Notificar cambios en el resultado
  React.useEffect(() => {
    if (onResultChange) {
      onResultChange(state.result);
    }
  }, [state.result, onResultChange]);

  const handleAddItem = () => {
    if (!newItem.concepto || newItem.valor === undefined) return;
    
    const item: Omit<CalculationItem, 'id'> = {
      concepto: newItem.concepto,
      valor: newItem.valor,
      tipo: newItem.tipo || 'FIJO',
      cantidad: newItem.cantidad,
      unidad: newItem.unidad
    };
    
    actions.addItem(item);
    onItemAdd?.(item as CalculationItem);
    
    // Reset form
    setNewItem({
      concepto: '',
      valor: 0,
      tipo: 'FIJO',
      cantidad: 1
    });
    closeAddItem();
  };

  const handleRemoveItem = (id: string) => {
    actions.removeItem(id);
    onItemRemove?.(id);
  };

  const handleEditItem = (id: string, updates: Partial<CalculationItem>) => {
    actions.updateItem(id, updates);
    const updatedItem = state.items.find(item => item.id === id);
    if (updatedItem) {
      onItemEdit?.({ ...updatedItem, ...updates });
    }
  };

  const renderCompactView = () => (
    <Card withBorder>
      <Group justify="space-between" mb="md">
        <Group>
          <IconCalculator size={20} />
          <Text fw={500}>{title}</Text>
        </Group>
        <Badge size="lg" variant="filled" color="blue">
          {actions.formatValue(state.result.total)}
        </Badge>
      </Group>
      
      {state.error && (
        <Alert icon={<IconAlertTriangle size={16} />} color="red">
          {state.error}
        </Alert>
      )}
      
      {!state.isValid && !state.error && (
        <Alert icon={<IconAlertTriangle size={16} />} color="yellow">
          Configuración incompleta
        </Alert>
      )}
    </Card>
  );

  const renderDetailedView = () => (
    <Paper withBorder p="md">
      <LoadingOverlay visible={state.loading || externalLoading} />
      
      {/* Header */}
      <Group justify="space-between" mb="md">
        <Box>
          <Group>
            <IconCalculator size={24} />
            <Title order={3}>{title}</Title>
          </Group>
          {subtitle && (
            <Text size="sm" c="dimmed" mt={4}>{subtitle}</Text>
          )}
        </Box>
        
        <Group>
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={actions.recalculate}
            size="sm"
          >
            Recalcular
          </Button>
        </Group>
      </Group>

      {/* Estado y errores */}
      {state.error && (
        <Alert icon={<IconAlertTriangle size={16} />} color="red" mb="md">
          {state.error}
        </Alert>
      )}
      
      {!state.isValid && !state.error && (
        <Alert icon={<IconAlertTriangle size={16} />} color="yellow" mb="md">
          Configuración incompleta o valores inválidos
        </Alert>
      )}

      {/* Resumen de totales */}
      <SimpleGrid cols={state.result.descuentos || state.result.recargos ? 4 : 2} mb="md">
        <Card withBorder p="sm">
          <Text size="xs" c="dimmed" mb={4}>Subtotal</Text>
          <Text fw={500}>{actions.formatValue(state.result.subtotal)}</Text>
        </Card>
        
        {state.result.recargos && (
          <Card withBorder p="sm">
            <Text size="xs" c="dimmed" mb={4}>Recargos</Text>
            <Text fw={500} c="green">+{actions.formatValue(state.result.recargos)}</Text>
          </Card>
        )}
        
        {state.result.descuentos && (
          <Card withBorder p="sm">
            <Text size="xs" c="dimmed" mb={4}>Descuentos</Text>
            <Text fw={500} c="red">-{actions.formatValue(state.result.descuentos)}</Text>
          </Card>
        )}
        
        <Card withBorder p="sm" bg="blue.0">
          <Text size="xs" c="dimmed" mb={4}>Total</Text>
          <Text fw={700} size="lg" c="blue">{actions.formatValue(state.result.total)}</Text>
        </Card>
      </SimpleGrid>

      {/* Agregar nuevo item */}
      {!readonly && allowAddItems && (
        <Card withBorder mb="md">
          <Group justify="space-between" mb="md">
            <Text fw={500}>Agregar Item</Text>
            <Button
              size="xs"
              leftSection={<IconPlus size={14} />}
              onClick={openAddItem}
            >
              Nuevo Item
            </Button>
          </Group>
          
          <Collapse in={addItemOpened}>
            <Stack gap="sm">
              <TextInput
                label="Concepto"
                value={newItem.concepto || ''}
                onChange={(e) => setNewItem(prev => ({ ...prev, concepto: e.target.value }))}
                placeholder="Descripción del item"
              />
              
              <Group grow>
                <NumberInput
                  label="Valor"
                  value={newItem.valor}
                  onChange={(value) => setNewItem(prev => ({ ...prev, valor: Number(value) || 0 }))}
                  decimalScale={2}
                  fixedDecimalScale
                />
                
                <Select
                  label="Tipo"
                  value={newItem.tipo}
                  onChange={(value) => setNewItem(prev => ({ ...prev, tipo: value as any }))}
                  data={availableTypes}
                />
              </Group>
              
              {newItem.tipo === 'VARIABLE' && (
                <Group grow>
                  <NumberInput
                    label="Cantidad"
                    value={newItem.cantidad}
                    onChange={(value) => setNewItem(prev => ({ ...prev, cantidad: Number(value) || 1 }))}
                    min={0}
                  />
                  
                  <TextInput
                    label="Unidad"
                    value={newItem.unidad || ''}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unidad: e.target.value }))}
                    placeholder="ej: kg, pallet, hora"
                  />
                </Group>
              )}
              
              <Group justify="flex-end">
                <Button variant="light" onClick={closeAddItem} size="sm">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAddItem} 
                  size="sm"
                  disabled={!newItem.concepto || newItem.valor === undefined}
                >
                  Agregar
                </Button>
              </Group>
            </Stack>
          </Collapse>
        </Card>
      )}

      {/* Desglose de items */}
      {showDesglose && state.items.length > 0 && (
        <Card withBorder>
          <Group justify="space-between" mb="md" style={{ cursor: 'pointer' }} onClick={toggleDesglose}>
            <Text fw={500}>Desglose ({state.items.length} items)</Text>
            <ActionIcon variant="light">
              {desgloseOpened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </ActionIcon>
          </Group>
          
          <Collapse in={desgloseOpened}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Concepto</Table.Th>
                  <Table.Th>Tipo</Table.Th>
                  <Table.Th>Valor</Table.Th>
                  <Table.Th>Cantidad</Table.Th>
                  <Table.Th>Total</Table.Th>
                  {!readonly && (allowEditItems || allowRemoveItems) && (
                    <Table.Th>Acciones</Table.Th>
                  )}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {state.result.desglose.map((item) => (
                  <Table.Tr key={item.id}>
                    <Table.Td>
                      <Text size="sm" fw={500}>{item.concepto}</Text>
                      {item.formula && (
                        <Text size="xs" c="dimmed">{item.formula}</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge size="xs" variant="light">
                        {item.tipo || 'FIJO'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {item.tipo === 'PORCENTAJE' ? `${item.valor}%` : actions.formatValue(item.valor)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {item.cantidad || 1} {item.unidad || ''}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {actions.formatValue(item.valor * (item.cantidad || 1))}
                      </Text>
                    </Table.Td>
                    {!readonly && (allowEditItems || allowRemoveItems) && (
                      <Table.Td>
                        <Group gap="xs">
                          {allowRemoveItems && (
                            <ActionIcon
                              size="sm"
                              variant="light"
                              color="red"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          )}
                        </Group>
                      </Table.Td>
                    )}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Collapse>
        </Card>
      )}

      {/* Metadatos */}
      {showMetadatos && state.result.metadatos && (
        <Card withBorder mt="md" bg="gray.0">
          <Text fw={500} mb="sm">Información del Cálculo</Text>
          <Group gap="md">
            {state.result.metadatos.itemCount && (
              <Text size="xs" c="dimmed">Items: {state.result.metadatos.itemCount}</Text>
            )}
            {state.result.metadatos.calculatedAt && (
              <Text size="xs" c="dimmed">
                Calculado: {new Date(state.result.metadatos.calculatedAt).toLocaleString()}
              </Text>
            )}
            {state.result.metadatos.precision && (
              <Text size="xs" c="dimmed">Precisión: {state.result.metadatos.precision} decimales</Text>
            )}
          </Group>
        </Card>
      )}
    </Paper>
  );

  // Seleccionar vista según variant
  switch (variant) {
    case 'compact':
      return renderCompactView();
    case 'detailed':
    case 'default':
    default:
      return renderDetailedView();
  }
};

export default CalculatorBase;