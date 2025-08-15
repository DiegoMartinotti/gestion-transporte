import { type CalculationItem, type CalculationConfig } from '../../hooks/useCalculatorBase';

// Type definitions
interface CalculatorState {
  items: CalculationItem[];
  result: CalculationResult;
  loading: boolean;
  error: string | null;
  isValid: boolean;
}

interface CalculatorActions {
  formatValue: (value: number) => string;
  recalculate: () => void;
  addItem: (item: Omit<CalculationItem, 'id'>) => void;
  removeItem: (id: string) => void;
  setItems: (items: CalculationItem[]) => void;
}

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
  onResultChange?: (result: CalculationResult) => void;
  onItemAdd?: (item: CalculationItem) => void;
  onItemEdit?: (item: CalculationItem) => void;
  onItemRemove?: (itemId: string) => void;

  // Personalización de tipos
  availableTypes?: Array<{ value: string; label: string }>;

  // Estados externos
  readonly?: boolean;
  loading?: boolean;
}

interface CalculationResult {
  total: number;
  subtotal: number;
  recargos?: number;
  descuentos?: number;
  desglose: CalculationItem[];
  metadatos?: {
    itemCount?: number;
    calculatedAt?: string;
    precision?: number;
  };
}

export type { CalculatorState, CalculatorActions, CalculatorBaseProps, CalculationResult };
