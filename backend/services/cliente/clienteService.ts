/**
 * @module services/cliente/clienteService
 * @description Servicio para la gestión de clientes usando BaseService
 */

import Cliente, { ICliente } from '../../models/Cliente';
import { BaseService, PaginationOptions, TransactionOptions } from '../BaseService';
import logger from '../../utils/logger';

/**
 * Servicio especializado para la gestión de clientes
 * Hereda toda la funcionalidad básica de BaseService y añade lógica específica
 */
class ClienteService extends BaseService<ICliente> {
    constructor() {
        super(Cliente);
    }

    // ==================== VALIDACIONES ESPECÍFICAS ====================

    /**
     * Valida los datos específicos de un cliente
     * @param data - Datos del cliente a validar
     */
    protected async validateData(data: Partial<ICliente>): Promise<void> {
        // Validar campos requeridos específicos
        if (data.nombre !== undefined) {
            this.validateRequired(data, ['nombre']);
            
            if (data.nombre.length < 3) {
                throw new Error('El nombre del cliente debe tener al menos 3 caracteres');
            }
        }

        if (data.cuit !== undefined) {
            this.validateRequired(data, ['cuit']);
            
            // Validar formato de CUIT argentino (11 dígitos)
            const cuitRegex = /^\d{11}$/;
            if (!cuitRegex.test(data.cuit.replace(/[-\s]/g, ''))) {
                throw new Error('El CUIT debe tener 11 dígitos');
            }
        }

        // Validar unicidad del nombre si está presente
        if (data.nombre) {
            await this.validateUniqueNombre(data.nombre, data._id?.toString());
        }

        // Validar unicidad del CUIT si está presente
        if (data.cuit) {
            await this.validateUniqueCuit(data.cuit, data._id?.toString());
        }
    }

    /**
     * Valida que el nombre del cliente sea único
     * @param nombre - Nombre a validar
     * @param excludeId - ID a excluir de la validación (para updates)
     */
    private async validateUniqueNombre(nombre: string, excludeId?: string): Promise<void> {
        const existingCliente = await this.model.findOne({ 
            nombre: nombre.trim(),
            ...(excludeId ? { _id: { $ne: excludeId } } : {})
        });

        if (existingCliente) {
            throw new Error(`Ya existe un cliente con el nombre: ${nombre}`);
        }
    }

    /**
     * Valida que el CUIT del cliente sea único
     * @param cuit - CUIT a validar
     * @param excludeId - ID a excluir de la validación (para updates)
     */
    private async validateUniqueCuit(cuit: string, excludeId?: string): Promise<void> {
        const cleanCuit = cuit.replace(/[-\s]/g, '');
        const existingCliente = await this.model.findOne({ 
            cuit: cleanCuit,
            ...(excludeId ? { _id: { $ne: excludeId } } : {})
        });

        if (existingCliente) {
            throw new Error(`Ya existe un cliente con el CUIT: ${cuit}`);
        }
    }

    // ==================== MÉTODOS ESPECÍFICOS ====================

    /**
     * Busca un cliente por CUIT
     * @param cuit - CUIT del cliente
     * @returns Cliente encontrado o null
     */
    async getByCuit(cuit: string): Promise<ICliente | null> {
        this.logOperation('getByCuit', { cuit });
        
        try {
            if (!cuit) {
                throw new Error('CUIT es requerido');
            }

            const cleanCuit = cuit.replace(/[-\s]/g, '');
            const cliente = await this.model.findOne({ cuit: cleanCuit }).lean().exec();
            
            if (cliente) {
                this.logSuccess('getByCuit', { cuit, found: true });
            } else {
                this.logWarn(`Cliente no encontrado con CUIT: ${cuit}`);
            }
            
            return cliente as ICliente;
        } catch (error) {
            this.logFailure('getByCuit', error);
            throw this.handleMongooseError(error);
        }
    }

    /**
     * Busca un cliente por nombre (búsqueda exacta)
     * @param nombre - Nombre del cliente
     * @returns Cliente encontrado o null
     */
    async getByNombre(nombre: string): Promise<ICliente | null> {
        this.logOperation('getByNombre', { nombre });
        
        try {
            if (!nombre) {
                throw new Error('Nombre es requerido');
            }

            const cliente = await this.model.findOne({ 
                nombre: nombre.trim() 
            }).lean().exec();
            
            if (cliente) {
                this.logSuccess('getByNombre', { nombre, found: true });
            } else {
                this.logWarn(`Cliente no encontrado con nombre: ${nombre}`);
            }
            
            return cliente as ICliente;
        } catch (error) {
            this.logFailure('getByNombre', error);
            throw this.handleMongooseError(error);
        }
    }

    /**
     * Busca clientes por nombre (búsqueda parcial)
     * @param query - Texto a buscar en el nombre
     * @param opciones - Opciones de paginación
     * @returns Resultado paginado con clientes encontrados
     */
    async searchByNombre(query: string, opciones: PaginationOptions<ICliente> = {}) {
        this.logOperation('searchByNombre', { query, opciones });
        
        try {
            if (!query || query.trim().length < 2) {
                throw new Error('La consulta debe tener al menos 2 caracteres');
            }

            const filtros = {
                ...opciones.filtros,
                nombre: { $regex: query.trim(), $options: 'i' }
            };

            const resultado = await this.getAll({ ...opciones, filtros });
            
            this.logSuccess('searchByNombre', { 
                query, 
                found: resultado.data.length,
                total: resultado.paginacion.total 
            });
            
            return resultado;
        } catch (error) {
            this.logFailure('searchByNombre', error);
            throw this.handleMongooseError(error);
        }
    }

    /**
     * Obtiene solo los clientes activos
     * @param opciones - Opciones de paginación
     * @returns Resultado paginado con clientes activos
     */
    async getClientesActivos(opciones: PaginationOptions<ICliente> = {}) {
        this.logOperation('getClientesActivos', { opciones });
        
        const filtros = {
            ...opciones.filtros,
            activo: true
        };

        return this.getAll({ ...opciones, filtros });
    }

    /**
     * Desactiva un cliente en lugar de eliminarlo
     * @param id - ID del cliente
     * @param options - Opciones de transacción
     * @returns Resultado de la operación
     */
    async deactivate(id: string, options: TransactionOptions = {}) {
        this.logOperation('deactivate', { id });
        
        try {
            const cliente = await this.update(id, { activo: false }, options);
            
            if (cliente) {
                this.logSuccess('deactivate', { id, deactivated: true });
            }
            
            return {
                success: true,
                message: 'Cliente desactivado correctamente',
                data: cliente
            };
        } catch (error) {
            this.logFailure('deactivate', error);
            throw error;
        }
    }

    /**
     * Reactiva un cliente
     * @param id - ID del cliente
     * @param options - Opciones de transacción
     * @returns Cliente reactivado
     */
    async reactivate(id: string, options: TransactionOptions = {}) {
        this.logOperation('reactivate', { id });
        
        try {
            const cliente = await this.update(id, { activo: true }, options);
            
            if (cliente) {
                this.logSuccess('reactivate', { id, reactivated: true });
            }
            
            return {
                success: true,
                message: 'Cliente reactivado correctamente',
                data: cliente
            };
        } catch (error) {
            this.logFailure('reactivate', error);
            throw error;
        }
    }

    // ==================== HOOKS DE LIFECYCLE ====================

    /**
     * Hook ejecutado después de crear un cliente
     * @param cliente - Cliente recién creado
     * @param options - Opciones de transacción
     */
    protected async afterCreate(cliente: ICliente, options: TransactionOptions = {}): Promise<void> {
        this.logInfo(`Cliente creado exitosamente: ${cliente.nombre} (${cliente.cuit})`);
        
        // Aquí se pueden agregar acciones adicionales después de crear un cliente
        // como notificaciones, logging adicional, etc.
    }

    /**
     * Hook ejecutado después de actualizar un cliente
     * @param cliente - Cliente actualizado
     * @param options - Opciones de transacción
     */
    protected async afterUpdate(cliente: ICliente, options: TransactionOptions = {}): Promise<void> {
        this.logInfo(`Cliente actualizado exitosamente: ${cliente.nombre} (${cliente.cuit})`);
    }

    /**
     * Hook ejecutado antes de eliminar un cliente
     * @param cliente - Cliente a eliminar
     * @param options - Opciones de transacción
     */
    protected async beforeDelete(cliente: ICliente, options: TransactionOptions = {}): Promise<void> {
        // Verificar que no tenga sites, tramos o viajes asociados
        // Esto se puede implementar cuando se necesite
        this.logWarn(`Preparando eliminación del cliente: ${cliente.nombre} (${cliente.cuit})`);
    }
}

// Instancia única del servicio
const clienteService = new ClienteService();

export { ClienteService };
export default clienteService;