import express from 'express';
import {
  createTarifaMetodo,
  createTarifaMetodoValidators,
  getAllTarifaMetodos,
  getAllTarifaMetodosValidators,
  getTarifaMetodoById,
  getTarifaMetodoByIdValidators,
  updateTarifaMetodo,
  updateTarifaMetodoValidators,
  deleteTarifaMetodo,
  deleteTarifaMetodoValidators,
  getMetodosActivos,
} from '../controllers/tarifaMetodo';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: TarifaMetodos
 *   description: Gestión de métodos de cálculo de tarifa
 */

/**
 * @swagger
 * /api/tarifa-metodos:
 *   get:
 *     tags: [TarifaMetodos]
 *     summary: Obtiene todos los métodos de cálculo de tarifa
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *       - in: query
 *         name: requiereDistancia
 *         schema:
 *           type: boolean
 *         description: Filtrar métodos que requieren distancia
 *       - in: query
 *         name: requierePalets
 *         schema:
 *           type: boolean
 *         description: Filtrar métodos que requieren palets
 *       - in: query
 *         name: busqueda
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre, código o descripción
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Límite de resultados
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Número de página
 *     responses:
 *       200:
 *         description: Lista de métodos obtenida exitosamente
 *       400:
 *         description: Parámetros de consulta inválidos
 *       401:
 *         description: No autorizado
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/', authenticateToken, getAllTarifaMetodosValidators, getAllTarifaMetodos as unknown);

/**
 * @swagger
 * /api/tarifa-metodos/activos:
 *   get:
 *     tags: [TarifaMetodos]
 *     summary: Obtiene solo los métodos activos (para selectors)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Métodos activos obtenidos exitosamente
 *       401:
 *         description: No autorizado
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/activos', authenticateToken, getMetodosActivos as unknown);

/**
 * @swagger
 * /api/tarifa-metodos/{id}:
 *   get:
 *     tags: [TarifaMetodos]
 *     summary: Obtiene un método de tarifa por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del método de tarifa
 *     responses:
 *       200:
 *         description: Método obtenido exitosamente
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Método no encontrado
 *       401:
 *         description: No autorizado
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/:id', authenticateToken, getTarifaMetodoByIdValidators, getTarifaMetodoById as unknown);

/**
 * @swagger
 * /api/tarifa-metodos:
 *   post:
 *     tags: [TarifaMetodos]
 *     summary: Crea un nuevo método de cálculo de tarifa
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigo
 *               - nombre
 *               - descripcion
 *               - formulaBase
 *             properties:
 *               codigo:
 *                 type: string
 *                 pattern: '^[A-Z][A-Z0-9_]*$'
 *                 description: Código único del método
 *               nombre:
 *                 type: string
 *                 description: Nombre descriptivo
 *               descripcion:
 *                 type: string
 *                 description: Descripción detallada
 *               formulaBase:
 *                 type: string
 *                 description: Fórmula base de cálculo
 *               variables:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     nombre:
 *                       type: string
 *                     descripcion:
 *                       type: string
 *                     tipo:
 *                       type: string
 *                       enum: [number, string, boolean, date]
 *                     origen:
 *                       type: string
 *                       enum: [tramo, viaje, cliente, vehiculo, calculado, constante]
 *                     requerido:
 *                       type: boolean
 *               prioridad:
 *                 type: integer
 *                 minimum: 1
 *               activo:
 *                 type: boolean
 *               requiereDistancia:
 *                 type: boolean
 *               requierePalets:
 *                 type: boolean
 *               permiteFormulasPersonalizadas:
 *                 type: boolean
 *               configuracion:
 *                 type: object
 *     responses:
 *       201:
 *         description: Método creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: El código ya existe
 *       401:
 *         description: No autorizado
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/', authenticateToken, createTarifaMetodoValidators, createTarifaMetodo as unknown);

/**
 * @swagger
 * /api/tarifa-metodos/{id}:
 *   put:
 *     tags: [TarifaMetodos]
 *     summary: Actualiza un método de cálculo de tarifa
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del método de tarifa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               codigo:
 *                 type: string
 *                 pattern: '^[A-Z][A-Z0-9_]*$'
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               formulaBase:
 *                 type: string
 *               variables:
 *                 type: array
 *               prioridad:
 *                 type: integer
 *               activo:
 *                 type: boolean
 *               requiereDistancia:
 *                 type: boolean
 *               requierePalets:
 *                 type: boolean
 *               permiteFormulasPersonalizadas:
 *                 type: boolean
 *               configuracion:
 *                 type: object
 *     responses:
 *       200:
 *         description: Método actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Método no encontrado
 *       409:
 *         description: El código ya existe
 *       401:
 *         description: No autorizado
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.put('/:id', authenticateToken, updateTarifaMetodoValidators, updateTarifaMetodo as unknown);

/**
 * @swagger
 * /api/tarifa-metodos/{id}:
 *   delete:
 *     tags: [TarifaMetodos]
 *     summary: Elimina un método de cálculo de tarifa
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del método de tarifa
 *     responses:
 *       200:
 *         description: Método eliminado exitosamente
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Método no encontrado
 *       409:
 *         description: No se puede eliminar (tiene dependencias)
 *       401:
 *         description: No autorizado
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.delete('/:id', authenticateToken, deleteTarifaMetodoValidators, deleteTarifaMetodo as unknown);

export default router;
