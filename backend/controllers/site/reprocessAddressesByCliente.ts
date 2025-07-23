import express from 'express';
import logger from '../../utils/logger';
import Site from '../../models/Site';
import { tryCatch } from '../../utils/errorHandler';
import { getAddressFromCoords } from '../../services/geocodingService';

// Función de utilidad para crear un retraso
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Reprocesa las direcciones de todos los sitios de un cliente utilizando sus coordenadas.
 */
const reprocessAddressesByCliente = tryCatch(async (req: express.Request, res: express.Response) => {
    const { cliente } = req.params;
    let actualizados = 0;
    let fallidos = 0;
    const erroresDetallados: string[] = [];

    try {
        logger.info(`Iniciando reprocesamiento de direcciones para cliente: ${cliente}`);

        // Buscar todos los sitios del cliente que tengan coordenadas
        // Adaptado para buscar en 'location.coordinates' (GeoJSON)
        const sites = await Site.find({
            cliente: cliente, 
            'location.coordinates': { $exists: true, $ne: [] } 
        });

        if (!sites || sites.length === 0) {
            logger.warn(`No se encontraron sitios con coordenadas para el cliente: ${cliente}`);
            return res.status(404).json({ message: 'No se encontraron sitios con coordenadas para este cliente.' });
        }

        logger.info(`Reprocesando ${sites.length} sitios para el cliente: ${cliente}`);

        // Iterar sobre cada sitio y obtener la dirección
        for (const site of sites) {
            try {
                // Extraer coordenadas del formato GeoJSON
                if (!site.location || !Array.isArray(site.location.coordinates) || site.location.coordinates.length < 2) {
                    fallidos++;
                    erroresDetallados.push(`Sitio ${site.nombre} (${site._id}) no tiene coordenadas válidas.`);
                    continue; 
                }

                const [lng, lat] = site.location.coordinates; // Nota: GeoJSON es [lng, lat]
                
                // Llamar al servicio de geocodificación inversa
                const addressData = await getAddressFromCoords(lat, lng);

                // Actualizar el sitio si se obtuvo información válida
                if (addressData) {
                    site.direccion = addressData.direccion || site.direccion; // Mantener si no hay nueva
                    site.localidad = addressData.localidad || site.localidad;
                    site.provincia = addressData.provincia || site.provincia;
                    
                    await site.save();
                    actualizados++;
                    logger.debug(`Sitio ${site.nombre} (${site._id}) actualizado.`);
                } else {
                     fallidos++;
                     erroresDetallados.push(`No se pudo obtener dirección para sitio ${site.nombre} (${site._id}) con coords ${lat},${lng}.`);
                     logger.warn(`Fallo al geocodificar sitio ${site.nombre} (${site._id})`);
                }

                // ¡Importante! Añadir retraso para no saturar el servicio de geocodificación
                await delay(1000); // Esperar 1 segundo entre llamadas

            } catch (error) {
                fallidos++;
                const errorMsg = `Error procesando sitio ${site.nombre} (${site._id}): ${(error as Error).message}`;
                logger.error(errorMsg, error);
                erroresDetallados.push(errorMsg);
                // Continuar con el siguiente sitio aunque uno falle
                 await delay(1000); // Esperar incluso si hay error
            }
        }

        logger.info(`Reprocesamiento para cliente ${cliente} completado. Actualizados: ${actualizados}, Fallidos: ${fallidos}`);
        
        const responseMessage = `Reprocesamiento completado. Sitios actualizados: ${actualizados}. Sitios fallidos: ${fallidos}.`;
        
        if (fallidos > 0) {
             return res.status(207).json({ // 207 Multi-Status si hubo errores parciales
                message: responseMessage,
                actualizados,
                fallidos,
                detalles_error: erroresDetallados 
             });
        } else {
             return res.status(200).json({ 
                message: responseMessage,
                actualizados,
                fallidos 
             });
        }

    } catch (error) {
        logger.error(`Error general durante el reprocesamiento para cliente ${cliente}: ${(error as Error).message}`, error);
        return res.status(500).json({ message: 'Error interno del servidor durante el reprocesamiento.', error: (error as Error).message });
    }
});

export default reprocessAddressesByCliente;