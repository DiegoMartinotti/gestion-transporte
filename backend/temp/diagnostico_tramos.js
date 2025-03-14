/**
 * Script de diagnóstico para verificar el problema con la validación de tipos TRMC vs TRMI
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { format } = require('date-fns');
require('dotenv').config();

// Importar modelos
const Tramo = require('../models/Tramo');
const Site = require('../models/Site');

// Configurar logger
const logger = {
    debug: console.log,
    error: console.error,
    info: console.log
};

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log('Conectado a MongoDB');
    diagnosticarTramos();
})
.catch(err => {
    console.error('Error conectando a MongoDB:', err);
    process.exit(1);
});

async function diagnosticarTramos() {
    try {
        console.log('Iniciando diagnóstico de tramos...');
        
        // Primero, obtener los IDs de los sitios
        const siteCorrientes = await Site.findOne({ Site: 'CTE-CORRIENTES' });
        const siteSiasa = await Site.findOne({ Site: 'SIASA' });
        
        if (!siteCorrientes || !siteSiasa) {
            console.error('No se encontraron los sitios necesarios');
            mongoose.connection.close();
            return;
        }
        
        console.log(`Site CTE-CORRIENTES ID: ${siteCorrientes._id}`);
        console.log(`Site SIASA ID: ${siteSiasa._id}`);
        
        // Buscar tramos con origen "CTE-CORRIENTES" y destino "SIASA"
        const tramosEncontrados = await Tramo.find({
            origen: siteCorrientes._id,
            destino: siteSiasa._id
        }).populate('origen destino');
        
        console.log(`Se encontraron ${tramosEncontrados.length} tramos para CTE-CORRIENTES → SIASA`);
        
        // Analizar cada tramo
        tramosEncontrados.forEach((tramo, index) => {
            console.log(`\nTramo #${index + 1}:`);
            console.log(`ID: ${tramo._id}`);
            console.log(`Origen: ${tramo.origen?.Site || tramo.origen}`);
            console.log(`Destino: ${tramo.destino?.Site || tramo.destino}`);
            
            // Analizar tarifas históricas
            if (tramo.tarifasHistoricas && tramo.tarifasHistoricas.length > 0) {
                console.log(`Tarifas históricas (${tramo.tarifasHistoricas.length}):`);
                
                tramo.tarifasHistoricas.forEach((tarifa, tarifaIndex) => {
                    console.log(`  Tarifa #${tarifaIndex + 1}:`);
                    console.log(`    Tipo: ${tarifa.tipo || 'No especificado'}`);
                    console.log(`    Método: ${tarifa.metodoCalculo || 'No especificado'}`);
                    console.log(`    Vigencia: ${format(new Date(tarifa.vigenciaDesde), 'dd/MM/yyyy')} - ${format(new Date(tarifa.vigenciaHasta), 'dd/MM/yyyy')}`);
                    console.log(`    Valor: ${tarifa.valor}, Peaje: ${tarifa.valorPeaje || 0}`);
                });
            } else if (tramo.tipo) {
                // Para tramos con formato antiguo
                console.log(`Tipo: ${tramo.tipo || 'No especificado'}`);
                console.log(`Método: ${tramo.metodoCalculo || 'No especificado'}`);
                console.log(`Vigencia: ${format(new Date(tramo.vigenciaDesde), 'dd/MM/yyyy')} - ${format(new Date(tramo.vigenciaHasta), 'dd/MM/yyyy')}`);
                console.log(`Valor: ${tramo.valor}, Peaje: ${tramo.valorPeaje || 0}`);
            } else {
                console.log('No se encontraron datos de tarifa');
            }
        });
        
        // Simular la creación del mapa de tramos
        console.log('\n\nSimulando creación del mapa de tramos:');
        const mapaTramos = {};
        
        tramosEncontrados.forEach(tramo => {
            if (tramo.tarifasHistoricas && tramo.tarifasHistoricas.length > 0) {
                tramo.tarifasHistoricas.forEach(tarifa => {
                    const key = `${tramo.origen._id}-${tramo.destino._id}-${tarifa.tipo}`;
                    
                    console.log(`Creando entrada en mapa para: ${key}`);
                    
                    if (!mapaTramos[key]) {
                        mapaTramos[key] = { 
                            ...tramo.toObject(), 
                            tarifaTipo: tarifa.tipo 
                        };
                    }
                });
            } else if (tramo.tipo) {
                // Para tramos con formato antiguo
                const key = `${tramo.origen._id}-${tramo.destino._id}-${tramo.tipo}`;
                
                console.log(`Creando entrada en mapa para: ${key} (formato antiguo)`);
                
                if (!mapaTramos[key]) {
                    mapaTramos[key] = { 
                        ...tramo.toObject(), 
                        tarifaTipo: tramo.tipo 
                    };
                }
            }
        });
        
        // Mostrar las claves del mapa
        console.log('\nClaves en el mapa de tramos:');
        Object.keys(mapaTramos).forEach(key => {
            console.log(`- ${key} (Tipo: ${mapaTramos[key].tarifaTipo})`);
        });
        
        // Simular búsqueda de tramos TRMI
        console.log('\nSimulando búsqueda de tramo TRMI:');
        
        const keyTRMI = `${siteCorrientes._id}-${siteSiasa._id}-TRMI`;
        const keyTRMC = `${siteCorrientes._id}-${siteSiasa._id}-TRMC`;
        
        console.log(`Buscando tramo con clave: ${keyTRMI}`);
        const tramoTRMI = mapaTramos[keyTRMI];
        
        if (tramoTRMI) {
            console.log('Tramo TRMI encontrado:');
            console.log(`ID: ${tramoTRMI._id}`);
            console.log(`Tipo: ${tramoTRMI.tarifaTipo}`);
        } else {
            console.log('No se encontró tramo TRMI');
        }
        
        console.log(`\nBuscando tramo con clave: ${keyTRMC}`);
        const tramoTRMC = mapaTramos[keyTRMC];
        
        if (tramoTRMC) {
            console.log('Tramo TRMC encontrado:');
            console.log(`ID: ${tramoTRMC._id}`);
            console.log(`Tipo: ${tramoTRMC.tarifaTipo}`);
        } else {
            console.log('No se encontró tramo TRMC');
        }
        
        // Cerrar conexión
        mongoose.connection.close();
        console.log('\nDiagnóstico completado');
    } catch (error) {
        console.error('Error durante el diagnóstico:', error);
        mongoose.connection.close();
        process.exit(1);
    }
} 