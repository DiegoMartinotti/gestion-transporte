/**
 * @module services/personal
 * @description Barrel export para PersonalService con funciones helper
 */

import personalService, { PersonalService } from './personalService';
import { PaginationOptions, TransactionOptions } from '../BaseService';
import { IPersonal } from '../../models/Personal';

// Exportar la clase y la instancia
export { PersonalService };
export default personalService;

// ==================== FUNCIONES HELPER ====================

/**
 * Obtiene todo el personal con paginación
 */
export const getAllPersonal = (opciones?: PaginationOptions<IPersonal>) => 
    personalService.getAll(opciones);

/**
 * Obtiene personal por ID
 */
export const getPersonalById = (id: string) => 
    personalService.getById(id);

/**
 * Obtiene personal por DNI
 */
export const getPersonalByDni = (dni: string) => 
    personalService.getByDni(dni);

/**
 * Obtiene todo el personal de una empresa específica
 */
export const getPersonalByEmpresa = (empresaId: string, opciones?: PaginationOptions<IPersonal>) => 
    personalService.getPersonalByEmpresa(empresaId, opciones);

/**
 * Obtiene personal por tipo
 */
export const getPersonalByTipo = (
    tipo: 'Conductor' | 'Administrativo' | 'Mecánico' | 'Supervisor' | 'Otro',
    empresaId?: string,
    opciones?: PaginationOptions<IPersonal>
) => personalService.getPersonalByTipo(tipo, empresaId, opciones);

/**
 * Obtiene solo el personal activo
 */
export const getPersonalActivo = (empresaId?: string, opciones?: PaginationOptions<IPersonal>) => 
    personalService.getPersonalActivo(empresaId, opciones);

/**
 * Busca personal por texto
 */
export const searchPersonal = (query: string, empresaId?: string, opciones?: PaginationOptions<IPersonal>) => 
    personalService.searchPersonal(query, empresaId, opciones);

/**
 * Obtiene personal con vencimientos próximos
 */
export const getPersonalConVencimientos = (diasLimite?: number, empresaId?: string) => 
    personalService.getPersonalConVencimientos(diasLimite, empresaId);

/**
 * Obtiene estadísticas de personal
 */
export const getEstadisticasPersonal = (empresaId?: string) => 
    personalService.getEstadisticas(empresaId);

/**
 * Crea nuevo personal
 */
export const createPersonal = (data: Partial<IPersonal>, options?: TransactionOptions) => 
    personalService.create(data, options);

/**
 * Actualiza personal existente
 */
export const updatePersonal = (id: string, data: Partial<IPersonal>, options?: TransactionOptions) => 
    personalService.update(id, data, options);

/**
 * Desactiva personal
 */
export const deactivatePersonal = (id: string, options?: TransactionOptions) => 
    personalService.deactivate(id, options);

/**
 * Reactiva personal
 */
export const reactivatePersonal = (id: string, options?: TransactionOptions) => 
    personalService.reactivate(id, options);

/**
 * Elimina personal (usar con precaución)
 */
export const deletePersonal = (id: string, options?: TransactionOptions) => 
    personalService.delete(id, options);