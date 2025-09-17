import express from 'express';
import {
  createReglaTarifa,
  createReglaTarifaValidators,
  getAllReglasTarifa,
  getAllReglasTarifaValidators,
  getReglaTarifaById,
  getReglaTarifaByIdValidators,
  updateReglaTarifa,
  updateReglaTarifaValidators,
  deleteReglaTarifa,
  deleteReglaTarifaValidators,
} from '../controllers/reglaTarifa';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ReglasTarifa
 *   description: Gestión de reglas de modificación de tarifa
 */

/**
 * @swagger
 * /api/reglas-tarifa:
 *   get:
 *     tags: [ReglasTarifa]
 *     summary: Obtiene todas las reglas de tarifa
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cliente
 *         schema:
 *           type: string
 *         description: ID del cliente específico
 *       - in: query
 *         name: metodoCalculo
 *         schema:
 *           type: string
 *         description: Método de cálculo específico
 *       - in: query
 *         name: activa
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *       - in: query
 *         name: vigente
 *         schema:
 *           type: boolean
 *         description: Filtrar por vigencia actual
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha para evaluar vigencia
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
 *         description: Lista de reglas obtenida exitosamente
 *       400:
 *         description: Parámetros de consulta inválidos
 *       401:
 *         description: No autorizado
 */
router.get('/', authenticateToken, getAllReglasTarifaValidators, getAllReglasTarifa as unknown);

/**
 * @swagger
 * /api/reglas-tarifa/{id}:
 *   get:
 *     tags: [ReglasTarifa]
 *     summary: Obtiene una regla de tarifa por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la regla de tarifa
 *     responses:
 *       200:
 *         description: Regla obtenida exitosamente
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Regla no encontrada
 *       401:
 *         description: No autorizado
 */
router.get('/:id', authenticateToken, getReglaTarifaByIdValidators, getReglaTarifaById as unknown);

/**
 * @swagger
 * /api/reglas-tarifa:
 *   post:
 *     tags: [ReglasTarifa]
 *     summary: Crea una nueva regla de tarifa
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
 *               - condiciones
 *               - modificadores
 *               - fechaInicioVigencia
 *             properties:
 *               codigo:
 *                 type: string
 *                 pattern: '^[A-Z][A-Z0-9_]*$'
 *                 description: Código único de la regla
 *               nombre:
 *                 type: string
 *                 description: Nombre descriptivo
 *               descripcion:
 *                 type: string
 *                 description: Descripción detallada
 *               cliente:
 *                 type: string
 *                 description: ID del cliente específico (opcional)
 *               metodoCalculo:
 *                 type: string
 *                 description: Método de cálculo específico (opcional)
 *               condiciones:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     campo:
 *                       type: string
 *                     operador:
 *                       type: string
 *                       enum: [igual, diferente, mayor, menor, mayorIgual, menorIgual, entre, en, contiene]
 *                     valor:
 *                       type: unknown
 *                     valorHasta:
 *                       type: unknown
 *               operadorLogico:
 *                 type: string
 *                 enum: [AND, OR]
 *                 default: AND
 *               modificadores:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     tipo:
 *                       type: string
 *                       enum: [porcentaje, fijo, formula]
 *                     valor:
 *                       type: unknown
 *                     aplicarA:
 *                       type: string
 *                       enum: [tarifa, peaje, total, extras]
 *                     descripcion:
 *                       type: string
 *               prioridad:
 *                 type: integer
 *                 minimum: 1
 *                 default: 100
 *               activa:
 *                 type: boolean
 *                 default: true
 *               fechaInicioVigencia:
 *                 type: string
 *                 format: date
 *               fechaFinVigencia:
 *                 type: string
 *                 format: date
 *               aplicarEnCascada:
 *                 type: boolean
 *                 default: true
 *               excluirOtrasReglas:
 *                 type: boolean
 *                 default: false
 *               diasSemana:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   minimum: 0
 *                   maximum: 6
 *               horariosAplicacion:
 *                 type: object
 *                 properties:
 *                   horaInicio:
 *                     type: string
 *                     pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                   horaFin:
 *                     type: string
 *                     pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               temporadas:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     nombre:
 *                       type: string
 *                     fechaInicio:
 *                       type: string
 *                     fechaFin:
 *                       type: string
 *     responses:
 *       201:
 *         description: Regla creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: El código ya existe
 *       401:
 *         description: No autorizado
 */
router.post('/', authenticateToken, createReglaTarifaValidators, createReglaTarifa as unknown);

/**
 * @swagger
 * /api/reglas-tarifa/{id}:
 *   put:
 *     tags: [ReglasTarifa]
 *     summary: Actualiza una regla de tarifa
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la regla de tarifa
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
 *               cliente:
 *                 type: string
 *               metodoCalculo:
 *                 type: string
 *               condiciones:
 *                 type: array
 *               operadorLogico:
 *                 type: string
 *                 enum: [AND, OR]
 *               modificadores:
 *                 type: array
 *               prioridad:
 *                 type: integer
 *               activa:
 *                 type: boolean
 *               fechaInicioVigencia:
 *                 type: string
 *                 format: date
 *               fechaFinVigencia:
 *                 type: string
 *                 format: date
 *               aplicarEnCascada:
 *                 type: boolean
 *               excluirOtrasReglas:
 *                 type: boolean
 *               diasSemana:
 *                 type: array
 *               horariosAplicacion:
 *                 type: object
 *               temporadas:
 *                 type: array
 *     responses:
 *       200:
 *         description: Regla actualizada exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Regla no encontrada
 *       409:
 *         description: El código ya existe
 *       401:
 *         description: No autorizado
 */
router.put('/:id', authenticateToken, updateReglaTarifaValidators, updateReglaTarifa as unknown);

/**
 * @swagger
 * /api/reglas-tarifa/{id}:
 *   delete:
 *     tags: [ReglasTarifa]
 *     summary: Elimina una regla de tarifa
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la regla de tarifa
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               confirmarEliminacion:
 *                 type: boolean
 *                 description: Confirmar eliminación de regla con historial de uso
 *     responses:
 *       200:
 *         description: Regla eliminada exitosamente
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Regla no encontrada
 *       409:
 *         description: Confirmación requerida (regla con historial)
 *       401:
 *         description: No autorizado
 */
router.delete('/:id', authenticateToken, deleteReglaTarifaValidators, deleteReglaTarifa as unknown);

export default router;
