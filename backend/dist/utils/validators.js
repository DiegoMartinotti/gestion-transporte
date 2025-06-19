/**
 * @module utils/validators
 * @description Utilidades de validación centralizadas para la aplicación
 */
import mongoose from 'mongoose';
/**
 * Validadores para uso común en toda la aplicación
 */
const validators = {
    /**
     * Valida que el ID proporcionado sea un ObjectId válido de MongoDB
     * @param id - ID a validar
     * @returns true si es válido
     */
    esObjectIdValido: (id) => {
        if (!id)
            return false;
        return mongoose.Types.ObjectId.isValid(id);
    },
    /**
     * Valida que un dominio (patente) tenga un formato válido
     * @param dominio - Dominio a validar
     * @returns true si es válido
     */
    esDominioValido: (dominio) => {
        if (!dominio || typeof dominio !== 'string')
            return false;
        // Dominio debe tener al menos 3 caracteres
        const dominioNormalizado = dominio.trim();
        return dominioNormalizado.length >= 3;
    },
    /**
     * Normaliza un dominio (patente) para almacenamiento y comparación
     * @param dominio - Dominio a normalizar
     * @returns Dominio normalizado
     */
    normalizarDominio: (dominio) => {
        if (!dominio)
            return '';
        return dominio.trim().toUpperCase();
    },
    /**
     * Valida que una fecha sea válida
     * @param fecha - Fecha a validar
     * @returns true si es válida
     */
    esFechaValida: (fecha) => {
        if (!fecha)
            return false;
        const fechaObj = new Date(fecha);
        return !isNaN(fechaObj.getTime());
    },
    /**
     * Valida que un texto no esté vacío
     * @param texto - Texto a validar
     * @returns true si es válido
     */
    esTextoNoVacio: (texto) => {
        if (texto === undefined || texto === null)
            return false;
        return texto.toString().trim().length > 0;
    },
    /**
     * Valida que un valor sea un número positivo
     * @param valor - Valor a validar
     * @returns true si es un número positivo
     */
    esNumeroPositivo: (valor) => {
        if (valor === undefined || valor === null)
            return false;
        const num = Number(valor);
        return !isNaN(num) && num > 0;
    },
    /**
     * Valida que un valor sea un booleano
     * @param valor - Valor a validar
     * @returns true si es un booleano
     */
    esBooleano: (valor) => {
        return typeof valor === 'boolean';
    },
    /**
     * Convierte un string a booleano
     * @param valor - String a convertir
     * @returns Valor convertido
     */
    stringABooleano: (valor) => {
        if (typeof valor === 'boolean')
            return valor;
        if (typeof valor !== 'string')
            return false;
        return ['true', 'yes', 'si', '1'].includes(valor.toLowerCase());
    },
    /**
     * Valida un email
     * @param email - Email a validar
     * @returns true si es válido
     */
    esEmailValido: (email) => {
        if (!email || typeof email !== 'string')
            return false;
        // Expresión regular simple para validar emails
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
};
export default validators;
//# sourceMappingURL=validators.js.map