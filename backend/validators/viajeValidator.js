const Joi = require('joi');

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

module.exports = viajeSchema;
