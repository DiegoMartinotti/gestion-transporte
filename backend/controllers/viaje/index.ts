/**
 * Controlador modular de viajes - Punto de entrada principal
 * Exporta todas las funciones del controlador de viajes
 */

// Operaciones CRUD básicas
export { getAllViajes } from './getAllViajes';
export { getViajeById } from './getViajeById';
export { createViaje } from './createViaje';
export { updateViaje } from './updateViaje';
export { deleteViaje } from './deleteViaje';

// Operaciones de importación masiva
export { iniciarBulkImportViajes } from './iniciarBulkImportViajes';

// Operaciones de plantillas Excel
export { getViajeTemplate } from './getViajeTemplate';
export { descargarPlantillaCorreccion } from './descargarPlantillaCorreccion';
export { procesarPlantillaCorreccion } from './procesarPlantillaCorreccion';