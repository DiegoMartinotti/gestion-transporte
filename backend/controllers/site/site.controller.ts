/**
 * Controlador principal para la gestión de sitios
 * Este archivo centraliza todas las operaciones relacionadas con sitios/ubicaciones
 */

import express from 'express';
import logger from '../../utils/logger';
import Site from '../../models/Site';
import { tryCatch } from '../../utils/errorHandler';
import { ValidationError } from '../../utils/errors';
import { getAddressFromCoords } from '../../services/geocodingService';
import bulkDeleteSites from './bulkDeleteSites';
import getSitesByClienteFunc from './getSitesByCliente';
import searchNearbyFunc from './searchNearby';
import updateSiteFunc from './updateSite';
import deleteSiteFunc from './deleteSite';
import bulkCreateSitesFunc from './bulkCreateSites';
import mongoose from 'mongoose';

interface SiteQuery {
  page?: string;
  limit?: string;
  cliente?: string;
  search?: string;
}

interface SiteCoords {
  lng: number;
  lat: number;
}

interface CreateSiteBody {
  nombre: string;
  direccion?: string;
  cliente: string;
  localidad?: string;
  provincia?: string;
  coordenadas?: SiteCoords;
}

interface UpdateSiteBody {
  nombre?: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
  coordenadas?: SiteCoords;
}

interface SiteBulkData {
  Site: string;
  Cliente: string;
  Codigo?: string;
  Direccion?: string;
  Localidad?: string;
  Provincia?: string;
  location: {
    coordinates: [number, number];
  };
}

interface BulkCreateResult {
  success: boolean;
  insertados: number;
  errores: Array<{
    index?: number;
    message: string;
    code?: number;
    data?: any;
  }>;
}

/**
 * Obtiene todos los sitios con paginación y filtros opcionales
 */
const getAllSites = tryCatch(async (req: express.Request, res: express.Response) => {
  const { page = '1', limit = '50', cliente, search }: SiteQuery = req.query as SiteQuery;
  
  // Construir filtros
  const filtro: any = {};
  if (cliente) filtro.cliente = cliente;
  if (search) {
    filtro.$or = [
      { nombre: { $regex: search, $options: 'i' } },
      { direccion: { $regex: search, $options: 'i' } },
      { localidad: { $regex: search, $options: 'i' } },
      { provincia: { $regex: search, $options: 'i' } }
    ];
  }
  
  try {
    // Realizar consulta
    const sites = await Site.find(filtro)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ cliente: 1, nombre: 1 })
      .lean()
      .exec();
    
    // Obtener total para paginación
    const total = await Site.countDocuments(filtro);
    
    // Formatear coordenadas GeoJSON a formato lat/lng
    const sitesFormateados = sites.map(site => {
      const coordenadas = site.location && Array.isArray(site.location.coordinates) ? {
        lng: site.location.coordinates[0],
        lat: site.location.coordinates[1]
      } : null;
      
      return {
        ...site,
        coordenadas
      };
    });
    
    logger.debug(`Obtenidos ${sitesFormateados.length} de ${total} sitios`);
    
    return res.json({
      success: true,
      data: sitesFormateados,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error al obtener sitios:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener sitios',
      error: (error as Error).message
    });
  }
});

/**
 * Obtiene un sitio por su ID
 */
const getSiteById = tryCatch(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  
  if (!id) {
    throw new ValidationError('ID de sitio requerido');
  }
  
  const site = await Site.findById(id).lean().exec();
  
  if (!site) {
    return res.status(404).json({
      success: false,
      message: 'Sitio no encontrado'
    });
  }
  
  // Formatear coordenadas
  const coordenadas = site.location && Array.isArray(site.location.coordinates) ? {
    lng: site.location.coordinates[0],
    lat: site.location.coordinates[1]
  } : null;
  
  const siteFormateado = {
    ...site,
    coordenadas
  };
  
  return res.json({
    success: true,
    data: siteFormateado
  });
});

/**
 * Obtiene sitios por cliente
 */
const getSitesByCliente = tryCatch(async (req: express.Request, res: express.Response) => {
  const { clienteId } = req.params;
  
  if (!clienteId) {
    throw new ValidationError('ID de cliente requerido');
  }
  
  const sites = await Site.find({ cliente: clienteId })
    .lean()
    .sort({ nombre: 1 })
    .exec();
  
  const sitesFormateados = sites.map(site => {
    // Convertir coordenadas de GeoJSON a formato lat/lng
    const coordenadas = site.location && Array.isArray(site.location.coordinates) ? {
      lng: site.location.coordinates[0],
      lat: site.location.coordinates[1]
    } : null;
    
    return {
      ...site,
      coordenadas
    };
  });
  
  logger.debug(`Obtenidos ${sitesFormateados.length} sitios para cliente ${clienteId}`);
  
  return res.json({
    success: true,
    count: sitesFormateados.length,
    data: sitesFormateados
  });
});

/**
 * Crea un nuevo sitio
 */
const createSite = tryCatch(async (req: express.Request, res: express.Response) => {
  // Extraer datos del body
  const { nombre, direccion, cliente, localidad, provincia, coordenadas }: CreateSiteBody = req.body;
  
  // Validar datos esenciales
  if (!nombre || !cliente) {
    throw new ValidationError('Nombre y cliente son requeridos');
  }
  
  // Convertir coordenadas al formato GeoJSON si existen
  const location = coordenadas ? {
    type: 'Point' as const,
    coordinates: [
      parseFloat(String(coordenadas.lng)),
      parseFloat(String(coordenadas.lat))
    ] as [number, number]
  } : undefined;
  
  try {
    const nuevoSite = new Site({
      nombre: nombre,
      cliente: cliente,
      direccion: direccion || '-',
      localidad: localidad || '',
      provincia: provincia || '',
      location
    });
    
    await nuevoSite.save();
    
    logger.debug(`Sitio creado: ${nuevoSite._id}`);
    
    return res.status(201).json({
      success: true,
      message: 'Sitio creado exitosamente',
      data: nuevoSite
    });
  } catch (error: any) {
    // Manejar error de duplicado
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un sitio con este nombre para este cliente'
      });
    }
    
    logger.error('Error al crear sitio:', error);
    throw error;
  }
});

/**
 * Actualiza un sitio existente
 */
const updateSite = tryCatch(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const { nombre, direccion, localidad, provincia, coordenadas }: UpdateSiteBody = req.body;
  
  // Construir el objeto para actualizar
  const updateData: any = {};
  if (nombre) updateData.nombre = nombre;
  if (direccion) updateData.direccion = direccion;
  if (localidad) updateData.localidad = localidad;
  if (provincia) updateData.provincia = provincia;
  
  // Convertir coordenadas al formato GeoJSON si existen
  if (coordenadas) {
    updateData.location = {
      type: 'Point',
      coordinates: [
        parseFloat(String(coordenadas.lng)),
        parseFloat(String(coordenadas.lat))
      ]
    };
  }
  
  const siteActualizado = await Site.findByIdAndUpdate(
    id,
    updateData,
    { new: true }
  );
  
  if (!siteActualizado) {
    return res.status(404).json({
      success: false,
      message: 'Sitio no encontrado'
    });
  }
  
  logger.debug(`Sitio actualizado: ${id}`);
  
  return res.json({
    success: true,
    message: 'Sitio actualizado exitosamente',
    data: siteActualizado
  });
});

/**
 * Elimina un sitio
 */
const deleteSite = tryCatch(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  
  // Verificar dependencias antes de eliminar (opcional)
  // Aquí se podría verificar si hay tramos u otras entidades que usen este sitio
  
  const siteEliminado = await Site.findByIdAndDelete(id);
  
  if (!siteEliminado) {
    return res.status(404).json({
      success: false,
      message: 'Sitio no encontrado'
    });
  }
  
  logger.debug(`Sitio eliminado: ${id}`);
  
  return res.json({
    success: true,
    message: 'Sitio eliminado exitosamente'
  });
});

/**
 * Geocodifica una dirección
 */
const geocodeDireccion = tryCatch(async (req: express.Request, res: express.Response) => {
  const { direccion } = req.body;
  
  if (!direccion) {
    throw new ValidationError('Dirección requerida');
  }
  
  // Aquí se implementaría la lógica de geocodificación
  // Normalmente se usaría un servicio externo como Google Maps, Mapbox, etc.
  
  // Este es un ejemplo simulado
  logger.debug(`Geocodificando dirección: ${direccion}`);
  
  // Coordenadas simuladas para demostración
  const coordenadas = {
    lat: -34.603722 + (Math.random() * 0.1),
    lng: -58.381592 + (Math.random() * 0.1)
  };
  
  return res.json({
    success: true,
    data: {
      direccion,
      coordenadas
    }
  });
});

// Función de utilidad para crear un retraso
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Reprocesa las direcciones de todos los sitios de un cliente utilizando sus coordenadas.
 */
const reprocessAddressesByCliente = tryCatch(async (req: express.Request, res: express.Response) => {
    const { cliente } = req.params;
    let actualizados = 0;
    let fallidos = 0;
    const erroresDetallados: string[] = [];

    try {
        logger.info(`Iniciando reprocesamiento de direcciones para cliente: ${cliente}`);

        // Buscar todos los sitios del cliente que tengan coordenadas
        // Adaptado para buscar en 'location.coordinates' (GeoJSON)
        const sites = await Site.find({
            cliente: cliente, 
            'location.coordinates': { $exists: true, $ne: [] } 
        });

        if (!sites || sites.length === 0) {
            logger.warn(`No se encontraron sitios con coordenadas para el cliente: ${cliente}`);
            return res.status(404).json({ message: 'No se encontraron sitios con coordenadas para este cliente.' });
        }

        logger.info(`Reprocesando ${sites.length} sitios para el cliente: ${cliente}`);

        // Iterar sobre cada sitio y obtener la dirección
        for (const site of sites) {
            try {
                // Extraer coordenadas del formato GeoJSON
                if (!site.location || !Array.isArray(site.location.coordinates) || site.location.coordinates.length < 2) {
                    fallidos++;
                    erroresDetallados.push(`Sitio ${site.nombre} (${site._id}) no tiene coordenadas válidas.`);
                    continue; 
                }

                const [lng, lat] = site.location.coordinates; // Nota: GeoJSON es [lng, lat]
                
                // Llamar al servicio de geocodificación inversa
                const addressData = await getAddressFromCoords(lat, lng);

                // Actualizar el sitio si se obtuvo información válida
                if (addressData) {
                    site.direccion = addressData.direccion || site.direccion; // Mantener si no hay nueva
                    site.localidad = addressData.localidad || site.localidad;
                    site.provincia = addressData.provincia || site.provincia;
                    
                    await site.save();
                    actualizados++;
                    logger.debug(`Sitio ${site.nombre} (${site._id}) actualizado.`);
                } else {
                     fallidos++;
                     erroresDetallados.push(`No se pudo obtener dirección para sitio ${site.nombre} (${site._id}) con coords ${lat},${lng}.`);
                     logger.warn(`Fallo al geocodificar sitio ${site.nombre} (${site._id})`);
                }

                // ¡Importante! Añadir retraso para no saturar el servicio de geocodificación
                await delay(1000); // Esperar 1 segundo entre llamadas

            } catch (error) {
                fallidos++;
                const errorMsg = `Error procesando sitio ${site.nombre} (${site._id}): ${(error as Error).message}`;
                logger.error(errorMsg, error);
                erroresDetallados.push(errorMsg);
                // Continuar con el siguiente sitio aunque uno falle
                 await delay(1000); // Esperar incluso si hay error
            }
        }

        logger.info(`Reprocesamiento para cliente ${cliente} completado. Actualizados: ${actualizados}, Fallidos: ${fallidos}`);
        
        const responseMessage = `Reprocesamiento completado. Sitios actualizados: ${actualizados}. Sitios fallidos: ${fallidos}.`;
        
        if (fallidos > 0) {
             return res.status(207).json({ // 207 Multi-Status si hubo errores parciales
                message: responseMessage,
                actualizados,
                fallidos,
                detalles_error: erroresDetallados 
             });
        } else {
             return res.status(200).json({ 
                message: responseMessage,
                actualizados,
                fallidos 
             });
        }

    } catch (error) {
        logger.error(`Error general durante el reprocesamiento para cliente ${cliente}: ${(error as Error).message}`, error);
        return res.status(500).json({ message: 'Error interno del servidor durante el reprocesamiento.', error: (error as Error).message });
    }
});

// Función para creación masiva (usada por la importación)
const createSitesBulk = async (sitesData: SiteBulkData[], options: { session?: mongoose.ClientSession } = {}): Promise<BulkCreateResult> => {
    const session = options.session;
    let insertados = 0;
    const errores: BulkCreateResult['errores'] = [];

    if (!Array.isArray(sitesData) || sitesData.length === 0) {
        return { success: false, insertados: 0, errores: [{ message: 'No site data provided for bulk creation.' }] };
    }

    // Pre-procesar datos para asegurar formato correcto del modelo Mongoose
    const sitesToInsert = sitesData.map((site, index) => {
        // Validar datos esenciales
        if (!site.Site || !site.location?.coordinates?.[0] || !site.location?.coordinates?.[1]) {
            errores.push({ index, message: 'Faltan campos requeridos (Site, Longitud, Latitud)', data: site });
            return null; // Marcar para filtrar
        }
        if (isNaN(site.location.coordinates[0]) || isNaN(site.location.coordinates[1])) {
             errores.push({ index, message: 'Coordenadas inválidas', data: site });
             return null;
        }

        return {
            nombre: site.Site, // Ya viene mapeado desde el controlador de viaje
            cliente: site.Cliente, // El cliente debería venir resuelto o ser validado aquí? Por ahora lo aceptamos.
            codigo: site.Codigo,
            direccion: site.Direccion,
            localidad: site.Localidad,
            provincia: site.Provincia,
            location: {
                type: 'Point' as const,
                coordinates: [site.location.coordinates[0], site.location.coordinates[1]] as [number, number]
            }
            // Añadir campos por defecto si son necesarios
        };
    }).filter(site => site !== null) as any[]; // Filtrar los nulos por errores de validación previa

    if (sitesToInsert.length === 0 && errores.length > 0) {
         return { success: false, insertados: 0, errores };
    }
    if (sitesToInsert.length === 0) {
        return { success: false, insertados: 0, errores: [{ message: 'No valid site data left after filtering.' }] };
    }

    try {
        // Usar insertMany para eficiencia. ordered: false permite continuar si uno falla.
        const result = await Site.insertMany(sitesToInsert, { session, ordered: false });
        insertados = result.length;
        logger.info(`[createSitesBulk] Insertados ${insertados} sitios correctamente.`);

    } catch (error: any) {
        logger.error('[createSitesBulk] Error durante insertMany:', error);
        // Analizar el error de bulkWrite para identificar fallos específicos
        if (error.name === 'MongoBulkWriteError' && error.writeErrors) {
            error.writeErrors.forEach((err: any) => {
                const failedData = sitesToInsert[err.index]; 
                errores.push({
                    index: err.index,
                    message: `Error al insertar sitio ${failedData?.nombre}: ${err.errmsg}`,
                    code: err.code,
                    data: failedData
                });
            });
             // Los que no dieron error se insertaron si ordered: false
            insertados = error.result?.nInserted || (sitesToInsert.length - error.writeErrors.length); 
            logger.warn(`[createSitesBulk] Completado con ${errores.length} errores. Insertados: ${insertados}`);
        } else {
            // Error general, no se insertó nada o error inesperado
            errores.push({ message: `Error inesperado en bulk create: ${error.message}` });
            insertados = 0; // Asumir que nada se insertó
        }
    }

    return {
        success: errores.length === 0,
        insertados,
        errores
    };
};

// Exportar todas las funciones del controlador
export {
  getAllSites,
  getSiteById,
  getSitesByCliente,
  createSite,
  updateSite,
  deleteSite,
  geocodeDireccion,
  reprocessAddressesByCliente,
  bulkDeleteSites,
  createSitesBulk,
  // Exportar también las funciones importadas de archivos separados
  getSitesByClienteFunc,
  searchNearbyFunc,
  updateSiteFunc,
  deleteSiteFunc,
  bulkCreateSitesFunc
};