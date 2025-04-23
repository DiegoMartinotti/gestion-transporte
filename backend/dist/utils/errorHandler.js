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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryCatch = void 0;
const logger_1 = __importDefault(require("./logger"));
/**
 * Envuelve un controlador async/await con manejo de errores
 * @param fn - Función async del controlador
 * @returns Función de middleware con manejo de errores
 */
const tryCatch = (fn) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield fn(req, res, next);
    }
    catch (error) {
        const err = error;
        logger_1.default.error('Error capturado:', err);
        if (err.name === 'ValidationError' && err.errors) {
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                errors: Object.values(err.errors).map(e => e.message)
            });
        }
        return res.status(err.status || 500).json({
            success: false,
            message: err.message || 'Error del servidor'
        });
    }
});
exports.tryCatch = tryCatch;
//# sourceMappingURL=errorHandler.js.map