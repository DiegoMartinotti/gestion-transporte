import api from './api';
import type { Viaje } from '../types/viaje';
import type { ExcelRowData } from '../types/excel';
import { ClienteService } from './clienteService';
import {
  ViajeExcelMappers,
  type Site,
  type PersonalItem,
  type VehiculoItem,
  type ClienteObject,
} from './viajeExcelMappers';
import * as XLSX from 'xlsx';

// Interfaces para respuestas de backend
interface BulkImportResponse {
  successCount: number;
  failCount: number;
  importacionId: string;
  erroresDetallados?: Array<{
    fila?: number;
    error?: string;
    [key: string]: unknown;
  }>;
  data?: unknown;
}

export class ViajeExcelService {
  private static baseUrl = '/viajes';

  /**
   * Resolver nombres de sites a IDs
   */
  private static async resolveSiteIds(
    sites: Site[],
    clienteId: string
  ): Promise<Map<string, string>> {
    const siteMap = new Map<string, string>();

    sites.forEach((site) => {
      // Verificar si site.cliente es un objeto con _id o directamente el string
      const siteClienteId =
        typeof site.cliente === 'object' ? (site.cliente as ClienteObject)?._id : site.cliente;

      if (siteClienteId === clienteId) {
        siteMap.set(site.nombre.toLowerCase(), site._id);
      }
    });

    return siteMap;
  }

  /**
   * Resolver DNIs de choferes a IDs de Personal
   */
  private static async resolvePersonalIds(personal: PersonalItem[]): Promise<Map<string, string>> {
    const personalMap = new Map<string, string>();

    personal.forEach((p) => {
      const dniStr = String(p.dni);
      personalMap.set(dniStr, p._id);
    });

    return personalMap;
  }

  /**
   * Resolver dominios de vehículos a IDs
   */
  private static async resolveVehiculoIds(vehiculos: VehiculoItem[]): Promise<Map<string, string>> {
    const vehiculoMap = new Map<string, string>();

    vehiculos.forEach((v) => {
      vehiculoMap.set(v.dominio.toLowerCase(), v._id);
    });

    return vehiculoMap;
  }

  private static extractClientFromExcel(jsonData: ExcelRowData[]): string {
    const primerRegistro = jsonData[0];
    const clienteNombre =
      primerRegistro?.['Cliente *'] || primerRegistro?.['Cliente'] || primerRegistro?.cliente;
    if (!clienteNombre) {
      throw new Error(
        'No se pudo determinar el cliente. Verifique que el archivo Excel tenga la columna Cliente.'
      );
    }
    return String(clienteNombre);
  }

  private static async findClientInSystem(clienteNombre: string): Promise<ClienteObject> {
    const clientesResponse = await ClienteService.getAll();
    const cliente = clientesResponse.data?.find((c: ClienteObject) => {
      if (c.nombre === clienteNombre) return true;
      if (c.nombre?.toLowerCase() === clienteNombre?.toLowerCase()) return true;
      if (c.nombre?.trim() === clienteNombre?.trim()) return true;
      return false;
    });
    if (!cliente) {
      throw new Error(`Cliente "${clienteNombre}" no encontrado en el sistema`);
    }
    return cliente;
  }

  private static async loadReferenceData(): Promise<{
    sites: Site[];
    personal: PersonalItem[];
    vehiculos: VehiculoItem[];
  }> {
    const [sitesResponse, personalResponse, vehiculosResponse] = await Promise.all([
      api.get('/sites'),
      api.get('/personal'),
      api.get('/vehiculos'),
    ]);

    const sitesData = (sitesResponse as { data?: { data?: Site[] } | Site[] }).data;
    const sites = (
      Array.isArray(sitesData) ? sitesData : (sitesData as { data?: Site[] })?.data || []
    ) as Site[];
    const personal = (
      Array.isArray(personalResponse)
        ? personalResponse
        : (personalResponse as { data?: PersonalItem[] }).data || []
    ) as PersonalItem[];
    const vehiculos = (
      Array.isArray(vehiculosResponse)
        ? vehiculosResponse
        : (vehiculosResponse as { data?: VehiculoItem[] }).data || []
    ) as VehiculoItem[];

    return { sites, personal, vehiculos };
  }

  private static validateViajeData(viajesMapeados: Array<Partial<Viaje>>): void {
    for (let i = 0; i < viajesMapeados.length; i++) {
      const viaje = viajesMapeados[i];

      if (typeof viaje.chofer !== 'string' || viaje.chofer.length !== 24) {
        throw new Error(
          `Viaje ${i + 1} tiene chofer inválido: ${viaje.chofer} (tipo: ${typeof viaje.chofer})`
        );
      }
    }
  }

  private static prepareBulkImportData(
    cliente: ClienteObject,
    viajesMapeados: Array<Partial<Viaje>>,
    erroresMapeo: Array<{ fila: number; error: string }>
  ): Record<string, unknown> {
    return {
      cliente: cliente._id,
      viajes: viajesMapeados,
      erroresMapeo: erroresMapeo,
      sitesNoEncontrados: Array.from(
        new Set(
          erroresMapeo
            .filter((e) => e.error.includes('origen') || e.error.includes('destino'))
            .map((e) => {
              const match = e.error.match(/Site (?:origen|destino) "([^"]+)" no encontrado/);
              return match ? match[1] : null;
            })
            .filter(Boolean)
        )
      ),
      totalFilasConErrores: erroresMapeo.length,
    };
  }

  private static transformBulkResponse(
    response: { data: BulkImportResponse },
    jsonData: ExcelRowData[],
    erroresMapeo: Array<{ fila: number; error: string }>
  ): Record<string, unknown> {
    const responseData = response.data;
    const totalRows = jsonData.length;
    const insertedRows = responseData.successCount || 0;
    const errorRowsMapeo = erroresMapeo.length;
    const errorRowsBackend = responseData.failCount || 0;
    const totalErrorRows = errorRowsMapeo + errorRowsBackend;

    const todosLosErrores = [...erroresMapeo, ...(responseData.erroresDetallados || [])];

    return {
      success: true,
      importId: responseData.importacionId,
      summary: {
        totalRows: totalRows,
        insertedRows: insertedRows,
        errorRows: totalErrorRows,
        successRate: totalRows > 0 ? Math.round((insertedRows / totalRows) * 100) : 0,
      },
      data: responseData,
      hasMissingData: totalErrorRows > 0,
      missingDataTypes: {
        sites: todosLosErrores.some(
          (e: { error?: string }) => e.error?.includes('origen') || e.error?.includes('destino')
        ),
        personal: todosLosErrores.some(
          (e: { error?: string }) => e.error?.includes('chofer') || e.error?.includes('personal')
        ),
        vehiculos: todosLosErrores.some((e: { error?: string }) => e.error?.includes('vehiculo')),
        tramos: todosLosErrores.some(
          (e: { error?: string }) => e.error?.includes('tramo') || e.error?.includes('tarifa')
        ),
      },
    };
  }

  private static async processExcelData(params: {
    jsonData: ExcelRowData[];
    cliente: ClienteObject;
    maps: {
      siteMap: Map<string, string>;
      personalMap: Map<string, string>;
      vehiculoMap: Map<string, string>;
    };
  }): Promise<{
    viajesMapeados: Array<Partial<Viaje>>;
    erroresMapeo: Array<{ fila: number; error: string }>;
  }> {
    const { jsonData, cliente, maps } = params;
    const { siteMap, personalMap, vehiculoMap } = maps;

    const viajesMapeados: Array<Partial<Viaje>> = [];
    const erroresMapeo: Array<{ fila: number; error: string }> = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i] as ExcelRowData;
      try {
        const viajeData = ViajeExcelMappers.mapExcelRowToViaje({
          row,
          index: i,
          siteMap,
          personalMap,
          vehiculoMap,
          clienteId: cliente._id,
        });
        viajesMapeados.push(viajeData);
      } catch (error) {
        erroresMapeo.push({
          fila: i + 1,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { viajesMapeados, erroresMapeo };
  }

  private static async sendBulkDataToBackend(
    cliente: ClienteObject,
    viajesMapeados: Array<Partial<Viaje>>,
    erroresMapeo: Array<{ fila: number; error: string }>
  ): Promise<BulkImportResponse> {
    const bulkData = this.prepareBulkImportData(cliente, viajesMapeados, erroresMapeo);

    const response = await api.post(`${this.baseUrl}/bulk/iniciar`, bulkData, {
      timeout: 60000,
    });

    return response.data as BulkImportResponse;
  }

  // Métodos públicos para Excel
  static async processExcelFile(file: File): Promise<Record<string, unknown>> {
    const fileReader = new FileReader();
    return new Promise((resolve, reject) => {
      fileReader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRowData[];

          const clienteNombre = this.extractClientFromExcel(jsonData);
          const cliente = await this.findClientInSystem(clienteNombre);
          const { sites, personal, vehiculos } = await this.loadReferenceData();

          const siteMap = await this.resolveSiteIds(sites, cliente._id);
          const personalMap = await this.resolvePersonalIds(personal);
          const vehiculoMap = await this.resolveVehiculoIds(vehiculos);

          const { viajesMapeados, erroresMapeo } = await this.processExcelData({
            jsonData,
            cliente,
            maps: { siteMap, personalMap, vehiculoMap },
          });

          this.validateViajeData(viajesMapeados);

          const responseData = await this.sendBulkDataToBackend(
            cliente,
            viajesMapeados,
            erroresMapeo
          );

          const transformedResponse = this.transformBulkResponse(
            { data: responseData },
            jsonData,
            erroresMapeo
          );
          resolve(transformedResponse);
        } catch (error) {
          reject(error);
        }
      };
      fileReader.readAsArrayBuffer(file);
    });
  }

  static async previewExcelFile(
    file: File,
    sampleSize = 5
  ): Promise<{
    headers: string[];
    preview: ExcelRowData[];
    totalRows: number;
    data: ExcelRowData[];
    samples: Array<{ sample: ExcelRowData[]; sampleSize: number }>;
  }> {
    const fileReader = new FileReader();
    return new Promise((resolve, reject) => {
      fileReader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRowData[];

          const headers = Object.keys(jsonData[0] || {});
          const preview = jsonData.slice(0, sampleSize);

          resolve({
            headers,
            preview,
            totalRows: jsonData.length,
            data: jsonData,
            samples: [
              {
                sample: preview,
                sampleSize: sampleSize,
              },
            ],
          });
        } catch (error) {
          reject(error);
        }
      };
      fileReader.readAsArrayBuffer(file);
    });
  }

  static async downloadMissingDataTemplates(importId: string): Promise<Blob> {
    try {
      const response = await fetch(
        `http://localhost:3001/api${this.baseUrl}/bulk/template/${importId}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error('El archivo descargado está vacío');
      }

      return blob;
    } catch (error) {
      const errorWithResponse = error as { response?: { status?: number } };
      if (errorWithResponse.response?.status === 401) {
        throw new Error('Token de autenticación inválido o expirado');
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Error al descargar plantillas: ${errorMessage}`);
    }
  }

  static async uploadCorrectionTemplate(importId: string, file: File): Promise<unknown> {
    try {
      const formData = new FormData();
      formData.append('correctionFile', file);

      const response = await fetch(
        `http://localhost:3001/api${this.baseUrl}/bulk/process-correction/${importId}`,
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al procesar la plantilla de corrección');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      const errorWithResponse = error as { response?: { status?: number } };
      if (errorWithResponse.response?.status === 401) {
        throw new Error('Token de autenticación inválido o expirado');
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Error al cargar plantilla: ${errorMessage}`);
    }
  }
}
