/**
 * Utilidades para el módulo de tarifario
 */
import dayjs from 'dayjs';
import { isWithinInterval, parseISO } from 'date-fns';

// Constantes para formatos de fecha
export const DATE_FORMAT = 'DD/MM/YYYY';
export const ISO_FORMAT = 'YYYY-MM-DD';

/**
 * Formatea un valor numérico como moneda
 * @param {number} value - Valor a formatear
 * @returns {string} Valor formateado como moneda
 */
export const formatMoney = (value) => {
    return Number(value || 0).toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

/**
 * Formatea una fecha ISO a formato legible
 * @param {string} dateString - Fecha en formato ISO
 * @returns {string} Fecha formateada
 */
export const formatDate = (dateString) => {
    if (!dateString) return '';
    return dayjs(dateString).format(DATE_FORMAT);
};

/**
 * Procesa una fecha desde un string
 * @param {string} dateString - Fecha como string
 * @returns {string|null} Fecha procesada o null
 */
export const parseDate = (dateString) => {
    if (!dateString) return null;
    return dayjs(dateString).format(ISO_FORMAT);
};

/**
 * Obtiene las tarifas vigentes de un tramo
 * @param {Object} tramo - Tramo con tarifas históricas
 * @param {string} fechaDesde - Fecha desde para filtrar
 * @param {string} fechaHasta - Fecha hasta para filtrar
 * @returns {Array} Tarifas vigentes
 */
export const obtenerTarifasVigentes = (tramo, fechaDesde, fechaHasta) => {
    // Caso base optimizado
    if (!tramo.tarifasHistoricas?.length) {
        return [{
            tipo: tramo.tipo || 'TRMC',
            metodoCalculo: tramo.metodoCalculo || 'Kilometro',
            valor: tramo.valor || 0,
            valorPeaje: tramo.valorPeaje || 0,
            vigenciaDesde: tramo.vigenciaDesde,
            vigenciaHasta: tramo.vigenciaHasta
        }];
    }

    // Optimización: Si no hay filtro de fechas, usar Map para mejor rendimiento
    if (!fechaDesde || !fechaHasta) {
        const tarifasPorTipo = new Map();
        
        // Primero agrupamos por tipo y nos quedamos con la más reciente
        tramo.tarifasHistoricas.forEach(tarifa => {
            const key = tarifa.tipo || 'TRMC';
            const fechaVigencia = new Date(tarifa.vigenciaDesde);
            
            if (!tarifasPorTipo.has(key) || fechaVigencia > new Date(tarifasPorTipo.get(key).vigenciaDesde)) {
                tarifasPorTipo.set(key, tarifa);
            }
        });
        
        return Array.from(tarifasPorTipo.values());
    }

    // Con filtro de fechas, filtrar por intervalo
    const fechaDesdeObj = parseISO(fechaDesde);
    const fechaHastaObj = parseISO(fechaHasta);
    
    return tramo.tarifasHistoricas.filter(tarifa => {
        // Optimización: Solo parsear si las fechas son válidas
        if (!tarifa.vigenciaDesde || !tarifa.vigenciaHasta) return false;
        
        const vigenciaDesdeObj = parseISO(tarifa.vigenciaDesde);
        const vigenciaHastaObj = parseISO(tarifa.vigenciaHasta);
        
        // Verificar si hay intersección entre los intervalos
        return (
            (isWithinInterval(fechaDesdeObj, { start: vigenciaDesdeObj, end: vigenciaHastaObj }) ||
            isWithinInterval(fechaHastaObj, { start: vigenciaDesdeObj, end: vigenciaHastaObj }) ||
            (fechaDesdeObj <= vigenciaDesdeObj && fechaHastaObj >= vigenciaHastaObj))
        );
    });
}; 