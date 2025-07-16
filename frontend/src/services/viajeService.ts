import api from './api';
import type { Viaje } from '../types/viaje';
import { ClienteService } from './clienteService';
import * as XLSX from 'xlsx';

// Interfaces para los servicios
interface Site {
  _id: string;
  nombre: string;
  cliente: string;
}

interface PersonalItem {
  _id: string;
  dni: string;
  nombre: string;
  apellido: string;
}

interface VehiculoItem {
  _id: string;
  dominio: string;
  empresa: string;
}

export interface ViajesResponse {
  data: Viaje[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
}

export class ViajeService {
  private static baseUrl = '/viajes';

  /**
   * Resolver nombres de sites a IDs
   */
  private static async resolveSiteIds(sites: Site[], clienteId: string): Promise<Map<string, string>> {
    const siteMap = new Map<string, string>();
    
    console.log('resolveSiteIds - Cliente ID buscado:', clienteId);
    console.log('resolveSiteIds - Sites totales:', sites.length);
    
    sites.forEach((site, index) => {
      if (index < 5) { // Solo log de los primeros 5
        console.log(`Site ${index}:`, {
          _id: site._id,
          nombre: site.nombre,
          cliente: site.cliente,
          tipoCliente: typeof site.cliente
        });
      }
      
      // Verificar si site.cliente es un objeto con _id o directamente el string
      const siteClienteId = typeof site.cliente === 'object' ? (site.cliente as any)?._id : site.cliente;
      
      if (index < 5) {
        console.log(`Site ${index} - Comparación:`, {
          siteClienteId,
          clienteId,
          sonIguales: siteClienteId === clienteId,
          siteClienteIdType: typeof siteClienteId,
          clienteIdType: typeof clienteId
        });
      }
      
      if (siteClienteId === clienteId) {
        siteMap.set(site.nombre.toLowerCase(), site._id);
        console.log(`Site agregado al mapa: ${site.nombre} -> ${site._id}`);
      }
    });
    
    console.log('resolveSiteIds - Mapa final:', siteMap);
    return siteMap;
  }

  /**
   * Resolver DNIs de choferes a IDs de Personal
   */
  private static async resolvePersonalIds(personal: PersonalItem[]): Promise<Map<string, string>> {
    const personalMap = new Map<string, string>();
    
    console.log('resolvePersonalIds - Personal total:', personal.length);
    
    // Extraer todos los DNIs para debug
    const allDnis = personal.map(p => p.dni);
    console.log('Todos los DNIs disponibles:', allDnis);
    
    personal.forEach((p, index) => {
      if (index < 3) { // Solo log de los primeros 3
        console.log(`Personal ${index}:`, {
          _id: p._id,
          dni: p.dni,
          nombre: p.nombre,
          apellido: p.apellido
        });
      }
      // Convertir DNI a string para consistencia
      const dniStr = String(p.dni);
      personalMap.set(dniStr, p._id);
      if (index < 3) { // Solo log de los primeros 3
        console.log(`Mapeando DNI: "${dniStr}" -> ID: "${p._id}"`);
      }
    });
    
    console.log('resolvePersonalIds - Mapa final size:', personalMap.size);
    return personalMap;
  }

  /**
   * Resolver dominios de vehículos a IDs
   */
  private static async resolveVehiculoIds(vehiculos: VehiculoItem[]): Promise<Map<string, string>> {
    const vehiculoMap = new Map<string, string>();
    
    console.log('resolveVehiculoIds - Vehiculos total:', vehiculos.length);
    
    vehiculos.forEach((v, index) => {
      if (index < 3) { // Solo log de los primeros 3
        console.log(`Vehiculo ${index}:`, {
          _id: v._id,
          dominio: v.dominio,
          empresa: v.empresa
        });
      }
      vehiculoMap.set(v.dominio.toLowerCase(), v._id);
    });
    
    console.log('resolveVehiculoIds - Mapa final size:', vehiculoMap.size);
    return vehiculoMap;
  }

  /**
   * Convertir fecha de Excel a formato Date
   */
  private static parseExcelDate(dateValue: any): Date {
    if (!dateValue) return new Date();
    
    // Si ya es una fecha
    if (dateValue instanceof Date) return dateValue;
    
    // Si es string en formato DD/MM/YYYY
    if (typeof dateValue === 'string' && dateValue.includes('/')) {
      const [day, month, year] = dateValue.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Si es número de Excel (días desde 1900)
    if (typeof dateValue === 'number') {
      return new Date((dateValue - 25569) * 86400 * 1000);
    }
    
    // Fallback: intentar parsear como fecha
    return new Date(dateValue);
  }

  static async getAll(filters?: any, page = 1, limit = 10): Promise<ViajesResponse> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await api.get(`${this.baseUrl}?${params.toString()}`);
    return response as unknown as ViajesResponse;
  }

  static async getById(id: string): Promise<Viaje> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data as Viaje;
  }

  static async getByCliente(clienteId: string): Promise<ViajesResponse> {
    const response = await api.get(`${this.baseUrl}?cliente=${clienteId}`);
    return response.data as ViajesResponse;
  }

  static async create(data: any): Promise<Viaje> {
    const response = await api.post(this.baseUrl, data);
    return response.data as Viaje;
  }

  static async update(id: string, data: any): Promise<Viaje> {
    const response = await api.put(`${this.baseUrl}/${id}`, data);
    return response.data as Viaje;
  }

  static async delete(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  static async deleteMany(ids: string[]): Promise<void> {
    // Para bulk delete, usamos múltiples llamadas individuales
    // ya que el backend no tiene un endpoint específico para bulk delete
    await Promise.all(ids.map(id => this.delete(id)));
  }

  static async exportSelected(ids: string[], filters?: any): Promise<Blob> {
    // Exportar solo los viajes seleccionados
    const params = new URLSearchParams();
    
    // Agregar los IDs como filtro
    params.append('ids', ids.join(','));
    
    // Agregar filtros adicionales si los hay
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const response = await api.get(`${this.baseUrl}/export?${params.toString()}`, {
      responseType: 'blob'
    });
    
    return response.data as Blob;
  }

  // Métodos para Excel
  static async processExcelFile(file: File): Promise<any> {
    // Leer el archivo Excel y extraer los datos
    const formData = new FormData();
    formData.append('file', file);
    
    // Primero necesitamos parsear el archivo para obtener los viajes
    const fileReader = new FileReader();
    return new Promise((resolve, reject) => {
      fileReader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Obtener el cliente del primer registro (asumiendo que todos son del mismo cliente)
          const primerRegistro = jsonData[0] as any;
          const clienteNombre = primerRegistro?.['Cliente *'] || primerRegistro?.['Cliente'] || primerRegistro?.cliente;
          if (!clienteNombre) {
            // Debug: mostrar las keys disponibles
            console.log('Keys disponibles en el registro:', Object.keys(primerRegistro || {}));
            console.log('Primer registro completo:', primerRegistro);
            throw new Error('No se pudo determinar el cliente. Verifique que el archivo Excel tenga la columna Cliente.');
          }
          
          console.log('Cliente encontrado en Excel:', clienteNombre);
          
          // Buscar el cliente por nombre (búsqueda más flexible)
          const clientesResponse = await ClienteService.getAll();
          const cliente = clientesResponse.data?.find((c: any) => {
            // Búsqueda exacta
            if (c.nombre === clienteNombre) return true;
            // Búsqueda sin distinción de mayúsculas/minúsculas
            if (c.nombre?.toLowerCase() === clienteNombre?.toLowerCase()) return true;
            // Búsqueda eliminando espacios extra
            if (c.nombre?.trim() === clienteNombre?.trim()) return true;
            return false;
          });
          if (!cliente) {
            // Debug: mostrar clientes disponibles
            console.log('Clientes disponibles:', clientesResponse.data?.map((c: any) => c.nombre));
            throw new Error(`Cliente "${clienteNombre}" no encontrado en el sistema`);
          }
          
          // Cargar datos de referencia para resolver IDs
          const [sitesResponse, personalResponse, vehiculosResponse] = await Promise.all([
            api.get('/sites'),
            api.get('/personal'),
            api.get('/vehiculos')
          ]);
          
          console.log('Respuesta de sitesResponse:', sitesResponse);
          console.log('Respuesta de personalResponse:', personalResponse);
          console.log('Respuesta de vehiculosResponse:', vehiculosResponse);
          
          // Las APIs tienen formatos inconsistentes:
          // Sites: {success: true, data: [...]}
          // Personal/Vehiculos: pueden ser directamente [...] o {data: [...]}
          const sites = ((sitesResponse as any).data?.data || (sitesResponse as any).data || []) as Site[];
          
          // Personal y vehiculos: manejar tanto arrays directos como objetos con data
          const personal = (Array.isArray(personalResponse) ? personalResponse : (personalResponse as any).data || []) as PersonalItem[];
          const vehiculos = (Array.isArray(vehiculosResponse) ? vehiculosResponse : (vehiculosResponse as any).data || []) as VehiculoItem[];
          
          console.log('Sites procesados:', sites.length, sites.slice(0, 2));
          console.log('Personal procesado:', personal.length, personal.slice(0, 2)); 
          console.log('Vehiculos procesados:', vehiculos.length, vehiculos.slice(0, 2));
          console.log('Cliente._id:', cliente._id);
          console.log('Cliente._id type:', typeof cliente._id);
          
          // Crear mapas de resolución
          const siteMap = await this.resolveSiteIds(sites, cliente._id);
          const personalMap = await this.resolvePersonalIds(personal);
          const vehiculoMap = await this.resolveVehiculoIds(vehiculos);
          
          console.log('Mapas creados:', {
            sites: siteMap.size,
            personal: personalMap.size,
            vehiculos: vehiculoMap.size
          });
          
          // Mapear los datos del Excel a los campos que espera el backend
          const viajesMapeados = [];
          const erroresMapeo = [];
          
          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i] as any;
            
            try {
              // Extraer valores del Excel
              const origenNombre = row['Site Origen *'] || row['Site Origen'] || row.origen;
              const destinoNombre = row['Site Destino *'] || row['Site Destino'] || row.destino;
              const choferDni = row['Chofer *'] || row['Chofer'] || row.chofer;
              const vehiculoDominio = row['Vehículo Principal *'] || row['Vehículo Principal'] || row.vehiculoPrincipal;
              const fechaValue = row['Fecha *'] || row['Fecha'] || row.fecha;
              
              // Resolver IDs
              const origenId = siteMap.get(origenNombre?.toLowerCase());
              const destinoId = siteMap.get(destinoNombre?.toLowerCase());
              
              console.log(`Buscando chofer con DNI: "${choferDni}" (tipo: ${typeof choferDni})`);
              // Convertir DNI a string para consistencia con el mapa
              const choferDniStr = String(choferDni);
              const choferId = personalMap.get(choferDniStr);
              console.log(`Chofer encontrado: ${choferId ? 'SÍ' : 'NO'} (ID: ${choferId})`);
              
              const vehiculoId = vehiculoMap.get(vehiculoDominio?.toLowerCase());
              
              // Validar que se encontraron los IDs
              if (!origenId) {
                throw new Error(`Site origen "${origenNombre}" no encontrado`);
              }
              if (!destinoId) {
                throw new Error(`Site destino "${destinoNombre}" no encontrado`);
              }
              if (!choferId) {
                throw new Error(`Chofer con DNI "${choferDniStr}" no encontrado`);
              }
              if (!vehiculoId) {
                throw new Error(`Vehículo con dominio "${vehiculoDominio}" no encontrado`);
              }
              
              // Validar que choferId es un ObjectId válido (no un número)
              if (typeof choferId !== 'string' || choferId.length !== 24) {
                throw new Error(`ID de chofer inválido: "${choferId}" (DNI: ${choferDniStr})`);
              }
              
              // Validar que vehiculoId es un ObjectId válido (no un número)
              if (typeof vehiculoId !== 'string' || vehiculoId.length !== 24) {
                throw new Error(`ID de vehículo inválido: "${vehiculoId}" (dominio: ${vehiculoDominio})`);
              }
              
              // Crear el viaje mapeado
              const viajeData = {
                cliente: cliente._id,
                origen: origenId,
                destino: destinoId,
                tipoTramo: row['Tipo Tramo'] || row.tipoTramo || undefined,
                fecha: this.parseExcelDate(fechaValue),
                chofer: choferId,
                vehiculos: [{ vehiculo: vehiculoId, posicion: 1 }], // Formato esperado por el backend
                dt: row['DT *'] || row['DT'] || row.dt,
                paletas: parseInt(row['Paletas'] || row.paletas || '0'),
                estado: row['Estado'] || row.estado || 'Pendiente',
                observaciones: row['Observaciones'] || row.observaciones || ''
              };
              
              console.log(`Viaje ${i + 1} mapeado:`, viajeData);
              
              viajesMapeados.push(viajeData);
              
            } catch (error: any) {
              erroresMapeo.push({
                fila: i + 1,
                error: error.message
              });
            }
          }
          
          console.log('Viajes mapeados:', viajesMapeados);
          console.log('Errores de mapeo:', erroresMapeo);
          
          // Verificar que todos los viajes tengan datos válidos
          for (let i = 0; i < viajesMapeados.length; i++) {
            const viaje = viajesMapeados[i];
            console.log(`Verificando viaje ${i + 1}:`, {
              chofer: viaje.chofer,
              choferType: typeof viaje.chofer,
              vehiculos: viaje.vehiculos,
              cliente: viaje.cliente,
              origen: viaje.origen,
              destino: viaje.destino
            });
            
            // Validar que el chofer sea un ObjectId válido
            if (typeof viaje.chofer !== 'string' || viaje.chofer.length !== 24) {
              throw new Error(`Viaje ${i + 1} tiene chofer inválido: ${viaje.chofer} (tipo: ${typeof viaje.chofer})`);
            }
          }
          
          // Si hay errores de mapeo, aún así enviar al backend para registrar los datos faltantes
          console.log('Enviando datos al backend incluso con errores de mapeo para registrar faltantes');
          
          // Preparar los datos para el bulk import
          const bulkData = {
            cliente: cliente._id,
            viajes: viajesMapeados,
            // Incluir información sobre los errores para que el backend pueda registrarlos
            erroresMapeo: erroresMapeo,
            sitesNoEncontrados: Array.from(new Set(erroresMapeo
              .filter(e => e.error.includes('origen') || e.error.includes('destino'))
              .map(e => {
                const match = e.error.match(/Site (?:origen|destino) "([^"]+)" no encontrado/);
                return match ? match[1] : null;
              })
              .filter(Boolean))),
            totalFilasConErrores: erroresMapeo.length
          };
          
          // Llamar al endpoint bulk con timeout extendido
          console.log('Enviando datos al endpoint bulk:', bulkData);
          const response = await api.post(`${this.baseUrl}/bulk/iniciar`, bulkData, {
            timeout: 60000 // 60 segundos para importaciones masivas
          });
          console.log('Respuesta del servidor:', response.data);
          
          // Debug: mostrar errores detallados si hay fallos
          if ((response.data as any).failCount > 0) {
            console.error('Errores detallados del backend:', (response.data as any).erroresDetallados);
            (response.data as any).erroresDetallados?.forEach((error: any, index: number) => {
              console.error(`Error ${index + 1}:`, JSON.stringify(error, null, 2));
            });
          }
          
          // Transformar la respuesta al formato esperado por el modal
          const responseData = response.data as any;
          const totalRows = jsonData.length;
          const insertedRows = responseData.successCount || 0;
          const errorRowsMapeo = erroresMapeo.length;
          const errorRowsBackend = responseData.failCount || 0;
          const totalErrorRows = errorRowsMapeo + errorRowsBackend;
          
          // Combinar errores de mapeo y errores del backend para detectar tipos de datos faltantes
          const todosLosErrores = [
            ...erroresMapeo,
            ...(responseData.erroresDetallados || [])
          ];
          
          const transformedResponse = {
            success: true,
            importId: responseData.importacionId,
            summary: {
              totalRows: totalRows,
              insertedRows: insertedRows,
              errorRows: totalErrorRows,
              successRate: totalRows > 0 ? Math.round((insertedRows / totalRows) * 100) : 0
            },
            data: responseData,
            // Información sobre datos faltantes para mostrar el botón de descarga
            hasMissingData: totalErrorRows > 0,
            missingDataTypes: {
              sites: todosLosErrores.some((e: any) => e.error?.includes('origen') || e.error?.includes('destino')),
              personal: todosLosErrores.some((e: any) => e.error?.includes('chofer') || e.error?.includes('personal')),
              vehiculos: todosLosErrores.some((e: any) => e.error?.includes('vehiculo')),
              tramos: todosLosErrores.some((e: any) => e.error?.includes('tramo') || e.error?.includes('tarifa'))
            }
          };
          
          console.log('Respuesta transformada:', transformedResponse);
          resolve(transformedResponse);
        } catch (error: any) {
          console.error('Error en processExcelFile:', error);
          console.error('Error detallado:', error.response?.data || error.message);
          reject(error);
        }
      };
      fileReader.readAsArrayBuffer(file);
    });
  }

  static async validateExcelFile(file: File): Promise<any> {
    // Leer el archivo y validar los datos sin procesar
    const fileReader = new FileReader();
    return new Promise((resolve, reject) => {
      fileReader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          console.log('Datos del archivo Excel:', jsonData);
          console.log('Número de filas:', jsonData.length);
          
          // Validar estructura básica
          const validRows = [];
          const invalidRows = [];
          const warnings = [];
          
          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i] as any;
            const rowErrors = [];
            
            // Validaciones básicas
            if (!row['Cliente *'] && !row['Cliente'] && !row.cliente) {
              rowErrors.push('Falta campo Cliente');
            }
            if (!row['Site Origen *'] && !row['Site Origen'] && !row.origen) {
              rowErrors.push('Falta campo Site Origen');
            }
            if (!row['Site Destino *'] && !row['Site Destino'] && !row.destino) {
              rowErrors.push('Falta campo Site Destino');
            }
            if (!row['Fecha *'] && !row['Fecha'] && !row.fecha) {
              rowErrors.push('Falta campo Fecha');
            }
            if (!row['Chofer *'] && !row['Chofer'] && !row.chofer) {
              rowErrors.push('Falta campo Chofer');
            }
            if (!row['Vehículo Principal *'] && !row['Vehículo Principal'] && !row.vehiculoPrincipal) {
              rowErrors.push('Falta campo Vehículo Principal');
            }
            if (!row['DT *'] && !row['DT'] && !row.dt) {
              rowErrors.push('Falta campo DT');
            }
            
            if (rowErrors.length > 0) {
              invalidRows.push({
                rowIndex: i + 1,
                data: row,
                errors: rowErrors
              });
            } else {
              validRows.push({
                rowIndex: i + 1,
                data: row
              });
            }
          }
          
          // Formato esperado por ExcelImportModal
          const result = {
            processedData: {
              data: jsonData,
              preview: jsonData.slice(0, 10),
              headers: Object.keys(jsonData[0] || {})
            },
            validationResult: {
              isValid: invalidRows.length === 0,
              summary: {
                validRows: validRows.length,
                errorRows: invalidRows.length,
                warningRows: warnings.length,
                totalRows: jsonData.length
              },
              errors: invalidRows.map(row => ({
                row: row.rowIndex,
                column: 'Multiple',
                message: row.errors.join(', '),
                severity: 'error',
                data: row.data
              }))
            }
          };
          
          console.log('Resultado de validación:', result);
          resolve(result);
        } catch (error) {
          console.error('Error validando archivo:', error);
          reject(error);
        }
      };
      fileReader.readAsArrayBuffer(file);
    });
  }

  static async previewExcelFile(file: File, sampleSize = 5): Promise<any> {
    // Leer el archivo y devolver una vista previa
    const fileReader = new FileReader();
    return new Promise((resolve, reject) => {
      fileReader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          console.log('Preview - Datos del archivo:', jsonData);
          console.log('Preview - Número total de filas:', jsonData.length);
          
          // Obtener headers
          const headers = Object.keys(jsonData[0] || {});
          
          // Tomar solo los primeros registros para preview
          const preview = jsonData.slice(0, sampleSize);
          
          resolve({
            headers,
            preview,
            totalRows: jsonData.length,
            data: jsonData,
            samples: [{
              sample: preview, // Los datos de muestra para ExcelDataPreview
              sampleSize: sampleSize
            }]
          });
        } catch (error) {
          console.error('Error en preview:', error);
          reject(error);
        }
      };
      fileReader.readAsArrayBuffer(file);
    });
  }

  // Método para descargar plantillas de corrección con datos faltantes
  static async downloadMissingDataTemplates(importId: string): Promise<Blob> {
    console.log('Llamando API para descargar plantillas:', `${this.baseUrl}/bulk/template/${importId}`);
    
    try {
      console.log('Usando servicio API con autenticación por cookies...');
      
      // Usar fetch con las mismas opciones que el servicio API
      const response = await fetch(`http://localhost:3001/api${this.baseUrl}/bulk/template/${importId}`, {
        method: 'GET',
        credentials: 'include', // Incluir cookies para autenticación
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Type': 'application/json'
        }
      });

      console.log('Respuesta del fetch:', response);
      console.log('Status:', response.status);
      console.log('Content-Type:', response.headers.get('content-type'));

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
      }

      // Crear blob directamente desde la respuesta
      const blob = await response.blob();
      
      console.log('Blob creado:', blob);
      console.log('Tamaño del blob:', blob.size);
      console.log('Tipo del blob:', blob.type);
      
      // Validar que el blob tiene contenido
      if (blob.size === 0) {
        throw new Error('El archivo descargado está vacío');
      }
      
      return blob;
      
    } catch (error: any) {
      console.error('Error en downloadMissingDataTemplates:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Token de autenticación inválido o expirado');
      }
      
      throw new Error(`Error al descargar plantillas: ${error.message}`);
    }
  }

  // Método para cargar plantillas de corrección completadas
  static async uploadCorrectionTemplate(importId: string, file: File): Promise<any> {
    console.log('Cargando plantilla de corrección:', `${this.baseUrl}/bulk/process-correction/${importId}`);
    
    try {
      const formData = new FormData();
      formData.append('correctionFile', file);

      const response = await fetch(`http://localhost:3001/api${this.baseUrl}/bulk/process-correction/${importId}`, {
        method: 'POST',
        credentials: 'include', // Incluir cookies para autenticación
        body: formData
      });

      console.log('Respuesta del upload:', response);
      console.log('Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al procesar la plantilla de corrección');
      }

      const result = await response.json();
      console.log('Resultado del procesamiento:', result);
      
      return result.data;
      
    } catch (error: any) {
      console.error('Error en uploadCorrectionTemplate:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Token de autenticación inválido o expirado');
      }
      
      throw new Error(`Error al cargar plantilla: ${error.message}`);
    }
  }
}