import { API_BASE_URL } from '../constants';

export interface BaseExcelServiceConfig {
  entityType: string;
  endpoints: {
    export: string;
    template: string;
  };
}

export class BaseExcelService {
  private config: BaseExcelServiceConfig;

  constructor(config: BaseExcelServiceConfig) {
    this.config = config;
  }

  /**
   * Exporta entidades a Excel
   * @param filters - Filtros opcionales para la exportación
   * @returns Promise<Blob> - Archivo Excel como blob
   */
  async exportToExcel(filters?: any): Promise<Blob> {
    const url = new URL(`${API_BASE_URL}${this.config.endpoints.export}`);
    
    // Agregar filtros como query parameters si existen
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const token = localStorage.getItem('token');
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error al exportar ${this.config.entityType}: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Obtiene la plantilla Excel para importación
   * @returns Promise<Blob> - Plantilla Excel como blob
   */
  async getTemplate(): Promise<Blob> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${this.config.endpoints.template}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener plantilla de ${this.config.entityType}: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Importa entidades desde Excel
   * @param file - Archivo Excel a importar
   * @returns Promise<any> - Resultado de la importación
   */
  async importFromExcel(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${this.config.endpoints.export}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error al importar ${this.config.entityType}: ${response.statusText}`);
    }

    return response.json();
  }
}

// Instancias pre-configuradas para las entidades principales
export const clienteExcelService = new BaseExcelService({
  entityType: 'clientes',
  endpoints: {
    export: '/clientes/export',
    template: '/clientes/template',
  },
});

export const empresaExcelService = new BaseExcelService({
  entityType: 'empresas',
  endpoints: {
    export: '/empresas/export',
    template: '/empresas/template',
  },
});

export const personalExcelService = new BaseExcelService({
  entityType: 'personal',
  endpoints: {
    export: '/personal/export',
    template: '/personal/template',
  },
});

export const siteExcelService = new BaseExcelService({
  entityType: 'sites',
  endpoints: {
    export: '/sites/export',
    template: '/sites/template',
  },
});

export const tramoExcelService = new BaseExcelService({
  entityType: 'tramos',
  endpoints: {
    export: '/tramos/export',
    template: '/tramos/template',
  },
});

export const vehiculoExcelService = new BaseExcelService({
  entityType: 'vehiculos',
  endpoints: {
    export: '/vehiculos/export',
    template: '/vehiculos/template',
  },
});

export const viajeExcelService = new BaseExcelService({
  entityType: 'viajes',
  endpoints: {
    export: '/viajes/export',
    template: '/viajes/template',
  },
});

export const extraExcelService = new BaseExcelService({
  entityType: 'extras',
  endpoints: {
    export: '/extras/export',
    template: '/extras/template',
  },
});