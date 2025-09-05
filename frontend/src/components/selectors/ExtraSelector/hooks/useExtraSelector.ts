import { useState, useEffect, useCallback } from 'react';
import { extraService, type Extra } from '../../../../services/extraService';
import { mapValueToSeleccionados, type ExtraSeleccionado } from '../utils/extraHelpers';
import { useExtraSelectorHandlers } from './useExtraSelectorHandlers';

interface ExtraSelectorProps {
  clienteId?: string;
  value?: { extraId: string; cantidad: number }[];
  onChange?: (extras: { extraId: string; cantidad: number }[]) => void;
  soloVigentes?: boolean;
}

export function useExtraSelector({
  clienteId,
  value = [],
  onChange,
  soloVigentes = true,
}: ExtraSelectorProps) {
  const [extras, setExtras] = useState<Extra[]>([]);
  const [loading, setLoading] = useState(false);
  const [extrasSeleccionados, setExtrasSeleccionados] = useState<ExtraSeleccionado[]>([]);

  const loadExtras = useCallback(async () => {
    if (!clienteId) return;

    try {
      setLoading(true);
      const params: Record<string, unknown> = { cliente: clienteId };
      if (soloVigentes) params.vigente = true;

      const data = (await extraService.getExtras(params)) as { data?: Extra[] } | Extra[];
      setExtras(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Error cargando extras:', error);
      setExtras([]);
    } finally {
      setLoading(false);
    }
  }, [clienteId, soloVigentes]);

  useEffect(() => {
    if (clienteId) {
      loadExtras();
    } else {
      setExtras([]);
      setExtrasSeleccionados([]);
    }
  }, [clienteId, soloVigentes, loadExtras]);

  const syncSelectedExtras = useCallback(() => {
    if (value && extras.length > 0) {
      const nuevosSeleccionados = mapValueToSeleccionados(value, extras);
      setExtrasSeleccionados(nuevosSeleccionados);
    }
  }, [value, extras]);

  useEffect(() => {
    syncSelectedExtras();
  }, [syncSelectedExtras]);

  const notifyChange = useCallback(
    (seleccionados: ExtraSeleccionado[]) => {
      const result = seleccionados.map((sel) => ({
        extraId: sel.extra._id || '',
        cantidad: sel.cantidad,
      }));
      onChange?.(result);
    },
    [onChange]
  );

  const handlers = useExtraSelectorHandlers({
    extras,
    extrasSeleccionados,
    setExtrasSeleccionados,
    notifyChange,
  });

  const totalGeneral = extrasSeleccionados.reduce((sum, sel) => sum + sel.subtotal, 0);
  const selectedIds = extrasSeleccionados.map((sel) => sel.extra._id || '').filter(Boolean);

  return {
    extras,
    loading,
    extrasSeleccionados,
    totalGeneral,
    selectedIds,
    ...handlers,
  };
}
