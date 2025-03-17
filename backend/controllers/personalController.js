const Personal = require('../models/Personal');
const Empresa = require('../models/Empresa');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Obtener todos los registros de personal
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.getAllPersonal = async (req, res) => {
  try {
    const { empresaId } = req.query;
    
    let query = {};
    if (empresaId) {
      query.empresa = empresaId;
    }
    
    const personal = await Personal.find(query)
      .populate('empresa', 'nombre tipo')
      .sort({ nombre: 1 });
    
    res.status(200).json(personal);
  } catch (error) {
    logger.error('Error al obtener personal:', error);
    res.status(500).json({ error: 'Error al obtener personal' });
  }
};

/**
 * Obtener un registro de personal por ID
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.getPersonalById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de personal inválido' });
    }
    
    const personal = await Personal.findById(id)
      .populate('empresa', 'nombre tipo');
    
    if (!personal) {
      return res.status(404).json({ error: 'Personal no encontrado' });
    }
    
    res.status(200).json(personal);
  } catch (error) {
    logger.error('Error al obtener personal por ID:', error);
    res.status(500).json({ error: 'Error al obtener personal por ID' });
  }
};

/**
 * Crear un nuevo registro de personal
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.createPersonal = async (req, res) => {
  try {
    const personalData = req.body;
    
    // Verificar si la empresa existe
    if (personalData.empresa) {
      const empresaExists = await Empresa.findById(personalData.empresa);
      if (!empresaExists) {
        return res.status(400).json({ error: 'La empresa especificada no existe' });
      }
    }
    
    // Si no se proporciona un período de empleo, crear uno con la fecha actual
    if (!personalData.periodosEmpleo || personalData.periodosEmpleo.length === 0) {
      personalData.periodosEmpleo = [{
        fechaIngreso: new Date(),
        categoria: 'Inicial'
      }];
    }
    
    // Crear el registro de personal
    const personal = new Personal(personalData);
    await personal.save();
    
    res.status(201).json(personal);
  } catch (error) {
    logger.error('Error al crear personal:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Ya existe un registro con ese DNI' });
    }
    
    res.status(500).json({ error: 'Error al crear personal' });
  }
};

/**
 * Actualizar un registro de personal
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.updatePersonal = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de personal inválido' });
    }
    
    // Verificar si la empresa existe si se está actualizando
    if (updateData.empresa) {
      const empresaExists = await Empresa.findById(updateData.empresa);
      if (!empresaExists) {
        return res.status(400).json({ error: 'La empresa especificada no existe' });
      }
    }
    
    const personal = await Personal.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!personal) {
      return res.status(404).json({ error: 'Personal no encontrado' });
    }
    
    res.status(200).json(personal);
  } catch (error) {
    logger.error('Error al actualizar personal:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Ya existe un registro con ese DNI' });
    }
    
    res.status(500).json({ error: 'Error al actualizar personal' });
  }
};

/**
 * Eliminar un registro de personal
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.deletePersonal = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de personal inválido' });
    }
    
    const personal = await Personal.findByIdAndDelete(id);
    
    if (!personal) {
      return res.status(404).json({ error: 'Personal no encontrado' });
    }
    
    res.status(200).json({ message: 'Personal eliminado correctamente' });
  } catch (error) {
    logger.error('Error al eliminar personal:', error);
    res.status(500).json({ error: 'Error al eliminar personal' });
  }
};

/**
 * Importar personal masivamente
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
exports.bulkImportPersonal = async (req, res) => {
  try {
    const { personal } = req.body;
    
    if (!Array.isArray(personal) || personal.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron datos de personal para importar' });
    }
    
    const results = {
      total: personal.length,
      exitosos: 0,
      errores: []
    };
    
    // Procesar cada registro de personal
    for (let i = 0; i < personal.length; i++) {
      try {
        const item = personal[i];
        
        // Verificar si la empresa existe
        if (item.empresaId) {
          const empresaExists = await Empresa.findById(item.empresaId);
          if (!empresaExists) {
            throw new Error(`La empresa con ID ${item.empresaId} no existe`);
          }
          
          // Asignar el ID de empresa al campo correcto
          item.empresa = item.empresaId;
          delete item.empresaId;
        } else {
          throw new Error('El ID de empresa es obligatorio');
        }
        
        // Crear un objeto con la estructura correcta para el modelo
        const personalData = {
          nombre: item.nombre,
          apellido: item.apellido,
          dni: item.dni,
          empresa: item.empresa,
          activo: item.activo
        };
        
        // Agregar campos opcionales si existen
        if (item.telefono) {
          personalData.contacto = {
            telefono: item.telefono
          };
        }
        
        if (item.email) {
          if (!personalData.contacto) personalData.contacto = {};
          personalData.contacto.email = item.email;
        }
        
        if (item.direccion) {
          personalData.direccion = {
            calle: item.direccion
          };
        }
        
        if (item.fechaNacimiento) {
          personalData.fechaNacimiento = new Date(item.fechaNacimiento);
        }
        
        if (item.licenciaConducir) {
          personalData.documentacion = {
            licenciaConducir: {
              numero: item.licenciaConducir
            }
          };
        }
        
        if (item.cargo) {
          personalData.tipo = item.cargo;
        } else {
          personalData.tipo = 'Otro';
        }
        
        if (item.observaciones) {
          personalData.observaciones = item.observaciones;
        }
        
        // Agregar período de empleo con fecha actual
        personalData.periodosEmpleo = [{
          fechaIngreso: new Date(),
          categoria: item.cargo || 'Inicial'
        }];
        
        // Crear el registro de personal
        const nuevoPersonal = new Personal(personalData);
        await nuevoPersonal.save();
        
        results.exitosos++;
      } catch (error) {
        logger.error(`Error al procesar registro de personal #${i + 1}:`, error);
        results.errores.push({
          indice: i,
          registro: personal[i],
          error: error.message
        });
      }
    }
    
    res.status(200).json(results);
  } catch (error) {
    logger.error('Error al importar personal masivamente:', error);
    res.status(500).json({ error: 'Error al importar personal masivamente' });
  }
}; 