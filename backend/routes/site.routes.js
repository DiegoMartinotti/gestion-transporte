/**
 * Rutas para la gestión de sitios/ubicaciones
 * Implementa los endpoints RESTful para gestionar sitios
 */

const express = require('express');
const router = express.Router();
const siteController = require('../controllers/site/site.controller');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateSite } = require('../middleware/validationMiddleware');
const logger = require('../utils/logger');

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
router.get('/', authenticateToken, async (req, res) => {
  logger.debug('GET /api/site - Parámetros:', req.query);
  return await siteController.getAllSites(req, res);
});

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
router.get('/:id', authenticateToken, async (req, res) => {
  logger.debug(`GET /api/site/${req.params.id}`);
  return await siteController.getSiteById(req, res);
});

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
router.get('/cliente/:clienteId', authenticateToken, async (req, res) => {
  logger.debug(`GET /api/site/cliente/${req.params.clienteId}`);
  return await siteController.getSitesByCliente(req, res);
});

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
router.post('/', authenticateToken, validateSite, async (req, res) => {
  logger.debug('POST /api/site - Body:', req.body);
  return await siteController.createSite(req, res);
});

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
router.put('/:id', authenticateToken, validateSite, async (req, res) => {
  logger.debug(`PUT /api/site/${req.params.id} - Body:`, req.body);
  return await siteController.updateSite(req, res);
});

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
router.delete('/:id', authenticateToken, async (req, res) => {
  logger.debug(`DELETE /api/site/${req.params.id}`);
  return await siteController.deleteSite(req, res);
});

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
router.post('/geocode', authenticateToken, async (req, res) => {
  logger.debug('POST /api/site/geocode - Body:', req.body);
  return await siteController.geocodeDireccion(req, res);
});

module.exports = router; 