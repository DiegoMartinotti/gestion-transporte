/**
 * @module services/empresa/empresaService
 * @description Servicio para la gestión de empresas usando BaseService
 */

import Empresa, { IEmpresa } from '../../models/Empresa';
import { BaseService, PaginationOptions, TransactionOptions } from '../BaseService';

/**
 * Servicio especializado para la gestión de empresas
 * Hereda toda la funcionalidad básica de BaseService y añade lógica específica
 */
class EmpresaService extends BaseService<IEmpresa> {
  constructor() {
    super(Empresa);
  }

  // ==================== VALIDACIONES ESPECÍFICAS ====================

  /**
   * Valida los datos específicos de una empresa
   * @param data - Datos de la empresa a validar
   */
  protected async validateData(data: Partial<IEmpresa>): Promise<void> {
    // Validar campos requeridos
    if (data.nombre !== undefined) {
      this.validateRequired(data, ['nombre']);

      if (data.nombre.length < 3) {
        throw new Error('El nombre de la empresa debe tener al menos 3 caracteres');
      }
    }

    if (data.tipo !== undefined) {
      this.validateRequired(data, ['tipo']);

      if (!['Propia', 'Subcontratada'].includes(data.tipo)) {
        throw new Error('El tipo debe ser "Propia" o "Subcontratada"');
      }
    }

    // Validar email si está presente
    if (data.mail) {
      this.validateEmail(data.mail, 'email');
    }

    // Validar CUIT si está presente
    if (data.cuit) {
      this.validateCUIT(data.cuit);
    }

    // Validar teléfono si está presente
    if (data.telefono) {
      this.validateTelefono(data.telefono);
    }

    // Validar unicidad del nombre si está presente
    if (data.nombre) {
      await this.validateUnique('nombre', data.nombre.trim(), data._id?.toString(), 'nombre');
    }

    // Validar unicidad del CUIT si está presente
    if (data.cuit) {
      await this.validateUniqueCuit(data.cuit, data._id?.toString());
    }
  }

  // Métodos de validación migrados a BaseService
  // Se usan: this.validateEmail(), this.validateCUIT(), this.validateTelefono(), this.validateUnique()

  /**
   * Valida que el CUIT de la empresa sea único
   * @param cuit - CUIT a validar
   * @param excludeId - ID a excluir de la validación (para updates)
   */
  private async validateUniqueCuit(cuit: string, excludeId?: string): Promise<void> {
    const existingEmpresa = await this.model.findOne({
      cuit: cuit.trim(),
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });

    if (existingEmpresa) {
      throw new Error(`Ya existe una empresa con el CUIT: ${cuit}`);
    }
  }

  // ==================== MÉTODOS ESPECÍFICOS ====================

  /**
   * Busca una empresa por nombre
   * @param nombre - Nombre de la empresa
   * @returns Empresa encontrada o null
   */
  async getByNombre(nombre: string): Promise<IEmpresa | null> {
    this.logOperation('getByNombre', { nombre });

    try {
      if (!nombre) {
        throw new Error('Nombre es requerido');
      }

      const empresa = await this.model
        .findOne({
          nombre: nombre.trim(),
        })
        .lean()
        .exec();

      if (empresa) {
        this.logSuccess('getByNombre', { nombre, found: true });
      } else {
        this.logWarn(`Empresa no encontrada con nombre: ${nombre}`);
      }

      return empresa as IEmpresa;
    } catch (error) {
      this.logFailure('getByNombre', error);
      throw this.handleMongooseError(error);
    }
  }

  /**
   * Busca una empresa por CUIT
   * @param cuit - CUIT de la empresa
   * @returns Empresa encontrada o null
   */
  async getByCuit(cuit: string): Promise<IEmpresa | null> {
    this.logOperation('getByCuit', { cuit });

    try {
      if (!cuit) {
        throw new Error('CUIT es requerido');
      }

      const empresa = await this.model
        .findOne({
          cuit: cuit.trim(),
        })
        .lean()
        .exec();

      if (empresa) {
        this.logSuccess('getByCuit', { cuit, found: true });
      } else {
        this.logWarn(`Empresa no encontrada con CUIT: ${cuit}`);
      }

      return empresa as IEmpresa;
    } catch (error) {
      this.logFailure('getByCuit', error);
      throw this.handleMongooseError(error);
    }
  }

  /**
   * Obtiene empresas por tipo
   * @param tipo - Tipo de empresa ('Propia' | 'Subcontratada')
   * @param opciones - Opciones de paginación
   * @returns Resultado paginado con empresas del tipo especificado
   */
  async getEmpresasByTipo(
    tipo: 'Propia' | 'Subcontratada',
    opciones: PaginationOptions<IEmpresa> = {}
  ) {
    this.logOperation('getEmpresasByTipo', { tipo, opciones });

    try {
      if (!['Propia', 'Subcontratada'].includes(tipo)) {
        throw new Error('El tipo debe ser "Propia" o "Subcontratada"');
      }

      const filtros = {
        ...opciones.filtros,
        tipo: tipo,
      };

      const resultado = await this.getAll({ ...opciones, filtros });

      this.logSuccess('getEmpresasByTipo', {
        tipo,
        found: resultado.data.length,
        total: resultado.paginacion.total,
      });

      return resultado;
    } catch (error) {
      this.logFailure('getEmpresasByTipo', error);
      throw this.handleMongooseError(error);
    }
  }

  /**
   * Obtiene solo las empresas activas
   * @param opciones - Opciones de paginación
   * @returns Resultado paginado con empresas activas
   */
  async getEmpresasActivas(opciones: PaginationOptions<IEmpresa> = {}) {
    this.logOperation('getEmpresasActivas', { opciones });

    const filtros = {
      ...opciones.filtros,
      activa: true,
    };

    return this.getAll({ ...opciones, filtros });
  }

  /**
   * Busca empresas por texto en nombre, razón social o contacto
   * @param query - Texto a buscar
   * @param opciones - Opciones de paginación
   * @returns Resultado paginado con empresas encontradas
   */
  async searchEmpresas(query: string, opciones: PaginationOptions<IEmpresa> = {}) {
    this.logOperation('searchEmpresas', { query, opciones });

    try {
      if (!query || query.trim().length < 2) {
        throw new Error('La consulta debe tener al menos 2 caracteres');
      }

      const searchRegex = { $regex: query.trim(), $options: 'i' };
      const filtros = {
        ...opciones.filtros,
        $or: [
          { nombre: searchRegex },
          { razonSocial: searchRegex },
          { contactoPrincipal: searchRegex },
          { cuit: searchRegex },
        ],
      };

      const resultado = await this.getAll({ ...opciones, filtros });

      this.logSuccess('searchEmpresas', {
        query,
        found: resultado.data.length,
        total: resultado.paginacion.total,
      });

      return resultado;
    } catch (error) {
      this.logFailure('searchEmpresas', error);
      throw this.handleMongooseError(error);
    }
  }

  /**
   * Desactiva una empresa en lugar de eliminarla
   * @param id - ID de la empresa
   * @param options - Opciones de transacción
   * @returns Resultado de la operación
   */
  async deactivate(id: string, options: TransactionOptions = {}) {
    this.logOperation('deactivate', { id });

    try {
      const empresa = await this.update(id, { activa: false }, options);

      if (empresa) {
        this.logSuccess('deactivate', { id, deactivated: true });
      }

      return {
        success: true,
        message: 'Empresa desactivada correctamente',
        data: empresa,
      };
    } catch (error) {
      this.logFailure('deactivate', error);
      throw error;
    }
  }

  /**
   * Reactiva una empresa
   * @param id - ID de la empresa
   * @param options - Opciones de transacción
   * @returns Empresa reactivada
   */
  async reactivate(id: string, options: TransactionOptions = {}) {
    this.logOperation('reactivate', { id });

    try {
      const empresa = await this.update(id, { activa: true }, options);

      if (empresa) {
        this.logSuccess('reactivate', { id, reactivated: true });
      }

      return {
        success: true,
        message: 'Empresa reactivada correctamente',
        data: empresa,
      };
    } catch (error) {
      this.logFailure('reactivate', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de empresas
   * @returns Estadísticas agrupadas por tipo y estado
   */
  async getEstadisticas() {
    this.logOperation('getEstadisticas', {});

    try {
      const stats = await this.model.aggregate([
        {
          $group: {
            _id: {
              tipo: '$tipo',
              activa: '$activa',
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: '$_id.tipo',
            activas: {
              $sum: {
                $cond: [{ $eq: ['$_id.activa', true] }, '$count', 0],
              },
            },
            inactivas: {
              $sum: {
                $cond: [{ $eq: ['$_id.activa', false] }, '$count', 0],
              },
            },
            total: { $sum: '$count' },
          },
        },
        {
          $project: {
            tipo: '$_id',
            activas: 1,
            inactivas: 1,
            total: 1,
            _id: 0,
          },
        },
      ]);

      this.logSuccess('getEstadisticas', { grupos: stats.length });

      return stats;
    } catch (error) {
      this.logFailure('getEstadisticas', error);
      throw this.handleMongooseError(error);
    }
  }

  // ==================== HOOKS DE LIFECYCLE ====================

  /**
   * Hook ejecutado después de crear una empresa
   * @param empresa - Empresa recién creada
   * @param options - Opciones de transacción
   */
  protected async afterCreate(empresa: IEmpresa, _options: TransactionOptions = {}): Promise<void> {
    this.logInfo(`Empresa creada exitosamente: ${empresa.nombre} (${empresa.tipo})`);

    // Aquí se pueden agregar acciones adicionales después de crear una empresa
    // como notificaciones, creación de estructuras relacionadas, etc.
  }

  /**
   * Hook ejecutado después de actualizar una empresa
   * @param empresa - Empresa actualizada
   * @param options - Opciones de transacción
   */
  protected async afterUpdate(empresa: IEmpresa, _options: TransactionOptions = {}): Promise<void> {
    this.logInfo(`Empresa actualizada exitosamente: ${empresa.nombre} (${empresa.tipo})`);
  }

  /**
   * Hook ejecutado antes de eliminar una empresa
   * @param empresa - Empresa a eliminar
   * @param options - Opciones de transacción
   */
  protected async beforeDelete(
    empresa: IEmpresa,
    _options: TransactionOptions = {}
  ): Promise<void> {
    // Verificar que no tenga vehículos o personal asociado
    // Esto se puede implementar cuando se necesite
    this.logWarn(`Preparando eliminación de empresa: ${empresa.nombre} (${empresa._id})`);

    if (empresa.flota && empresa.flota.length > 0) {
      throw new Error('No se puede eliminar una empresa que tiene vehículos asociados');
    }

    if (empresa.personal && empresa.personal.length > 0) {
      throw new Error('No se puede eliminar una empresa que tiene personal asociado');
    }
  }
}

// Instancia única del servicio
const empresaService = new EmpresaService();

export { EmpresaService };
export default empresaService;
