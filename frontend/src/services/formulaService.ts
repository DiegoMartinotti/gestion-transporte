import api from './api';

export interface Formula {
  _id: string;
  clienteId: string;
  tipoUnidad: 'Sider' | 'Bitren' | 'General';
  formula: string;
  vigenciaDesde: string;
  vigenciaHasta?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFormulaData {
  clienteId: string;
  tipoUnidad: 'Sider' | 'Bitren' | 'General';
  formula: string;
  vigenciaDesde: string;
  vigenciaHasta?: string | null;
}

export interface UpdateFormulaData {
  formula?: string;
  vigenciaDesde?: string;
  vigenciaHasta?: string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
  variables?: string[];
  result?: number;
}

export interface CalculateResult {
  resultado: number;
  variables: Record<string, number>;
  formula: string;
}

export interface ConflictCheckData {
  clienteId: string;
  tipoUnidad: string;
  vigenciaDesde: Date;
  vigenciaHasta?: Date | null;
  excludeId?: string;
}

class FormulaService {
  private readonly basePath = '/api/formulas';

  async getAll() {
    return api.get<Formula[]>(this.basePath);
  }

  async getById(id: string) {
    return api.get<Formula>(`${this.basePath}/${id}`);
  }

  async getByCliente(clienteId: string, tipoUnidad?: string, fecha?: string) {
    const params = new URLSearchParams();
    if (tipoUnidad) params.append('tipoUnidad', tipoUnidad);
    if (fecha) params.append('fecha', fecha);
    
    const queryString = params.toString();
    const url = `${this.basePath}/cliente/${clienteId}${queryString ? `?${queryString}` : ''}`;
    
    return api.get<Formula[]>(url);
  }

  async create(data: CreateFormulaData) {
    return api.post<Formula>(this.basePath, data);
  }

  async update(id: string, data: UpdateFormulaData) {
    return api.put<Formula>(`${this.basePath}/${id}`, data);
  }

  async delete(id: string) {
    return api.delete(`${this.basePath}/${id}`);
  }

  async validate(formula: string, variables?: Record<string, number>): Promise<ValidationResult> {
    try {
      const testVariables = variables || {
        Valor: 1000,
        Palets: 10,
        Peaje: 500
      };

      const response = await api.post<CalculateResult>(`${this.basePath}/calculate`, {
        formula,
        variables: testVariables
      });

      return {
        isValid: true,
        result: response.data?.resultado,
        variables: Object.keys(testVariables)
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al validar la fórmula';
      
      return {
        isValid: false,
        errors: [errorMessage]
      };
    }
  }

  async calculate(formula: string, variables: Record<string, number>) {
    return api.post<CalculateResult>(`${this.basePath}/calculate`, {
      formula,
      variables
    });
  }

  async checkConflictos(data: ConflictCheckData) {
    const params = {
      clienteId: data.clienteId,
      tipoUnidad: data.tipoUnidad,
      vigenciaDesde: data.vigenciaDesde.toISOString(),
      vigenciaHasta: data.vigenciaHasta?.toISOString() || null,
      ...(data.excludeId && { excludeId: data.excludeId })
    };

    return api.post<Formula[]>(`${this.basePath}/check-conflicts`, params);
  }

  async getHistory(clienteId: string, tipoUnidad?: string) {
    const params = new URLSearchParams();
    if (tipoUnidad) params.append('tipoUnidad', tipoUnidad);
    
    const queryString = params.toString();
    const url = `${this.basePath}/history/${clienteId}${queryString ? `?${queryString}` : ''}`;
    
    return api.get<Formula[]>(url);
  }

  async getActive(clienteId: string, tipoUnidad: string, fecha?: Date) {
    const params = new URLSearchParams();
    params.append('tipoUnidad', tipoUnidad);
    if (fecha) params.append('fecha', fecha.toISOString());
    
    const url = `${this.basePath}/active/${clienteId}?${params.toString()}`;
    return api.get<Formula | null>(url);
  }

  // Método auxiliar para obtener la fórmula aplicable
  async getFormulaAplicable(clienteId: string, tipoUnidad: string, fecha: Date = new Date()) {
    try {
      const response = await this.getActive(clienteId, tipoUnidad, fecha);
      return response.data?.formula || 'Valor * Palets + Peaje'; // Fórmula por defecto
    } catch (error) {
      console.error('Error getting formula aplicable:', error);
      return 'Valor * Palets + Peaje'; // Fórmula por defecto
    }
  }

  // Validaciones del lado cliente
  validateFormulaLocal(formula: string): ValidationResult {
    if (!formula.trim()) {
      return {
        isValid: false,
        errors: ['La fórmula no puede estar vacía']
      };
    }

    // Verificar variables válidas
    const validVariables = ['Valor', 'Palets', 'Peaje'];
    const foundVariables = validVariables.filter(variable => 
      formula.includes(variable)
    );

    if (foundVariables.length === 0) {
      return {
        isValid: false,
        errors: ['La fórmula debe incluir al menos una variable válida (Valor, Palets, Peaje)'],
        variables: validVariables
      };
    }

    // Verificar caracteres no permitidos
    const allowedChars = /^[A-Za-z0-9\s\+\-\*\/\(\)\.\,\;\>\<\=]+$/;
    if (!allowedChars.test(formula)) {
      return {
        isValid: false,
        errors: ['La fórmula contiene caracteres no permitidos']
      };
    }

    // Verificar paréntesis balanceados
    let parentheses = 0;
    for (const char of formula) {
      if (char === '(') parentheses++;
      if (char === ')') parentheses--;
      if (parentheses < 0) {
        return {
          isValid: false,
          errors: ['Paréntesis desbalanceados']
        };
      }
    }
    
    if (parentheses !== 0) {
      return {
        isValid: false,
        errors: ['Paréntesis desbalanceados']
      };
    }

    return {
      isValid: true,
      variables: foundVariables
    };
  }
}

export const formulaService = new FormulaService();