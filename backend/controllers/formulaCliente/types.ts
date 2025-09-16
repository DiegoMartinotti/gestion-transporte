// @allow-duplicate: migración legítima de controlador monolítico a modular
import { Request } from 'express';
import { IFormulasPersonalizadasCliente } from '../../models/FormulasPersonalizadasCliente';

/**
 * Interface for authenticated user in request
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  roles?: string[];
}

/**
 * Interface for authenticated request
 */
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Interface for API responses
 */
export interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
  overlappingFormula?: IFormulasPersonalizadasCliente;
}

/**
 * Interface for formula creation request
 */
export interface FormulaCreateRequest {
  clienteId: string;
  tipoUnidad: string;
  formula: string;
  vigenciaDesde: string;
  vigenciaHasta?: string;
}

/**
 * Interface for formula update request
 */
export interface FormulaUpdateRequest {
  formula?: string;
  vigenciaDesde?: string;
  vigenciaHasta?: string | null;
}

/**
 * Interface for formula query parameters
 */
export interface FormulaQueryParams {
  tipoUnidad?: string;
  fecha?: string;
}
