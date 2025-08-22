import * as XLSX from 'xlsx';
import { WorkSheet, WorkBook } from 'xlsx';
import { apiService } from '../../services/api';

// Interfaces para tipos de respuesta de la API
interface ApiClienteResponse {
  _id: string;
  nombre: string;
  cuit: string;
  activo: boolean;
}

interface ApiEmpresaResponse {
  _id: string;
  nombre: string;
  tipo: string;
  activa: boolean;
}

interface ApiPersonalResponse {
  _id: string;
  nombre: string;
  apellido: string;
  tipo: string;
  empresa?: { nombre: string };
}

export interface ReferenceData {
  clientes: { id: string; nombre: string; cuit: string; activo: boolean }[];
  empresas: { id: string; nombre: string; tipo: string; activa: boolean }[];
  personal: { id: string; nombre: string; apellido: string; tipo: string; empresa: string }[];
}

export class ReferenceDataSheets {
  /**
   * Obtiene datos de referencia desde la API
   */
  static async fetchReferenceData(): Promise<ReferenceData> {
    try {
      const [clientesRes, empresasRes, personalRes] = await Promise.all([
        apiService.get('/clientes'),
        apiService.get('/empresas'),
        apiService.get('/personal'),
      ]);

      return {
        clientes: (clientesRes.data as ApiClienteResponse[]).map((c: ApiClienteResponse) => ({
          id: c._id,
          nombre: c.nombre,
          cuit: c.cuit,
          activo: c.activo,
        })),
        empresas: (empresasRes.data as ApiEmpresaResponse[]).map((e: ApiEmpresaResponse) => ({
          id: e._id,
          nombre: e.nombre,
          tipo: e.tipo,
          activa: e.activa,
        })),
        personal: (personalRes.data as ApiPersonalResponse[]).map((p: ApiPersonalResponse) => ({
          id: p._id,
          nombre: p.nombre,
          apellido: p.apellido,
          tipo: p.tipo,
          empresa: p.empresa?.nombre || 'Sin empresa',
        })),
      };
    } catch (error) {
      console.error('Error fetching reference data:', error);
      throw new Error('No se pudieron obtener los datos de referencia');
    }
  }

  /**
   * Crea hoja de referencia de clientes
   */
  static createClientesReferenceSheet(clientes: ReferenceData['clientes']): WorkSheet {
    const headers = ['ID', 'Nombre', 'CUIT', 'Estado'];
    const data = [
      headers,
      ...clientes.map((cliente) => [
        cliente.id,
        cliente.nombre,
        cliente.cuit,
        cliente.activo ? 'Activo' : 'Inactivo',
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Configurar anchos de columna
    ws['!cols'] = [
      { wch: 25 }, // ID
      { wch: 40 }, // Nombre
      { wch: 15 }, // CUIT
      { wch: 10 }, // Estado
    ];

    // Aplicar estilos a headers
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'E3F2FD' } },
        };
      }
    }

    return ws;
  }

  /**
   * Crea hoja de referencia de empresas
   */
  static createEmpresasReferenceSheet(empresas: ReferenceData['empresas']): WorkSheet {
    const headers = ['ID', 'Nombre', 'Tipo', 'Estado'];
    const data = [
      headers,
      ...empresas.map((empresa) => [
        empresa.id,
        empresa.nombre,
        empresa.tipo,
        empresa.activa ? 'Activa' : 'Inactiva',
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Configurar anchos de columna
    ws['!cols'] = [
      { wch: 25 }, // ID
      { wch: 35 }, // Nombre
      { wch: 15 }, // Tipo
      { wch: 10 }, // Estado
    ];

    // Aplicar estilos a headers
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'E8F5E8' } },
        };
      }
    }

    return ws;
  }

  /**
   * Crea hoja de referencia de personal
   */
  static createPersonalReferenceSheet(personal: ReferenceData['personal']): WorkSheet {
    const headers = ['ID', 'Nombre', 'Apellido', 'Tipo', 'Empresa'];
    const data = [headers, ...personal.map((p) => [p.id, p.nombre, p.apellido, p.tipo, p.empresa])];

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Configurar anchos de columna
    ws['!cols'] = [
      { wch: 25 }, // ID
      { wch: 20 }, // Nombre
      { wch: 20 }, // Apellido
      { wch: 15 }, // Tipo
      { wch: 30 }, // Empresa
    ];

    // Aplicar estilos a headers
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'FFF3E0' } },
        };
      }
    }

    return ws;
  }

  /**
   * Crea hoja de referencia para tipos y categorías
   */
  static createTypesReferenceSheet(): WorkSheet {
    const data = [
      ['TIPOS DE PERSONAL', '', 'TIPOS DE EMPRESA', '', 'CATEGORÍAS LICENCIA'],
      ['Conductor', '', 'Propia', '', 'A1'],
      ['Administrativo', '', 'Subcontratada', '', 'A2'],
      ['Mecánico', '', '', '', 'A3'],
      ['Supervisor', '', '', '', 'B1'],
      ['Otro', '', '', '', 'B2'],
      ['', '', '', '', 'C1'],
      ['', '', '', '', 'C2'],
      ['', '', '', '', 'C3'],
      ['', '', '', '', 'D1'],
      ['', '', '', '', 'D2'],
      ['', '', '', '', 'D3'],
      ['', '', '', '', 'D4'],
      ['', '', '', '', 'E1'],
      ['', '', '', '', 'E2'],
      ['', '', '', '', 'E3'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Configurar anchos de columna
    ws['!cols'] = [
      { wch: 20 }, // Tipos Personal
      { wch: 2 }, // Separador
      { wch: 20 }, // Tipos Empresa
      { wch: 2 }, // Separador
      { wch: 20 }, // Categorías Licencia
    ];

    // Aplicar estilos a headers
    for (let col = 0; col < 5; col += 2) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'F3E5F5' } },
        };
      }
    }

    return ws;
  }

  /**
   * Crea hoja de datos para validaciones
   */
  static createValidationDataSheet(): WorkSheet {
    const data = [
      ['DATOS PARA VALIDACIONES'],
      [''],
      ['Formatos válidos:'],
      [''],
      ['DNI: 12345678 (7-8 dígitos)'],
      ['CUIL: 20-12345678-9'],
      ['CUIT: 30-12345678-9'],
      ['Email: usuario@dominio.com'],
      ['Teléfono: +54 11 1234-5678'],
      ['Fecha: DD/MM/AAAA'],
      [''],
      ['Estados válidos:'],
      [''],
      ['Activo/Activa: Sí, No'],
      [''],
      ['Provincias argentinas comunes:'],
      ['Buenos Aires'],
      ['Ciudad Autónoma de Buenos Aires'],
      ['Córdoba'],
      ['Santa Fe'],
      ['Mendoza'],
      ['Tucumán'],
      ['Entre Ríos'],
      ['Salta'],
      ['Chaco'],
      ['Corrientes'],
      ['Misiones'],
      ['Santiago del Estero'],
      ['San Juan'],
      ['Jujuy'],
      ['Río Negro'],
      ['Formosa'],
      ['Neuquén'],
      ['Chubut'],
      ['San Luis'],
      ['Catamarca'],
      ['La Rioja'],
      ['La Pampa'],
      ['Santa Cruz'],
      ['Tierra del Fuego'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Configurar anchos de columna
    ws['!cols'] = [{ wch: 50 }];

    // Aplicar estilos al título
    if (ws['A1']) {
      ws['A1'].s = {
        font: { bold: true, size: 14 },
        fill: { fgColor: { rgb: 'E1F5FE' } },
      };
    }

    return ws;
  }

  /**
   * Genera libro Excel completo con todas las hojas de referencia
   */
  static async generateReferenceWorkbook(): Promise<WorkBook> {
    const wb = XLSX.utils.book_new();

    try {
      // Obtener datos de la API
      const referenceData = await this.fetchReferenceData();

      // Agregar hojas de referencia con datos reales
      const clientesWs = this.createClientesReferenceSheet(referenceData.clientes);
      XLSX.utils.book_append_sheet(wb, clientesWs, 'Ref_Clientes');

      const empresasWs = this.createEmpresasReferenceSheet(referenceData.empresas);
      XLSX.utils.book_append_sheet(wb, empresasWs, 'Ref_Empresas');

      const personalWs = this.createPersonalReferenceSheet(referenceData.personal);
      XLSX.utils.book_append_sheet(wb, personalWs, 'Ref_Personal');
    } catch (error) {
      console.warn('No se pudieron obtener datos reales, usando datos de ejemplo');

      // Constante para evitar duplicación de string literal
      const EMPRESA_PROPIA_EJEMPLO = 'Empresa Propia';

      // Si falla la API, crear hojas con datos de ejemplo
      const clientesEjemplo = [
        { id: 'ejemplo1', nombre: 'Cliente Ejemplo 1', cuit: '30-12345678-9', activo: true },
        { id: 'ejemplo2', nombre: 'Cliente Ejemplo 2', cuit: '20-87654321-0', activo: true },
      ];

      const empresasEjemplo = [
        { id: 'ejemplo1', nombre: EMPRESA_PROPIA_EJEMPLO, tipo: 'Propia', activa: true },
        { id: 'ejemplo2', nombre: 'Empresa Subcontratada', tipo: 'Subcontratada', activa: true },
      ];

      const personalEjemplo = [
        {
          id: 'ejemplo1',
          nombre: 'Juan',
          apellido: 'Pérez',
          tipo: 'Conductor',
          empresa: EMPRESA_PROPIA_EJEMPLO,
        },
        {
          id: 'ejemplo2',
          nombre: 'María',
          apellido: 'González',
          tipo: 'Administrativo',
          empresa: EMPRESA_PROPIA_EJEMPLO,
        },
      ];

      const clientesWs = this.createClientesReferenceSheet(clientesEjemplo);
      XLSX.utils.book_append_sheet(wb, clientesWs, 'Ref_Clientes');

      const empresasWs = this.createEmpresasReferenceSheet(empresasEjemplo);
      XLSX.utils.book_append_sheet(wb, empresasWs, 'Ref_Empresas');

      const personalWs = this.createPersonalReferenceSheet(personalEjemplo);
      XLSX.utils.book_append_sheet(wb, personalWs, 'Ref_Personal');
    }

    // Agregar hojas auxiliares
    const typesWs = this.createTypesReferenceSheet();
    XLSX.utils.book_append_sheet(wb, typesWs, 'Ref_Tipos');

    const validationWs = this.createValidationDataSheet();
    XLSX.utils.book_append_sheet(wb, validationWs, 'Ref_Validaciones');

    // Hoja de información general
    const infoWs = this.createInfoSheet();
    XLSX.utils.book_append_sheet(wb, infoWs, 'Info_General');

    return wb;
  }

  /**
   * Crea hoja de información general
   */
  private static createInfoSheet(): WorkSheet {
    const data = [
      ['SISTEMA DE GESTIÓN DE TRANSPORTE'],
      ['Hojas de Referencia para Importación Excel'],
      [''],
      ['DESCRIPCIÓN DE HOJAS:'],
      [''],
      ['Ref_Clientes: Lista de clientes existentes en el sistema'],
      ['Ref_Empresas: Lista de empresas disponibles'],
      ['Ref_Personal: Personal registrado por empresa'],
      ['Ref_Tipos: Tipos y categorías válidas para formularios'],
      ['Ref_Validaciones: Formatos y datos válidos'],
      [''],
      ['USO DE ESTAS HOJAS:'],
      [''],
      ['1. Consulte estas hojas antes de llenar plantillas de importación'],
      ['2. Use los IDs exactos que aparecen en estas hojas'],
      ['3. Verifique que los datos no estén duplicados'],
      ['4. Respete los formatos indicados en Ref_Validaciones'],
      [''],
      ['NOTAS IMPORTANTES:'],
      [''],
      ['- Los datos mostrados son los actuales del sistema'],
      ['- Actualice estas hojas si hay cambios en el sistema'],
      ['- Para importaciones, use los nombres exactos como aparecen aquí'],
      ['- Los IDs son únicos y no deben modificarse'],
      [''],
      ['Generado el: ' + new Date().toLocaleString('es-AR')],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Configurar anchos de columna
    ws['!cols'] = [{ wch: 70 }];

    // Aplicar estilos al título
    if (ws['A1']) {
      ws['A1'].s = {
        font: { bold: true, size: 16 },
        fill: { fgColor: { rgb: 'BBDEFB' } },
      };
    }

    if (ws['A2']) {
      ws['A2'].s = {
        font: { bold: true, size: 12 },
        fill: { fgColor: { rgb: 'E3F2FD' } },
      };
    }

    return ws;
  }

  /**
   * Descarga archivo Excel con hojas de referencia
   */
  static async downloadReferenceFile(filename = 'referencias_sistema.xlsx'): Promise<void> {
    try {
      const wb = await this.generateReferenceWorkbook();
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error generating reference file:', error);
      throw new Error('No se pudo generar el archivo de referencias');
    }
  }

  /**
   * Obtiene lista simplificada de empresas para otros templates
   */
  static async getEmpresasForTemplate(): Promise<{ id: string; nombre: string }[]> {
    try {
      const response = await apiService.get('/empresas');
      return (response.data as ApiEmpresaResponse[]).map((e: ApiEmpresaResponse) => ({
        id: e._id,
        nombre: e.nombre,
      }));
    } catch (error) {
      console.warn('Could not fetch empresas, using empty list');
      return [];
    }
  }

  /**
   * Obtiene lista simplificada de clientes para otros templates
   */
  static async getClientesForTemplate(): Promise<{ id: string; nombre: string }[]> {
    try {
      const response = await apiService.get('/clientes');
      return (response.data as ApiClienteResponse[]).map((c: ApiClienteResponse) => ({
        id: c._id,
        nombre: c.nombre,
      }));
    } catch (error) {
      console.warn('Could not fetch clientes, using empty list');
      return [];
    }
  }
}

export default ReferenceDataSheets;
