/**
 * Script para aplicar la corrección a la visualización de tramos
 */

const fs = require('fs');
const path = require('path');

// Ruta al archivo original
const tramoControllerPath = path.join(__dirname, '..', 'controllers', 'tramoController.js');

// Ruta para el archivo de respaldo
const backupPath = `${tramoControllerPath}.bak.visualizacion.${Date.now()}`;

// Leer el contenido del archivo
console.log('Leyendo archivo original...');
const originalContent = fs.readFileSync(tramoControllerPath, 'utf8');

// Crear una copia de seguridad
console.log(`Creando copia de seguridad en: ${backupPath}`);
fs.writeFileSync(backupPath, originalContent, 'utf8');

// Buscar la función getTramosByCliente
const getTramosByClienteRegex = /exports\.getTramosByCliente\s*=\s*async\s*\(\s*req\s*,\s*res\s*\)\s*=>\s*\{[\s\S]*?(?=exports\.)/;

// Nuevo código para la función getTramosByCliente
const newGetTramosByCliente = `exports.getTramosByCliente = async (req, res) => {
    try {
        logger.debug('Buscando tramos para cliente:', req.params.cliente);
        
        const { cliente } = req.params;
        
        // Obtener todos los tramos del cliente
        const todosLosTramos = await Tramo.find({ cliente })
            .populate('origen', 'Site location')
            .populate('destino', 'Site location')
            .lean();  // Usar lean() para mejor rendimiento
        
        logger.debug(\`Encontrados \${todosLosTramos.length} tramos totales para cliente \${cliente}\`);
        
        // Crear un mapa para almacenar solo el tramo más reciente por cada combinación
        // Modificamos la clave para incluir el tipo de tramo
        const tramosUnicos = new Map();
        
        // Procesar cada tramo
        todosLosTramos.forEach(tramo => {
            if (!tramo || !tramo.origen || !tramo.destino) {
                logger.error('Tramo inválido o sin origen/destino:', tramo);
                return;
            }
            
            // Verificar si el tramo tiene tarifas históricas
            if (tramo.tarifasHistoricas && tramo.tarifasHistoricas.length > 0) {
                // Procesar cada tarifa histórica como un tramo separado
                tramo.tarifasHistoricas.forEach(tarifa => {
                    // Crear una copia del tramo para cada tarifa
                    const tramoConTarifa = {
                        ...tramo,
                        tipo: tarifa.tipo || 'TRMC',
                        metodoCalculo: tarifa.metodoCalculo,
                        valor: tarifa.valor,
                        valorPeaje: tarifa.valorPeaje,
                        vigenciaDesde: tarifa.vigenciaDesde,
                        vigenciaHasta: tarifa.vigenciaHasta,
                        // Mantener la referencia a todas las tarifas históricas
                        tarifasHistoricas: tramo.tarifasHistoricas
                    };
                    
                    // Crear una clave única que incluya origen, destino y tipo
                    const clave = \`\${tramo.origen.Site}-\${tramo.destino.Site}-\${tarifa.tipo || 'TRMC'}\`;
                    
                    // Convertir vigenciaHasta a Date para comparación
                    const vigenciaHasta = new Date(tarifa.vigenciaHasta);
                    
                    // Si no existe un tramo para esta clave o este tramo tiene una fecha más reciente
                    if (!tramosUnicos.has(clave) || 
                        vigenciaHasta > new Date(tramosUnicos.get(clave).vigenciaHasta)) {
                        tramosUnicos.set(clave, tramoConTarifa);
                        logger.debug(\`Actualizado tramo para \${clave} con vigencia hasta \${vigenciaHasta.toISOString()}\`);
                    }
                });
            } else {
                // Para tramos sin tarifas históricas (formato antiguo)
                // Crear una clave única que incluya origen, destino y tipo
                const clave = \`\${tramo.origen.Site}-\${tramo.destino.Site}-\${tramo.tipo || 'TRMC'}\`;
                
                // Convertir vigenciaHasta a Date para comparación
                const vigenciaHasta = new Date(tramo.vigenciaHasta);
                
                // Si no existe un tramo para esta clave o este tramo tiene una fecha más reciente
                if (!tramosUnicos.has(clave) || 
                    vigenciaHasta > new Date(tramosUnicos.get(clave).vigenciaHasta)) {
                    tramosUnicos.set(clave, tramo);
                    logger.debug(\`Actualizado tramo para \${clave} con vigencia hasta \${vigenciaHasta.toISOString()}\`);
                }
            }
        });
        
        // Convertir el mapa a array y ordenar
        const resultado = Array.from(tramosUnicos.values()).sort((a, b) => {
            // Primero ordenar por origen
            const origenA = a.origen?.Site || '';
            const origenB = b.origen?.Site || '';
            if (origenA < origenB) return -1;
            if (origenA > origenB) return 1;
            
            // Si origen es igual, ordenar por destino
            const destinoA = a.destino?.Site || '';
            const destinoB = b.destino?.Site || '';
            if (destinoA < destinoB) return -1;
            if (destinoA > destinoB) return 1;
            
            // Si origen y destino son iguales, ordenar por tipo
            return (a.tipo || 'TRMC').localeCompare(b.tipo || 'TRMC');
        });
        
        logger.debug(\`Enviando \${resultado.length} tramos únicos de \${todosLosTramos.length} totales\`);
        
        // Enviar respuesta con metadata
        res.json({
            success: true,
            data: resultado,
            metadata: {
                totalTramos: todosLosTramos.length,
                tramosUnicos: resultado.length,
                combinacionesUnicas: tramosUnicos.size
            }
        });
        
    } catch (error) {
        logger.error('Error al obtener tramos:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

`;

// Aplicar la corrección
console.log('Aplicando corrección...');
let modifiedContent = originalContent.replace(getTramosByClienteRegex, newGetTramosByCliente);

// Verificar si se realizó el reemplazo
if (modifiedContent === originalContent) {
    console.error('No se pudo encontrar la función getTramosByCliente para reemplazar. Aplicando método alternativo...');
    
    // Método alternativo: buscar por líneas clave
    const lines = originalContent.split('\n');
    let startIndex = -1;
    let endIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('exports.getTramosByCliente = async (req, res) =>')) {
            startIndex = i;
        }
        if (startIndex !== -1 && lines[i].includes('};') && i > startIndex + 10) {
            // Buscar la siguiente función después de getTramosByCliente
            for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
                if (lines[j].includes('exports.') && lines[j].includes('= async')) {
                    endIndex = j - 1;
                    break;
                }
            }
            if (endIndex === -1) {
                endIndex = i;
            }
            break;
        }
    }
    
    if (startIndex !== -1 && endIndex !== -1) {
        console.log(`Encontrado bloque de código entre líneas ${startIndex+1} y ${endIndex+1}`);
        
        // Dividir el nuevo código en líneas
        const newLines = newGetTramosByCliente.split('\n');
        
        // Reemplazar el bloque de código
        lines.splice(startIndex, endIndex - startIndex + 1, ...newLines);
        modifiedContent = lines.join('\n');
    } else {
        console.error('No se pudo encontrar la función getTramosByCliente para reemplazar');
        process.exit(1);
    }
}

// Escribir el contenido modificado
console.log('Escribiendo archivo modificado...');
fs.writeFileSync(tramoControllerPath, modifiedContent, 'utf8');

console.log('¡Corrección aplicada con éxito!');
console.log('Por favor, reinicie el servidor para que los cambios surtan efecto.'); 