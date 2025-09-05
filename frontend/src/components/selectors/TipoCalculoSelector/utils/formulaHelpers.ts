import type { TipoCalculo, CalculoConfig } from '../constants/tiposCalculo';

export const getFormulaPreview = (tipo: TipoCalculo, parametros?: CalculoConfig['parametros']) => {
  const factor = parametros?.factorMultiplicador || 1;
  const monto = parametros?.montoFijo || 0;
  const formula = parametros?.formula || 'Ingrese una fórmula';

  switch (tipo) {
    case 'peso':
      return `resultado = peso × ${factor}`;
    case 'volumen':
      return `resultado = volumen × ${factor}`;
    case 'distancia':
      return `resultado = distancia × ${factor}`;
    case 'tiempo':
      return `resultado = tiempo × ${factor}`;
    case 'fija':
      return `resultado = ${monto}`;
    case 'formula':
      return formula;
    default:
      return '';
  }
};
