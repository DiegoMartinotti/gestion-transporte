export interface CostItem {
  id: string;
  concepto: string;
  valor: number;
  tipo: 'tarifa' | 'extra' | 'formula' | 'ajuste';
  categoria?: string;
  descripcion?: string;
  formula?: string;
  variables?: Record<string, number>;
  porcentaje?: number;
}

export interface CategorySummary {
  categoria: string;
  total: number;
  items: CostItem[];
  porcentaje: number;
  color: string;
  icon: React.ReactElement;
}

export interface CostBreakdownProps {
  items: CostItem[];
  title?: string;
  showFormulas?: boolean;
  showDistribution?: boolean;
  showTimeline?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  formatCurrency?: (amount: number) => string;
  formatPercentage?: (percentage: number) => string;
}
