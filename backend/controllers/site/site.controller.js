/**
 * Controlador principal para la gestión de sitios
 * Este archivo centraliza todas las operaciones relacionadas con sitios/ubicaciones
 */

const logger = require('../../utils/logger');
const Site = require('../../models/Site');
const { tryCatch } = require('../../utils/errorHandler');
const { ValidationError } = require('../../utils/errors');

/**
 * Obtiene todos los sitios con paginación y filtros opcionales
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 */
const getAllSites = tryCatch(async (req, res) => {
  const { page = 1, limit = 50, cliente, search } = req.query;
  
  // Construir filtros
  const filtro = {};
  if (cliente) filtro.Cliente = cliente;
  if (search) {
    filtro.$or = [
      { Site: { $regex: search, $options: 'i' } },
      { Direccion: { $regex: search, $options: 'i' } },
      { Localidad: { $regex: search, $options: 'i' } },
      { Provincia: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Consulta paginada
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    lean: true,
    sort: { Cliente: 1, Site: 1 }
  };
  
  try {
    // Realizar consulta
    const sites = await Site.find(filtro)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ Cliente: 1, Site: 1 })
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
      error: error.message
    });
  }
});

/**
 * Obtiene un sitio por su ID
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 */
const getSiteById = tryCatch(async (req, res) => {
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
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 */
const getSitesByCliente = tryCatch(async (req, res) => {
  const { clienteId } = req.params;
  
  if (!clienteId) {
    throw new ValidationError('ID de cliente requerido');
  }
  
  const sites = await Site.find({ Cliente: clienteId })
    .lean()
    .sort({ Site: 1 })
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
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 */
const createSite = tryCatch(async (req, res) => {
  // Extraer datos del body
  const { nombre, direccion, cliente, localidad, provincia, coordenadas } = req.body;
  
  // Validar datos esenciales
  if (!nombre || !cliente) {
    throw new ValidationError('Nombre y cliente son requeridos');
  }
  
  // Convertir coordenadas al formato GeoJSON si existen
  const location = coordenadas ? {
    type: 'Point',
    coordinates: [
      parseFloat(coordenadas.lng),
      parseFloat(coordenadas.lat)
    ]
  } : null;
  
  try {
    const nuevoSite = new Site({
      Site: nombre,
      Cliente: cliente,
      Direccion: direccion || '-',
      Localidad: localidad || '',
      Provincia: provincia || '',
      location
    });
    
    await nuevoSite.save();
    
    logger.debug(`Sitio creado: ${nuevoSite._id}`);
    
    return res.status(201).json({
      success: true,
      message: 'Sitio creado exitosamente',
      data: nuevoSite
    });
  } catch (error) {
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
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 */
const updateSite = tryCatch(async (req, res) => {
  const { id } = req.params;
  const { nombre, direccion, localidad, provincia, coordenadas } = req.body;
  
  // Construir el objeto para actualizar
  const updateData = {};
  if (nombre) updateData.Site = nombre;
  if (direccion) updateData.Direccion = direccion;
  if (localidad) updateData.Localidad = localidad;
  if (provincia) updateData.Provincia = provincia;
  
  // Convertir coordenadas al formato GeoJSON si existen
  if (coordenadas) {
    updateData.location = {
      type: 'Point',
      coordinates: [
        parseFloat(coordenadas.lng),
        parseFloat(coordenadas.lat)
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
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 */
const deleteSite = tryCatch(async (req, res) => {
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
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 */
const geocodeDireccion = tryCatch(async (req, res) => {
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

// Exportar todas las funciones del controlador
module.exports = {
  getAllSites,
  getSiteById,
  getSitesByCliente,
  createSite,
  updateSite,
  deleteSite,
  geocodeDireccion
}; 