import { ImportResult } from '../../../components/modals/types/ExcelImportModalTypes';
import { Tramo, Site } from '../../../types';

// Tipos específicos para TramosPage
export interface TramosDataResponse {
  data: Tramo[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface SitesDataResponse {
  data: Site[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface TramoFormData {
  cliente: string;
  origen: string;
  destino: string;
  distancia: number;
  tipo?: 'TRMC' | 'TRMI';
  metodoCalculo?: 'Kilometro' | 'Palet' | 'Fijo';
  valor?: number;
  valorPeaje?: number;
  vigenciaDesde?: string;
  vigenciaHasta?: string;
  activo?: boolean;
}

export interface TarifaCalculationResult {
  tarifa: number;
  peaje: number;
  total: number;
  metodo: string;
  variables: Record<string, number>;
  formula?: string;
}

export interface TramosImportResult extends ImportResult {
  entityType: 'tramos';
}
