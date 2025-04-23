"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugTramo = exports.sonTramosIguales = exports.generarTramoId = exports.fechasSuperpuestas = exports.normalizarFecha = void 0;
/**
 * Utility para validar tramos y detectar duplicados
 */
const logger_1 = __importDefault(require("./logger"));
/**
 * Normaliza las fechas para manejo consistente
 * @param fecha - La fecha a normalizar
 * @returns Fecha normalizada
 */
const normalizarFecha = (fecha) => {
    if (fecha instanceof Date) {
        return fecha;
    }
    if (typeof fecha === 'string' && fecha.includes('/')) {
        const parts = fecha.split('/');
        if (parts.length === 3) {
            return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00.000Z`);
        }
    }
    return new Date(fecha);
};
exports.normalizarFecha = normalizarFecha;
/**
 * Verifica si dos fechas se superponen
 * @param fecha1Desde - Fecha inicio primer rango
 * @param fecha1Hasta - Fecha fin primer rango
 * @param fecha2Desde - Fecha inicio segundo rango
 * @param fecha2Hasta - Fecha fin segundo rango
 * @returns true si hay superposición
 */
const fechasSuperpuestas = (fecha1Desde, fecha1Hasta, fecha2Desde, fecha2Hasta) => {
    // Normalizar fechas
    const f1Desde = normalizarFecha(fecha1Desde);
    const f1Hasta = normalizarFecha(fecha1Hasta);
    const f2Desde = normalizarFecha(fecha2Desde);
    const f2Hasta = normalizarFecha(fecha2Hasta);
    // Verificar superposición y mostrar log detallado
    logger_1.default.debug('Comparando fechas para superposición:');
    logger_1.default.debug(`Rango 1: ${f1Desde.toISOString().split('T')[0]} - ${f1Hasta.toISOString().split('T')[0]}`);
    logger_1.default.debug(`Rango 2: ${f2Desde.toISOString().split('T')[0]} - ${f2Hasta.toISOString().split('T')[0]}`);
    // Dos rangos se superponen si el inicio de uno es anterior o igual al fin del otro
    // Y el fin de uno es posterior o igual al inicio del otro
    const haySuper = f1Desde <= f2Hasta && f2Desde <= f1Hasta;
    if (haySuper) {
        logger_1.default.debug('⚠️ SUPERPOSICIÓN DETECTADA');
        logger_1.default.debug(`Rango 1 inicia antes del fin de Rango 2: ${f1Desde <= f2Hasta}`);
        logger_1.default.debug(`Rango 2 inicia antes del fin de Rango 1: ${f2Desde <= f1Hasta}`);
    }
    else {
        logger_1.default.debug('✅ No hay superposición');
        logger_1.default.debug(`Rango 1 termina antes de que inicie Rango 2: ${f1Hasta < f2Desde}`);
        logger_1.default.debug(`Rango 2 termina antes de que inicie Rango 1: ${f2Hasta < f1Desde}`);
    }
    return haySuper;
};
exports.fechasSuperpuestas = fechasSuperpuestas;
/**
 * Genera un identificador único para un tramo basado en sus propiedades
 * @param tramo - El objeto tramo
 * @returns ID único
 */
const generarTramoId = (tramo) => {
    if (!tramo.origen || !tramo.destino) {
        throw new Error('El tramo debe tener origen y destino definidos');
    }
    // Normalizar el tipo (IMPORTANTE)
    const tipo = tramo.tipo ? tramo.tipo.toUpperCase() : 'TRMC';
    // Normalizar método de cálculo
    const metodo = tramo.metodoCalculo || 'Palet';
    // Log de diagnóstico mejorado
    logger_1.default.debug(`[DIAGNÓSTICO] generarTramoId - Datos: origen=${tramo.origen}, destino=${tramo.destino}, tipo=${tipo}, metodo=${metodo}`);
    // Crear un ID que garantice la distinción por tipo
    const id = `${tramo.origen}:${tramo.destino}:${tipo}:${metodo}`;
    logger_1.default.debug(`[DIAGNÓSTICO] ID generado: ${id}`);
    return id;
};
exports.generarTramoId = generarTramoId;
/**
 * Verifica si dos tramos son exactamente iguales (misma ruta, tipo y método)
 * @param tramo1 - Primer tramo
 * @param tramo2 - Segundo tramo
 * @returns true si son el mismo tramo
 */
const sonTramosIguales = (tramo1, tramo2) => {
    // Normalizar tipos para comparación
    const tipo1 = tramo1.tipo ? tramo1.tipo.toUpperCase() : 'TRMC';
    const tipo2 = tramo2.tipo ? tramo2.tipo.toUpperCase() : 'TRMC';
    const sonIguales = (tramo1.origen.toString() === tramo2.origen.toString() &&
        tramo1.destino.toString() === tramo2.destino.toString() &&
        tipo1 === tipo2 &&
        (tramo1.metodoCalculo || 'Palet') === (tramo2.metodoCalculo || 'Palet'));
    // Log detallado
    logger_1.default.debug(`sonTramosIguales: Comparando tramos - Resultado: ${sonIguales}`);
    logger_1.default.debug(`Tipo 1: ${tipo1}, Tipo 2: ${tipo2}`);
    return sonIguales;
};
exports.sonTramosIguales = sonTramosIguales;
/**
 * Debug: Imprime los detalles completos de un tramo para diagnóstico
 * @param tramo - El tramo a inspeccionar
 * @param etiqueta - Etiqueta para identificar el log
 */
const debugTramo = (tramo, etiqueta = 'Tramo') => {
    logger_1.default.debug(`------ DEBUG ${etiqueta} ------`);
    logger_1.default.debug(`ID: ${generarTramoId(tramo)}`);
    logger_1.default.debug(`Origen: ${tramo.origen}`);
    logger_1.default.debug(`Destino: ${tramo.destino}`);
    logger_1.default.debug(`Tipo: ${tramo.tipo} (normalizado: ${tramo.tipo ? tramo.tipo.toUpperCase() : 'TRMC'})`);
    logger_1.default.debug(`Método: ${tramo.metodoCalculo || 'Kilometro'}`);
    logger_1.default.debug(`Cliente: ${tramo.cliente}`);
    logger_1.default.debug(`Vigencia: ${tramo.vigenciaDesde} - ${tramo.vigenciaHasta}`);
    logger_1.default.debug('-------------------------');
};
exports.debugTramo = debugTramo;
//# sourceMappingURL=tramoValidator.js.map