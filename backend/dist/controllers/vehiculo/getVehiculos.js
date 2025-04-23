"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const vehiculoService = require('../../services/vehiculo/vehiculoService');
const logger = require('../../utils/logger');
/**
 * Analiza y valida los parámetros de filtrado y paginación
 * @param {Object} query - Parámetros de la query string
 * @returns {Object} Parámetros procesados
 */
const procesarParametros = (query) => {
    const opciones = {
        limite: parseInt(query.limite) || 50,
        pagina: parseInt(query.pagina) || 1,
        filtros: {}
    };
    // Limitar valores extremos
    opciones.limite = Math.min(Math.max(opciones.limite, 1), 100);
    opciones.pagina = Math.max(opciones.pagina, 1);
    // Procesar filtros específicos
    const filtrosPermitidos = ['dominio', 'tipo', 'activo', 'modelo', 'anio'];
    filtrosPermitidos.forEach(filtro => {
        if (query[filtro] !== undefined) {
            // Manejar valores específicos según el tipo
            if (filtro === 'activo') {
                opciones.filtros[filtro] = query[filtro].toLowerCase() === 'true';
            }
            else if (filtro === 'anio') {
                opciones.filtros[filtro] = parseInt(query[filtro]);
            }
            else {
                opciones.filtros[filtro] = query[filtro];
            }
        }
    });
    // Filtro por documentos próximos a vencer
    if (query.vencimientoProximo === 'true') {
        opciones.vencimientoProximo = true;
        opciones.diasVencimiento = parseInt(query.diasVencimiento) || 30;
    }
    // Filtro por documentos vencidos
    if (query.vencidos === 'true') {
        opciones.vencidos = true;
    }
    return opciones;
};
/**
 * @desc    Obtener todos los vehículos con filtros
 * @route   GET /api/vehiculos
 * @access  Private
 */
const getVehiculos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const inicioTiempo = Date.now();
    logger.info(`Petición recibida: GET /api/vehiculos ${JSON.stringify(req.query)}`);
    try {
        const opciones = procesarParametros(req.query);
        logger.info(`Parámetros procesados: ${JSON.stringify(opciones)}`);
        let resultado;
        // Determinar el tipo de consulta según los parámetros
        if (opciones.vencimientoProximo) {
            // Consulta de vehículos con vencimientos próximos
            resultado = yield vehiculoService.getVehiculosConVencimientos(opciones.diasVencimiento);
            logger.info(`Obtenidos ${resultado.length} vehículos con vencimientos próximos`);
        }
        else if (opciones.vencidos) {
            // Consulta de vehículos con documentos vencidos
            resultado = yield vehiculoService.getVehiculosVencidos();
            logger.info(`Obtenidos ${resultado.length} vehículos con documentos vencidos`);
        }
        else {
            // Consulta estándar con filtros
            resultado = yield vehiculoService.getAllVehiculos(opciones);
            const { vehiculos, paginacion } = resultado;
            logger.info(`Obtenidos ${vehiculos.length} vehículos (total: ${paginacion.total})`);
            // Para mantener compatibilidad con el cliente, si no se solicitó paginación
            // devolvemos solo el array de vehículos
            if (!req.query.pagina && !req.query.limite) {
                resultado = vehiculos;
            }
        }
        const tiempoTotal = Date.now() - inicioTiempo;
        logger.info(`Tiempo de respuesta: ${tiempoTotal}ms`);
        res.status(200).json(resultado);
    }
    catch (error) {
        const tiempoTotal = Date.now() - inicioTiempo;
        logger.error(`Error al obtener vehículos: ${error.message} (tiempo: ${tiempoTotal}ms)`, error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error al obtener vehículos',
            error: error.message
        });
    }
});
module.exports = getVehiculos;
//# sourceMappingURL=getVehiculos.js.map