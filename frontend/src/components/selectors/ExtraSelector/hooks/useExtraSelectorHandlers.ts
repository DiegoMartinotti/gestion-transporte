import { useCallback } from 'react';
import type { Extra } from '../../../../services/extraService';
import { createExtraSeleccionado, type ExtraSeleccionado } from '../utils/extraHelpers';

interface UseExtraSelectorHandlersParams {
  extras: Extra[];
  extrasSeleccionados: ExtraSeleccionado[];
  setExtrasSeleccionados: React.Dispatch<React.SetStateAction<ExtraSeleccionado[]>>;
  notifyChange: (seleccionados: ExtraSeleccionado[]) => void;
}

export function useExtraSelectorHandlers({
  extras,
  extrasSeleccionados,
  setExtrasSeleccionados,
  notifyChange,
}: UseExtraSelectorHandlersParams) {
  const handleExtraSelect = useCallback(
    (extraIds: string[]) => {
      const nuevosSeleccionados: ExtraSeleccionado[] = extraIds
        .map((id) => {
          const existente = extrasSeleccionados.find((sel) => sel.extra._id === id);
          if (existente) return existente;

          const extra = extras.find((e) => e._id === id);
          return extra ? createExtraSeleccionado(extra, 1) : null;
        })
        .filter(Boolean) as ExtraSeleccionado[];

      setExtrasSeleccionados(nuevosSeleccionados);
      notifyChange(nuevosSeleccionados);
    },
    [extrasSeleccionados, extras, setExtrasSeleccionados, notifyChange]
  );

  const updateCantidad = useCallback(
    (extraId: string, cantidad: number) => {
      if (cantidad <= 0) {
        const nuevosSeleccionados = extrasSeleccionados.filter((sel) => sel.extra._id !== extraId);
        setExtrasSeleccionados(nuevosSeleccionados);
        notifyChange(nuevosSeleccionados);
        return;
      }

      const nuevosSeleccionados = extrasSeleccionados.map((sel) => {
        if (sel.extra._id === extraId) {
          return { ...sel, cantidad, subtotal: sel.extra.valor * cantidad };
        }
        return sel;
      });

      setExtrasSeleccionados(nuevosSeleccionados);
      notifyChange(nuevosSeleccionados);
    },
    [extrasSeleccionados, setExtrasSeleccionados, notifyChange]
  );

  const removeExtra = useCallback(
    (extraId: string) => {
      const nuevosSeleccionados = extrasSeleccionados.filter((sel) => sel.extra._id !== extraId);
      setExtrasSeleccionados(nuevosSeleccionados);
      notifyChange(nuevosSeleccionados);
    },
    [extrasSeleccionados, setExtrasSeleccionados, notifyChange]
  );

  return { handleExtraSelect, updateCantidad, removeExtra };
}
