import express from 'express';
import {
  calculateTarifa,
  calculateTarifaValidators,
  simulateTarifa,
  simulateTarifaValidators,
  getAuditoria,
  getAuditoriaValidators,
  clearCache,
} from '../controllers/tarifaEngine';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: TarifaEngine
 *   description: Motor de cálculo de tarifas con pipeline avanzado
 */

/**
 * @swagger
 * /api/tarifa-engine/calculate:
 *   post:
 *     tags: [TarifaEngine]
 *     summary: Calcula una tarifa usando el motor avanzado
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clienteId
 *               - origenId
 *               - destinoId
 *               - tipoUnidad
 *             properties:
 *               clienteId:
 *                 type: string
 *                 description: ID del cliente
 *               origenId:
 *                 type: string
 *                 description: ID del sitio de origen
 *               destinoId:
 *                 type: string
 *                 description: ID del sitio de destino
 *               fecha:
 *                 type: string
 *                 format: date
 *                 description: Fecha del cálculo (opcional, por defecto hoy)
 *               tipoTramo:
 *                 type: string
 *                 enum: [TRMC, TRMI]
 *                 default: TRMC
 *                 description: Tipo de tramo
 *               tipoUnidad:
 *                 type: string
 *                 description: Tipo de vehículo
 *               metodoCalculo:
 *                 type: string
 *                 description: Método específico (opcional, se auto-detecta)
 *               palets:
 *                 type: number
 *                 minimum: 0
 *                 description: Cantidad de palets
 *               peso:
 *                 type: number
 *                 minimum: 0
 *                 description: Peso total en kg
 *               volumen:
 *                 type: number
 *                 minimum: 0
 *                 description: Volumen en m³
 *               cantidadBultos:
 *                 type: integer
 *                 minimum: 0
 *                 description: Cantidad de bultos
 *               urgencia:
 *                 type: string
 *                 enum: [Normal, Urgente, Critico]
 *                 default: Normal
 *                 description: Nivel de urgencia
 *               vehiculos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     tipo:
 *                       type: string
 *                     cantidad:
 *                       type: integer
 *                       minimum: 1
 *               extras:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     cantidad:
 *                       type: number
 *               aplicarReglas:
 *                 type: boolean
 *                 default: true
 *                 description: Aplicar reglas de negocio
 *               usarCache:
 *                 type: boolean
 *                 default: true
 *                 description: Usar cache de resultados
 *               incluirDesgloseCalculo:
 *                 type: boolean
 *                 default: false
 *                 description: Incluir desglose detallado
 *     responses:
 *       200:
 *         description: Tarifa calculada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tarifaBase:
 *                   type: number
 *                 peaje:
 *                   type: number
 *                 total:
 *                   type: number
 *                 metodoUtilizado:
 *                   type: string
 *                 formulaAplicada:
 *                   type: string
 *                 reglasAplicadas:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       codigo:
 *                         type: string
 *                       nombre:
 *                         type: string
 *                       modificacion:
 *                         type: number
 *                 contextoUtilizado:
 *                   type: object
 *                 desgloseCalculo:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       etapa:
 *                         type: string
 *                       valor:
 *                         type: number
 *                       descripcion:
 *                         type: string
 *                 advertencias:
 *                   type: array
 *                   items:
 *                     type: string
 *                 cacheUtilizado:
 *                   type: boolean
 *                 metadatos:
 *                   type: object
 *       400:
 *         description: Datos de entrada inválidos
 *       404:
 *         description: Cliente, origen o destino no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/calculate', authenticateToken, calculateTarifaValidators, calculateTarifa as unknown);

/**
 * @swagger
 * /api/tarifa-engine/simulate:
 *   post:
 *     tags: [TarifaEngine]
 *     summary: Simula cálculos para múltiples escenarios
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - escenarios
 *             properties:
 *               escenarios:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - nombre
 *                     - clienteId
 *                     - origenId
 *                     - destinoId
 *                     - tipoUnidad
 *                   properties:
 *                     nombre:
 *                       type: string
 *                       description: Nombre descriptivo del escenario
 *                     clienteId:
 *                       type: string
 *                     origenId:
 *                       type: string
 *                     destinoId:
 *                       type: string
 *                     tipoUnidad:
 *                       type: string
 *                     fecha:
 *                       type: string
 *                       format: date
 *                     metodoCalculo:
 *                       type: string
 *                     palets:
 *                       type: number
 *                     peso:
 *                       type: number
 *                     urgencia:
 *                       type: string
 *                       enum: [Normal, Urgente, Critico]
 *               configuracion:
 *                 type: object
 *                 properties:
 *                   compararMetodos:
 *                     type: boolean
 *                     default: false
 *                     description: Comparar diferentes métodos de cálculo
 *                   incluirDesglose:
 *                     type: boolean
 *                     default: false
 *                     description: Incluir desglose detallado
 *                   aplicarReglas:
 *                     type: boolean
 *                     default: true
 *                     description: Aplicar reglas de negocio
 *     responses:
 *       200:
 *         description: Simulación completada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 simulacion:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     configuracion:
 *                       type: object
 *                     tiempoEjecucion:
 *                       type: number
 *                     usuario:
 *                       type: string
 *                 resultados:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       nombre:
 *                         type: string
 *                       parametros:
 *                         type: object
 *                       calculos:
 *                         type: object
 *                       analisis:
 *                         type: object
 *                 errores:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       escenario:
 *                         type: string
 *                       error:
 *                         type: string
 *                       parametros:
 *                         type: object
 *                 resumen:
 *                   type: object
 *                   properties:
 *                     rendimiento:
 *                       type: object
 *                     precios:
 *                       type: object
 *                     metodos:
 *                       type: object
 *                     recomendaciones:
 *                       type: array
 *                 metadatos:
 *                   type: object
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/simulate', authenticateToken, simulateTarifaValidators, simulateTarifa as unknown);

/**
 * @swagger
 * /api/tarifa-engine/audit:
 *   get:
 *     tags: [TarifaEngine]
 *     summary: Obtiene auditoría de cálculos del motor
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha desde
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha hasta
 *       - in: query
 *         name: clienteId
 *         schema:
 *           type: string
 *         description: ID del cliente específico
 *       - in: query
 *         name: conErrores
 *         schema:
 *           type: boolean
 *         description: Solo cálculos con errores
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *         description: Límite de resultados
 *       - in: query
 *         name: incluirContexto
 *         schema:
 *           type: boolean
 *         description: Incluir contexto de cálculo
 *       - in: query
 *         name: agruparPor
 *         schema:
 *           type: string
 *           enum: [cliente, metodo, fecha, hora]
 *         description: Agrupar resultados por criterio
 *     responses:
 *       200:
 *         description: Auditoría obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 consulta:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     filtros:
 *                       type: object
 *                     configuracion:
 *                       type: object
 *                     usuario:
 *                       type: string
 *                 auditorias:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       tiempoEjecucion:
 *                         type: number
 *                       resultado:
 *                         type: object
 *                       contexto:
 *                         type: object
 *                       errores:
 *                         type: array
 *                 agrupacion:
 *                   type: object
 *                 estadisticas:
 *                   type: object
 *                   properties:
 *                     resumen:
 *                       type: object
 *                     rendimiento:
 *                       type: object
 *                     metodos:
 *                       type: object
 *                     cache:
 *                       type: object
 *                     patrones:
 *                       type: object
 *                 cache:
 *                   type: object
 *                 metadatos:
 *                   type: object
 *       400:
 *         description: Parámetros de consulta inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/audit', authenticateToken, getAuditoriaValidators, getAuditoria as unknown);

/**
 * @swagger
 * /api/tarifa-engine/clear-cache:
 *   post:
 *     tags: [TarifaEngine]
 *     summary: Limpia la cache del motor (requiere permisos de administrador)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache limpiada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 operacion:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 usuario:
 *                   type: object
 *                 estadisticas:
 *                   type: object
 *                   properties:
 *                     antes:
 *                       type: object
 *                     despues:
 *                       type: object
 *                 impacto:
 *                   type: object
 *                 recomendaciones:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos suficientes
 *       500:
 *         description: Error interno del servidor
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/clear-cache', authenticateToken, clearCache as unknown);

export default router;
