/**
 * Script para aplicar las correcciones al archivo tramoController.js
 * 
 * Este script modifica el archivo tramoController.js para corregir el problema
 * con los tipos de tramo TRMC y TRMI.
 */

const fs = require('fs');
const path = require('path');

// Ruta al archivo original
const tramoControllerPath = path.join(__dirname, '..', 'controllers', 'tramoController.js');

// Leer el archivo original
console.log('Leyendo archivo original...');
let content = fs.readFileSync(tramoControllerPath, 'utf8');

// Hacer las modificaciones
console.log('Aplicando correcciones...');

// 1. Reemplazar la creación del mapa de tramos
const mapaCreationPattern = /const mapaTramos = \{\};\s+tramosExistentes\.forEach\(tramo => \{\s+const key = `\$\{tramo\.origen\}-\$\{tramo\.destino\}`;\s+mapaTramos\[key\] = tramo;\s+\}\);/;
const mapaCreationReplacement = `const mapaTramos = {};
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

content = content.replace(mapaCreationPattern, mapaCreationReplacement);

// 2. Reemplazar la búsqueda del tramo existente
const tramoKeyPattern = /const tramoKey = `\$\{tramoData\.origen\}-\$\{tramoData\.destino\}`;\s+const tramoExistente = mapaTramos\[tramoKey\];/;
const tramoKeyReplacement = `// Verificar si ya existe un tramo con el mismo origen, destino y tipo
                const tipo = tramoData.tarifaHistorica.tipo?.toUpperCase() || 'TRMC';
                const tramoKey = \`\${tramoData.origen}-\${tramoData.destino}-\${tipo}\`;
                const tramoExistente = mapaTramos[tramoKey];`;

content = content.replace(tramoKeyPattern, tramoKeyReplacement);

// 3. Reemplazar la actualización del mapa después de crear un nuevo tramo
const updateMapPattern = /mapaTramos\[tramoKey\] = nuevoTramo;/;
const updateMapReplacement = `// Actualizar el mapa de tramos existentes con el nuevo tipo específico
                     const nuevoTipo = tramoData.tarifaHistorica.tipo;
                     const nuevoTramoKey = \`\${tramoData.origen}-\${tramoData.destino}-\${nuevoTipo}\`;
                     mapaTramos[nuevoTramoKey] = nuevoTramo;`;

content = content.replace(updateMapPattern, updateMapReplacement);

// Crear una copia de seguridad del archivo original
const backupPath = path.join(__dirname, '..', 'controllers', 'tramoController.js.bak');
console.log('Creando copia de seguridad en:', backupPath);
fs.writeFileSync(backupPath, fs.readFileSync(tramoControllerPath));

// Escribir el archivo modificado
console.log('Escribiendo archivo modificado...');
fs.writeFileSync(tramoControllerPath, content);

console.log('¡Correcciones aplicadas con éxito!');
console.log('Por favor, reinicie el servidor para que los cambios surtan efecto.'); 