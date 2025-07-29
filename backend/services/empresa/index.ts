/**
 * @module services/empresa
 * @description Barrel export para EmpresaService con funciones helper
 */

import empresaService, { EmpresaService } from './empresaService';
import { PaginationOptions, TransactionOptions } from '../BaseService';
import { IEmpresa } from '../../models/Empresa';

// Exportar la clase y la instancia
export { EmpresaService };
export default empresaService;

// ==================== FUNCIONES HELPER ====================

/**
 * Obtiene todas las empresas con paginación
 */
export const getAllEmpresas = (opciones?: PaginationOptions<IEmpresa>) => 
    empresaService.getAll(opciones);

/**
 * Obtiene una empresa por ID
 */
export const getEmpresaById = (id: string) => 
    empresaService.getById(id);

/**
 * Obtiene una empresa por nombre exacto
 */
export const getEmpresaByNombre = (nombre: string) => 
    empresaService.getByNombre(nombre);

/**
 * Obtiene una empresa por CUIT
 */
export const getEmpresaByCuit = (cuit: string) => 
    empresaService.getByCuit(cuit);

/**
 * Obtiene empresas por tipo
 */
export const getEmpresasByTipo = (tipo: 'Propia' | 'Subcontratada', opciones?: PaginationOptions<IEmpresa>) => 
    empresaService.getEmpresasByTipo(tipo, opciones);

/**
 * Obtiene solo las empresas activas
 */
export const getEmpresasActivas = (opciones?: PaginationOptions<IEmpresa>) => 
    empresaService.getEmpresasActivas(opciones);

/**
 * Busca empresas por texto
 */
export const searchEmpresas = (query: string, opciones?: PaginationOptions<IEmpresa>) => 
    empresaService.searchEmpresas(query, opciones);

/**
 * Obtiene estadísticas de empresas
 */
export const getEstadisticas = () => 
    empresaService.getEstadisticas();

/**
 * Crea una nueva empresa
 */
export const createEmpresa = (data: Partial<IEmpresa>, options?: TransactionOptions) => 
    empresaService.create(data, options);

/**
 * Actualiza una empresa existente
 */
export const updateEmpresa = (id: string, data: Partial<IEmpresa>, options?: TransactionOptions) => 
    empresaService.update(id, data, options);

/**
 * Desactiva una empresa
 */
export const deactivateEmpresa = (id: string, options?: TransactionOptions) => 
    empresaService.deactivate(id, options);

/**
 * Reactiva una empresa
 */
export const reactivateEmpresa = (id: string, options?: TransactionOptions) => 
    empresaService.reactivate(id, options);

/**
 * Elimina una empresa (usar con precaución)
 */
export const deleteEmpresa = (id: string, options?: TransactionOptions) => 
    empresaService.delete(id, options);