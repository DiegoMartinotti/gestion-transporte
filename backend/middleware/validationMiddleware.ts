/**
 * Middleware centralizado para validaciones
 * Este archivo contiene validadores para diferentes entidades
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const VALIDATION_ERROR_MESSAGE = 'Error de validación';
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;

type ValidationMessage = string | null;

const filterMessages = (messages: ValidationMessage[]): string[] =>
  messages.filter((message): message is string => Boolean(message));

const respondWithErrors = (res: Response, errors: string[]): void => {
  res.status(400).json({
    success: false,
    message: VALIDATION_ERROR_MESSAGE,
    errors,
  });
};

const hasAnyValue = (value: unknown): boolean =>
  value !== undefined && value !== null && value !== '';

const getCoordinateErrors = (coordenadas?: {
  lat?: string | number;
  lng?: string | number;
}): string[] => {
  if (!coordenadas) {
    return [];
  }

  const { lat, lng } = coordenadas;

  if (lat === undefined || lng === undefined) {
    return ['Las coordenadas deben incluir lat y lng'];
  }

  const latNum = Number(lat);
  const lngNum = Number(lng);

  const messages: ValidationMessage[] = [
    !Number.isFinite(latNum) || latNum < -90 || latNum > 90
      ? 'La latitud debe ser un número entre -90 y 90'
      : null,
    !Number.isFinite(lngNum) || lngNum < -180 || lngNum > 180
      ? 'La longitud debe ser un número entre -180 y 180'
      : null,
  ];

  return filterMessages(messages);
};

const collectSiteErrors = (req: SiteRequest): string[] => {
  const { nombre, cliente, direccion, coordenadas, localidad, provincia } = req.body;
  const isPost = req.method === 'POST';
  const isPut = req.method === 'PUT';
  const hasUpdatableField = [nombre, direccion, coordenadas, localidad, provincia].some(
    hasAnyValue
  );

  const messages: ValidationMessage[] = [
    isPost && !hasAnyValue(nombre) ? 'El nombre del sitio es requerido' : null,
    isPost && !hasAnyValue(cliente) ? 'El cliente asociado es requerido' : null,
    isPut && !hasUpdatableField ? 'Debe proporcionar al menos un campo para actualizar' : null,
  ];

  return [...filterMessages(messages), ...getCoordinateErrors(coordenadas)];
};

const parseDate = (value?: string | Date): number | null => {
  if (!value) {
    return null;
  }

  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
};

const getTramoBaseErrors = ({
  origen,
  destino,
  cliente,
  tarifa,
}: TramoRequest['body']): string[] => {
  const tarifaNum = tarifa !== undefined ? Number(tarifa) : undefined;

  const messages: ValidationMessage[] = [
    !hasAnyValue(origen) ? 'El origen es requerido' : null,
    !hasAnyValue(destino) ? 'El destino es requerido' : null,
    !hasAnyValue(cliente) ? 'El cliente es requerido' : null,
    tarifa !== undefined && (tarifaNum === undefined || Number.isNaN(tarifaNum) || tarifaNum < 0)
      ? 'La tarifa debe ser un número positivo'
      : null,
  ];

  return filterMessages(messages);
};

const getTramoDateErrors = (
  vigenciaDesde?: string | Date,
  vigenciaHasta?: string | Date
): string[] => {
  const desde = parseDate(vigenciaDesde);
  const hasta = parseDate(vigenciaHasta);

  const messages: ValidationMessage[] = [
    vigenciaDesde && desde === null ? 'La fecha de vigencia desde no es válida' : null,
    vigenciaHasta && hasta === null ? 'La fecha de vigencia hasta no es válida' : null,
    desde !== null && hasta !== null && hasta < desde
      ? 'La fecha de vigencia hasta debe ser posterior a la fecha desde'
      : null,
  ];

  return filterMessages(messages);
};

const collectTramoErrors = (req: TramoRequest): string[] => [
  ...getTramoBaseErrors(req.body),
  ...getTramoDateErrors(req.body.vigenciaDesde, req.body.vigenciaHasta),
];

const collectAuthErrors = (req: AuthRequest): string[] => {
  const email = req.body.email?.trim();
  const { password } = req.body;

  const messages: ValidationMessage[] = [
    !hasAnyValue(email) ? 'El email es requerido' : null,
    email && !EMAIL_REGEX.test(email) ? 'El formato del email no es válido' : null,
    !hasAnyValue(password) ? 'La contraseña es requerida' : null,
    typeof password === 'string' && password.length > 0 && password.length < 6
      ? 'La contraseña debe tener al menos 6 caracteres'
      : null,
  ];

  return filterMessages(messages);
};

interface SiteRequest extends Request {
  body: {
    nombre?: string;
    cliente?: string;
    direccion?: string;
    coordenadas?: {
      lat?: string | number;
      lng?: string | number;
    };
    localidad?: string;
    provincia?: string;
  };
}

interface TramoRequest extends Request {
  body: {
    origen?: string;
    destino?: string;
    cliente?: string;
    tarifa?: string | number;
    vigenciaDesde?: string | Date;
    vigenciaHasta?: string | Date;
  };
}

interface AuthRequest extends Request {
  body: {
    email?: string;
    password?: string;
  };
}

/**
 * Valida los datos de un sitio antes de crear o actualizar
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const validateSite = (req: SiteRequest, res: Response, next: NextFunction): void => {
  const errors = collectSiteErrors(req);

  if (errors.length > 0) {
    logger.warn('Validación fallida:', errors);
    respondWithErrors(res, errors);
    return;
  }

  next();
};

/**
 * Valida los datos de un tramo antes de crear o actualizar
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const validateTramo = (req: TramoRequest, res: Response, next: NextFunction): void => {
  const errors = collectTramoErrors(req);

  if (errors.length > 0) {
    logger.warn('Validación de tramo fallida:', errors);
    respondWithErrors(res, errors);
    return;
  }

  next();
};

/**
 * Valida los datos de autenticación
 * @param {Request} req - Objeto de solicitud Express
 * @param {Response} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const validateAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const errors = collectAuthErrors(req);

  if (errors.length > 0) {
    respondWithErrors(res, errors);
    return;
  }

  next();
};

export { validateSite, validateTramo, validateAuth };
