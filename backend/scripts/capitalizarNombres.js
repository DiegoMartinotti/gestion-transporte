/**
 * Script para capitalizar los nombres de los empleados en la base de datos
 * Convierte los nombres que están en mayúsculas a formato capitalizado (primera letra mayúscula)
 */

const mongoose = require('mongoose');
const Personal = require('../models/Personal');
require('dotenv').config();

// Función para capitalizar texto (primera letra mayúscula, resto minúsculas)
const capitalizar = (texto) => {
  if (!texto) return texto;
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
};

// Función para capitalizar nombres compuestos
const capitalizarNombreCompleto = (nombre) => {
  if (!nombre) return nombre;
  return nombre.split(' ')
    .map(parte => capitalizar(parte))
    .join(' ');
};

// Función principal
async function capitalizarNombres() {
  try {
    // Conectar a la base de datos
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('Variable de entorno MONGODB_URI no definida');
    }
    
    console.log(`Conectando a MongoDB: ${mongoUri.replace(/mongodb(\+srv)?:\/\/[^:]+:[^@]+@/, 'mongodb$1://****:****@')}`);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Conexión a la base de datos establecida');
    
    // Obtener todos los empleados
    const empleados = await Personal.find({});
    console.log(`Se encontraron ${empleados.length} empleados en la base de datos`);
    
    let actualizados = 0;
    
    // Procesar cada empleado
    for (const empleado of empleados) {
      const nombreOriginal = empleado.nombre;
      const apellidoOriginal = empleado.apellido;
      
      // Capitalizar nombre y apellido
      empleado.nombre = capitalizarNombreCompleto(nombreOriginal);
      empleado.apellido = capitalizarNombreCompleto(apellidoOriginal);
      
      // Si hubo cambios, guardar el empleado
      if (nombreOriginal !== empleado.nombre || apellidoOriginal !== empleado.apellido) {
        await empleado.save();
        actualizados++;
        console.log(`Empleado actualizado: ${nombreOriginal} ${apellidoOriginal} -> ${empleado.nombre} ${empleado.apellido}`);
      }
    }
    
    console.log(`Proceso completado. Se actualizaron ${actualizados} empleados.`);
    
  } catch (error) {
    console.error(`Error al capitalizar nombres: ${error.message}`);
  } finally {
    // Cerrar conexión a la base de datos
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('Conexión a la base de datos cerrada');
    }
  }
}

// Ejecutar la función principal
capitalizarNombres(); 