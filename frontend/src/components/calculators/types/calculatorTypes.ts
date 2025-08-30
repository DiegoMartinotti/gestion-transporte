import { CalculationItem } from '../../../hooks/useCalculatorBase';

// Type definitions
export interface CalculatorState {
  items: CalculationItem[];
  result: CalculationResult;
  loading: boolean;
  error: string | null;
  isValid: boolean;
}

export interface CalculatorActions {
  formatValue: (value: number) => string;
  recalculate: () => void;
  addItem: (item: Omit<CalculationItem, 'id'>) => void;
  removeItem: (id: string) => void;
  setItems: (items: CalculationItem[]) => void;
}

export interface CalculationResult {
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
