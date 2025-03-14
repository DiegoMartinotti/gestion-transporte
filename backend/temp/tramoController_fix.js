/**
 * Corrección para el problema de los tipos de tramo TRMC y TRMI
 * 
 * Modificaciones necesarias en el archivo tramoController.js:
 * 
 * 1. Modificar cómo se crea el mapa de tramos existentes:
 */

// Crear un mapa para búsqueda rápida de tramos existentes
const mapaTramos = {};
tramosExistentes.forEach(tramo => {
    // Incluir el tipo en la clave para diferenciar entre TRMC y TRMI
    if (tramo.tarifasHistoricas && tramo.tarifasHistoricas.length > 0) {
        // Crear una entrada para cada tipo de tarifa histórica
        const tiposUnicos = new Set(tramo.tarifasHistoricas.map(t => t.tipo));
        tiposUnicos.forEach(tipo => {
            const key = `${tramo.origen}-${tramo.destino}-${tipo}`;
            mapaTramos[key] = tramo;
        });
    } else {
        // Si no tiene tarifas históricas, usar la clave básica
        const key = `${tramo.origen}-${tramo.destino}`;
        mapaTramos[key] = tramo;
    }
});

/**
 * 2. Modificar cómo se busca un tramo existente:
 */

// Verificar si ya existe un tramo con el mismo origen, destino y tipo
const tipo = tramoData.tarifaHistorica.tipo?.toUpperCase() || 'TRMC';
const tramoKey = `${tramoData.origen}-${tramoData.destino}-${tipo}`;
const tramoExistente = mapaTramos[tramoKey];

/**
 * 3. Modificar cómo se actualiza el mapa de tramos después de crear uno nuevo:
 */

// Actualizar el mapa de tramos existentes con el nuevo tipo específico
const nuevoTipo = tramoData.tarifaHistorica.tipo;
const nuevoTramoKey = `${tramoData.origen}-${tramoData.destino}-${nuevoTipo}`;
mapaTramos[nuevoTramoKey] = nuevoTramo;

/**
 * Instrucciones para aplicar la corrección:
 * 
 * 1. Reemplazar la creación del mapa de tramos en la línea ~212
 * 2. Reemplazar la búsqueda del tramo existente en la línea ~275
 * 3. Reemplazar la actualización del mapa después de crear un nuevo tramo en la línea ~411
 */ 