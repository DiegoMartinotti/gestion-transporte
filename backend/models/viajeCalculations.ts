import type { HydratedDocument } from 'mongoose';
import logger from '../utils/logger';
import { calcularTarifaPaletConFormula } from '../utils/formulaParser';
import type { IExtra } from './Extra';
import type { ISite } from './Site';
import type { IVehiculo } from './Vehiculo';
import type { IViaje, ClienteFormulaConfig, TarifaVigente } from './viaje.types';

export interface TarifaBaseParams {
  clienteDoc: ClienteFormulaConfig;
  metodoCalculo: TarifaVigente['metodoCalculo'];
  valor: number;
  numPalets: number;
  peaje: number;
  tipoUnidad: 'Sider' | 'Bitren';
  tramoDistancia?: number;
}

export const UNKNOWN_SITE_LABEL = 'ID desconocido';

export const calcularTarifaBase = ({
  clienteDoc,
  metodoCalculo,
  valor,
  numPalets,
  peaje,
  tipoUnidad,
  tramoDistancia,
}: TarifaBaseParams): number => {
  switch (metodoCalculo) {
    case 'Palet':
      return calcularTarifaPalet({ clienteDoc, valor, peaje, numPalets, tipoUnidad });
    case 'Kilometro':
      return calcularTarifaKilometro(valor, tramoDistancia);
    case 'Fijo':
      return calcularTarifaFija(valor);
    default:
      throw new Error(`Método de cálculo no válido: ${metodoCalculo}`);
  }
};

interface TarifaPaletParams {
  clienteDoc: ClienteFormulaConfig;
  valor: number;
  peaje: number;
  numPalets: number;
  tipoUnidad: 'Sider' | 'Bitren';
}

const calcularTarifaPalet = ({
  clienteDoc,
  valor,
  peaje,
  numPalets,
  tipoUnidad,
}: TarifaPaletParams): number => {
  const formulaKey: keyof ClienteFormulaConfig =
    tipoUnidad === 'Bitren' ? 'formulaPaletBitren' : 'formulaPaletSider';
  const formulaPersonalizada = clienteDoc[formulaKey];

  if (!formulaPersonalizada) {
    return assertNumber(valor, 'Valor de tarifa inválido para cálculo Palet.') * numPalets;
  }

  logger.info(
    `Usando fórmula personalizada para ${clienteDoc.Cliente ?? clienteDoc.nombre} (${tipoUnidad}): ${formulaPersonalizada}`
  );
  const valorTarifaParaFormula = assertNumber(
    valor,
    'Valor de tarifa inválido para fórmula Palet.'
  );
  const resultado = calcularTarifaPaletConFormula(
    valorTarifaParaFormula,
    peaje,
    numPalets,
    formulaPersonalizada
  );
  return resultado.tarifaBase;
};

const calcularTarifaKilometro = (valor: number, tramoDistancia?: number): number => {
  if (!tramoDistancia || tramoDistancia <= 0) {
    logger.warn('[TARIFA] El tramo no tiene distancia válida para cálculo por Km.', {
      tramoDistancia,
    });
    return 0;
  }
  const valorTarifa = assertNumber(valor, 'Valor de tarifa inválido para cálculo Km.');
  return valorTarifa * tramoDistancia;
};

const calcularTarifaFija = (valor: number): number => {
  return assertNumber(valor, 'Valor de tarifa inválido para cálculo Fijo.');
};

export const calcularTotalExtras = async (viajeDoc: HydratedDocument<IViaje>): Promise<number> => {
  if (!Array.isArray(viajeDoc.extras) || viajeDoc.extras.length === 0) {
    return 0;
  }

  if (!extrasEstanPoblados(viajeDoc)) {
    logger.warn(
      `Extras no poblados al calcular total del viaje, intentando poblar: ${viajeDoc._id}`
    );
    await viajeDoc.populate('extras.extra');
  }

  if (!extrasEstanPoblados(viajeDoc)) {
    logger.error(`Fallo al poblar extras para calcular total del viaje: ${viajeDoc._id}`);
    return 0;
  }

  return viajeDoc.extras.reduce((sum, extraItem) => {
    const extraDetalle = extraItem?.extra;
    const valorExtra = isExtraDoc(extraDetalle) ? Number(extraDetalle.valor) : 0;
    const cantidadExtra = Number(extraItem?.cantidad);
    if (!Number.isNaN(valorExtra) && !Number.isNaN(cantidadExtra)) {
      return sum + valorExtra * cantidadExtra;
    }
    logger.warn('Item extra inválido o no poblado encontrado:', extraItem);
    return sum;
  }, 0);
};

const extrasEstanPoblados = (viajeDoc: HydratedDocument<IViaje>): boolean => {
  const primerExtra = viajeDoc.extras?.[0]?.extra;
  return Boolean(viajeDoc.populated('extras.extra') || isExtraDoc(primerExtra));
};

export const assertNumber = (value: number, errorMessage: string): number => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(errorMessage);
  }
  return parsed;
};

export const isVehiculoDoc = (value: unknown): value is Pick<IVehiculo, 'tipo'> => {
  return typeof value === 'object' && value !== null && 'tipo' in value;
};

export const isSiteDoc = (value: unknown): value is Pick<ISite, 'nombre'> => {
  return typeof value === 'object' && value !== null && 'nombre' in value;
};

export const isExtraDoc = (value: unknown): value is Pick<IExtra, 'valor'> => {
  return typeof value === 'object' && value !== null && 'valor' in value;
};
