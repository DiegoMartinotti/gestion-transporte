"use strict";
/**
 * Rutas para la gestión de sitios/ubicaciones
 * Implementa los endpoints RESTful para gestionar sitios
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
router.get('/', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger.debug('GET /api/site - Parámetros:', req.query);
    return yield siteController.getAllSites(req, res);
}));
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
router.get('/:id', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger.debug(`GET /api/site/${req.params.id}`);
    return yield siteController.getSiteById(req, res);
}));
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
router.get('/cliente/:clienteId', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger.debug(`GET /api/site/cliente/${req.params.clienteId}`);
    return yield siteController.getSitesByCliente(req, res);
}));
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
router.post('/', authenticateToken, validateSite, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger.debug('POST /api/site - Body:', req.body);
    return yield siteController.createSite(req, res);
}));
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
router.put('/:id', authenticateToken, validateSite, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger.debug(`PUT /api/site/${req.params.id} - Body:`, req.body);
    return yield siteController.updateSite(req, res);
}));
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
router.delete('/:id', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger.debug(`DELETE /api/site/${req.params.id}`);
    return yield siteController.deleteSite(req, res);
}));
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
router.post('/geocode', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger.debug('POST /api/site/geocode - Body:', req.body);
    return yield siteController.geocodeDireccion(req, res);
}));
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
router.delete('/bulk/cliente/:cliente', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger.debug(`DELETE /api/site/bulk/cliente/${req.params.cliente}`);
    return yield siteController.bulkDeleteSites(req, res);
}));
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
router.post('/reprocess-addresses/:cliente', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger.debug(`POST /api/site/reprocess-addresses/${req.params.cliente}`);
    return yield siteController.reprocessAddressesByCliente(req, res);
}));
module.exports = router;
//# sourceMappingURL=site.routes.js.map