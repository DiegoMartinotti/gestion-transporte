import api from './api';

export interface CalculationParams {
  cliente: string;
  origen: string;
  destino: string;
  fecha: string;
  palets: number;
  tipoUnidad?: string;
  tipoTramo: string;
  metodoCalculo?: string;
  permitirTramoNoVigente?: boolean;
  tramoId?: string;
  tarifaHistoricaId?: string;
}

export interface CalculationResult {
  tarifaBase: number;
  extrasTotal: number;
  total: number;
  metodCalculo: string;
  desglose: {
    concepto: string;
    valor: number;
    formula?: string;
  }[];
}

export interface TarifaVersion {
  _id: string;
  version: number;
  fechaVigenciaInicio: string;
  fechaVigenciaFin?: string;
  tarifasPorTipo: {
    chico: number;
    semi: number;
    acoplado: number;
    bitrén: number;
  };
  tipoCalculo: 'peso' | 'volumen' | 'distancia' | 'tiempo' | 'fija' | 'formula';
  formula?: string;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TarifaConflict {
  tipo: 'superposicion' | 'gap' | 'duplicado';
  mensaje: string;
  fechaInicio: string;
  fechaFin?: string;
  versionesAfectadas: string[];
}

export const tarifaService = {
  // Calcular tarifa en tiempo real
  calculateTarifa: async (tramoId: string, params: CalculationParams): Promise<CalculationResult> => {
    const response = await api.post(`/tramos/${tramoId}/calculate-tarifa`, params);
    return response.data as CalculationResult;
  },

  // Obtener versiones de tarifas
  getTarifaVersions: async (tramoId: string): Promise<TarifaVersion[]> => {
    const response = await api.get(`/tramos/${tramoId}/tarifas`);
    return response.data as TarifaVersion[];
  },

  // Crear nueva versión de tarifa
  createTarifaVersion: async (tramoId: string, version: Partial<TarifaVersion>): Promise<TarifaVersion> => {
    const response = await api.post(`/tramos/${tramoId}/tarifas`, version);
    return response.data as TarifaVersion;
  },

  // Actualizar versión de tarifa
  updateTarifaVersion: async (tramoId: string, versionId: string, version: Partial<TarifaVersion>): Promise<TarifaVersion> => {
    const response = await api.put(`/tramos/${tramoId}/tarifas/${versionId}`, version);
    return response.data as TarifaVersion;
  },

  // Activar/desactivar versión
  toggleTarifaVersion: async (tramoId: string, versionId: string, activa: boolean): Promise<TarifaVersion> => {
    const response = await api.patch(`/tramos/${tramoId}/tarifas/${versionId}/toggle`, { activa });
    return response.data as TarifaVersion;
  },

  // Detectar conflictos de fechas
  detectConflicts: async (tramoId: string, version: Partial<TarifaVersion>): Promise<TarifaConflict[]> => {
    const response = await api.post(`/tramos/${tramoId}/tarifas/detect-conflicts`, version);
    return response.data as TarifaConflict[];
  },

  // Validar fórmula personalizada
  validateFormula: async (formula: string): Promise<{ valid: boolean; error?: string; variables: string[] }> => {
    const response = await api.post('/formulas/validate', { formula });
    return response.data as { valid: boolean; error?: string; variables: string[] };
  },

  // Vista previa de cálculo con nueva tarifa
  previewCalculation: async (tramoId: string, version: Partial<TarifaVersion>, params: CalculationParams): Promise<CalculationResult> => {
    const response = await api.post(`/tramos/${tramoId}/tarifas/preview`, { version, params });
    return response.data as CalculationResult;
  }
};

// Exportar funciones individuales para compatibilidad
export const calculateTarifa = tarifaService.calculateTarifa;
export const getTarifaVersions = tarifaService.getTarifaVersions;
export const createTarifaVersion = tarifaService.createTarifaVersion;
export const updateTarifaVersion = tarifaService.updateTarifaVersion;
export const toggleTarifaVersion = tarifaService.toggleTarifaVersion;
export const detectConflicts = tarifaService.detectConflicts;
export const validateFormula = tarifaService.validateFormula;
export const previewCalculation = tarifaService.previewCalculation;