/**
 * Rutas para la gestión de sitios/ubicaciones
 * Implementa los endpoints RESTful para gestionar sitios
 */

import express from 'express';
const router = express.Router();
import * as siteController from '../controllers/site/index';
import { 
    bulkCreateSites,
    searchNearby,
    getSiteTemplate,
    exportSites
} from '../controllers/site/index';
import { authenticateToken } from '../middleware/authMiddleware';
import { validateSite } from '../middleware/validationMiddleware';
import logger from '../utils/logger';

/**
 * @swagger
 * /api/site:
 *   get:
 *     summary: Obtiene todos los sitios
 *     description: Devuelve un listado paginado de todos los sitios/ubicaciones.
 *     tags: [Sites]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página para paginación
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Número de elementos por página
 *       - in: query
 *         name: cliente
 *         schema:
 *           type: string
 *         description: ID del cliente para filtrar sitios
 *     responses:
 *       200:
 *         description: Listado de sitios obtenido correctamente
 *       400:
 *         description: Error en la solicitud
 *       500:
 *         description: Error del servidor
 */
router.get('/', authenticateToken, siteController.getAllSites);

/**
 * @swagger
 * /api/site/template:
 *   get:
 *     summary: Obtiene plantilla Excel para sitios
 *     description: Descarga un archivo Excel con la plantilla para importar sitios
 *     tags: [Sites]
 *     responses:
 *       200:
 *         description: Plantilla generada correctamente
 *       500:
 *         description: Error del servidor
 */
router.get('/template', getSiteTemplate);

/**
 * @swagger
 * /api/site/export:
 *   get:
 *     summary: Exporta sitios a Excel
 *     description: Descarga todos los sitios en formato Excel
 *     tags: [Sites]
 *     responses:
 *       200:
 *         description: Archivo exportado correctamente
 *       500:
 *         description: Error del servidor
 */
router.get('/export', authenticateToken, exportSites);

/**
 * @swagger
 * /api/site/{id}:
 *   get:
 *     summary: Obtiene un sitio por su ID
 *     description: Devuelve los detalles de un sitio específico
 *     tags: [Sites]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del sitio
 *     responses:
 *       200:
 *         description: Sitio obtenido correctamente
 *       404:
 *         description: Sitio no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', authenticateToken, siteController.getSiteById);

/**
 * @swagger
 * /api/site/cliente/{clienteId}:
 *   get:
 *     summary: Obtiene sitios por cliente
 *     description: Devuelve todos los sitios asociados a un cliente
 *     tags: [Sites]
 *     parameters:
 *       - in: path
 *         name: clienteId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Sitios obtenidos correctamente
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/cliente/:clienteId', authenticateToken, siteController.getSitesByCliente);

/**
 * @swagger
 * /api/site/nearby:
 *   get:
 *     summary: Buscar sitios cercanos
 *     description: Busca sitios cercanos a una coordenada específica
 *     tags: [Sites]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitud del punto de referencia
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitud del punto de referencia
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10
 *         description: Radio de búsqueda en kilómetros
 *     responses:
 *       200:
 *         description: Sitios cercanos encontrados
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error del servidor
 */
router.get('/nearby', authenticateToken, searchNearby);

/**
 * @swagger
 * /api/site:
 *   post:
 *     summary: Crea un nuevo sitio
 *     description: Crea un nuevo sitio/ubicación con los datos proporcionados
 *     tags: [Sites]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - cliente
 *             properties:
 *               nombre:
 *                 type: string
 *               direccion:
 *                 type: string
 *               cliente:
 *                 type: string
 *               coordenadas:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *     responses:
 *       201:
 *         description: Sitio creado correctamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.post('/', authenticateToken, validateSite, siteController.createSite);

/**
 * @swagger
 * /api/site/bulk:
 *   post:
 *     summary: Creación masiva de sitios
 *     description: Crea múltiples sitios a partir de un array de datos
 *     tags: [Sites]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required:
 *                 - nombre
 *                 - cliente
 *               properties:
 *                 nombre:
 *                   type: string
 *                 direccion:
 *                   type: string
 *                 cliente:
 *                   type: string
 *                 coordenadas:
 *                   type: object
 *                   properties:
 *                     lat:
 *                       type: number
 *                     lng:
 *                       type: number
 *     responses:
 *       201:
 *         description: Sitios creados correctamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.post('/bulk', authenticateToken, bulkCreateSites);

/**
 * @swagger
 * /api/site/{id}:
 *   put:
 *     summary: Actualiza un sitio existente
 *     description: Actualiza los datos de un sitio existente
 *     tags: [Sites]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del sitio a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               direccion:
 *                 type: string
 *               coordenadas:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *     responses:
 *       200:
 *         description: Sitio actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Sitio no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', authenticateToken, validateSite, siteController.updateSite);

/**
 * @swagger
 * /api/site/{id}:
 *   delete:
 *     summary: Elimina un sitio
 *     description: Elimina un sitio existente por su ID
 *     tags: [Sites]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del sitio a eliminar
 *     responses:
 *       200:
 *         description: Sitio eliminado correctamente
 *       403:
 *         description: No se puede eliminar el sitio (tiene dependencias)
 *       404:
 *         description: Sitio no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id', authenticateToken, siteController.deleteSite);

/**
 * @swagger
 * /api/site/geocode:
 *   post:
 *     summary: Geocodificar dirección
 *     description: Convierte una dirección en coordenadas
 *     tags: [Sites]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - direccion
 *             properties:
 *               direccion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Coordenadas obtenidas correctamente
 *       400:
 *         description: Dirección inválida
 *       500:
 *         description: Error del servidor
 */
router.post('/geocode', authenticateToken, siteController.geocodeDireccion);

/**
 * @swagger
 * /api/site/bulk/cliente/{cliente}:
 *   delete:
 *     summary: Elimina masivamente sitios por cliente
 *     description: Elimina todos los sitios asociados a un cliente específico
 *     tags: [Sites]
 *     parameters:
 *       - in: path
 *         name: cliente
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del cliente cuyos sitios se eliminarán
 *     responses:
 *       200:
 *         description: Sitios eliminados correctamente
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error del servidor
 */
router.delete('/bulk/cliente/:cliente', authenticateToken, siteController.bulkDeleteSites);

/**
 * @swagger
 * /api/site/reprocess-addresses/{cliente}:
 *   post:
 *     summary: Reprocesa direcciones de sitios para un cliente
 *     description: Obtiene y actualiza la dirección, localidad y provincia de todos los sitios de un cliente usando sus coordenadas.
 *     tags: [Sites]
 *     parameters:
 *       - in: path
 *         name: cliente
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre o identificador del cliente
 *     responses:
 *       200:
 *         description: Direcciones reprocesadas correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 actualizados:
 *                   type: number
 *                 fallidos:
 *                   type: number
 *       404:
 *         description: Cliente no encontrado o sin sitios
 *       500:
 *         description: Error del servidor durante el reprocesamiento
 */
router.post('/reprocess-addresses/:cliente', authenticateToken, siteController.reprocessAddressesByCliente);

export default router;