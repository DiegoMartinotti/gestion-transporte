import { BaseService, PaginationOptions, BulkResult, TransactionOptions } from '../BaseService';
import Vehiculo, { IVehiculo } from '../../models/Vehiculo';
import Empresa from '../../models/Empresa';
import { VehiculoBulkOperations, VehiculoBulkData } from './vehiculoBulkOperations';

const EMPRESA_POPULATION_FIELDS = 'nombre tipo';
class VehiculoService extends BaseService<IVehiculo> {
  private bulkOperations: VehiculoBulkOperations;

  constructor() {
    super(Vehiculo);
    this.bulkOperations = new VehiculoBulkOperations();
  }
  protected async validateData(data: Partial<IVehiculo>): Promise<void> {
    if (!data) {
      throw new Error('Los datos del vehículo son requeridos');
    }

    this.validateRequiredFields(data);
    await this.validateEmpresaExists(data);
    await this.validateDominioUnique(data);
  }

  private validateRequiredFields(data: Partial<IVehiculo>): void {
    if (data.dominio !== undefined) {
      if (!data.dominio) {
        throw new Error('El dominio del vehículo es obligatorio');
      }
      this.validateAndNormalizeDominio(data);
    }

    if (data.tipo !== undefined && !data.tipo) {
      throw new Error('El tipo de vehículo es obligatorio');
    }

    if (data.empresa !== undefined && !data.empresa) {
      throw new Error('La empresa del vehículo es obligatoria');
    }
  }

  private validateAndNormalizeDominio(data: Partial<IVehiculo>): void {
    if (!data.dominio) return;

    // Normalizar dominio
    data.dominio = data.dominio.toUpperCase().trim();

    // Validar formato de patente argentina
    if (!/^[A-Z]{3}\d{3}$|^[A-Z]{2}\d{3}[A-Z]{2}$/.test(data.dominio)) {
      throw new Error('Formato de patente inválido');
    }
  }

  private async validateEmpresaExists(data: Partial<IVehiculo>): Promise<void> {
    if (!data.empresa) return;

    const empresaExiste = await Empresa.findById(data.empresa);
    if (!empresaExiste) {
      throw new Error('La empresa especificada no existe');
    }
  }

  private async validateDominioUnique(data: Partial<IVehiculo>): Promise<void> {
    if (!data.dominio) return;

    const dominioExiste = await Vehiculo.findOne({ dominio: data.dominio });
    if (dominioExiste) {
      throw new Error('Ya existe un vehículo con ese dominio');
    }
  }

  protected async afterCreate(
    vehiculo: IVehiculo,
    options: TransactionOptions = {}
  ): Promise<void> {
    if (vehiculo.empresa) {
      await Empresa.findByIdAndUpdate(
        vehiculo.empresa,
        { $push: { flota: vehiculo._id } },
        { session: options.session }
      );

      this.logInfo('Actualizada referencia en empresa', {
        vehiculoId: vehiculo._id,
        empresaId: vehiculo.empresa,
      });
    }
  }

  protected async afterUpdate(
    vehiculo: IVehiculo,
    _options: TransactionOptions = {}
  ): Promise<void> {
    // La lógica de cambio de empresa se maneja en updateWithEmpresaChange
  }

  protected async beforeDelete(
    vehiculo: IVehiculo,
    options: TransactionOptions = {}
  ): Promise<void> {
    if (vehiculo.empresa) {
      await Empresa.findByIdAndUpdate(
        vehiculo.empresa,
        { $pull: { flota: vehiculo._id } },
        { session: options.session }
      );

      this.logInfo('Eliminada referencia en empresa', {
        vehiculoId: vehiculo._id,
        empresaId: vehiculo.empresa,
      });
    }
  }

  async getVehiculosByEmpresa(
    empresaId: string,
    opciones: PaginationOptions<IVehiculo> = {}
  ): Promise<IVehiculo[]> {
    this.validateId(empresaId, 'ID de empresa');

    const { limite = 100, pagina = 1 } = opciones;
    const skip = (pagina - 1) * limite;

    const vehiculos = await this.model
      .find({ empresa: empresaId })
      .populate('empresa', EMPRESA_POPULATION_FIELDS)
      .limit(limite)
      .skip(skip)
      .lean()
      .exec();

    return vehiculos as IVehiculo[];
  }

  async getVehiculosConVencimientos(dias: number): Promise<IVehiculo[]> {
    const diasLimite = parseInt(String(dias)) || 30;
    const hoy = new Date();
    const limite = new Date();
    limite.setDate(limite.getDate() + diasLimite);

    const vehiculos = await this.model
      .find({
        $or: [
          { 'documentacion.seguro.vencimiento': { $gte: hoy, $lte: limite } },
          { 'documentacion.vtv.vencimiento': { $gte: hoy, $lte: limite } },
          { 'documentacion.ruta.vencimiento': { $gte: hoy, $lte: limite } },
          { 'documentacion.senasa.vencimiento': { $gte: hoy, $lte: limite } },
        ],
      })
      .populate('empresa', EMPRESA_POPULATION_FIELDS)
      .lean()
      .exec();

    return vehiculos as IVehiculo[];
  }

  async getVehiculosVencidos(): Promise<IVehiculo[]> {
    const hoy = new Date();

    const vehiculos = await this.model
      .find({
        $or: [
          { 'documentacion.seguro.vencimiento': { $lt: hoy } },
          { 'documentacion.vtv.vencimiento': { $lt: hoy } },
          { 'documentacion.ruta.vencimiento': { $lt: hoy } },
          { 'documentacion.senasa.vencimiento': { $lt: hoy } },
        ],
      })
      .populate('empresa', EMPRESA_POPULATION_FIELDS)
      .lean()
      .exec();

    return vehiculos as IVehiculo[];
  }

  async updateWithEmpresaChange(
    id: string,
    data: Partial<IVehiculo>,
    options: TransactionOptions = {}
  ): Promise<IVehiculo | null> {
    this.logOperation('updateWithEmpresaChange', { id, hasData: !!data });

    return this.executeInTransaction(
      async (session) => {
        this.validateId(id, 'ID del vehículo');
        const vehiculoActual = await this.validateExists(id, session);

        if (data.dominio && data.dominio !== vehiculoActual.dominio) {
          data.dominio = data.dominio.toUpperCase().trim();
          const dominioExiste = await this.model
            .findOne({
              dominio: data.dominio,
              _id: { $ne: id },
            })
            .session(session);

          if (dominioExiste) {
            throw new Error('Ya existe un vehículo con ese dominio');
          }
        }

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
            empresaNueva: data.empresa,
          });
        }

        const vehiculoActualizado = (await this.model.findByIdAndUpdate(
          id,
          data as Record<string, unknown>,
          { new: true, runValidators: true, session }
        )) as IVehiculo | null;

        this.logSuccess('updateWithEmpresaChange', { id, updated: !!vehiculoActualizado });
        return vehiculoActualizado;
      },
      { autoManage: !options.session }
    );
  }

  async createVehiculosBulk(
    vehiculosData: VehiculoBulkData[],
    options: TransactionOptions = {}
  ): Promise<BulkResult> {
    if (!Array.isArray(vehiculosData) || vehiculosData.length === 0) {
      return {
        success: false,
        insertados: 0,
        actualizados: 0,
        errores: [{ message: 'No vehicle data provided for bulk operation.' }],
      };
    }

    this.logOperation('createVehiculosBulk', { count: vehiculosData.length });

    try {
      const session = options.session;
      const empresaMap = await this.bulkOperations.prepareEmpresaMapping(vehiculosData, session);
      const vehiculosExistentesMap = await this.bulkOperations.prepareVehiculosMapping(
        vehiculosData,
        session
      );
      const { operations, errores } = this.bulkOperations.processVehiculosBulkData(
        vehiculosData,
        empresaMap,
        vehiculosExistentesMap
      );

      const bulkResult = await this.executeBulkWrite(operations, { session });

      this.logSuccess('createVehiculosBulk', {
        insertados: bulkResult.insertados,
        actualizados: bulkResult.actualizados,
        errores: bulkResult.errores.length,
      });

      return {
        ...bulkResult,
        errores: [...errores, ...bulkResult.errores],
      };
    } catch (error) {
      this.logFailure('createVehiculosBulk', error);
      throw this.handleMongooseError(error);
    }
  }
}
const vehiculoService = new VehiculoService();
export { VehiculoService };
export default vehiculoService;

export const getAllVehiculos = async (opciones?: PaginationOptions<IVehiculo>) => {
  const result = await vehiculoService.getAll(opciones);
  return { vehiculos: result.data, paginacion: result.paginacion };
};
export const getVehiculoById = (id: string) => vehiculoService.getById(id);
export const createVehiculo = (data: Partial<IVehiculo>) => vehiculoService.create(data);
export const updateVehiculo = (id: string, data: Partial<IVehiculo>) =>
  vehiculoService.updateWithEmpresaChange(id, data);
export const deleteVehiculo = async (id: string) => {
  const result = await vehiculoService.delete(id);
  return { message: result.message || 'Vehículo eliminado correctamente' };
};
export const getVehiculosByEmpresa = (empresaId: string, opciones?: PaginationOptions<IVehiculo>) =>
  vehiculoService.getVehiculosByEmpresa(empresaId, opciones);
export const getVehiculosConVencimientos = (dias: number) =>
  vehiculoService.getVehiculosConVencimientos(dias);
export const getVehiculosVencidos = () => vehiculoService.getVehiculosVencidos();
export const createVehiculosBulk = (
  vehiculosData: VehiculoBulkData[],
  options?: TransactionOptions
) => vehiculoService.createVehiculosBulk(vehiculosData, options);
