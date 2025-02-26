/**
 * Utilidad para depurar problemas con tramos TRMC vs TRMI
 */
const { generarTramoId } = require('./tramoValidator');

/**
 * Compara dos tramos y muestra información detallada de la comparación
 * @param {Object} tramo1 - Primer tramo
 * @param {Object} tramo2 - Segundo tramo 
 */
const compararTramos = (tramo1, tramo2) => {
    console.log('=========== DEPURACIÓN DE COMPARACIÓN DE TRAMOS ===========');
    
    // Mostrar datos básicos de cada tramo
    console.log('TRAMO 1:', {
        origen: tramo1.origen.toString(),
        destino: tramo1.destino.toString(),
        tipo: tramo1.tipo,
        metodo: tramo1.metodoCalculo
    });
    
    console.log('TRAMO 2:', {
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

    console.log('COMPARACIÓN DE COMPONENTES:', {
        origenMatch,
        destinoMatch,
        tipoMatch,
        metodoMatch
    });

    // Verificar específicamente el tipo
    console.log('VERIFICACIÓN TIPO:', {
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

    console.log('IDs GENERADOS:', {
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
 * @param {Object} tramo - El tramo a normalizar
 * @returns {Object} Tramo normalizado
 */
const normalizarTramo = (tramo) => {
    const tramoNormalizado = { ...tramo };
    
    // Asegurar que el tipo esté en mayúsculas y sea un valor válido
    if (tramoNormalizado.tipo) {
        tramoNormalizado.tipo = tramoNormalizado.tipo.toUpperCase();
        if (!['TRMC', 'TRMI'].includes(tramoNormalizado.tipo)) {
            console.warn(`Tipo inválido encontrado: ${tramoNormalizado.tipo}, se establece TRMC por defecto`);
            tramoNormalizado.tipo = 'TRMC';
        }
    } else {
        console.warn('Tramo sin tipo definido, se establece TRMC por defecto');
        tramoNormalizado.tipo = 'TRMC';
    }

    // Asegurar que el método de cálculo sea un valor válido
    if (tramoNormalizado.metodoCalculo) {
        if (!['Kilometro', 'Tarifa', 'Palet', 'Bulto'].includes(tramoNormalizado.metodoCalculo)) {
            console.warn(`Método de cálculo inválido: ${tramoNormalizado.metodoCalculo}, se establece Kilometro por defecto`);
            tramoNormalizado.metodoCalculo = 'Kilometro';
        }
    } else {
        console.warn('Tramo sin método de cálculo, se establece Kilometro por defecto');
        tramoNormalizado.metodoCalculo = 'Kilometro';
    }

    return tramoNormalizado;
};

module.exports = {
    compararTramos,
    normalizarTramo
};
