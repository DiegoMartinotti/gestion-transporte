"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const Vehiculo = require('../models/Vehiculo');
const Empresa = require('../models/Empresa');
const logger = require('../utils/logger');
/**
 * @desc    Obtener todos los vehículos
 * @route   GET /api/vehiculos
 * @access  Private
 */
const getVehiculos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vehiculos = yield Vehiculo.find().populate('empresa', 'nombre tipo');
        res.json(vehiculos);
    }
    catch (error) {
        logger.error('Error al obtener vehículos:', error);
        res.status(500).json({ message: 'Error al obtener vehículos', error: error.message });
    }
});
/**
 * @desc    Obtener vehículos por empresa
 * @route   GET /api/vehiculos/empresa/:empresaId
 * @access  Private
 */
const getVehiculosByEmpresa = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { empresaId } = req.params;
        const vehiculos = yield Vehiculo.find({ empresa: empresaId }).populate('empresa', 'nombre tipo');
        res.json(vehiculos);
    }
    catch (error) {
        logger.error(`Error al obtener vehículos de la empresa ${req.params.empresaId}:`, error);
        res.status(500).json({ message: 'Error al obtener vehículos por empresa', error: error.message });
    }
});
/**
 * @desc    Obtener un vehículo por ID
 * @route   GET /api/vehiculos/:id
 * @access  Private
 */
const getVehiculoById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vehiculo = yield Vehiculo.findById(req.params.id).populate('empresa', 'nombre tipo');
        if (!vehiculo) {
            return res.status(404).json({ message: 'Vehículo no encontrado' });
        }
        res.json(vehiculo);
    }
    catch (error) {
        logger.error(`Error al obtener vehículo ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error al obtener vehículo', error: error.message });
    }
});
/**
 * @desc    Crear un nuevo vehículo
 * @route   POST /api/vehiculos
 * @access  Private
 */
const createVehiculo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { dominio, tipo, marca, modelo, año, numeroChasis, numeroMotor, empresa, documentacion, caracteristicas, activo, observaciones } = req.body;
        // Verificar que la empresa existe
        const empresaExiste = yield Empresa.findById(empresa);
        if (!empresaExiste) {
            return res.status(400).json({ message: 'La empresa especificada no existe' });
        }
        // Verificar si ya existe un vehículo con el mismo dominio
        const dominioExiste = yield Vehiculo.findOne({ dominio: dominio.toUpperCase() });
        if (dominioExiste) {
            return res.status(400).json({ message: 'Ya existe un vehículo con ese dominio' });
        }
        const vehiculo = new Vehiculo({
            dominio,
            tipo,
            marca,
            modelo,
            año,
            numeroChasis,
            numeroMotor,
            empresa,
            documentacion,
            caracteristicas,
            activo,
            observaciones
        });
        const vehiculoGuardado = yield vehiculo.save();
        // Actualizar la referencia en la empresa
        yield Empresa.findByIdAndUpdate(empresa, { $push: { flota: vehiculoGuardado._id } });
        res.status(201).json(vehiculoGuardado);
    }
    catch (error) {
        logger.error('Error al crear vehículo:', error);
        res.status(500).json({ message: 'Error al crear vehículo', error: error.message });
    }
});
/**
 * @desc    Actualizar un vehículo
 * @route   PUT /api/vehiculos/:id
 * @access  Private
 */
const updateVehiculo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { dominio, tipo, marca, modelo, año, numeroChasis, numeroMotor, empresa, documentacion, caracteristicas, activo, observaciones } = req.body;
        // Verificar que la empresa existe
        const empresaExiste = yield Empresa.findById(empresa);
        if (!empresaExiste) {
            return res.status(400).json({ message: 'La empresa especificada no existe' });
        }
        // Verificar si el vehículo existe
        const vehiculo = yield Vehiculo.findById(req.params.id);
        if (!vehiculo) {
            return res.status(404).json({ message: 'Vehículo no encontrado' });
        }
        // Si se cambia el dominio, verificar que no exista otro con ese dominio
        if (dominio && dominio.toUpperCase() !== vehiculo.dominio) {
            const dominioExiste = yield Vehiculo.findOne({ dominio: dominio.toUpperCase() });
            if (dominioExiste) {
                return res.status(400).json({ message: 'Ya existe un vehículo con ese dominio' });
            }
        }
        // Si se cambia la empresa, actualizar las referencias
        if (empresa && empresa.toString() !== vehiculo.empresa.toString()) {
            // Eliminar de la empresa anterior
            yield Empresa.findByIdAndUpdate(vehiculo.empresa, { $pull: { flota: vehiculo._id } });
            // Agregar a la nueva empresa
            yield Empresa.findByIdAndUpdate(empresa, { $push: { flota: vehiculo._id } });
        }
        const vehiculoActualizado = yield Vehiculo.findByIdAndUpdate(req.params.id, {
            dominio,
            tipo,
            marca,
            modelo,
            año,
            numeroChasis,
            numeroMotor,
            empresa,
            documentacion,
            caracteristicas,
            activo,
            observaciones
        }, { new: true, runValidators: true });
        res.json(vehiculoActualizado);
    }
    catch (error) {
        logger.error(`Error al actualizar vehículo ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error al actualizar vehículo', error: error.message });
    }
});
/**
 * @desc    Eliminar un vehículo
 * @route   DELETE /api/vehiculos/:id
 * @access  Private
 */
const deleteVehiculo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vehiculo = yield Vehiculo.findById(req.params.id);
        if (!vehiculo) {
            return res.status(404).json({ message: 'Vehículo no encontrado' });
        }
        // Eliminar la referencia en la empresa
        yield Empresa.findByIdAndUpdate(vehiculo.empresa, { $pull: { flota: vehiculo._id } });
        yield vehiculo.remove();
        res.json({ message: 'Vehículo eliminado correctamente' });
    }
    catch (error) {
        logger.error(`Error al eliminar vehículo ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error al eliminar vehículo', error: error.message });
    }
});
/**
 * @desc    Obtener vehículos con documentación próxima a vencer
 * @route   GET /api/vehiculos/vencimientos/:dias
 * @access  Private
 */
const getVehiculosConVencimientos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const diasLimite = parseInt(req.params.dias) || 30;
        const hoy = new Date();
        const limite = new Date();
        limite.setDate(limite.getDate() + diasLimite);
        const vehiculos = yield Vehiculo.find({
            $or: [
                { 'documentacion.seguro.vencimiento': { $gte: hoy, $lte: limite } },
                { 'documentacion.vtv.vencimiento': { $gte: hoy, $lte: limite } },
                { 'documentacion.ruta.vencimiento': { $gte: hoy, $lte: limite } },
                { 'documentacion.senasa.vencimiento': { $gte: hoy, $lte: limite } }
            ]
        }).populate('empresa', 'nombre tipo');
        res.json(vehiculos);
    }
    catch (error) {
        logger.error('Error al obtener vehículos con vencimientos próximos:', error);
        res.status(500).json({ message: 'Error al obtener vehículos con vencimientos', error: error.message });
    }
});
/**
 * @desc    Obtener vehículos con documentación vencida
 * @route   GET /api/vehiculos/vencidos
 * @access  Private
 */
const getVehiculosVencidos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hoy = new Date();
        const vehiculos = yield Vehiculo.find({
            $or: [
                { 'documentacion.seguro.vencimiento': { $lt: hoy } },
                { 'documentacion.vtv.vencimiento': { $lt: hoy } },
                { 'documentacion.ruta.vencimiento': { $lt: hoy } },
                { 'documentacion.senasa.vencimiento': { $lt: hoy } }
            ]
        }).populate('empresa', 'nombre tipo');
        res.json(vehiculos);
    }
    catch (error) {
        logger.error('Error al obtener vehículos con documentación vencida:', error);
        res.status(500).json({ message: 'Error al obtener vehículos vencidos', error: error.message });
    }
});
/**
 * @desc    Crear múltiples vehículos en una sola operación (carga masiva)
 * @route   POST /api/vehiculos/bulk
 * @access  Private
 */
const createVehiculosBulk = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { vehiculos } = req.body;
        if (!vehiculos || !Array.isArray(vehiculos) || vehiculos.length === 0) {
            return res.status(400).json({ message: 'No se proporcionaron vehículos para cargar' });
        }
        logger.info(`Iniciando carga masiva de ${vehiculos.length} vehículos`);
        // Validar que todos los vehículos tengan los campos requeridos
        const vehiculosInvalidos = vehiculos.filter(v => !v.dominio || !v.tipo || !v.empresa);
        if (vehiculosInvalidos.length > 0) {
            return res.status(400).json({
                message: 'Algunos vehículos no tienen los campos requeridos (dominio, tipo, empresa)',
                vehiculosInvalidos
            });
        }
        // Verificar que todas las empresas existan
        const empresasIds = [...new Set(vehiculos.map(v => v.empresa))];
        const empresasExistentes = yield Empresa.find({ _id: { $in: empresasIds } });
        if (empresasExistentes.length !== empresasIds.length) {
            return res.status(400).json({ message: 'Una o más empresas especificadas no existen' });
        }
        // Verificar dominios duplicados en la base de datos
        const dominios = vehiculos.map(v => v.dominio.toUpperCase());
        const dominiosExistentes = yield Vehiculo.find({ dominio: { $in: dominios } });
        if (dominiosExistentes.length > 0) {
            return res.status(400).json({
                message: 'Algunos dominios ya existen en la base de datos',
                dominiosExistentes: dominiosExistentes.map(v => v.dominio)
            });
        }
        // Verificar dominios duplicados en la carga
        const dominiosUnicos = new Set(dominios);
        if (dominiosUnicos.size !== dominios.length) {
            return res.status(400).json({ message: 'Hay dominios duplicados en la carga' });
        }
        // Preparar los vehículos para inserción
        const vehiculosPreparados = vehiculos.map(v => (Object.assign(Object.assign({}, v), { dominio: v.dominio.toUpperCase() })));
        // Insertar los vehículos en la base de datos
        const vehiculosInsertados = yield Vehiculo.insertMany(vehiculosPreparados);
        // Actualizar las referencias en las empresas
        for (const vehiculo of vehiculosInsertados) {
            yield Empresa.findByIdAndUpdate(vehiculo.empresa, { $push: { flota: vehiculo._id } });
        }
        logger.info(`Carga masiva completada: ${vehiculosInsertados.length} vehículos insertados`);
        res.status(201).json({
            message: 'Vehículos cargados exitosamente',
            insertados: vehiculosInsertados.length,
            vehiculos: vehiculosInsertados
        });
    }
    catch (error) {
        logger.error('Error en carga masiva de vehículos:', error);
        // Manejar errores específicos de validación de MongoDB
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Error de validación en los datos de los vehículos',
                errores: Object.values(error.errors).map(e => e.message)
            });
        }
        // Manejar errores de duplicados
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'Hay dominios duplicados que ya existen en la base de datos',
                error: error.message
            });
        }
        res.status(500).json({
            message: 'Error al procesar la carga masiva de vehículos',
            error: error.message
        });
    }
});
module.exports = {
    getVehiculos,
    getVehiculosByEmpresa,
    getVehiculoById,
    createVehiculo,
    updateVehiculo,
    deleteVehiculo,
    getVehiculosConVencimientos,
    getVehiculosVencidos,
    createVehiculosBulk
};
//# sourceMappingURL=vehiculoController.js.map