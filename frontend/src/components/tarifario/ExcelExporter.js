import * as XLSX from 'xlsx';
import { formatMoney, formatDate } from './utils';

/**
 * Clase para manejar la exportación de datos a Excel
 */
class ExcelExporter {
    /**
     * Prepara los datos de tramos para exportar a Excel
     * @param {Array} tramos - Lista de tramos a exportar
     * @returns {Array} Datos formateados para Excel
     */
    static prepararDatos(tramos) {
        // Optimización: Memoizar las funciones de formateo
        const fechasCache = new Map();
        const getFechaFormateada = (fecha) => {
            if (!fechasCache.has(fecha)) {
                fechasCache.set(fecha, formatDate(fecha));
            }
            return fechasCache.get(fecha);
        };

        return tramos.map(tramo => {
            const { tarifaActual: tarifa } = tramo;
            
            return {
                'Origen': tramo.origen?.Site || 'N/A',
                'Destino': tramo.destino?.Site || 'N/A',
                'Tipo': tarifa.tipo || 'N/A',
                'Método': tarifa.metodoCalculo || 'N/A',
                'Valor': formatMoney(tarifa.valor),
                'Peaje': formatMoney(tarifa.valorPeaje),
                'Detalle': this.generarDetalleMetodo(tarifa.metodoCalculo, tarifa.valor, tramo.distancia),
                'Vigencia Desde': getFechaFormateada(tarifa.vigenciaDesde),
                'Vigencia Hasta': getFechaFormateada(tarifa.vigenciaHasta),
                'Distancia (km)': tramo.distancia || 0
            };
        });
    }

    /**
     * Genera una descripción legible del método de cálculo
     * @param {string} metodoCalculo - Método de cálculo
     * @param {number} valor - Valor de la tarifa
     * @param {number} distancia - Distancia del tramo
     * @returns {string} Descripción formateada
     */
    static generarDetalleMetodo(metodoCalculo, valor, distancia) {
        switch (metodoCalculo) {
            case 'Kilometro':
                return `$${formatMoney(valor)} por km (${distancia || 0} km)`;
            case 'Palet':
                return `$${formatMoney(valor)} por palet`;
            case 'Fijo':
                return `$${formatMoney(valor)} tarifa fija`;
            default:
                return `$${formatMoney(valor)}`;
        }
    }

    /**
     * Crea y descarga un archivo Excel con los datos proporcionados
     * @param {Array} datos - Datos a exportar
     * @param {string} nombreArchivo - Nombre del archivo Excel
     */
    static exportarExcel(datos, nombreArchivo) {
        // Crear el libro de Excel
        const wb = XLSX.utils.book_new();
        
        // Crear la hoja con los datos
        const ws = XLSX.utils.json_to_sheet(datos);
        
        // Ajustar el ancho de las columnas
        const wscols = [
            { wch: 25 }, // Origen
            { wch: 25 }, // Destino
            { wch: 10 }, // Tipo
            { wch: 15 }, // Método de Cálculo
            { wch: 12 }, // Valor
            { wch: 12 }, // Valor Peaje
            { wch: 25 }, // Detalle
            { wch: 15 }, // Vigencia Desde
            { wch: 15 }, // Vigencia Hasta
            { wch: 15 }  // Distancia
        ];
        ws['!cols'] = wscols;
        
        // Agregar la hoja al libro
        XLSX.utils.book_append_sheet(wb, ws, 'Tarifas');
        
        // Guardar el archivo
        XLSX.writeFile(wb, nombreArchivo);
    }

    /**
     * Exporta tramos seleccionados a Excel
     * @param {Array} tramos - Tramos seleccionados para exportar
     * @param {string} cliente - Nombre del cliente
     */
    static exportarSeleccionados(tramos, cliente) {
        if (!tramos || tramos.length === 0) {
            console.warn('No hay tramos seleccionados para exportar');
            return;
        }
        
        const datos = this.prepararDatos(tramos);
        const fechaActual = new Date().toISOString().slice(0, 10);
        const nombreArchivo = `Tarifas_${cliente}_Seleccionadas_${fechaActual}.xlsx`;
        
        this.exportarExcel(datos, nombreArchivo);
    }

    /**
     * Exporta todos los tramos a Excel
     * @param {Array} tramos - Todos los tramos para exportar
     * @param {string} cliente - Nombre del cliente
     */
    static exportarTodos(tramos, cliente) {
        if (!tramos || tramos.length === 0) {
            console.warn('No hay tramos para exportar');
            return;
        }
        
        const datos = this.prepararDatos(tramos);
        const fechaActual = new Date().toISOString().slice(0, 10);
        const nombreArchivo = `Tarifas_${cliente}_Completo_${fechaActual}.xlsx`;
        
        this.exportarExcel(datos, nombreArchivo);
    }
}

export default ExcelExporter; 