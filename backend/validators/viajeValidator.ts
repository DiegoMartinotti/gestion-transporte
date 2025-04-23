import * as Joi from 'joi';

// Define interfaces para la estructura de los datos
interface ExtrasViaje {
  demoras: number;
  operativos: number;
  estadias: number;
}

interface ViajeInput {
  origen: string;
  destino: string;
  fecha: Date;
  tarifa: number;
  cliente: string;
  dt: string;
  extras?: ExtrasViaje;
  cobrado?: boolean;
  paletas?: number;
}

interface ViajeUpdateInput {
  origen?: string;
  destino?: string;
  fecha?: Date;
  tarifa?: number;
  extras?: ExtrasViaje;
  cobrado?: boolean;
  paletas?: number;
}

// Schema de validación para Viajes
const viajeSchema = {
  create: Joi.object<ViajeInput>({
    origen: Joi.string().required(),
    destino: Joi.string().required(),
    fecha: Joi.date().iso().required(),
    tarifa: Joi.number().required(),
    cliente: Joi.string().required(),
    dt: Joi.string().required(),
    extras: Joi.object<ExtrasViaje>({
      demoras: Joi.number().default(0),
      operativos: Joi.number().default(0),
      estadias: Joi.number().default(0),
    }).default({ demoras: 0, operativos: 0, estadias: 0 }),
    cobrado: Joi.boolean().default(false),
    paletas: Joi.number().default(0)
  }),

  update: Joi.object<ViajeUpdateInput>({
    origen: Joi.string(),
    destino: Joi.string(),
    fecha: Joi.date().iso(),
    tarifa: Joi.number(),
    extras: Joi.object<ExtrasViaje>({
      demoras: Joi.number(),
      operativos: Joi.number(),
      estadias: Joi.number(),
    }),
    cobrado: Joi.boolean(),
    paletas: Joi.number()
  })
};

export default viajeSchema; 