import express from 'express';
import {
  getAllFormulas,
  getAllFormulasValidators,
  getFormulaById,
  getFormulaByIdValidators,
  validateFormula,
  validateFormulaValidators,
} from '../controllers/formulaCliente';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: FormulasClienteExtended
 *   description: API extendida de fórmulas personalizadas con soporte multi-método
 */

/**
 * @swagger
 * /api/formulas-cliente-extended:
 *   get:
 *     tags: [FormulasClienteExtended]
 *     summary: Obtiene todas las fórmulas personalizadas con filtros avanzados
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
 *         name: tipoUnidad
 *         schema:
 *           type: string
 *           enum: [Sider, Bitren, General, Todos]
 *         description: Tipo de unidad específico
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
 *         description: Búsqueda por nombre, descripción o fórmula
 *       - in: query
 *         name: incluirHistorial
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir historial de cambios
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
 *         description: Lista de fórmulas obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 formulas:
 *                   type: array
 *                   items:
 *                     type: object
 *                 paginacion:
 *                   type: object
 *                 estadisticas:
 *                   type: object
 *                 metadatos:
 *                   type: object
 *       400:
 *         description: Parámetros de consulta inválidos
 *       401:
 *         description: No autorizado
 */
router.get('/', authenticateToken, getAllFormulasValidators, getAllFormulas as any);

/**
 * @swagger
 * /api/formulas-cliente-extended/{id}:
 *   get:
 *     tags: [FormulasClienteExtended]
 *     summary: Obtiene una fórmula por ID con información extendida
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la fórmula
 *     responses:
 *       200:
 *         description: Fórmula obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 clienteId:
 *                   type: object
 *                 tipoUnidad:
 *                   type: string
 *                 metodoCalculo:
 *                   type: string
 *                 formula:
 *                   type: string
 *                 nombre:
 *                   type: string
 *                 descripcion:
 *                   type: string
 *                 prioridad:
 *                   type: integer
 *                 activa:
 *                   type: boolean
 *                 vigenciaDesde:
 *                   type: string
 *                   format: date
 *                 vigenciaHasta:
 *                   type: string
 *                   format: date
 *                 estadisticas:
 *                   type: object
 *                 validacionFormula:
 *                   type: object
 *                 informacionAdicional:
 *                   type: object
 *                   properties:
 *                     esVigente:
 *                       type: boolean
 *                     diasRestantesVigencia:
 *                       type: integer
 *                     metodoCalculo:
 *                       type: object
 *                     estadisticas:
 *                       type: object
 *                     validacion:
 *                       type: object
 *                     conflictos:
 *                       type: object
 *                     historial:
 *                       type: object
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Fórmula no encontrada
 *       401:
 *         description: No autorizado
 */
router.get('/:id', authenticateToken, getFormulaByIdValidators, getFormulaById as any);

/**
 * @swagger
 * /api/formulas-cliente-extended/validate:
 *   post:
 *     tags: [FormulasClienteExtended]
 *     summary: Valida una fórmula contra un método de cálculo
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - formula
 *               - metodoCalculo
 *             properties:
 *               formula:
 *                 type: string
 *                 description: Fórmula a validar
 *               metodoCalculo:
 *                 type: string
 *                 description: Código del método de cálculo
 *               variables:
 *                 type: object
 *                 description: Variables específicas para testing
 *               contextoTesting:
 *                 type: object
 *                 description: Contexto de prueba personalizado
 *     responses:
 *       200:
 *         description: Validación completada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valida:
 *                   type: boolean
 *                 detalles:
 *                   type: object
 *                   properties:
 *                     sintaxis:
 *                       type: object
 *                       properties:
 *                         valida:
 *                           type: boolean
 *                         errores:
 *                           type: array
 *                           items:
 *                             type: string
 *                         advertencias:
 *                           type: array
 *                           items:
 *                             type: string
 *                     variables:
 *                       type: object
 *                       properties:
 *                         valida:
 *                           type: boolean
 *                         errores:
 *                           type: array
 *                         advertencias:
 *                           type: array
 *                         variablesRequeridas:
 *                           type: array
 *                         variablesOpcionales:
 *                           type: array
 *                         variablesNoEncontradas:
 *                           type: array
 *                     prueba:
 *                       type: object
 *                       properties:
 *                         exitosa:
 *                           type: boolean
 *                         resultado:
 *                           type: number
 *                         error:
 *                           type: string
 *                         tiempoEjecucion:
 *                           type: number
 *                     analisis:
 *                       type: object
 *                       properties:
 *                         variablesEncontradas:
 *                           type: array
 *                         funcionesUtilizadas:
 *                           type: array
 *                         complejidad:
 *                           type: object
 *                     metodo:
 *                       type: object
 *                     sugerencias:
 *                       type: array
 *                       items:
 *                         type: string
 *                     contextoPrueba:
 *                       type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Método de cálculo no encontrado
 *       401:
 *         description: No autorizado
 */
router.post('/validate', authenticateToken, validateFormulaValidators, validateFormula as any);

export default router;
