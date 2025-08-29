import { useState, useEffect, useCallback } from 'react';
import { extraService, type Extra } from '../services/extraService';

interface ExtraCalculatorItem {
  extra: Extra;
  cantidad: number;
  subtotal: number;
}

interface UseExtraCalculatorProps {
  extrasSeleccionados: { extraId: string; cantidad: number }[];
  onChange?: (total: number, desglose: ExtraCalculatorItem[]) => void;
  readonly?: boolean;
}

export function useExtraCalculator({ 
  extrasSeleccionados, 
  onChange, 
  readonly = false 
}: UseExtraCalculatorProps) {
  const [items, setItems] = useState<ExtraCalculatorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const notifyChange = useCallback((itemsActualizados: ExtraCalculatorItem[], total: number) => {
    onChange?.(total, itemsActualizados);
  }, [onChange]);

  const loadExtrasData = useCallback(async () => {
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
  }, [extrasSeleccionados, notifyChange]);

  useEffect(() => {
    if (extrasSeleccionados.length > 0) {
      loadExtrasData();
    } else {
      setItems([]);
      notifyChange([], 0);
    }
  }, [extrasSeleccionados, loadExtrasData, notifyChange]);

  const updateCantidad = useCallback((extraId: string, nuevaCantidad: number) => {
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
    }).filter(item => item.cantidad > 0);
    
    setItems(nuevosItems);
    const total = nuevosItems.reduce((sum, item) => sum + item.subtotal, 0);
    notifyChange(nuevosItems, total);
  }, [readonly, items, notifyChange]);

  const removeItem = useCallback((extraId: string) => {
    if (readonly) return;
    
    const nuevosItems = items.filter(item => item.extra._id !== extraId);
    setItems(nuevosItems);
    const total = nuevosItems.reduce((sum, item) => sum + item.subtotal, 0);
    notifyChange(nuevosItems, total);
  }, [readonly, items, notifyChange]);

  const recalcular = useCallback(() => {
    loadExtrasData();
  }, [loadExtrasData]);

  const totalGeneral = items.reduce((sum, item) => sum + item.subtotal, 0);
  const cantidadTotal = items.reduce((sum, item) => sum + item.cantidad, 0);

  return {
    items,
    loading,
    error,
    totalGeneral,
    cantidadTotal,
    updateCantidad,
    removeItem,
    recalcular
  };
}