/**
 * Utilidad para depurar problemas con tramos TRMC vs TRMI
 */
import { generarTramoId, Tramo } from './tramoValidator';
import logger from './logger';

/**
 * Resultado de la comparación de tramos
 */
interface ResultadoComparacion {
  origenMatch: boolean;
  destinoMatch: boolean;
  tipoMatch: boolean;
  metodoMatch: boolean;
  idsMatch: boolean;
}

/**
 * Compara dos tramos y muestra información detallada de la comparación
 * @param tramo1 - Primer tramo
 * @param tramo2 - Segundo tramo 
 * @returns Resultado de la comparación
 */
const compararTramos = (tramo1: Tramo, tramo2: Tramo): ResultadoComparacion => {
    logger.debug('=========== DEPURACIÓN DE COMPARACIÓN DE TRAMOS ===========');
    
    // Mostrar datos básicos de cada tramo
    logger.debug('TRAMO 1:', {
        origen: tramo1.origen.toString(),
        destino: tramo1.destino.toString(),
        tipo: tramo1.tipo,
        metodo: tramo1.metodoCalculo
    });
    
    logger.debug('TRAMO 2:', {
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

    logger.debug('COMPARACIÓN DE COMPONENTES:', {
        origenMatch,
        destinoMatch,
        tipoMatch,
        metodoMatch
    });

    // Verificar específicamente el tipo
    logger.debug('VERIFICACIÓN TIPO:', {
        tramo1Tipo: tramo1.tipo,
        tramo1TipoType: typeof tramo1.tipo,
        tramo2Tipo: tramo2.tipo,
        tramo2TipoType: typeof tramo2.tipo,
        iguales: tramo1.tipo === tramo2.tipo,
        upperCase1: tramo1.tipo?.toUpperCase(),
        upperCase2: tramo2.tipo?.toUpperCase(),
        igualesUpperCase: tramo1.tipo?.toUpperCase() === tramo2.tipo?.toUpperCase()
    });

    // Generar y comparar IDs completos
    const id1 = generarTramoId(tramo1);
    const id2 = generarTramoId(tramo2);

    logger.debug('IDs GENERADOS:', {
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

/**
 * Función para normalizar un tramo y verificar que todos sus campos estén correctos
 * @param tramo - El tramo a normalizar
 * @returns Tramo normalizado
 */
const normalizarTramo = (tramo: Tramo): Tramo => {
    const tramoNormalizado: Tramo = { ...tramo };
    
    // Asegurar que el tipo esté en mayúsculas y sea un valor válido
    if (tramoNormalizado.tipo) {
        tramoNormalizado.tipo = tramoNormalizado.tipo.toUpperCase();
        if (!['TRMC', 'TRMI'].includes(tramoNormalizado.tipo)) {
            logger.warn(`Tipo inválido encontrado: ${tramoNormalizado.tipo}, se establece TRMC por defecto`);
            tramoNormalizado.tipo = 'TRMC';
        }
    } else {
        logger.warn('Tramo sin tipo definido, se establece TRMC por defecto');
        tramoNormalizado.tipo = 'TRMC';
    }

    // Asegurar que el método de cálculo sea un valor válido
    if (tramoNormalizado.metodoCalculo) {
        if (!['Kilometro', 'Tarifa', 'Palet', 'Bulto'].includes(tramoNormalizado.metodoCalculo)) {
            logger.warn(`Método de cálculo inválido: ${tramoNormalizado.metodoCalculo}, se establece Kilometro por defecto`);
            tramoNormalizado.metodoCalculo = 'Kilometro';
        }
    } else {
        logger.warn('Tramo sin método de cálculo, se establece Kilometro por defecto');
        tramoNormalizado.metodoCalculo = 'Kilometro';
    }

    return tramoNormalizado;
};

export {
    compararTramos,
    normalizarTramo,
    ResultadoComparacion
}; 