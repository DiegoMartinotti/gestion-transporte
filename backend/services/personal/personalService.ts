/**
 * @module services/personal/personalService
 * @description Servicio para la gestión de personal usando BaseService
 */

import Personal, { IPersonal } from '../../models/Personal';
import Empresa from '../../models/Empresa';
import { BaseService, PaginationOptions, TransactionOptions } from '../BaseService';
import { Types } from 'mongoose';
import logger from '../../utils/logger';

/**
 * Interfaz para vencimientos próximos
 */
interface IVencimiento {
    tipo: string;
    vencimiento: Date;
}

/**
 * Servicio especializado para la gestión de personal
 * Hereda toda la funcionalidad básica de BaseService y añade lógica específica
 */
class PersonalService extends BaseService<IPersonal> {
    constructor() {
        super(Personal);
    }

    // ==================== VALIDACIONES ESPECÍFICAS ====================

    /**
     * Valida los datos específicos de personal
     * @param data - Datos del personal a validar
     */
    protected async validateData(data: Partial<IPersonal>): Promise<void> {
        // Validar campos requeridos
        if (data.nombre !== undefined) {
            this.validateRequired(data, ['nombre']);
            
            if (data.nombre.length < 2) {
                throw new Error('El nombre debe tener al menos 2 caracteres');
            }
        }

        if (data.apellido !== undefined) {
            this.validateRequired(data, ['apellido']);
            
            if (data.apellido.length < 2) {
                throw new Error('El apellido debe tener al menos 2 caracteres');
            }
        }

        if (data.dni !== undefined) {
            this.validateRequired(data, ['dni']);
            this.validateDni(data.dni);
        }

        if (data.tipo !== undefined) {
            this.validateRequired(data, ['tipo']);
            this.validateTipoPersonal(data.tipo);
        }

        if (data.empresa !== undefined) {
            this.validateRequired(data, ['empresa']);
            await this.validateEmpresaExists(data.empresa as Types.ObjectId | string);
        }

        // Validar CUIL si está presente
        if (data.cuil) {
            this.validateCUIL(data.cuil);
        }

        // Validar email si está presente
        if (data.contacto?.email) {
            this.validateEmail(data.contacto.email);
        }

        // Validar fecha de nacimiento si está presente
        if (data.fechaNacimiento) {
            this.validateFechaNacimiento(data.fechaNacimiento);
        }

        // Validar número de legajo si está presente y es modificación
        if (data.numeroLegajo && data.empresa) {
            await this.validateUniqueLegajo(data.numeroLegajo, data.empresa as Types.ObjectId | string, data._id?.toString());
        }

        // La validación de unicidad de DNI se maneja a nivel de modelo con unique: true
    }

    /**
     * Valida formato de DNI argentino
     * @param dni - DNI a validar
     */
    private validateDni(dni: string): void {
        const dniRegex = /^[0-9]{7,8}$/;
        const cleanDni = dni.replace(/\D/g, '');
        if (!dniRegex.test(cleanDni)) {
            throw new Error('El DNI debe tener 7 u 8 dígitos');
        }
    }

    // Método validateCuil migrado a BaseService como validateCUIL

    /**
     * Valida que el tipo de personal sea válido
     * @param tipo - Tipo de personal
     */
    private validateTipoPersonal(tipo: string): void {
        const tiposValidos = ['Conductor', 'Administrativo', 'Mecánico', 'Supervisor', 'Otro'];
        if (!tiposValidos.includes(tipo)) {
            throw new Error(`El tipo debe ser uno de: ${tiposValidos.join(', ')}`);
        }
    }

    // Método validateEmail migrado a BaseService

    /**
     * Valida que la fecha de nacimiento sea lógica
     * @param fecha - Fecha de nacimiento
     */
    private validateFechaNacimiento(fecha: Date): void {
        const hoy = new Date();
        const edad = hoy.getFullYear() - fecha.getFullYear();
        
        if (edad < 16 || edad > 100) {
            throw new Error('La edad debe estar entre 16 y 100 años');
        }
    }

    /**
     * Valida que la empresa existe y está activa
     * @param empresaId - ID de la empresa
     */
    private async validateEmpresaExists(empresaId: Types.ObjectId | string): Promise<void> {
        const empresa = await Empresa.findById(empresaId);
        if (!empresa) {
            throw new Error(`Empresa con ID ${empresaId} no encontrada`);
        }
        
        if (!empresa.activa) {
            throw new Error('No se puede asignar personal a una empresa inactiva');
        }
    }

    /**
     * Valida que el número de legajo sea único dentro de la empresa
     * @param numeroLegajo - Número de legajo
     * @param empresaId - ID de la empresa
     * @param excludeId - ID a excluir de la validación (para updates)
     */
    private async validateUniqueLegajo(numeroLegajo: string, empresaId: Types.ObjectId | string, excludeId?: string): Promise<void> {
        const existing = await this.model.findOne({
            empresa: empresaId,
            numeroLegajo: numeroLegajo.trim(),
            ...(excludeId ? { _id: { $ne: excludeId } } : {})
        });

        if (existing) {
            throw new Error(`El número de legajo ${numeroLegajo} ya está en uso en esta empresa`);
        }
    }

    // ==================== MÉTODOS ESPECÍFICOS ====================

    /**
     * Busca personal por DNI
     * @param dni - DNI del personal
     * @returns Personal encontrado o null
     */
    async getByDni(dni: string): Promise<IPersonal | null> {
        this.logOperation('getByDni', { dni });
        
        try {
            if (!dni) {
                throw new Error('DNI es requerido');
            }

            const cleanDni = dni.replace(/\D/g, '');
            const personal = await this.model.findOne({ dni: cleanDni }).lean().exec();
            
            if (personal) {
                this.logSuccess('getByDni', { dni, found: true });
            } else {
                this.logWarn(`Personal no encontrado con DNI: ${dni}`);
            }
            
            return personal as IPersonal;
        } catch (error) {
            this.logFailure('getByDni', error);
            throw this.handleMongooseError(error);
        }
    }

    /**
     * Obtiene todo el personal de una empresa específica
     * @param empresaId - ID de la empresa
     * @param opciones - Opciones de paginación
     * @returns Resultado paginado con personal de la empresa
     */
    async getPersonalByEmpresa(empresaId: string, opciones: PaginationOptions<IPersonal> = {}) {
        this.logOperation('getPersonalByEmpresa', { empresaId, opciones });
        
        try {
            this.validateId(empresaId, 'Empresa ID');

            const filtros = {
                ...opciones.filtros,
                empresa: empresaId
            };

            const resultado = await this.getAll({ ...opciones, filtros });
            
            this.logSuccess('getPersonalByEmpresa', { 
                empresaId, 
                found: resultado.data.length,
                total: resultado.paginacion.total 
            });
            
            return resultado;
        } catch (error) {
            this.logFailure('getPersonalByEmpresa', error);
            throw this.handleMongooseError(error);
        }
    }

    /**
     * Obtiene personal por tipo
     * @param tipo - Tipo de personal
     * @param empresaId - ID de empresa (opcional)
     * @param opciones - Opciones de paginación
     * @returns Resultado paginado con personal del tipo especificado
     */
    async getPersonalByTipo(
        tipo: 'Conductor' | 'Administrativo' | 'Mecánico' | 'Supervisor' | 'Otro',
        empresaId?: string,
        opciones: PaginationOptions<IPersonal> = {}
    ) {
        this.logOperation('getPersonalByTipo', { tipo, empresaId, opciones });
        
        try {
            this.validateTipoPersonal(tipo);
            
            const filtros: any = {
                ...opciones.filtros,
                tipo: tipo
            };

            if (empresaId) {
                this.validateId(empresaId, 'Empresa ID');
                filtros.empresa = empresaId;
            }

            const resultado = await this.getAll({ ...opciones, filtros });
            
            this.logSuccess('getPersonalByTipo', { 
                tipo, 
                empresaId,
                found: resultado.data.length,
                total: resultado.paginacion.total 
            });
            
            return resultado;
        } catch (error) {
            this.logFailure('getPersonalByTipo', error);
            throw this.handleMongooseError(error);
        }
    }

    /**
     * Obtiene solo el personal activo
     * @param empresaId - ID de empresa (opcional)
     * @param opciones - Opciones de paginación
     * @returns Resultado paginado con personal activo
     */
    async getPersonalActivo(empresaId?: string, opciones: PaginationOptions<IPersonal> = {}) {
        this.logOperation('getPersonalActivo', { empresaId, opciones });
        
        const filtros: any = {
            ...opciones.filtros,
            activo: true
        };

        if (empresaId) {
            this.validateId(empresaId, 'Empresa ID');
            filtros.empresa = empresaId;
        }

        return this.getAll({ ...opciones, filtros });
    }

    /**
     * Busca personal por texto en nombre, apellido, DNI o número de legajo
     * @param query - Texto a buscar
     * @param empresaId - ID de empresa (opcional)
     * @param opciones - Opciones de paginación
     * @returns Resultado paginado con personal encontrado
     */
    async searchPersonal(query: string, empresaId?: string, opciones: PaginationOptions<IPersonal> = {}) {
        this.logOperation('searchPersonal', { query, empresaId, opciones });
        
        try {
            if (!query || query.trim().length < 2) {
                throw new Error('La consulta debe tener al menos 2 caracteres');
            }

            const searchRegex = { $regex: query.trim(), $options: 'i' };
            const filtros: any = {
                ...opciones.filtros,
                $or: [
                    { nombre: searchRegex },
                    { apellido: searchRegex },
                    { dni: searchRegex },
                    { numeroLegajo: searchRegex }
                ]
            };

            if (empresaId) {
                this.validateId(empresaId, 'Empresa ID');
                filtros.empresa = empresaId;
            }

            const resultado = await this.getAll({ ...opciones, filtros });
            
            this.logSuccess('searchPersonal', { 
                query, 
                empresaId,
                found: resultado.data.length,
                total: resultado.paginacion.total 
            });
            
            return resultado;
        } catch (error) {
            this.logFailure('searchPersonal', error);
            throw this.handleMongooseError(error);
        }
    }

    /**
     * Obtiene personal con vencimientos próximos
     * @param diasLimite - Días límite para considerar vencimiento próximo (default: 30)
     * @param empresaId - ID de empresa (opcional)
     * @returns Personal con vencimientos próximos
     */
    async getPersonalConVencimientos(diasLimite: number = 30, empresaId?: string) {
        this.logOperation('getPersonalConVencimientos', { diasLimite, empresaId });
        
        try {
            const fechaLimite = new Date();
            fechaLimite.setDate(fechaLimite.getDate() + diasLimite);

            const filtros: any = {
                activo: true,
                $or: [
                    { 'documentacion.licenciaConducir.vencimiento': { $lte: fechaLimite } },
                    { 'documentacion.psicofisico.vencimiento': { $lte: fechaLimite } },
                    { 'documentacion.carnetProfesional.vencimiento': { $lte: fechaLimite } }
                ]
            };

            if (empresaId) {
                this.validateId(empresaId, 'Empresa ID');
                filtros.empresa = empresaId;
            }

            const personal = await this.model.find(filtros)
                .populate('empresa', 'nombre')
                .lean()
                .exec();

            this.logSuccess('getPersonalConVencimientos', { 
                diasLimite, 
                empresaId,
                found: personal.length
            });
            
            return personal as IPersonal[];
        } catch (error) {
            this.logFailure('getPersonalConVencimientos', error);
            throw this.handleMongooseError(error);
        }
    }

    /**
     * Desactiva personal en lugar de eliminarlo
     * @param id - ID del personal
     * @param options - Opciones de transacción
     * @returns Resultado de la operación
     */
    async deactivate(id: string, options: TransactionOptions = {}) {
        this.logOperation('deactivate', { id });
        
        try {
            const personal = await this.update(id, { activo: false }, options);
            
            if (personal) {
                this.logSuccess('deactivate', { id, deactivated: true });
            }
            
            return {
                success: true,
                message: 'Personal desactivado correctamente',
                data: personal
            };
        } catch (error) {
            this.logFailure('deactivate', error);
            throw error;
        }
    }

    /**
     * Reactiva personal
     * @param id - ID del personal
     * @param options - Opciones de transacción
     * @returns Personal reactivado
     */
    async reactivate(id: string, options: TransactionOptions = {}) {
        this.logOperation('reactivate', { id });
        
        try {
            const personal = await this.update(id, { activo: true }, options);
            
            if (personal) {
                this.logSuccess('reactivate', { id, reactivated: true });
            }
            
            return {
                success: true,
                message: 'Personal reactivado correctamente',
                data: personal
            };
        } catch (error) {
            this.logFailure('reactivate', error);
            throw error;
        }
    }

    /**
     * Obtiene estadísticas de personal
     * @param empresaId - ID de empresa (opcional)
     * @returns Estadísticas agrupadas por tipo y estado
     */
    async getEstadisticas(empresaId?: string) {
        this.logOperation('getEstadisticas', { empresaId });
        
        try {
            const matchFilter: any = {};
            if (empresaId) {
                this.validateId(empresaId, 'Empresa ID');
                matchFilter.empresa = new Types.ObjectId(empresaId);
            }

            const stats = await this.model.aggregate([
                { $match: matchFilter },
                {
                    $group: {
                        _id: {
                            tipo: '$tipo',
                            activo: '$activo'
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: '$_id.tipo',
                        activos: {
                            $sum: {
                                $cond: [{ $eq: ['$_id.activo', true] }, '$count', 0]
                            }
                        },
                        inactivos: {
                            $sum: {
                                $cond: [{ $eq: ['$_id.activo', false] }, '$count', 0]
                            }
                        },
                        total: { $sum: '$count' }
                    }
                },
                {
                    $project: {
                        tipo: '$_id',
                        activos: 1,
                        inactivos: 1,
                        total: 1,
                        _id: 0
                    }
                }
            ]);

            this.logSuccess('getEstadisticas', { empresaId, grupos: stats.length });
            
            return stats;
        } catch (error) {
            this.logFailure('getEstadisticas', error);
            throw this.handleMongooseError(error);
        }
    }

    // ==================== HOOKS DE LIFECYCLE ====================

    /**
     * Hook ejecutado después de crear personal
     * @param personal - Personal recién creado
     * @param options - Opciones de transacción
     */
    protected async afterCreate(personal: IPersonal, options: TransactionOptions = {}): Promise<void> {
        this.logInfo(`Personal creado exitosamente: ${personal.nombre} ${personal.apellido} (DNI: ${personal.dni})`);
        
        // Aquí se pueden agregar acciones adicionales después de crear personal
        // como notificaciones, asignación automática a la empresa, etc.
    }

    /**
     * Hook ejecutado después de actualizar personal
     * @param personal - Personal actualizado
     * @param options - Opciones de transacción
     */
    protected async afterUpdate(personal: IPersonal, options: TransactionOptions = {}): Promise<void> {
        this.logInfo(`Personal actualizado exitosamente: ${personal.nombre} ${personal.apellido} (${personal._id})`);
    }

    /**
     * Hook ejecutado antes de eliminar personal
     * @param personal - Personal a eliminar
     * @param options - Opciones de transacción
     */
    protected async beforeDelete(personal: IPersonal, options: TransactionOptions = {}): Promise<void> {
        // Verificar que no tenga viajes asignados activos
        // Esto se puede implementar cuando se necesite
        this.logWarn(`Preparando eliminación del personal: ${personal.nombre} ${personal.apellido} (${personal._id})`);
        
        // Podrías agregar aquí validaciones para no eliminar personal con viajes activos
    }
}

// Instancia única del servicio
const personalService = new PersonalService();

export { PersonalService };
export default personalService;