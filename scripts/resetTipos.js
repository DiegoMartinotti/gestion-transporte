/**
 * Script para corregir problemas de tipos en la base de datos
 * Ejecutar con: node scripts/resetTipos.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Tramo = require('../backend/models/Tramo');
const { connectDB } = require('../backend/config/database');
const { generarTramoId } = require('../backend/utils/tramoValidator');

console.log('Conectando a la base de datos...');

// Usar la función segura de conexión
connectDB()
  .then(async () => {
    try {
        console.log('Conexión establecida. Iniciando corrección de tipos...');
        
        // 1. Eliminar índices existentes
        console.log('Eliminando índices existentes...');
        try {
            await mongoose.connection.db.collection('tramos').dropIndex('idx_tramo_completo');
            console.log('Índice idx_tramo_completo eliminado');
        } catch (e) {
            console.log('No se pudo eliminar el índice (posiblemente no existe):', e.message);
        }
        
        // 2. Normalizar todos los tipos a mayúsculas
        console.log('Normalizando tipos a mayúsculas...');
        const actualizados = await Tramo.updateMany(
            { tipo: { $exists: true } },
            [{ $set: { tipo: { $toUpper: "$tipo" } } }]
        );
        console.log(`Tipos normalizados: ${actualizados.modifiedCount} documentos actualizados`);
        
        // 3. Verificar tramos con mismo origen-destino pero diferente tipo
        console.log('Analizando duplicados potenciales...');
        const tramos = await Tramo.find().lean();
        
        const mapaOD = {};
        tramos.forEach(t => {
            const key = `${t.origen}-${t.destino}-${t.cliente}`;
            if (!mapaOD[key]) {
                mapaOD[key] = { TRMC: [], TRMI: [] };
            }
            mapaOD[key][t.tipo].push(t);
        });
        
        // Analizar rutas con ambos tipos
        let rutasConAmbosTipos = 0;
        let rutasSoloTRMC = 0;
        let rutasSoloTRMI = 0;
        
        Object.entries(mapaOD).forEach(([ruta, tipos]) => {
            if (tipos.TRMC.length > 0 && tipos.TRMI.length > 0) {
                rutasConAmbosTipos++;
            } else if (tipos.TRMC.length > 0) {
                rutasSoloTRMC++;
            } else {
                rutasSoloTRMI++;
            }
        });
        
        console.log('Resultado del análisis:');
        console.log(`- Rutas con ambos tipos (TRMC y TRMI): ${rutasConAmbosTipos}`);
        console.log(`- Rutas solo con TRMC: ${rutasSoloTRMC}`);
        console.log(`- Rutas solo con TRMI: ${rutasSoloTRMI}`);
        console.log(`Total rutas analizadas: ${Object.keys(mapaOD).length}`);
        
        console.log('Script completado. Desconectando...');
    } catch (error) {
        console.error('Error durante el proceso:', error);
    } finally {
        mongoose.disconnect();
        console.log('Desconexión completa.');
    }
}).catch(err => {
    console.error('Error conectando a MongoDB:', err);
    process.exit(1);
});
