import type mongoose, { Document, Types } from 'mongoose';
import type { ICliente } from './Cliente';
import type { ISite } from './Site';
import type { IPersonal } from './Personal';
import type { IVehiculo } from './Vehiculo';
import type { IExtra } from './Extra';
import type { ITarifaHistorica } from './Tramo';

export interface IVehiculoViaje {
  vehiculo: Types.ObjectId | IVehiculo;
  posicion: number;
  observaciones?: string;
}

export interface IExtraViaje {
  extra: Types.ObjectId | IExtra;
  cantidad: number;
}

export interface ITempTariffInfo {
  metodoCalculo: 'Kilometro' | 'Palet' | 'Fijo';
  valor: number;
  valorPeaje: number;
  distanciaTramo?: number;
  tramoId?: Types.ObjectId;
}

export interface ClienteFormulaConfig {
  Cliente?: string;
  formulaPaletBitren?: string;
  formulaPaletSider?: string;
}

export type TarifaVigente = ITarifaHistorica | ITempTariffInfo;

export interface IViaje extends Document {
  cliente: Types.ObjectId | (ICliente & ClienteFormulaConfig);
  fecha: Date;
  origen: Types.ObjectId | ISite;
  destino: Types.ObjectId | ISite;
  tipoTramo: 'TRMC' | 'TRMI';
  chofer: Types.ObjectId | IPersonal;
  vehiculos: IVehiculoViaje[];
  tipoUnidad: 'Sider' | 'Bitren';
  paletas: number;
  tarifa: number;
  peaje: number;
  dt: string;
  extras: IExtraViaje[];
  cobros: Types.ObjectId[];
  total: number;
  estado: 'Pendiente' | 'En Curso' | 'Completado' | 'Cancelado';
  estadoPartida: 'Abierta' | 'Cerrada';
  observaciones?: string;
  createdAt: Date;
  updatedAt: Date;

  _tempTariffInfo?: ITempTariffInfo;

  getDescripcionCorta(): string;
  isCompleto(): boolean;
}

export type IViajeModel = mongoose.Model<IViaje>;
