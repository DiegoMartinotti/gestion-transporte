import { useState, useEffect, useCallback } from 'react';
import { useCalculatorBase, type CalculatorBaseActions } from '../../../hooks/useCalculatorBase';
import { extraService, type Extra } from '../../../services/extraService';

// Función auxiliar para cargar extras iniciales
const loadExtrasInicialesHelper = async (
  extrasIniciales: ExtrasIniciales[],
  calculatorActions: CalculatorBaseActions
) => {
  if (extrasIniciales.length === 0) return;

  try {
    const extrasData = await Promise.all(
      extrasIniciales.map(async (extraInicial) => {
        const extra = await extraService.getExtraById(extraInicial.extraId);
        return {
          id: extra._id || '',
          concepto: extra.tipo,
          valor: extraInicial.valor || extra.valor,
          cantidad: extraInicial.cantidad || 1,
          categoria: 'extra' as const,
        };
      })
    );

    calculatorActions.setItems(extrasData);
  } catch (err) {
    console.error('Error cargando extras iniciales:', err);
    throw new Error('Error al cargar extras iniciales');
  }
};

interface ExtrasIniciales {
  extraId: string;
  cantidad?: number;
  valor?: number;
}

export interface UseTotalCalculatorProps {
  clienteId?: string;
  extrasIniciales?: ExtrasIniciales[];
  onTotalChange?: (total: number) => void;
}

export const useTotalCalculator = ({
  clienteId,
  extrasIniciales = [],
  onTotalChange,
}: UseTotalCalculatorProps) => {
  // Estados locales
  const [selectedTab, setSelectedTab] = useState('resumen');
  const [extrasDisponibles, setExtrasDisponibles] = useState<Extra[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Usar el hook base para manejar los cálculos de extras
  const [calculatorState, calculatorActions] = useCalculatorBase({
    allowNegative: false,
    autoCalculate: true,
    precision: 2,
  });

  // Cargar extras disponibles del cliente
  const loadExtrasDisponibles = useCallback(async () => {
    if (!clienteId) return;

    setLoading(true);
    setError('');
    try {
      const response = await extraService.getExtrasVigentesByCliente(clienteId);
      setExtrasDisponibles(response.data);
    } catch (err) {
      setError('Error al cargar extras disponibles');
      console.error('Error cargando extras:', err);
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  // Cargar extras iniciales
  const loadExtrasIniciales = useCallback(async () => {
    try {
      await loadExtrasInicialesHelper(extrasIniciales, calculatorActions);
    } catch (err) {
      setError('Error al cargar extras iniciales');
    }
  }, [extrasIniciales, calculatorActions]);

  // Calcular total general
  const calcularTotalGeneral = useCallback(
    (tarifaBase = 0) => {
      const totalExtras = calculatorState.items.reduce((sum, item) => sum + (item.total || 0), 0);
      const total = tarifaBase + totalExtras;

      onTotalChange?.(total);
      return total;
    },
    [calculatorState.items, onTotalChange]
  );

  // Agregar extra
  const agregarExtra = useCallback(
    (extraId: string) => {
      const extra = extrasDisponibles.find((e) => e._id === extraId);
      if (!extra) return;

      const nuevoItem = {
        id: extra._id || '',
        concepto: extra.tipo,
        valor: extra.valor,
        cantidad: 1,
        categoria: 'extra' as const,
      };

      calculatorActions.addItem(nuevoItem);
    },
    [extrasDisponibles, calculatorActions]
  );

  // Efectos
  useEffect(() => {
    if (clienteId) {
      loadExtrasDisponibles();
    }
  }, [clienteId, loadExtrasDisponibles]);

  useEffect(() => {
    if (extrasIniciales.length > 0) {
      loadExtrasIniciales();
    }
  }, [extrasIniciales.length, loadExtrasIniciales]);

  // Crear wrapper para setSelectedTab que maneje null
  const handleSetSelectedTab = useCallback((value: string | null) => {
    if (value !== null) {
      setSelectedTab(value);
    }
  }, []);

  return {
    // Estados
    selectedTab,
    extrasDisponibles,
    loading,
    error,
    calculatorState,

    // Acciones
    setSelectedTab: handleSetSelectedTab,
    calculatorActions,
    calcularTotalGeneral,
    agregarExtra,
    loadExtrasDisponibles,
    loadExtrasIniciales,
  };
};
