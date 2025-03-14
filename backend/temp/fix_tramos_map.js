/**
 * Script para aplicar la corrección al mapa de tramos
 */

const fs = require('fs');
const path = require('path');

// Ruta al archivo original
const tramoControllerPath = path.join(__dirname, '..', 'controllers', 'tramoController.js');

// Ruta para el archivo de respaldo
const backupPath = `${tramoControllerPath}.bak.${Date.now()}`;

// Leer el contenido del archivo
console.log('Leyendo archivo original...');
const originalContent = fs.readFileSync(tramoControllerPath, 'utf8');

// Crear una copia de seguridad
console.log(`Creando copia de seguridad en: ${backupPath}`);
fs.writeFileSync(backupPath, originalContent, 'utf8');

// Patrón para encontrar la creación del mapa de tramos
const mapCreationPattern = /const mapaTramos = \{\};[\s\S]*?tramosExistentes\.forEach\(tramo => \{[\s\S]*?\/\/ Incluir el tipo en la clave para diferenciar entre TRMC y TRMI[\s\S]*?tramo\.tarifasHistoricas\.forEach\(tarifa => \{[\s\S]*?const key = `\$\{tramo\.origen\}-\$\{tramo\.destino\}-\$\{tarifa\.tipo\}`;[\s\S]*?if \(\!mapaTramos\[key\]\) \{[\s\S]*?mapaTramos\[key\] = \{ \.\.\.tramo\.toObject\(\), tarifaTipo: tarifa\.tipo \};[\s\S]*?\}[\s\S]*?\}\);/;

// Reemplazo para la creación del mapa
const mapCreationReplacement = `const mapaTramos = {};
        tramosExistentes.forEach(tramo => {
            // Incluir el tipo en la clave para diferenciar entre TRMC y TRMI
            if (tramo.tarifasHistoricas && tramo.tarifasHistoricas.length > 0) {
                // Crear una entrada para cada tipo de tarifa histórica
                const tiposUnicos = new Set(tramo.tarifasHistoricas.map(t => t.tipo));
                tiposUnicos.forEach(tipo => {
                    const key = \`\${tramo.origen}-\${tramo.destino}-\${tipo}\`;
                    mapaTramos[key] = tramo;
                });
            } else {
                // Si no tiene tarifas históricas, usar la clave básica
                const key = \`\${tramo.origen}-\${tramo.destino}\`;
                mapaTramos[key] = tramo;
            }
        });`;

// Aplicar la corrección
console.log('Aplicando corrección...');
let modifiedContent = originalContent.replace(mapCreationPattern, mapCreationReplacement);

// Verificar si se realizó el reemplazo
if (modifiedContent === originalContent) {
    console.error('No se pudo encontrar el patrón para reemplazar. Aplicando método alternativo...');
    
    // Método alternativo: buscar por líneas clave
    const lines = originalContent.split('\n');
    let startIndex = -1;
    let endIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('const mapaTramos = {};')) {
            startIndex = i;
        }
        if (startIndex !== -1 && lines[i].includes('});') && i > startIndex + 5) {
            endIndex = i;
            break;
        }
    }
    
    if (startIndex !== -1 && endIndex !== -1) {
        console.log(`Encontrado bloque de código entre líneas ${startIndex+1} y ${endIndex+1}`);
        const newLines = [
            '        const mapaTramos = {};',
            '        tramosExistentes.forEach(tramo => {',
            '            // Incluir el tipo en la clave para diferenciar entre TRMC y TRMI',
            '            if (tramo.tarifasHistoricas && tramo.tarifasHistoricas.length > 0) {',
            '                // Crear una entrada para cada tipo de tarifa histórica',
            '                const tiposUnicos = new Set(tramo.tarifasHistoricas.map(t => t.tipo));',
            '                tiposUnicos.forEach(tipo => {',
            '                    const key = `${tramo.origen}-${tramo.destino}-${tipo}`;',
            '                    mapaTramos[key] = tramo;',
            '                });',
            '            } else {',
            '                // Si no tiene tarifas históricas, usar la clave básica',
            '                const key = `${tramo.origen}-${tramo.destino}`;',
            '                mapaTramos[key] = tramo;',
            '            }',
            '        });'
        ];
        
        lines.splice(startIndex, endIndex - startIndex + 1, ...newLines);
        modifiedContent = lines.join('\n');
    } else {
        console.error('No se pudo encontrar el bloque de código para reemplazar');
        process.exit(1);
    }
}

// Escribir el contenido modificado
console.log('Escribiendo archivo modificado...');
fs.writeFileSync(tramoControllerPath, modifiedContent, 'utf8');

console.log('¡Corrección aplicada con éxito!');
console.log('Por favor, reinicie el servidor para que los cambios surtan efecto.'); 