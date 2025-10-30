/**
 * Tipos reutilizables para Express Request/Response handlers
 * Solución para TS2769 (overload mismatch) y TS2345 (argument incompatibility)
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Request extendido con index signature para propiedades dinámicas
 */
export interface IndexableRequest<
  P = Record<string, string>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Record<string, unknown>,
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  [key: string]: unknown;
}

/**
 * Request con usuario autenticado
 */
export interface AuthenticatedRequest<
  P = Record<string, string>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Record<string, unknown>,
> extends IndexableRequest<P, ResBody, ReqBody, ReqQuery> {
  user?: {
    userId: string;
    email: string;
    [key: string]: unknown;
  };
}

/**
 * Request con parámetros tipados
 */
export interface TypedRequest<
  TParams = Record<string, string>,
  TBody = unknown,
  TQuery = Record<string, unknown>,
> extends AuthenticatedRequest<TParams, unknown, TBody, TQuery> {
  params: TParams;
  body: TBody;
  query: TQuery;
}

/**
 * Handler tipado que acepta Request extendido
 */
export type TypedRequestHandler<
  TParams = Record<string, string>,
  TBody = unknown,
  TQuery = Record<string, unknown>,
  TResponse = unknown,
> = RequestHandler<TParams, TResponse, TBody, TQuery>;

/**
 * Async handler wrapper para evitar try/catch repetitivos
 * Sobrecarga 1: Handler con 3 parámetros (req, res, next)
 */
export function asyncHandler<
  TParams = Record<string, string>,
  TBody = unknown,
  TQuery = Record<string, unknown>,
  TResponse = unknown,
>(
  fn: (
    req: TypedRequest<TParams, TBody, TQuery>,
    res: Response<TResponse>,
    next: NextFunction
  ) => Promise<void>
): RequestHandler<TParams, TResponse, TBody, TQuery>;

/**
 * Sobrecarga 2: Handler con 2 parámetros (req, res) - para controllers legacy
 */
export function asyncHandler<TReq = Request, TRes = Response>(
  fn: (req: TReq, res: TRes) => Promise<void>
): RequestHandler;

/**
 * Implementación
 */
export function asyncHandler(fn: (...args: unknown[]) => Promise<void>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
