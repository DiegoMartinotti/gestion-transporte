/**
 * @module services/cliente
 * @description Barrel export para ClienteService con funciones helper
 */

import clienteService, { ClienteService } from './clienteService';
import { PaginationOptions, TransactionOptions } from '../BaseService';
import { ICliente } from '../../models/Cliente';

// Exportar la clase y la instancia
export { ClienteService };
export default clienteService;

// ==================== FUNCIONES HELPER ====================

/**
 * Obtiene todos los clientes con paginación
 */
export const getAllClientes = (opciones?: PaginationOptions<ICliente>) => 
    clienteService.getAll(opciones);

/**
 * Obtiene un cliente por ID
 */
export const getClienteById = (id: string) => 
    clienteService.getById(id);

/**
 * Obtiene un cliente por CUIT
 */
export const getClienteByCuit = (cuit: string) => 
    clienteService.getByCuit(cuit);

/**
 * Obtiene un cliente por nombre exacto
 */
export const getClienteByNombre = (nombre: string) => 
    clienteService.getByNombre(nombre);

/**
 * Busca clientes por nombre (búsqueda parcial)
 */
export const searchClientesByNombre = (query: string, opciones?: PaginationOptions<ICliente>) => 
    clienteService.searchByNombre(query, opciones);

/**
 * Obtiene solo los clientes activos
 */
export const getClientesActivos = (opciones?: PaginationOptions<ICliente>) => 
    clienteService.getClientesActivos(opciones);

/**
 * Crea un nuevo cliente
 */
export const createCliente = (data: Partial<ICliente>, options?: TransactionOptions) => 
    clienteService.create(data, options);

/**
 * Actualiza un cliente existente
 */
export const updateCliente = (id: string, data: Partial<ICliente>, options?: TransactionOptions) => 
    clienteService.update(id, data, options);

/**
 * Desactiva un cliente
 */
export const deactivateCliente = (id: string, options?: TransactionOptions) => 
    clienteService.deactivate(id, options);

/**
 * Reactiva un cliente
 */
export const reactivateCliente = (id: string, options?: TransactionOptions) => 
    clienteService.reactivate(id, options);

/**
 * Elimina un cliente (usar con precaución)
 */
export const deleteCliente = (id: string, options?: TransactionOptions) => 
    clienteService.delete(id, options);