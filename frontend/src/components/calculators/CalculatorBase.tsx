import React from 'react';
import { Paper, LoadingOverlay } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  useCalculatorBase,
  type CalculationItem,
  type CalculationConfig,
} from '../../hooks/useCalculatorBase';
import {
  type CalculationResult,
  CompactView,
  HeaderSection,
  AlertsSection,
  TotalsSummary,
  AddItemForm,
  ItemsTable,
  MetadataSection,
} from './CalculatorComponents';

interface CalculatorBaseProps {
  config?: CalculationConfig;
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'compact' | 'detailed';
  allowAddItems?: boolean;
  allowEditItems?: boolean;
  allowRemoveItems?: boolean;
  showDesglose?: boolean;
  showMetadatos?: boolean;
  initialItems?: CalculationItem[];
  onResultChange?: (result: CalculationResult) => void;
  onItemAdd?: (item: CalculationItem) => void;
  onItemEdit?: (item: CalculationItem) => void;
  onItemRemove?: (itemId: string) => void;
  availableTypes?: Array<{ value: string; label: string }>;
  readonly?: boolean;
  loading?: boolean;
}

const DEFAULT_TYPES = [
  { value: 'FIJO', label: 'Valor Fijo' },
  { value: 'VARIABLE', label: 'Variable por Cantidad' },
  { value: 'PORCENTAJE', label: 'Porcentaje' },
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
  onItemRemove,
  availableTypes = DEFAULT_TYPES,
  readonly = false,
  loading: externalLoading = false,
}) => {
  const [state, actions] = useCalculatorBase(config);
  const [desgloseOpened, { toggle: toggleDesglose }] = useDisclosure(true);
  const [addItemOpened, { open: openAddItem, close: closeAddItem }] = useDisclosure(false);

  const [newItem, setNewItem] = React.useState<Partial<CalculationItem>>({
    concepto: '',
    valor: 0,
    tipo: 'FIJO',
    cantidad: 1,
  });

  React.useEffect(() => {
    if (initialItems.length > 0 && state.items.length === 0) {
      actions.setItems(initialItems);
    }
  }, [initialItems, state.items.length, actions]);

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
      unidad: newItem.unidad,
    };

    actions.addItem(item);
    onItemAdd?.(item as CalculationItem);

    setNewItem({
      concepto: '',
      valor: 0,
      tipo: 'FIJO',
      cantidad: 1,
    });
    closeAddItem();
  };

  const handleRemoveItem = (id: string) => {
    actions.removeItem(id);
    onItemRemove?.(id);
  };

  if (variant === 'compact') {
    return <CompactView title={title} state={state} actions={actions} />;
  }

  return (
    <Paper withBorder p="md">
      <LoadingOverlay visible={state.loading || externalLoading} />

      <HeaderSection title={title} subtitle={subtitle} actions={actions} />
      <AlertsSection state={state} />
      <TotalsSummary state={state} actions={actions} />

      <AddItemForm
        readonly={readonly}
        allowAddItems={allowAddItems}
        addItemOpened={addItemOpened}
        openAddItem={openAddItem}
        closeAddItem={closeAddItem}
        newItem={newItem}
        setNewItem={setNewItem}
        handleAddItem={handleAddItem}
        availableTypes={availableTypes}
      />

      {showDesglose && (
        <ItemsTable
          state={state}
          actions={actions}
          readonly={readonly}
          allowEditItems={allowEditItems}
          allowRemoveItems={allowRemoveItems}
          desgloseOpened={desgloseOpened}
          toggleDesglose={toggleDesglose}
          handleRemoveItem={handleRemoveItem}
        />
      )}

      {showMetadatos && <MetadataSection state={state} />}
    </Paper>
  );
};

export default CalculatorBase;
