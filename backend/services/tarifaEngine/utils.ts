/**
 * @module services/tarifaEngine/utils
 * @description Utilidades y helpers para el motor de tarifas
 */

import { IContextoCalculo, VehiculoDocument } from './types';
import Vehiculo from '../../models/Vehiculo';

/**
 * Calcula la distancia aérea entre dos sites
 */
export function calcularDistanciaAerea(
  origen: { location?: { coordinates: [number, number] } },
  destino: { location?: { coordinates: [number, number] } }
): number {
  if (!origen.location?.coordinates || !destino.location?.coordinates) {
    return 0;
  }

  const [lon1, lat1] = origen.location.coordinates;
  const [lon2, lat2] = destino.location.coordinates;

  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

/**
 * Verifica si una fecha es feriado
 */
export async function esFeriado(fecha: Date): Promise<boolean> {
  return verificarFeriadosFijos(fecha);
}

/**
 * Verifica feriados fijos conocidos
 */
function verificarFeriadosFijos(fecha: Date): boolean {
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();

  // Feriados fijos comunes
  const feriadosFijos = [
    [1, 1], // Año Nuevo
    [5, 1], // Día del Trabajador
    [7, 9], // Día de la Independencia
    [12, 25], // Navidad
  ];

  return feriadosFijos.some(([m, d]) => m === mes && d === dia);
}

/**
 * Obtiene la capacidad máxima según el tipo de unidad
 */
export async function obtenerCapacidadMaxima(tipoUnidad: string): Promise<number> {
  const vehiculo = await Vehiculo.findOne({ tipo: tipoUnidad });
  return vehiculo ? (vehiculo as VehiculoDocument).capacidadMaxima || 0 : 0;
}

/**
 * Obtiene el peso máximo según el tipo de unidad
 */
export async function obtenerPesoMaximo(tipoUnidad: string): Promise<number> {
  const vehiculo = await Vehiculo.findOne({ tipo: tipoUnidad });
  return vehiculo ? (vehiculo as VehiculoDocument).pesoMaximo || 0 : 0;
}

/**
 * Genera una clave de cache única para el contexto
 */
export function generarCacheKey(contexto: IContextoCalculo): string {
  const elementos = [
    contexto.clienteId.toString(),
    contexto.origenId.toString(),
    contexto.destinoId.toString(),
    contexto.fecha.toISOString().split('T')[0],
    contexto.tipoTramo,
    contexto.tipoUnidad,
    contexto.metodoCalculo || 'auto',
    contexto.palets?.toString() || '0',
    contexto.peso?.toString() || '0',
  ];

  return `tarifa:${elementos.join(':')}`;
}

/**
 * Prepara componentes temporales
 */
export function prepararComponentesTemporales(fecha: Date) {
  const diaSemana = fecha.getDay();
  const mes = fecha.getMonth() + 1;
  const trimestre = Math.ceil(mes / 3);
  const esFinDeSemana = diaSemana === 0 || diaSemana === 6;
  const horaDelDia = fecha.getHours();

  return { diaSemana, mes, trimestre, esFinDeSemana, horaDelDia };
}
