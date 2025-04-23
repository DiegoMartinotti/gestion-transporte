"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const Joi = __importStar(require("joi"));
// Schema de validación para Viajes
const viajeSchema = {
    create: Joi.object({
        origen: Joi.string().required(),
        destino: Joi.string().required(),
        fecha: Joi.date().iso().required(),
        tarifa: Joi.number().required(),
        cliente: Joi.string().required(),
        dt: Joi.string().required(),
        extras: Joi.object({
            demoras: Joi.number().default(0),
            operativos: Joi.number().default(0),
            estadias: Joi.number().default(0),
        }).default({ demoras: 0, operativos: 0, estadias: 0 }),
        cobrado: Joi.boolean().default(false),
        paletas: Joi.number().default(0)
    }),
    update: Joi.object({
        origen: Joi.string(),
        destino: Joi.string(),
        fecha: Joi.date().iso(),
        tarifa: Joi.number(),
        extras: Joi.object({
            demoras: Joi.number(),
            operativos: Joi.number(),
            estadias: Joi.number(),
        }),
        cobrado: Joi.boolean(),
        paletas: Joi.number()
    })
};
exports.default = viajeSchema;
//# sourceMappingURL=viajeValidator.js.map