/**
 * @module services/tarifaEngine/contextHelpers
 * @description Helpers para preparación de contexto de cálculo
 */

import Cliente from '../../models/Cliente';
import Site from '../../models/Site';
import Tramo from '../../models/Tramo';
import { FormulaContext } from '../../utils/formulaParser';
import { IContextoCalculo } from './types';
import {
  calcularDistanciaAerea,
  esFeriado,
  obtenerCapacidadMaxima,
  obtenerPesoMaximo,
  prepararComponentesTemporales,
} from './utils';

/**
 * Carga los datos principales necesarios para el cálculo
 */
export async function cargarDatosPrincipales(contexto: IContextoCalculo) {
  const [cliente, origen, destino] = await Promise.all([
    Cliente.findById(contexto.clienteId),
    Site.findById(contexto.origenId),
    Site.findById(contexto.destinoId),
  ]);

  if (!cliente || !origen || !destino) {
    throw new Error('Datos principales no encontrados (cliente, origen o destino)');
  }

  const tramo = await Tramo.findOne({
    cliente: contexto.clienteId,
    origen: contexto.origenId,
    destino: contexto.destinoId,
  });

  return { cliente, origen, destino, tramo };
}

/**
 * Prepara contexto de vehículos
 */
export async function prepararContextoVehiculo(contexto: IContextoCalculo) {
  return {
    TipoUnidad: contexto.tipoUnidad,
    CapacidadMaxima: await obtenerCapacidadMaxima(contexto.tipoUnidad),
    PesoMaximo: await obtenerPesoMaximo(contexto.tipoUnidad),
    CantidadVehiculos: contexto.vehiculos?.reduce((sum, v) => sum + v.cantidad, 0) || 1,
  };
}

/**
 * Prepara contexto de cliente
 */
export function prepararContextoCliente(cliente: Record<string, unknown>) {
  return {
    TipoCliente: (cliente.tipo as string) || 'Regular',
    CategoriaCliente: (cliente.categoria as string) || 'Normal',
    DescuentoCliente: (cliente.descuento as number) || 0,
  };
}

/**
 * Prepara el contexto completo con toda la información necesaria
 */
export async function prepararContextoCompleto(
  contexto: IContextoCalculo
): Promise<FormulaContext> {
  const { cliente, origen, destino, tramo } = await cargarDatosPrincipales(contexto);
  const fecha = contexto.fecha || new Date();
  const componentesTemporales = prepararComponentesTemporales(fecha);
  const contextoVehiculo = await prepararContextoVehiculo(contexto);
  const contextoCliente = prepararContextoCliente(cliente as unknown as Record<string, unknown>);

  return {
    // Valores básicos
    Valor: 0,
    Peaje: 0,
    Cantidad: contexto.palets || 0,
    Palets: contexto.palets || 0,

    // Distancia
    Distancia: tramo?.distancia || 0,
    DistanciaReal: tramo?.distancia || 0,
    DistanciaAerea: calcularDistanciaAerea(origen, destino),

    // Tiempo
    Fecha: fecha,
    ...componentesTemporales,
    EsFeriado: await esFeriado(fecha),

    // Vehículo y Cliente
    ...contextoVehiculo,
    ...contextoCliente,

    // Adicionales
    Peso: contexto.peso || 0,
    Volumen: contexto.volumen || 0,
    CantidadBultos: contexto.cantidadBultos || 0,
    TipoCarga: 'General',
    Urgencia: contexto.urgencia || 'Normal',
  };
}
