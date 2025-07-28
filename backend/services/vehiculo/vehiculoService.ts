/**
 * @module services/vehiculo/VehiculoService
 * @description Servicio para gestión de vehículos extendiendo BaseService
 * Mantiene métodos específicos de vehículos mientras usa funcionalidad común
 */

import { BaseService, PaginationOptions, PaginationResult, BulkResult, TransactionOptions } from '../BaseService';
import Vehiculo, { IVehiculo } from '../../models/Vehiculo';
import Empresa from '../../models/Empresa';
import mongoose from 'mongoose';
import logger from '../../utils/logger';

// ==================== INTERFACES ESPECÍFICAS ====================

interface VehiculoData {
  dominio?: string;
  empresa?: string;
  tipo?: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  documentacion?: {
    seguro?: { vencimiento?: Date };
    vtv?: { vencimiento?: Date };
    ruta?: { vencimiento?: Date };
    senasa?: { vencimiento?: Date };
  };
}

interface VehiculoBulkData {
  patenteFaltante: string;
  tipo: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  empresa: string;
}

// ==================== CLASE VEHICULO SERVICE ====================

/**
 * Servicio de vehículos que extiende BaseService
 * Proporciona funcionalidad CRUD común más métodos específicos de vehículos
 */
class VehiculoService extends BaseService<IVehiculo> {
  constructor() {
    super(Vehiculo);
  }

  // ==================== HOOKS ABSTRACTOS IMPLEMENTADOS ====================

  /**
   * Validaciones específicas para datos de vehículos
   */
  protected async validateData(data: Partial<IVehiculo>): Promise<void> {
    if (!data) {
      throw new Error('Los datos del vehículo son requeridos');
    }

    // Validar campos requeridos para creación
    if (data.dominio !== undefined) {
      if (!data.dominio) {
        throw new Error('El dominio del vehículo es obligatorio');
      }
      
      // Normalizar dominio
      data.dominio = data.dominio.toUpperCase().trim();
      
      // Validar formato de patente argentina
      if (!/^[A-Z]{3}[0-9]{3}$|^[A-Z]{2}[0-9]{3}[A-Z]{2}$/.test(data.dominio)) {
        throw new Error('Formato de patente inválido');
      }
    }

    if (data.tipo !== undefined && !data.tipo) {
      throw new Error('El tipo de vehículo es obligatorio');
    }

    if (data.empresa !== undefined && !data.empresa) {
      throw new Error('La empresa del vehículo es obligatoria');
    }

    // Validar que la empresa existe
    if (data.empresa) {
      const empresaExiste = await Empresa.findById(data.empresa);
      if (!empresaExiste) {
        throw new Error('La empresa especificada no existe');
      }
    }

    // Validar duplicación de dominio
    if (data.dominio) {
      const dominioExiste = await Vehiculo.findOne({ dominio: data.dominio });
      if (dominioExiste) {
        throw new Error('Ya existe un vehículo con ese dominio');
      }
    }
  }

  /**
   * Hook después de crear - actualizar referencia en empresa
   */
  protected async afterCreate(vehiculo: IVehiculo, options: TransactionOptions = {}): Promise<void> {
    if (vehiculo.empresa) {
      await Empresa.findByIdAndUpdate(
        vehiculo.empresa,
        { $push: { flota: vehiculo._id } },
        { session: options.session }
      );
      
      this.logInfo('Actualizada referencia en empresa', {
        vehiculoId: vehiculo._id,
        empresaId: vehiculo.empresa
      });
    }
  }

  /**
   * Hook después de actualizar - manejar cambio de empresa
   */
  protected async afterUpdate(vehiculo: IVehiculo, options: TransactionOptions = {}): Promise<void> {
    // Este hook se puede usar para lógica adicional después de actualizar
    // La lógica de cambio de empresa se maneja en updateWithEmpresaChange
  }

  /**
   * Hook antes de eliminar - limpiar referencias
   */
  protected async beforeDelete(vehiculo: IVehiculo, options: TransactionOptions = {}): Promise<void> {
    if (vehiculo.empresa) {
      await Empresa.findByIdAndUpdate(
        vehiculo.empresa,
        { $pull: { flota: vehiculo._id } },
        { session: options.session }
      );
      
      this.logInfo('Eliminada referencia en empresa', {
        vehiculoId: vehiculo._id,
        empresaId: vehiculo.empresa
      });
    }
  }

  // ==================== MÉTODOS ESPECÍFICOS DE VEHÍCULOS ====================

  /**
   * Obtiene vehículos de una empresa específica
   */
  async getVehiculosByEmpresa(empresaId: string, opciones: PaginationOptions<IVehiculo> = {}): Promise<IVehiculo[]> {
    try {
      this.validateId(empresaId, 'ID de empresa');
      
      const { limite = 100, pagina = 1 } = opciones;
      const skip = (pagina - 1) * limite;
      
      this.logOperation('getVehiculosByEmpresa', { empresaId, limite, pagina });
      
      const vehiculos = await this.model.find({ empresa: empresaId })
        .populate('empresa', 'nombre tipo')
        .limit(limite)
        .skip(skip)
        .lean()
        .exec();
      
      this.logSuccess('getVehiculosByEmpresa', { 
        empresaId, 
        found: vehiculos.length 
      });
      
      return vehiculos as IVehiculo[];
    } catch (error) {
      this.logFailure('getVehiculosByEmpresa', error);
      throw this.handleMongooseError(error);
    }
  }

  /**
   * Obtiene vehículos con documentación próxima a vencer
   */
  async getVehiculosConVencimientos(dias: number): Promise<IVehiculo[]> {
    try {
      const diasLimite = parseInt(String(dias)) || 30;
      const hoy = new Date();
      const limite = new Date();
      limite.setDate(limite.getDate() + diasLimite);
      
      this.logOperation('getVehiculosConVencimientos', { diasLimite });

      const vehiculos = await this.model.find({
        $or: [
          { 'documentacion.seguro.vencimiento': { $gte: hoy, $lte: limite } },
          { 'documentacion.vtv.vencimiento': { $gte: hoy, $lte: limite } },
          { 'documentacion.ruta.vencimiento': { $gte: hoy, $lte: limite } },
          { 'documentacion.senasa.vencimiento': { $gte: hoy, $lte: limite } }
        ]
      })
      .populate('empresa', 'nombre tipo')
      .lean()
      .exec();
      
      this.logSuccess('getVehiculosConVencimientos', { 
        diasLimite,
        found: vehiculos.length 
      });
      
      return vehiculos as IVehiculo[];
    } catch (error) {
      this.logFailure('getVehiculosConVencimientos', error);
      throw this.handleMongooseError(error);
    }
  }

  /**
   * Obtiene vehículos con documentación vencida
   */
  async getVehiculosVencidos(): Promise<IVehiculo[]> {
    try {
      const hoy = new Date();
      
      this.logOperation('getVehiculosVencidos');

      const vehiculos = await this.model.find({
        $or: [
          { 'documentacion.seguro.vencimiento': { $lt: hoy } },
          { 'documentacion.vtv.vencimiento': { $lt: hoy } },
          { 'documentacion.ruta.vencimiento': { $lt: hoy } },
          { 'documentacion.senasa.vencimiento': { $lt: hoy } }
        ]
      })
      .populate('empresa', 'nombre tipo')
      .lean()
      .exec();
      
      this.logSuccess('getVehiculosVencidos', { found: vehiculos.length });
      
      return vehiculos as IVehiculo[];
    } catch (error) {
      this.logFailure('getVehiculosVencidos', error);
      throw this.handleMongooseError(error);
    }
  }

  /**
   * Actualiza un vehículo con manejo especial de cambio de empresa
   */
  async updateWithEmpresaChange(id: string, data: Partial<IVehiculo>, options: TransactionOptions = {}): Promise<IVehiculo | null> {
    this.logOperation('updateWithEmpresaChange', { id, hasData: !!data });
    
    return this.executeInTransaction(async (session) => {
      this.validateId(id, 'ID del vehículo');
      
      // Obtener vehículo actual
      const vehiculoActual = await this.validateExists(id, session);
      
      // Validar datos (sin verificar duplicación de dominio si no cambió)
      if (data.dominio && data.dominio !== vehiculoActual.dominio) {
        data.dominio = data.dominio.toUpperCase().trim();
        const dominioExiste = await this.model.findOne({ 
          dominio: data.dominio,
          _id: { $ne: id }
        }).session(session);
        
        if (dominioExiste) {
          throw new Error('Ya existe un vehículo con ese dominio');
        }
      }

      // Validar empresa si cambió
      if (data.empresa && data.empresa.toString() !== vehiculoActual.empresa.toString()) {
        const empresaExiste = await Empresa.findById(data.empresa).session(session);
        if (!empresaExiste) {
          throw new Error('La empresa especificada no existe');
        }

        // Eliminar de empresa anterior
        await Empresa.findByIdAndUpdate(
          vehiculoActual.empresa,
          { $pull: { flota: vehiculoActual._id } },
          { session }
        );
        
        // Agregar a nueva empresa
        await Empresa.findByIdAndUpdate(
          data.empresa,
          { $push: { flota: vehiculoActual._id } },
          { session }
        );

        this.logInfo('Vehículo cambiado de empresa', {
          vehiculoId: id,
          empresaAnterior: vehiculoActual.empresa,
          empresaNueva: data.empresa
        });
      }

      // Actualizar vehículo
      const vehiculoActualizado = await this.model.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true, session }
      );
      
      this.logSuccess('updateWithEmpresaChange', { 
        id, 
        updated: !!vehiculoActualizado 
      });
      
      return vehiculoActualizado;
    }, { autoManage: !options.session });
  }

  /**
   * Crea o actualiza vehículos masivamente
   */
  async createVehiculosBulk(vehiculosData: VehiculoBulkData[], options: TransactionOptions = {}): Promise<BulkResult> {
    const session = options.session;
    let insertados = 0;
    let actualizados = 0;
    const errores: BulkResult['errores'] = [];
    const operations: any[] = [];

    if (!Array.isArray(vehiculosData) || vehiculosData.length === 0) {
      return { 
        success: false, 
        insertados, 
        actualizados, 
        errores: [{ message: 'No vehicle data provided for bulk operation.' }] 
      };
    }

    this.logOperation('createVehiculosBulk', { count: vehiculosData.length });

    try {
      // Resolver empresas
      const empresaIdentifiersSet = new Set(vehiculosData.map(v => v.empresa).filter(e => e));
      const empresaIdentifiers = Array.from(empresaIdentifiersSet);
      const empresaIds = empresaIdentifiers.filter(id => mongoose.Types.ObjectId.isValid(id));
      const empresaNombres = empresaIdentifiers.filter(id => !mongoose.Types.ObjectId.isValid(id));

      const empresasFoundById = await Empresa.find({ _id: { $in: empresaIds } }).session(session || null).lean();
      const empresasFoundByName = await Empresa.find({ nombre: { $in: empresaNombres } }).session(session || null).lean();
      
      const empresaMap = new Map();
      [...empresasFoundById, ...empresasFoundByName].forEach(emp => {
        empresaMap.set(emp._id.toString(), emp._id);
        if (emp.nombre) {
          empresaMap.set(emp.nombre.toLowerCase(), emp._id);
        }
      });

      // Buscar vehículos existentes
      const patentesFaltantes = vehiculosData.map(v => String(v.patenteFaltante || '').trim().toUpperCase()).filter(p => p);
      const vehiculosExistentes = await this.model.find({ dominio: { $in: patentesFaltantes } }).session(session || null).lean();
      const vehiculosExistentesMap = new Map(vehiculosExistentes.map(v => [v.dominio, v]));

      // Procesar cada registro
      for (let i = 0; i < vehiculosData.length; i++) {
        const index = i;
        const item = vehiculosData[i];
        const patente = String(item.patenteFaltante || '').trim().toUpperCase();

        // Validar campos básicos
        if (!patente || !item.tipo || !item.empresa) {
          errores.push({ index, message: 'Faltan campos requeridos (Patente Faltante, Tipo, Empresa)', data: item });
          continue;
        }

        // Resolver empresa
        let empresaId: mongoose.Types.ObjectId | null = null;
        const empresaKey = typeof item.empresa === 'string' ? item.empresa.toLowerCase() : item.empresa;
        
        if (mongoose.Types.ObjectId.isValid(item.empresa)) {
          empresaId = empresaMap.get(item.empresa.toString());
        } else if (typeof empresaKey === 'string') {
          empresaId = empresaMap.get(empresaKey);
        }

        if (!empresaId) {
          errores.push({ index, message: `Empresa '${item.empresa}' no encontrada o inválida`, data: item });
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

        if (vehiculoExistente) {
          operations.push({
            updateOne: {
              filter: { _id: vehiculoExistente._id },
              update: { $set: vehiculoDataToSet }
            }
          });
        } else {
          operations.push({
            insertOne: {
              document: {
                dominio: patente,
                ...vehiculoDataToSet
              }
            }
          });
        }
      }

      // Ejecutar operaciones bulk
      const bulkResult = await this.executeBulkWrite(operations, { session });
      
      this.logSuccess('createVehiculosBulk', {
        insertados: bulkResult.insertados,
        actualizados: bulkResult.actualizados,
        errores: bulkResult.errores.length
      });

      return {
        ...bulkResult,
        errores: [...errores, ...bulkResult.errores]
      };

    } catch (error) {
      this.logFailure('createVehiculosBulk', error);
      throw this.handleMongooseError(error);
    }
  }
}

// ==================== INSTANCIA SINGLETON ====================

const vehiculoService = new VehiculoService();

// ==================== EXPORTS PARA COMPATIBILIDAD ====================

export { VehiculoService };
export default vehiculoService;

// Exportar métodos individuales para compatibilidad con controladores existentes
export const getAllVehiculos = async (opciones?: PaginationOptions<IVehiculo>) => {
  const result = await vehiculoService.getAll(opciones);
  // Convertir formato BaseService a formato esperado por controladores
  return {
    vehiculos: result.data,
    paginacion: result.paginacion
  };
};
export const getVehiculoById = (id: string) => vehiculoService.getById(id);
export const createVehiculo = (data: Partial<IVehiculo>) => vehiculoService.create(data);
export const updateVehiculo = (id: string, data: Partial<IVehiculo>) => vehiculoService.updateWithEmpresaChange(id, data);
export const deleteVehiculo = async (id: string) => {
  const result = await vehiculoService.delete(id);
  // Convertir formato BaseService a formato esperado por controladores
  return { message: result.message || 'Vehículo eliminado correctamente' };
};
export const getVehiculosByEmpresa = (empresaId: string, opciones?: PaginationOptions<IVehiculo>) => vehiculoService.getVehiculosByEmpresa(empresaId, opciones);
export const getVehiculosConVencimientos = (dias: number) => vehiculoService.getVehiculosConVencimientos(dias);
export const getVehiculosVencidos = () => vehiculoService.getVehiculosVencidos();
export const createVehiculosBulk = (vehiculosData: VehiculoBulkData[], options?: TransactionOptions) => vehiculoService.createVehiculosBulk(vehiculosData, options);