import mongoose, { HydratedDocument, Schema, Types } from 'mongoose';
import Tramo, { type ITramo, type ITarifaHistorica } from './Tramo';
import Cliente, { type ICliente } from './Cliente';
import Site, { type ISite } from './Site';
import Vehiculo, { type IVehiculo } from './Vehiculo';
import logger from '../utils/logger';
import { actualizarEstadoPartida } from '../utils/estadoPartida';
import type {
  IViaje,
  ITempTariffInfo,
  TarifaVigente,
  ClienteFormulaConfig,
  IVehiculoViaje,
} from './viaje.types';
import {
  calcularTarifaBase,
  calcularTotalExtras,
  isSiteDoc,
  isVehiculoDoc,
  UNKNOWN_SITE_LABEL,
} from './viajeCalculations';

const VEHICULO_PRINCIPAL_NO_ENCONTRADO = 'Vehículo principal no encontrado';
const TARIFA_INCOMPLETA_ERROR =
  'Datos incompletos en la tarifa vigente seleccionada para calcular la tarifa base.';
const TARIFA_VALIDATION_ERROR =
  'La tarifa y el peaje calculados deben ser números mayores o iguales a 0';

type TramoLookup = HydratedDocument<ITramo> | null;

interface TarifaContext {
  tarifaVigente: TarifaVigente;
  tramoDistancia?: number;
  tramoId?: Types.ObjectId;
}

export const attachViajeHooks = (schema: Schema<IViaje>): void => {
  schema.pre('save', preSaveViaje);
  schema.post('save', postSaveViaje);
};

export const getSiteName = (site: Types.ObjectId | ISite): string => {
  return isSiteDoc(site) ? (site.nombre ?? UNKNOWN_SITE_LABEL) : UNKNOWN_SITE_LABEL;
};

const preSaveViaje = async function (this: IViaje, next: (err?: Error) => void): Promise<void> {
  const viajeDoc = this as HydratedDocument<IViaje>;
  const tempTariffInfo = viajeDoc._tempTariffInfo;

  try {
    validateVehiculos(viajeDoc.vehiculos);
    await updateTipoUnidadIfNeeded(viajeDoc);

    if (shouldRecalculateTarifa(viajeDoc, tempTariffInfo)) {
      const clienteDoc = await loadCliente(viajeDoc.cliente);
      const tarifaContext = await resolveTarifaContext(viajeDoc, clienteDoc, tempTariffInfo);
      applyTarifa(viajeDoc, clienteDoc, tarifaContext);
      cleanupTempTariffInfo(viajeDoc);
    }

    const totalExtras = await calcularTotalExtras(viajeDoc);
    viajeDoc.total = Math.round((viajeDoc.tarifa + totalExtras) * 100) / 100;
    if (Number.isNaN(viajeDoc.total)) {
      logger.error('Error: Total calculado final es NaN', { tarifa: viajeDoc.tarifa, totalExtras });
      throw new Error('El total calculado para el viaje es inválido (NaN)');
    }

    logger.debug(
      `Viaje ${viajeDoc.dt} pre-save completo. Tarifa: ${viajeDoc.tarifa}, Peaje: ${viajeDoc.peaje}, Total: ${viajeDoc.total}`
    );
    next();
  } catch (error) {
    const handledError = ensureError(error);
    cleanupTempTariffInfo(viajeDoc);
    logger.error("Error en hook pre('save') de Viaje:", handledError);
    next(handledError);
  }
};

const postSaveViaje = async (doc: HydratedDocument<IViaje>): Promise<void> => {
  try {
    if (doc.isModified('total')) {
      await actualizarEstadoPartida((doc._id as mongoose.Types.ObjectId).toString());
    }
  } catch (error) {
    logger.error('Error actualizando estado de partida:', ensureError(error));
  }
};

const validateVehiculos = (vehiculos: IVehiculoViaje[]): void => {
  if (!Array.isArray(vehiculos) || vehiculos.length === 0) {
    throw new Error(
      'Debe asignarse al menos un vehículo al viaje y las posiciones deben ser únicas'
    );
  }
  const posiciones = vehiculos.map((v) => v.posicion);
  if (new Set(posiciones).size !== posiciones.length) {
    throw new Error('Las posiciones de los vehículos asignados al viaje deben ser únicas');
  }
};

const updateTipoUnidadIfNeeded = async (viajeDoc: HydratedDocument<IViaje>): Promise<void> => {
  if (!viajeDoc.isNew && !viajeDoc.isModified('vehiculos')) {
    return;
  }

  const vehiculoRef = viajeDoc.vehiculos?.[0]?.vehiculo;
  if (!vehiculoRef) {
    logger.warn(
      `Viaje ${viajeDoc.dt} no tiene vehículos asignados, tipoUnidad permanecerá como ${viajeDoc.tipoUnidad}`
    );
    return;
  }

  const vehiculoPrincipal = isVehiculoDoc(vehiculoRef)
    ? vehiculoRef
    : await Vehiculo.findById(vehiculoRef).lean<Pick<IVehiculo, 'tipo'>>();

  if (!vehiculoPrincipal) {
    throw new Error(VEHICULO_PRINCIPAL_NO_ENCONTRADO);
  }

  viajeDoc.tipoUnidad = vehiculoPrincipal.tipo === 'Bitren' ? 'Bitren' : 'Sider';
  logger.debug(`Tipo Unidad actualizado a: ${viajeDoc.tipoUnidad} para viaje ${viajeDoc.dt}`);
};

const shouldRecalculateTarifa = (
  viajeDoc: HydratedDocument<IViaje>,
  tempTariffInfo?: ITempTariffInfo
): boolean => {
  return (
    viajeDoc.isNew ||
    Boolean(tempTariffInfo) ||
    viajeDoc.isModified('origen') ||
    viajeDoc.isModified('destino') ||
    viajeDoc.isModified('tipoTramo') ||
    viajeDoc.isModified('tipoUnidad') ||
    viajeDoc.isModified('paletas')
  );
};

const loadCliente = async (
  clienteId: IViaje['cliente']
): Promise<ICliente & ClienteFormulaConfig> => {
  const clienteDoc = await Cliente.findById(clienteId).lean<
    (ICliente & ClienteFormulaConfig) | null
  >();
  if (!clienteDoc) {
    throw new Error('Cliente no encontrado para cálculo de tarifa');
  }
  return clienteDoc;
};

const resolveTarifaContext = async (
  viajeDoc: HydratedDocument<IViaje>,
  clienteDoc: ICliente & ClienteFormulaConfig,
  tempTariffInfo?: ITempTariffInfo
): Promise<TarifaContext> => {
  if (tempTariffInfo) {
    return resolveTarifaDesdeImport(viajeDoc, tempTariffInfo);
  }
  return resolveTarifaDesdeTramo(viajeDoc, clienteDoc);
};

const resolveTarifaDesdeImport = async (
  viajeDoc: HydratedDocument<IViaje>,
  tempTariffInfo: ITempTariffInfo
): Promise<TarifaContext> => {
  const context: TarifaContext = {
    tarifaVigente: tempTariffInfo,
    tramoDistancia: tempTariffInfo.distanciaTramo,
    tramoId: tempTariffInfo.tramoId,
  };

  viajeDoc.peaje = Number(tempTariffInfo.valorPeaje) || 0;

  if (tempTariffInfo.metodoCalculo !== 'Kilometro') {
    return context;
  }

  if (context.tramoDistancia && context.tramoDistancia > 0) {
    return context;
  }

  if (!context.tramoId) {
    throw new Error('No se proporcionó tramoId para cálculo Kilómetro en importación masiva.');
  }

  const tramo = await Tramo.findById(context.tramoId).lean<Pick<
    ITramo,
    '_id' | 'distancia'
  > | null>();
  if (!tramo || !tramo.distancia || tramo.distancia <= 0) {
    throw new Error(
      `No se pudo obtener una distancia válida para el tramo ID ${context.tramoId} para cálculo por Km.`
    );
  }
  context.tramoDistancia = tramo.distancia;
  return context;
};

const resolveTarifaDesdeTramo = async (
  viajeDoc: HydratedDocument<IViaje>,
  clienteDoc: ICliente & ClienteFormulaConfig
): Promise<TarifaContext> => {
  const tramo = await findTramoForViaje(viajeDoc);
  if (!tramo) {
    const { origenNombre, destinoNombre } = await resolveTramoSiteNames(viajeDoc);
    throw new Error(
      `No se encontró un tramo válido para Cliente ${clienteDoc.nombre} (${viajeDoc.cliente}) desde ${origenNombre} hasta ${destinoNombre} para la fecha ${
        viajeDoc.fecha.toISOString().split('T')[0]
      }`
    );
  }

  const tarifaVigente = getTarifaVigente(tramo, viajeDoc);
  if (!tarifaVigente) {
    const { origenNombre, destinoNombre } = await resolveTramoSiteNames(viajeDoc);
    const clienteNombre = clienteDoc.Cliente ?? clienteDoc.nombre;
    throw new Error(
      `No se encontró una tarifa (${viajeDoc.tipoTramo}) vigente para tramo ${origenNombre} → ${destinoNombre} (Cliente: ${clienteNombre}) en fecha ${
        viajeDoc.fecha.toISOString().split('T')[0]
      }`
    );
  }

  viajeDoc.peaje = Number(tarifaVigente.valorPeaje) || 0;
  return {
    tarifaVigente,
    tramoDistancia: tramo.distancia,
    tramoId: tramo._id as Types.ObjectId,
  };
};

const findTramoForViaje = async (viajeDoc: HydratedDocument<IViaje>): Promise<TramoLookup> => {
  return Tramo.findOne({
    cliente: viajeDoc.cliente,
    origen: viajeDoc.origen,
    destino: viajeDoc.destino,
  }).populate('tarifasHistoricas');
};

const resolveTramoSiteNames = async (
  viajeDoc: HydratedDocument<IViaje>
): Promise<{ origenNombre: string; destinoNombre: string }> => {
  const origenDoc = isSiteDoc(viajeDoc.origen)
    ? viajeDoc.origen
    : await Site.findById(viajeDoc.origen).lean<ISite | null>();
  const destinoDoc = isSiteDoc(viajeDoc.destino)
    ? viajeDoc.destino
    : await Site.findById(viajeDoc.destino).lean<ISite | null>();
  return {
    origenNombre: origenDoc?.nombre ?? UNKNOWN_SITE_LABEL,
    destinoNombre: destinoDoc?.nombre ?? UNKNOWN_SITE_LABEL,
  };
};

const getTarifaVigente = (
  tramo: HydratedDocument<ITramo>,
  viajeDoc: HydratedDocument<IViaje>
): ITarifaHistorica | undefined => {
  try {
    return tramo.getTarifaVigente(viajeDoc.fecha, viajeDoc.tipoTramo);
  } catch (error) {
    const handledError = ensureError(error);
    logger.error(
      `Error en tramo.getTarifaVigente para tramo ${tramo._id}: ${handledError.message}`
    );
    throw new Error(`Error buscando tarifa vigente: ${handledError.message}`);
  }
};

const applyTarifa = (
  viajeDoc: HydratedDocument<IViaje>,
  clienteDoc: ICliente & ClienteFormulaConfig,
  context: TarifaContext
): void => {
  const { tarifaVigente, tramoDistancia } = context;

  if (
    !tarifaVigente ||
    typeof tarifaVigente.metodoCalculo === 'undefined' ||
    typeof tarifaVigente.valor === 'undefined'
  ) {
    throw new Error(TARIFA_INCOMPLETA_ERROR);
  }

  const numPalets = Number(viajeDoc.paletas) || 0;
  const tarifaBase = calcularTarifaBase({
    clienteDoc,
    metodoCalculo: tarifaVigente.metodoCalculo,
    valor: tarifaVigente.valor,
    numPalets,
    peaje: viajeDoc.peaje,
    tipoUnidad: viajeDoc.tipoUnidad,
    tramoDistancia,
  });

  viajeDoc.tarifa = Math.round(tarifaBase * 100) / 100;

  if (
    Number.isNaN(viajeDoc.tarifa) ||
    viajeDoc.tarifa < 0 ||
    Number.isNaN(viajeDoc.peaje) ||
    viajeDoc.peaje < 0
  ) {
    logger.error('Error de validación Post-Cálculo - Tarifa o Peaje inválido:', {
      tarifa: viajeDoc.tarifa,
      peaje: viajeDoc.peaje,
    });
    throw new Error(TARIFA_VALIDATION_ERROR);
  }
};

const cleanupTempTariffInfo = (viajeDoc: HydratedDocument<IViaje>): void => {
  if (viajeDoc._tempTariffInfo) {
    delete viajeDoc._tempTariffInfo;
    logger.debug(`_tempTariffInfo eliminada para viaje ${viajeDoc.dt}`);
  }
};

const ensureError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error));

export { UNKNOWN_SITE_LABEL } from './viajeCalculations';
