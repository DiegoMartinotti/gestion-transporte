import { BulkResult } from '../BaseService';
import Vehiculo from '../../models/Vehiculo';
import Empresa from '../../models/Empresa';
import mongoose from 'mongoose';

export interface VehiculoBulkData {
  patenteFaltante: string;
  tipo: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  empresa: string;
}

export class VehiculoBulkOperations {
  private model = Vehiculo;

  async prepareEmpresaMapping(
    vehiculosData: VehiculoBulkData[],
    session: unknown
  ): Promise<Map<string, mongoose.Types.ObjectId>> {
    const empresaIdentifiersSet = new Set(vehiculosData.map((v) => v.empresa).filter((e) => e));
    const empresaIdentifiers = Array.from(empresaIdentifiersSet);
    const empresaIds = empresaIdentifiers.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const empresaNombres = empresaIdentifiers.filter((id) => !mongoose.Types.ObjectId.isValid(id));

    const empresasFoundById = await Empresa.find({ _id: { $in: empresaIds } })
      .session(session || null)
      .lean();
    const empresasFoundByName = await Empresa.find({ nombre: { $in: empresaNombres } })
      .session(session || null)
      .lean();

    const empresaMap = new Map<string, mongoose.Types.ObjectId>();
    [...empresasFoundById, ...empresasFoundByName].forEach((emp) => {
      empresaMap.set(emp._id.toString(), emp._id);
      if (emp.nombre) {
        empresaMap.set(emp.nombre.toLowerCase(), emp._id);
      }
    });

    return empresaMap;
  }

  async prepareVehiculosMapping(
    vehiculosData: VehiculoBulkData[],
    session: unknown
  ): Promise<Map<string, unknown>> {
    const patentesFaltantes = vehiculosData
      .map((v) =>
        String(v.patenteFaltante || '')
          .trim()
          .toUpperCase()
      )
      .filter((p) => p);
    const vehiculosExistentes = await this.model
      .find({ dominio: { $in: patentesFaltantes } })
      .session(session || null)
      .lean();
    return new Map(vehiculosExistentes.map((v) => [v.dominio, v]));
  }

  processVehiculosBulkData(
    vehiculosData: VehiculoBulkData[],
    empresaMap: Map<string, mongoose.Types.ObjectId>,
    vehiculosExistentesMap: Map<string, unknown>
  ): { operations: unknown[]; errores: BulkResult['errores'] } {
    const operations: unknown[] = [];
    const errores: BulkResult['errores'] = [];

    for (let i = 0; i < vehiculosData.length; i++) {
      const index = i;
      const item = vehiculosData[i];
      const patente = String(item.patenteFaltante || '')
        .trim()
        .toUpperCase();

      if (!patente || !item.tipo || !item.empresa) {
        errores.push({
          index,
          message: 'Faltan campos requeridos (Patente Faltante, Tipo, Empresa)',
          data: item,
        });
        continue;
      }

      const empresaId = this.resolveEmpresaId(item.empresa, empresaMap);
      if (!empresaId) {
        errores.push({
          index,
          message: `Empresa '${item.empresa}' no encontrada o inválida`,
          data: item,
        });
        continue;
      }

      const vehiculoDataToSet = {
        tipo: item.tipo,
        marca: item.marca || null,
        modelo: item.modelo || null,
        año: item.anio || null,
        empresa: empresaId,
      };

      const vehiculoExistente = vehiculosExistentesMap.get(patente);
      this.addBulkOperation(operations, vehiculoExistente, patente, vehiculoDataToSet);
    }

    return { operations, errores };
  }

  private resolveEmpresaId(
    empresa: string,
    empresaMap: Map<string, mongoose.Types.ObjectId>
  ): mongoose.Types.ObjectId | null {
    if (mongoose.Types.ObjectId.isValid(empresa)) {
      return empresaMap.get(empresa.toString()) || null;
    }
    const empresaKey = typeof empresa === 'string' ? empresa.toLowerCase() : empresa;
    return empresaMap.get(empresaKey) || null;
  }

  private addBulkOperation(
    operations: unknown[],
    vehiculoExistente: unknown,
    patente: string,
    vehiculoDataToSet: Record<string, unknown>
  ): void {
    if (vehiculoExistente) {
      operations.push({
        updateOne: {
          filter: { _id: (vehiculoExistente as { _id: unknown })._id },
          update: { $set: vehiculoDataToSet },
        },
      });
    } else {
      operations.push({
        insertOne: {
          document: { dominio: patente, ...vehiculoDataToSet },
        },
      });
    }
  }
}
