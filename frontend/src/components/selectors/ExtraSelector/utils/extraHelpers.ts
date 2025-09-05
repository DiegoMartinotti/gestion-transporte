import type { Extra } from '../../../../services/extraService';

export interface ExtraSeleccionado {
  extra: Extra;
  cantidad: number;
  subtotal: number;
}

export function createExtraSeleccionado(extra: Extra, cantidad: number): ExtraSeleccionado {
  return { extra, cantidad, subtotal: extra.valor * cantidad };
}

export function mapValueToSeleccionados(
  value: { extraId: string; cantidad: number }[],
  extras: Extra[]
): ExtraSeleccionado[] {
  return value
    .map((item) => {
      const extra = extras.find((e) => e._id === item.extraId);
      return extra ? createExtraSeleccionado(extra, item.cantidad) : null;
    })
    .filter(Boolean) as ExtraSeleccionado[];
}
