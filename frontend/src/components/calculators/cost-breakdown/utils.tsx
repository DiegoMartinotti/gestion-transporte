import React from 'react';
import {
  IconCoin,
  IconGasStation,
  IconRoad,
  IconClock,
  IconTruck,
  IconPercentage,
  IconPlus,
  IconMath,
} from '@tabler/icons-react';
import { CostItem, CategorySummary } from './types';

const CATEGORY_ICONS = {
  'Tarifa Base': <IconTruck size={14} />,
  Combustible: <IconGasStation size={14} />,
  Peajes: <IconRoad size={14} />,
  'Tiempo Extra': <IconClock size={14} />,
  Recargo: <IconPlus size={14} />,
  Ajuste: <IconPercentage size={14} />,
  Formula: <IconMath size={14} />,
  Otros: <IconCoin size={14} />,
};

const CATEGORY_COLORS = ['blue', 'green', 'orange', 'red', 'violet', 'teal', 'pink', 'indigo'];

export const categorizeItems = (items: CostItem[]): CategorySummary[] => {
  const grouped = items.reduce(
    (acc, item) => {
      const category = item.categoria || 'Otros';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, CostItem[]>
  );

  const total = items.reduce((sum, item) => sum + item.valor, 0);

  return Object.entries(grouped).map(([categoria, categoryItems], index) => {
    const categoryTotal = categoryItems.reduce((sum, item) => sum + item.valor, 0);
    return {
      categoria,
      total: categoryTotal,
      items: categoryItems,
      porcentaje: total > 0 ? (categoryTotal / total) * 100 : 0,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      icon: CATEGORY_ICONS[categoria as keyof typeof CATEGORY_ICONS] || CATEGORY_ICONS.Otros,
    };
  });
};

export const defaultFormatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const defaultFormatPercentage = (percentage: number): string => {
  return percentage.toFixed(1) + '%';
};
