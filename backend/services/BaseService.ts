/**
 * @module services/BaseService
 * @description Servicio base abstracto que proporciona funcionalidad común para todos los servicios
 * Implementa patrones unificados de paginación, transacciones, logging y operaciones bulk
 */

import mongoose, { Document, Model, ClientSession, FilterQuery, Error as MongooseError } from 'mongoose';
import logger from '../utils/logger';

// ==================== INTERFACES UNIFICADAS ====================

/**
 * Opciones para paginación de resultados
 */
export interface PaginationOptions<T = any> {
  limite?: number;
  pagina?: number;
  filtros?: FilterQuery<T>;
  ordenamiento?: any;
  proyeccion?: string;
}

/**
 * Resultado paginado genérico
 */
export interface PaginationResult<T> {
  data: T[];
  paginacion: {
    total: number;
    paginas: number;
    paginaActual: number;
    limite: number;
  };
}

/**
 * Resultado de operaciones bulk (crear/actualizar masivamente)
 */
export interface BulkResult {
  success: boolean;
  insertados: number;
  actualizados: number;
  errores: Array<{
    index?: number | string;
    message: string;
    code?: number;
    data?: any;
  }>;
}

/**
 * Opciones para operaciones con transacciones
 */
export interface TransactionOptions {
  session?: ClientSession;
}

/**
 * Resultado de operación con información de éxito/error
 */
export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ==================== CLASE BASE ABSTRACTA ====================

/**
 * Servicio base abstracto que proporciona funcionalidad común
 * Implementa patrones de paginación, transacciones, logging y operaciones bulk
 */
export abstract class BaseService<T extends Document> {
  protected model: Model<T>;
  protected modelName: string;

  constructor(model: Model<T>) {
    this.model = model;
    this.modelName = model.collection.name;
    logger.debug(`Inicializado BaseService para modelo: ${this.modelName}`);
  }

  // ==================== MANEJO DE ERRORES Y VALIDACIONES ====================

  /**
   * Ejecuta una operación dentro de una transacción con manejo automático
   * @param operation - Función que ejecuta la operación con la sesión
   * @param options - Opciones de configuración
   */
  protected async executeInTransaction<R>(
    operation: (session: ClientSession) => Promise<R>,
    options: { autoManage?: boolean } = {}
  ): Promise<R> {
    const { autoManage = true } = options;
    const session = await mongoose.startSession();
    
    try {
      if (autoManage) {
        session.startTransaction();
        this.logOperation('transaction_start', { modelName: this.modelName });
      }
      
      const result = await operation(session);
      
      if (autoManage) {
        await session.commitTransaction();
        this.logSuccess('transaction_commit', { modelName: this.modelName });
      }
      
      return result;
    } catch (error) {
      if (autoManage) {
        await session.abortTransaction();
        this.logFailure('transaction_rollback', error);
      }
      throw this.handleMongooseError(error);
    } finally {
      session.endSession();
    }
  }

  /**
   * Valida que un ID sea válido para MongoDB
   * @param id - ID a validar
   * @param fieldName - Nombre del campo para el mensaje de error
   */
  protected validateId(id: string, fieldName: string = 'ID'): void {
    if (!id) {
      throw new Error(`${fieldName} es requerido`);
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(`${fieldName} no es un ObjectId válido: ${id}`);
    }
  }

  /**
   * Valida que un documento exista en la base de datos
   * @param id - ID del documento a verificar
   * @param session - Sesión de MongoDB (opcional)
   */
  protected async validateExists(id: string, session?: ClientSession): Promise<T> {
    this.validateId(id);
    
    const documento = await this.model.findById(id).session(session || null);
    
    if (!documento) {
      throw new Error(`${this.modelName} con ID ${id} no encontrado`);
    }
    
    return documento;
  }

  /**
   * Valida que los campos requeridos estén presentes en los datos
   * @param data - Datos a validar
   * @param fields - Campos requeridos
   */
  protected validateRequired(data: any, fields: string[]): void {
    if (!data) {
      throw new Error('Los datos son requeridos');
    }
    
    const missingFields = fields.filter(field => {
      const value = data[field];
      return value === undefined || value === null || value === '';
    });
    
    if (missingFields.length > 0) {
      throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Valida formato de email
   * @param email - Email a validar
   * @param fieldName - Nombre del campo para el mensaje de error
   */
  protected validateEmail(email: string, fieldName: string = 'email'): void {
    if (!email) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(`El formato del ${fieldName} no es válido`);
    }
  }

  /**
   * Valida formato de CUIT argentino
   * @param cuit - CUIT a validar
   * @param fieldName - Nombre del campo para el mensaje de error
   */
  protected validateCUIT(cuit: string, fieldName: string = 'CUIT'): void {
    if (!cuit) return;
    
    // Formato argentino: XX-XXXXXXXX-X
    const cuitRegex = /^\d{2}-\d{8}-\d{1}$/;
    if (!cuitRegex.test(cuit)) {
      throw new Error(`El formato del ${fieldName} no es válido (debe ser formato argentino)`);
    }
  }

  /**
   * Valida formato de CUIL argentino
   * @param cuil - CUIL a validar
   * @param fieldName - Nombre del campo para el mensaje de error
   */
  protected validateCUIL(cuil: string, fieldName: string = 'CUIL'): void {
    if (!cuil) return;
    
    // Formato argentino: XX-XXXXXXXX-X
    const cuilRegex = /^\d{2}-\d{8}-\d{1}$/;
    if (!cuilRegex.test(cuil)) {
      throw new Error(`El ${fieldName} debe tener formato XX-XXXXXXXX-X`);
    }
  }

  /**
   * Valida formato de teléfono
   * @param telefono - Teléfono a validar
   * @param fieldName - Nombre del campo para el mensaje de error
   */
  protected validateTelefono(telefono: string, fieldName: string = 'teléfono'): void {
    if (!telefono) return;
    
    // Permitir números con guiones, espacios o sin separadores
    const telefonoRegex = /^[\d\s\-\+\(\)]{8,15}$/;
    if (!telefonoRegex.test(telefono)) {
      throw new Error(`El formato del ${fieldName} no es válido`);
    }
  }

  /**
   * Valida que un valor no esté duplicado en la base de datos
   * @param field - Campo a verificar
   * @param value - Valor a buscar
   * @param excludeId - ID a excluir de la búsqueda (para updates)
   * @param fieldName - Nombre del campo para el mensaje de error
   */
  protected async validateUnique(field: string, value: any, excludeId?: string, fieldName?: string): Promise<void> {
    if (!value) return;
    
    const query: any = { [field]: value };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const existing = await this.model.findOne(query);
    if (existing) {
      const displayName = fieldName || field;
      throw new Error(`Ya existe un registro con ese ${displayName}: ${value}`);
    }
  }

  /**
   * Maneja errores de Mongoose y los convierte a errores más legibles
   * @param error - Error original
   */
  protected handleMongooseError(error: any): never {
    // Error de validación de Mongoose
    if (error instanceof MongooseError.ValidationError) {
      const messages = Object.values(error.errors).map(err => (err as any).message);
      throw new Error(`Errores de validación: ${messages.join(', ')}`);
    }
    
    // Error de clave duplicada (código 11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'campo';
      throw new Error(`Ya existe un registro con ese ${field}`);
    }
    
    // Error de cast (ID inválido)
    if (error instanceof MongooseError.CastError) {
      throw new Error(`ID inválido: ${error.value}`);
    }
    
    // Error de referencia inválida
    if (error.name === 'DocumentNotFoundError') {
      throw new Error(`Documento no encontrado`);
    }
    
    // Error genérico
    this.logError('mongoose_error', error);
    throw new Error(error.message || 'Error interno del servidor');
  }

  // ==================== MÉTODOS CRUD BÁSICOS ====================

  /**
   * Obtiene todos los documentos con paginación optimizada
   */
  async getAll(opciones: PaginationOptions<T> = {}): Promise<PaginationResult<T>> {
    try {
      const { limite = 50, pagina = 1, filtros = {}, ordenamiento, proyeccion } = opciones;
      const skip = (pagina - 1) * limite;
      
      this.logOperation('getAll', { pagina, limite });
      
      const query = filtros as FilterQuery<T>;
      
      // Construir query base
      const findQuery = this.model.find(query)
        .limit(limite)
        .skip(skip)
        .lean();
      
      // Ejecutar consultas en paralelo para mejor rendimiento
      const [data, total] = await Promise.all([
        findQuery.exec(),
        this.model.countDocuments(query)
      ]);
      
      const result = {
        data: data as T[],
        paginacion: {
          total,
          paginas: Math.ceil(total / limite),
          paginaActual: pagina,
          limite
        }
      };
      
      this.logSuccess('getAll', { count: data.length, total });
      return result;
    } catch (error) {
      this.logFailure('getAll', error);
      throw new Error(`Error al obtener ${this.modelName}: ${(error as Error).message}`);
    }
  }

  /**
   * Obtiene un documento por ID con validación mejorada
   */
  async getById(id: string): Promise<T | null> {
    this.logOperation('getById', { id });
    
    try {
      this.validateId(id, 'ID del documento');
      
      const documento = await this.model.findById(id).lean().exec();
      
      if (!documento) {
        this.logWarn(`Documento no encontrado: ${id}`);
        return null;
      }
      
      this.logSuccess('getById', { id, found: true });
      return documento as T;
    } catch (error) {
      this.logFailure('getById', error);
      throw this.handleMongooseError(error);
    }
  }

  /**
   * Crea un nuevo documento con validaciones y transacción mejorada
   */
  async create(data: Partial<T>, options: TransactionOptions = {}): Promise<T> {
    this.logOperation('create', { hasData: !!data });
    
    return this.executeInTransaction(async (session) => {
      // Validar datos antes de crear
      await this.validateData(data);
      
      const documento = new this.model(data);
      const documentoGuardado = await documento.save({ session });
      
      // Hook post-creación
      await this.afterCreate(documentoGuardado, { session });
      
      this.logSuccess('create', { 
        id: documentoGuardado._id,
        created: true
      });
      
      return documentoGuardado;
    }, { autoManage: !options.session });
  }

  /**
   * Actualiza un documento existente con validaciones y transacción mejorada
   */
  async update(id: string, data: Partial<T>, options: TransactionOptions & { upsert?: boolean } = {}): Promise<T | null> {
    const { upsert = false, ...transactionOptions } = options;
    this.logOperation('update', { id, upsert, hasData: !!data });
    
    return this.executeInTransaction(async (session) => {
      this.validateId(id, 'ID del documento');
      await this.validateData(data);
      
      // Verificar existencia si no es upsert
      if (!upsert) {
        await this.validateExists(id, session);
      }
      
      const documentoActualizado = await this.model.findByIdAndUpdate(
        id,
        data,
        { 
          new: true, 
          runValidators: true, 
          session,
          upsert
        }
      );
      
      if (!documentoActualizado && !upsert) {
        throw new Error('Documento no encontrado');
      }
      
      // Hook post-actualización
      if (documentoActualizado) {
        await this.afterUpdate(documentoActualizado, { session });
      }
      
      this.logSuccess('update', { 
        id, 
        updated: !!documentoActualizado,
        upsert 
      });
      
      return documentoActualizado;
    }, { autoManage: !transactionOptions.session });
  }

  /**
   * Elimina un documento con validaciones y transacción mejorada
   */
  async delete(id: string, options: TransactionOptions = {}): Promise<ServiceResult> {
    this.logOperation('delete', { id });
    
    return this.executeInTransaction(async (session) => {
      this.validateId(id, 'ID del documento');
      
      // Obtener el documento antes de eliminarlo para el hook
      const documento = await this.validateExists(id, session);
      
      // Hook pre-eliminación
      await this.beforeDelete(documento, { session });
      
      // Eliminar el documento
      const documentoEliminado = await this.model.findByIdAndDelete(id, { session });
      
      if (!documentoEliminado) {
        throw new Error('Error al eliminar el documento');
      }
      
      this.logSuccess('delete', { 
        id, 
        deleted: true 
      });
      
      return { 
        success: true, 
        message: 'Documento eliminado correctamente',
        data: { id }
      };
    }, { autoManage: !options.session });
  }

  // ==================== OPERACIONES BULK ====================

  /**
   * Ejecuta operaciones bulk con manejo de errores
   */
  protected async executeBulkWrite(operations: any[], options: TransactionOptions = {}): Promise<BulkResult> {
    const session = options.session;
    
    try {
      if (operations.length === 0) {
        logger.info(`${this.modelName}: No se prepararon operaciones para bulk write`);
        return {
          success: true,
          insertados: 0,
          actualizados: 0,
          errores: []
        };
      }
      
      const result = await this.model.bulkWrite(operations, { 
        session, 
        ordered: false 
      });
      
      const bulkResult: BulkResult = {
        success: true,
        insertados: result.insertedCount || 0,
        actualizados: result.modifiedCount || 0,
        errores: []
      };
      
      // Manejar errores de escritura individuales
      if (result.hasWriteErrors && result.hasWriteErrors()) {
        const writeErrors = result.getWriteErrors();
        logger.warn(`${this.modelName}: ${writeErrors.length} errores durante bulkWrite`);
        
        writeErrors.forEach(err => {
          bulkResult.errores.push({
            index: 'N/A',
            message: `Error en operación: ${err.errmsg}`,
            code: err.code,
            data: (err as any).op || 'No disponible'
          });
        });
        
        bulkResult.success = bulkResult.errores.length === 0;
      }
      
      logger.info(`${this.modelName}: BulkWrite completado. Insertados: ${bulkResult.insertados}, Actualizados: ${bulkResult.actualizados}`);
      
      return bulkResult;
    } catch (error) {
      logger.error(`${this.modelName}: Error durante bulkWrite:`, error);
      throw error;
    }
  }

  // ==================== UTILIDADES DE LOGGING ====================

  /**
   * Formatea un contexto estándar para logging
   */
  private formatLogContext(operation: string, data?: any): any {
    const context: any = {
      model: this.modelName,
      operation,
      timestamp: new Date().toISOString()
    };
    
    if (data) {
      context.data = typeof data === 'object' ? data : { value: data };
    }
    
    return context;
  }

  /**
   * Log de inicio de operación
   */
  protected logOperation(operation: string, data?: any): void {
    const context = this.formatLogContext(operation, data);
    logger.info(`[${this.modelName}] ${operation} - iniciado`, context);
  }

  /**
   * Log de operación exitosa
   */
  protected logSuccess(operation: string, result?: any): void {
    const context = this.formatLogContext(operation, result);
    logger.info(`[${this.modelName}] ${operation} - exitoso`, context);
  }

  /**
   * Log de fallo en operación
   */
  protected logFailure(operation: string, error: any): void {
    const context = this.formatLogContext(operation, {
      error: error.message || 'Error desconocido',
      stack: error.stack
    });
    logger.error(`[${this.modelName}] ${operation} - falló`, context);
  }

  /**
   * Log genérico de información con contexto del servicio
   */
  protected logInfo(message: string, data?: any): void {
    const context = this.formatLogContext('info', data);
    logger.info(`[${this.modelName}] ${message}`, context);
  }

  /**
   * Log de error con contexto del servicio
   */
  protected logError(message: string, error: any): void {
    const context = this.formatLogContext('error', {
      error: error.message || 'Error desconocido',
      stack: error.stack
    });
    logger.error(`[${this.modelName}] ${message}`, context);
  }

  /**
   * Log de debug con contexto del servicio
   */
  protected logDebug(message: string, data?: any): void {
    const context = this.formatLogContext('debug', data);
    logger.debug(`[${this.modelName}] ${message}`, context);
  }

  /**
   * Log de advertencia con contexto del servicio
   */
  protected logWarn(message: string, data?: any): void {
    const context = this.formatLogContext('warning', data);
    logger.warn(`[${this.modelName}] ${message}`, context);
  }

  // ==================== MÉTODOS ABSTRACTOS ====================

  /**
   * Los servicios específicos deben implementar validaciones personalizadas
   */
  protected abstract validateData(data: Partial<T>): Promise<void> | void;

  /**
   * Hook que se ejecuta después de crear un documento
   */
  protected async afterCreate(documento: T, options: TransactionOptions = {}): Promise<void> {
    // Implementación por defecto vacía - los servicios específicos pueden sobrescribir
  }

  /**
   * Hook que se ejecuta después de actualizar un documento
   */
  protected async afterUpdate(documento: T, options: TransactionOptions = {}): Promise<void> {
    // Implementación por defecto vacía - los servicios específicos pueden sobrescribir
  }

  /**
   * Hook que se ejecuta antes de eliminar un documento
   */
  protected async beforeDelete(documento: T, options: TransactionOptions = {}): Promise<void> {
    // Implementación por defecto vacía - los servicios específicos pueden sobrescribir
  }
}