/**
 * @module controllers/tramo
 * @description Índice de controladores para el módulo de tramos
 */

import getTramosByCliente from './getTramosByCliente';
import getDistanciasCalculadas from './getDistanciasCalculadas';
import getTramoById from './getTramoById';
import createTramo from './createTramo';
import updateTramo from './updateTramo';
import deleteTramo from './deleteTramo';
import getAllTramos from './getAllTramos';
import getVigentesByFecha from './getVigentesByFecha';
import getTramoTemplate from './getTramoTemplate';
import bulkCreateTramos from './bulkCreateTramos';
import verificarPosiblesDuplicados from './verificarPosiblesDuplicados';
import updateVigenciaMasiva from './updateVigenciaMasiva';
import calcularTarifa from './calcularTarifa';

export {
    getTramosByCliente,
    getDistanciasCalculadas,
    getTramoById,
    createTramo,
    updateTramo,
    deleteTramo,
    getAllTramos,
    getVigentesByFecha,
    getTramoTemplate,
    bulkCreateTramos,
    verificarPosiblesDuplicados,
    updateVigenciaMasiva,
    calcularTarifa,
};