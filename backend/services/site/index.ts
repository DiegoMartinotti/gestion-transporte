/**
 * @module services/site
 * @description Barrel export para SiteService con funciones helper
 */

import siteService, { SiteService } from './siteService';
import { PaginationOptions, TransactionOptions } from '../BaseService';
import { ISite } from '../../models/Site';

// Exportar la clase y la instancia
export { SiteService };
export default siteService;

// ==================== FUNCIONES HELPER ====================

/**
 * Obtiene todos los sites con paginación
 */
export const getAllSites = (opciones?: PaginationOptions<ISite>) => 
    siteService.getAll(opciones);

/**
 * Obtiene un site por ID
 */
export const getSiteById = (id: string) => 
    siteService.getById(id);

/**
 * Obtiene un site por cliente y nombre
 */
export const getSiteByClienteAndNombre = (clienteId: string, nombre: string) => 
    siteService.getByClienteAndNombre(clienteId, nombre);

/**
 * Obtiene todos los sites de un cliente específico
 */
export const getSitesByCliente = (clienteId: string, opciones?: PaginationOptions<ISite>) => 
    siteService.getSitesByCliente(clienteId, opciones);

/**
 * Busca sites por texto
 */
export const searchSites = (query: string, clienteId?: string, opciones?: PaginationOptions<ISite>) => 
    siteService.searchSites(query, clienteId, opciones);

/**
 * Obtiene sites cerca de una ubicación
 */
export const getSitesNearLocation = (
    lng: number, 
    lat: number, 
    maxDistance?: number, 
    opciones?: PaginationOptions<ISite>
) => siteService.getSitesNearLocation(lng, lat, maxDistance, opciones);

/**
 * Obtiene sites agrupados por localidad
 */
export const getSitesByLocalidad = (clienteId?: string) => 
    siteService.getSitesByLocalidad(clienteId);

/**
 * Crea un nuevo site
 */
export const createSite = (data: Partial<ISite>, options?: TransactionOptions) => 
    siteService.create(data, options);

/**
 * Actualiza un site existente
 */
export const updateSite = (id: string, data: Partial<ISite>, options?: TransactionOptions) => 
    siteService.update(id, data, options);

/**
 * Elimina un site
 */
export const deleteSite = (id: string, options?: TransactionOptions) => 
    siteService.delete(id, options);