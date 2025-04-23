"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizarTramo = exports.compararTramos = void 0;
/**
 * Utilidad para depurar problemas con tramos TRMC vs TRMI
 */
const tramoValidator_1 = require("./tramoValidator");
const logger_1 = __importDefault(require("./logger"));
/**
 * Compara dos tramos y muestra información detallada de la comparación
 * @param tramo1 - Primer tramo
 * @param tramo2 - Segundo tramo
 * @returns Resultado de la comparación
 */
const compararTramos = (tramo1, tramo2) => {
    var _a, _b, _c, _d;
    logger_1.default.debug('=========== DEPURACIÓN DE COMPARACIÓN DE TRAMOS ===========');
    // Mostrar datos básicos de cada tramo
    logger_1.default.debug('TRAMO 1:', {
        origen: tramo1.origen.toString(),
        destino: tramo1.destino.toString(),
        tipo: tramo1.tipo,
        metodo: tramo1.metodoCalculo
    });
    logger_1.default.debug('TRAMO 2:', {
        origen: tramo2.origen.toString(),
        destino: tramo2.destino.toString(),
        tipo: tramo2.tipo,
        metodo: tramo2.metodoCalculo
    });
    // Verificar cada componente del ID individualmente
    const origenMatch = tramo1.origen.toString() === tramo2.origen.toString();
    const destinoMatch = tramo1.destino.toString() === tramo2.destino.toString();
    const tipoMatch = tramo1.tipo === tramo2.tipo;
    const metodoMatch = tramo1.metodoCalculo === tramo2.metodoCalculo;
    logger_1.default.debug('COMPARACIÓN DE COMPONENTES:', {
        origenMatch,
        destinoMatch,
        tipoMatch,
        metodoMatch
    });
    // Verificar específicamente el tipo
    logger_1.default.debug('VERIFICACIÓN TIPO:', {
        tramo1Tipo: tramo1.tipo,
        tramo1TipoType: typeof tramo1.tipo,
        tramo2Tipo: tramo2.tipo,
        tramo2TipoType: typeof tramo2.tipo,
        iguales: tramo1.tipo === tramo2.tipo,
        upperCase1: (_a = tramo1.tipo) === null || _a === void 0 ? void 0 : _a.toUpperCase(),
        upperCase2: (_b = tramo2.tipo) === null || _b === void 0 ? void 0 : _b.toUpperCase(),
        igualesUpperCase: ((_c = tramo1.tipo) === null || _c === void 0 ? void 0 : _c.toUpperCase()) === ((_d = tramo2.tipo) === null || _d === void 0 ? void 0 : _d.toUpperCase())
    });
    // Generar y comparar IDs completos
    const id1 = (0, tramoValidator_1.generarTramoId)(tramo1);
    const id2 = (0, tramoValidator_1.generarTramoId)(tramo2);
    logger_1.default.debug('IDs GENERADOS:', {
        id1,
        id2,
        iguales: id1 === id2
    });
    return {
        origenMatch,
        destinoMatch,
        tipoMatch,
        metodoMatch,
        idsMatch: id1 === id2
    };
};
exports.compararTramos = compararTramos;
/**
 * Función para normalizar un tramo y verificar que todos sus campos estén correctos
 * @param tramo - El tramo a normalizar
 * @returns Tramo normalizado
 */
const normalizarTramo = (tramo) => {
    const tramoNormalizado = Object.assign({}, tramo);
    // Asegurar que el tipo esté en mayúsculas y sea un valor válido
    if (tramoNormalizado.tipo) {
        tramoNormalizado.tipo = tramoNormalizado.tipo.toUpperCase();
        if (!['TRMC', 'TRMI'].includes(tramoNormalizado.tipo)) {
            logger_1.default.warn(`Tipo inválido encontrado: ${tramoNormalizado.tipo}, se establece TRMC por defecto`);
            tramoNormalizado.tipo = 'TRMC';
        }
    }
    else {
        logger_1.default.warn('Tramo sin tipo definido, se establece TRMC por defecto');
        tramoNormalizado.tipo = 'TRMC';
    }
    // Asegurar que el método de cálculo sea un valor válido
    if (tramoNormalizado.metodoCalculo) {
        if (!['Kilometro', 'Tarifa', 'Palet', 'Bulto'].includes(tramoNormalizado.metodoCalculo)) {
            logger_1.default.warn(`Método de cálculo inválido: ${tramoNormalizado.metodoCalculo}, se establece Kilometro por defecto`);
            tramoNormalizado.metodoCalculo = 'Kilometro';
        }
    }
    else {
        logger_1.default.warn('Tramo sin método de cálculo, se establece Kilometro por defecto');
        tramoNormalizado.metodoCalculo = 'Kilometro';
    }
    return tramoNormalizado;
};
exports.normalizarTramo = normalizarTramo;
//# sourceMappingURL=tramoDebugger.js.map