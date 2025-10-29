/**
 * Extensiones de tipos para Express con tipado fuerte
 */
import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';

/**
 * Request tipado con parámetros, body y query específicos
 */
export type TypedRequest<
  P = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Query,
> = Request<P, ResBody, ReqBody, ReqQuery>;

/**
 * Request con usuario autenticado
 */
export interface AuthenticatedRequest<
  P = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Query,
> extends TypedRequest<P, ResBody, ReqBody, ReqQuery> {
  user: {
    id: string;
    email: string;
  };
}

/**
 * Handler asíncrono tipado
 */
export type AsyncRequestHandler<
  P = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Query,
> = (
  req: TypedRequest<P, ResBody, ReqBody, ReqQuery>,
  res: Response<ResBody>,
  next: NextFunction
) => Promise<void | Response<ResBody>>;

/**
 * Handler asíncrono con autenticación
 */
export type AuthenticatedAsyncHandler<
  P = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Query,
> = (
  req: AuthenticatedRequest<P, ResBody, ReqBody, ReqQuery>,
  res: Response<ResBody>,
  next: NextFunction
) => Promise<void | Response<ResBody>>;
