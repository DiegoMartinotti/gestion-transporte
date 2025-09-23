/**
 * @module services/site/siteService
 * @description Servicio para la gestión de sites usando BaseService
 */

import Site, { ISite } from '../../models/Site';
import Cliente from '../../models/Cliente';
import { BaseService, PaginationOptions, TransactionOptions } from '../BaseService';
import { Types } from 'mongoose';

/**
 * Servicio especializado para la gestión de sites
 * Hereda toda la funcionalidad básica de BaseService y añade lógica específica
 */
class SiteService extends BaseService<ISite> {
    private static readonly CLIENTE_ID_VALIDATION_NAME = 'Cliente ID';

    constructor() {
        super(Site);
    }

    // ==================== VALIDACIONES ESPECÍFICAS ====================

    /**
     * Valida los datos específicos de un site
     * @param data - Datos del site a validar
     */
    protected async validateData(data: Partial<ISite>): Promise<void> {
        // Validar campos requeridos
        if (data.nombre !== undefined) {
            this.validateRequired(data, ['nombre']);
            
            if (data.nombre.length < 2) {
                throw new Error('El nombre del site debe tener al menos 2 caracteres');
            }
        }

        if (data.cliente !== undefined) {
            this.validateRequired(data, ['cliente']);
            
            // Validar que el cliente existe
            await this.validateClienteExists(data.cliente);
        }

        // Validar coordenadas si están presentes
        if (data.location?.coordinates) {
            this.validateSiteCoordinates(data.location.coordinates);
        }

        // Las validaciones de unicidad (nombre + cliente) se manejan en el modelo
        // mediante el pre-save hook, por lo que no necesitamos duplicarlas aquí
    }

    /**
     * Valida que el cliente existe
     * @param clienteId - ID del cliente
     */
    private async validateClienteExists(clienteId: Types.ObjectId | string): Promise<void> {
        const cliente = await Cliente.findById(clienteId);
        if (!cliente) {
            throw new Error(`Cliente con ID ${clienteId} no encontrado`);
        }
        
        if (!cliente.activo) {
            throw new Error('No se puede crear un site para un cliente inactivo');
        }
    }

    /**
     * Valida que las coordenadas sean válidas
     * @param coordinates - Array [longitude, latitude]
     */
    private validateSiteCoordinates(coordinates: number[]): void {
        if (!Array.isArray(coordinates) || coordinates.length !== 2) {
            throw new Error('Las coordenadas deben ser un array de [longitud, latitud]');
        }

        const [lng, lat] = coordinates;
        
        if (typeof lng !== 'number' || typeof lat !== 'number') {
            throw new Error('Las coordenadas deben ser números');
        }

        if (lng < -180 || lng > 180) {
            throw new Error('La longitud debe estar entre -180 y 180');
        }

        if (lat < -90 || lat > 90) {
            throw new Error('La latitud debe estar entre -90 y 90');
        }
    }

    // ==================== MÉTODOS ESPECÍFICOS ====================

    /**
     * Busca un site por cliente y nombre
     * @param clienteId - ID del cliente
     * @param nombre - Nombre del site
     * @returns Site encontrado o null
     */
    async getByClienteAndNombre(clienteId: string, nombre: string): Promise<ISite | null> {
        this.logOperation('getByClienteAndNombre', { clienteId, nombre });
        
        try {
            this.validateId(clienteId, SiteService.CLIENTE_ID_VALIDATION_NAME);
            
            if (!nombre) {
                throw new Error('Nombre del site es requerido');
            }

            const site = await (this.model as unknown).findByClienteAndNombre(clienteId, nombre);
            
            if (site) {
                this.logSuccess('getByClienteAndNombre', { clienteId, nombre, found: true });
            } else {
                this.logWarn(`Site no encontrado: ${nombre} para cliente ${clienteId}`);
            }
            
            return site;
        } catch (error) {
            this.logFailure('getByClienteAndNombre', error);
            throw this.handleMongooseError(error);
        }
    }

    /**
     * Obtiene todos los sites de un cliente específico
     * @param clienteId - ID del cliente
     * @param opciones - Opciones de paginación
     * @returns Resultado paginado con sites del cliente
     */
    async getSitesByCliente(clienteId: string, opciones: PaginationOptions<ISite> = {}) {
        this.logOperation('getSitesByCliente', { clienteId, opciones });
        
        try {
            this.validateId(clienteId, SiteService.CLIENTE_ID_VALIDATION_NAME);

            const filtros = {
                ...opciones.filtros,
                cliente: clienteId
            };

            const resultado = await this.getAll({ ...opciones, filtros });
            
            this.logSuccess('getSitesByCliente', { 
                clienteId, 
                found: resultado.data.length,
                total: resultado.paginacion.total 
            });
            
            return resultado;
        } catch (error) {
            this.logFailure('getSitesByCliente', error);
            throw this.handleMongooseError(error);
        }
    }

    /**
     * Busca sites por texto en nombre, código o dirección
     * @param query - Texto a buscar
     * @param clienteId - ID del cliente (opcional, filtra por cliente)
     * @param opciones - Opciones de paginación
     * @returns Resultado paginado con sites encontrados
     */
    async searchSites(query: string, clienteId?: string, opciones: PaginationOptions<ISite> = {}) {
        this.logOperation('searchSites', { query, clienteId, opciones });
        
        try {
            if (!query || query.trim().length < 2) {
                throw new Error('La consulta debe tener al menos 2 caracteres');
            }

            const searchRegex = { $regex: query.trim(), $options: 'i' };
            const filtros: unknown = {
                ...opciones.filtros,
                $or: [
                    { nombre: searchRegex },
                    { codigo: searchRegex },
                    { direccion: searchRegex },
                    { localidad: searchRegex },
                    { provincia: searchRegex }
                ]
            };

            // Filtrar por cliente si se especifica
            if (clienteId) {
                this.validateId(clienteId, SiteService.CLIENTE_ID_VALIDATION_NAME);
                filtros.cliente = clienteId;
            }

            const resultado = await this.getAll({ ...opciones, filtros });
            
            this.logSuccess('searchSites', { 
                query, 
                clienteId,
                found: resultado.data.length,
                total: resultado.paginacion.total 
            });
            
            return resultado;
        } catch (error) {
            this.logFailure('searchSites', error);
            throw this.handleMongooseError(error);
        }
    }

    /**
     * Busca sites cerca de una ubicación específica
     * @param lng - Longitud
     * @param lat - Latitud
     * @param maxDistance - Distancia máxima en metros (default: 5000m = 5km)
     * @param opciones - Opciones de paginación
     * @returns Sites encontrados cerca de la ubicación
     */
    async getSitesNearLocation(
        lng: number, 
        lat: number, 
        maxDistance: number = 5000,
        opciones: PaginationOptions<ISite> = {}
    ) {
        this.logOperation('getSitesNearLocation', { lng, lat, maxDistance, opciones });
        
        try {
            this.validateSiteCoordinates([lng, lat]);

            const { limite = 50, pagina = 1, filtros = {} } = opciones;
            const skip = (pagina - 1) * limite;

            const agregacion: unknown[] = [
                {
                    $geoNear: {
                        near: {
                            type: 'Point',
                            coordinates: [lng, lat]
                        },
                        distanceField: 'distance',
                        maxDistance: maxDistance,
                        spherical: true
                    }
                },
                { $match: filtros },
                { $skip: skip },
                { $limit: limite }
            ];

            const [data, totalResult] = await Promise.all([
                this.model.aggregate(agregacion),
                this.model.aggregate([
                    {
                        $geoNear: {
                            near: {
                                type: 'Point',
                                coordinates: [lng, lat]
                            },
                            distanceField: 'distance',
                            maxDistance: maxDistance,
                            spherical: true
                        }
                    },
                    { $match: filtros },
                    { $count: 'total' }
                ])
            ]);

            const total = totalResult[0]?.total || 0;

            const resultado = {
                data: data as ISite[],
                paginacion: {
                    total,
                    paginas: Math.ceil(total / limite),
                    paginaActual: pagina,
                    limite
                }
            };

            this.logSuccess('getSitesNearLocation', { 
                lng, lat, maxDistance,
                found: resultado.data.length,
                total: resultado.paginacion.total 
            });
            
            return resultado;
        } catch (error) {
            this.logFailure('getSitesNearLocation', error);
            throw this.handleMongooseError(error);
        }
    }

    /**
     * Obtiene sites agrupados por localidad
     * @param clienteId - ID del cliente (optional)
     * @returns Sites agrupados por localidad
     */
    async getSitesByLocalidad(clienteId?: string) {
        this.logOperation('getSitesByLocalidad', { clienteId });
        
        try {
            const matchFilter: unknown = {};
            if (clienteId) {
                this.validateId(clienteId, SiteService.CLIENTE_ID_VALIDATION_NAME);
                matchFilter.cliente = new Types.ObjectId(clienteId);
            }

            const agregacion: unknown[] = [
                { $match: matchFilter },
                {
                    $group: {
                        _id: {
                            localidad: '$localidad',
                            provincia: '$provincia'
                        },
                        sites: {
                            $push: {
                                _id: '$_id',
                                nombre: '$nombre',
                                codigo: '$codigo',
                                direccion: '$direccion',
                                coordenadas: '$location.coordinates'
                            }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        localidad: '$_id.localidad',
                        provincia: '$_id.provincia',
                        sites: 1,
                        count: 1,
                        _id: 0
                    }
                },
                { $sort: { provincia: 1 as const, localidad: 1 as const } }
            ];

            const resultado = await this.model.aggregate(agregacion);
            
            this.logSuccess('getSitesByLocalidad', { 
                clienteId,
                grupos: resultado.length
            });
            
            return resultado;
        } catch (error) {
            this.logFailure('getSitesByLocalidad', error);
            throw this.handleMongooseError(error);
        }
    }

    // ==================== HOOKS DE LIFECYCLE ====================

    /**
     * Hook ejecutado después de crear un site
     * @param site - Site recién creado
     * @param options - Opciones de transacción
     */
    protected async afterCreate(site: ISite, _options: TransactionOptions = {}): Promise<void> {
        this.logInfo(`Site creado exitosamente: ${site.nombre} para cliente ${site.cliente}`);
        
        // Aquí se pueden agregar acciones adicionales después de crear un site
        // como notificaciones, indexación geoespacial adicional, etc.
    }

    /**
     * Hook ejecutado después de actualizar un site
     * @param site - Site actualizado
     * @param options - Opciones de transacción
     */
    protected async afterUpdate(site: ISite, _options: TransactionOptions = {}): Promise<void> {
        this.logInfo(`Site actualizado exitosamente: ${site.nombre} (${site._id})`);
    }

    /**
     * Hook ejecutado antes de eliminar un site
     * @param site - Site a eliminar
     * @param options - Opciones de transacción
     */
    protected async beforeDelete(site: ISite, _options: TransactionOptions = {}): Promise<void> {
        // Verificar que no tenga tramos o viajes asociados
        // Esto se puede implementar cuando se necesite
        this.logWarn(`Preparando eliminación del site: ${site.nombre} (${site._id})`);
    }
}

// Instancia única del servicio
const siteService = new SiteService();

export { SiteService };
export default siteService;