import * as XLSX from 'xlsx';
import { WorkSheet, WorkBook } from 'xlsx';
import { CUIT_OPTIONAL_HYPHEN_REGEX, EMAIL_REGEX } from '../../utils/excel/validationHelpers';

export interface EmpresaTemplateData {
  nombre: string;
  tipo: 'Propia' | 'Subcontratada';
  razonSocial?: string;
  direccion?: string;
  telefono?: string;
  mail?: string;
  cuit?: string;
  contactoPrincipal?: string;
  activa?: boolean;
  observaciones?: string;
  [key: string]: unknown;
}

interface ExcelRowData {
  [key: string]: unknown;
}

export class EmpresaTemplate {
  private static REQUIRED_MARKER = '(*)';
  private static DATA_VALIDATION_KEY = '!dataValidation';
  private static ROW_PREFIX = 'Fila';

  private static HEADERS = [
    `Nombre ${this.REQUIRED_MARKER}`,
    `Tipo ${this.REQUIRED_MARKER}`,
    'Razón Social',
    'Dirección',
    'Teléfono',
    'Email',
    'CUIT',
    'Contacto Principal',
    'Activa',
    'Observaciones',
  ];

  private static SAMPLE_DATA: Partial<EmpresaTemplateData>[] = [
    {
      nombre: 'Transportes del Norte',
      tipo: 'Propia',
      razonSocial: 'Transportes del Norte S.A.',
      direccion: 'Av. San Martín 1234, CABA',
      telefono: '+54 11 1234-5678',
      mail: 'contacto@transportesnorte.com.ar',
      cuit: '30-12345678-9',
      contactoPrincipal: 'Juan Pérez',
      activa: true,
      observaciones: 'Empresa principal',
    },
    {
      nombre: 'Logística Sur',
      tipo: 'Subcontratada',
      razonSocial: 'Logística Sur S.R.L.',
      direccion: 'Ruta 9 Km 45, Buenos Aires',
      telefono: '+54 11 8765-4321',
      mail: 'info@logisticasur.com.ar',
      cuit: '30-87654321-0',
      contactoPrincipal: 'María González',
      activa: true,
      observaciones: 'Subcontratista de confianza',
    },
  ];

  /**
   * Mapea una fila de datos a array para Excel
   */
  private static mapRowToArray(row: Partial<EmpresaTemplateData>): string[] {
    const activaValue = this.getActivaDisplayValue(row.activa);

    return [
      row.nombre || '',
      row.tipo || '',
      row.razonSocial || '',
      row.direccion || '',
      row.telefono || '',
      row.mail || '',
      row.cuit || '',
      row.contactoPrincipal || '',
      activaValue,
      row.observaciones || '',
    ];
  }

  /**
   * Convierte valor booleano activa a string para display
   */
  private static getActivaDisplayValue(activa?: boolean): string {
    if (activa === undefined) {
      return 'Sí';
    }

    return activa ? 'Sí' : 'No';
  }

  /**
   * Valida campos básicos de una fila
   */
  private static validateRowFields(row: ExcelRowData, rowNum: number): string[] {
    const errors: string[] = [];
    const nombre = row[`Nombre ${this.REQUIRED_MARKER}`]?.toString()?.trim();
    const tipo = row[`Tipo ${this.REQUIRED_MARKER}`]?.toString()?.trim();

    if (!nombre) {
      errors.push(`${this.ROW_PREFIX} ${rowNum}: El nombre es obligatorio`);
    }

    if (!tipo) {
      errors.push(`${this.ROW_PREFIX} ${rowNum}: El tipo es obligatorio`);
    } else if (tipo !== 'Propia' && tipo !== 'Subcontratada') {
      errors.push(`${this.ROW_PREFIX} ${rowNum}: El tipo debe ser "Propia" o "Subcontratada"`);
    }

    return errors;
  }

  /**
   * Valida formato de email
   */
  private static validateEmail(email: string, rowNum: number): string | null {
    if (email) {
      const normalizedEmail = email.trim();
      if (normalizedEmail && !EMAIL_REGEX.test(normalizedEmail)) {
        return `${this.ROW_PREFIX} ${rowNum}: Email con formato inválido`;
      }
    }
    return null;
  }

  /**
   * Valida formato de CUIT
   */
  private static validateCUIT(cuit: string, rowNum: number): string | null {
    if (cuit) {
      const normalizedCuit = cuit.trim();
      if (normalizedCuit && !CUIT_OPTIONAL_HYPHEN_REGEX.test(normalizedCuit)) {
        return `${this.ROW_PREFIX} ${rowNum}: CUIT con formato inválido`;
      }
    }
    return null;
  }

  /**
   * Extrae los datos básicos de una fila de Excel
   */
  private static extractRowData(row: ExcelRowData) {
    return {
      nombre: row[`Nombre ${this.REQUIRED_MARKER}`]?.toString()?.trim() || '',
      tipo: row[`Tipo ${this.REQUIRED_MARKER}`]?.toString()?.trim() || '',
      razonSocial: row['Razón Social']?.toString()?.trim(),
      direccion: row['Dirección']?.toString()?.trim(),
      telefono: row['Teléfono']?.toString()?.trim(),
      mail: row['Email']?.toString()?.trim(),
      cuit: row['CUIT']?.toString()?.trim(),
      contactoPrincipal: row['Contacto Principal']?.toString()?.trim(),
      activa: row['Activa']?.toString()?.trim(),
      observaciones: row['Observaciones']?.toString()?.trim(),
    };
  }

  /**
   * Procesa una fila válida y crea el objeto EmpresaTemplateData
   */
  private static processValidRow(row: ExcelRowData): EmpresaTemplateData {
    const data = this.extractRowData(row);

    // Validar activa
    const activaValue = data.activa && data.activa.toLowerCase() === 'no' ? false : true;

    const empresaData: EmpresaTemplateData = {
      nombre: data.nombre,
      tipo: data.tipo as 'Propia' | 'Subcontratada',
      activa: activaValue,
    };

    // Agregar campos opcionales si están presentes
    if (data.razonSocial) empresaData.razonSocial = data.razonSocial;
    if (data.direccion) empresaData.direccion = data.direccion;
    if (data.telefono) empresaData.telefono = data.telefono;
    if (data.mail) empresaData.mail = data.mail;
    if (data.cuit) empresaData.cuit = data.cuit;
    if (data.contactoPrincipal) empresaData.contactoPrincipal = data.contactoPrincipal;
    if (data.observaciones) empresaData.observaciones = data.observaciones;

    return empresaData;
  }

  /**
   * Procesa una sola fila durante la validación
   */
  private static processRowValidation(
    row: ExcelRowData,
    index: number,
    nombresVistos: Set<string>
  ): { success: boolean; empresa?: EmpresaTemplateData; errors: string[] } {
    const rowNum = index + 2;
    const data = this.extractRowData(row);

    // Validar campos básicos
    const fieldErrors = this.validateRowFields(row, rowNum);
    if (fieldErrors.length > 0) {
      return { success: false, errors: fieldErrors };
    }

    // Validar duplicados
    if (nombresVistos.has(data.nombre.toLowerCase())) {
      return {
        success: false,
        errors: [`${this.ROW_PREFIX} ${rowNum}: Nombre duplicado en el archivo`],
      };
    }
    nombresVistos.add(data.nombre.toLowerCase());

    // Validar email y CUIT
    const validationError = this.validateEmailAndCuit(data, rowNum);
    if (validationError) {
      return { success: false, errors: [validationError] };
    }

    // Validar campo activa
    const activaError = this.validateActivaField(data.activa, rowNum);
    if (activaError) {
      return { success: false, errors: [activaError] };
    }

    const empresa = this.processValidRow(row);
    return { success: true, empresa, errors: [] };
  }

  /**
   * Valida email y CUIT si están presentes
   */
  private static validateEmailAndCuit(
    data: { mail?: string; cuit?: string },
    rowNum: number
  ): string | null {
    if (data.mail) {
      const emailError = this.validateEmail(data.mail, rowNum);
      if (emailError) return emailError;
    }

    if (data.cuit) {
      const cuitError = this.validateCUIT(data.cuit, rowNum);
      if (cuitError) return cuitError;
    }

    return null;
  }

  /**
   * Valida campo activa
   */
  private static validateActivaField(activa: string | undefined, rowNum: number): string | null {
    if (
      activa &&
      activa.toLowerCase() !== 'sí' &&
      activa.toLowerCase() !== 'si' &&
      activa.toLowerCase() !== 'no'
    ) {
      return `${this.ROW_PREFIX} ${rowNum}: El campo Activa debe ser "Sí" o "No"`;
    }
    return null;
  }

  /**
   * Genera una plantilla Excel para carga masiva de empresas
   */
  static generateTemplate(): WorkBook {
    const wb = XLSX.utils.book_new();

    // Hoja principal con plantilla
    const wsData = [this.HEADERS, ...this.SAMPLE_DATA.map((row) => this.mapRowToArray(row))];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Configurar ancho de columnas
    ws['!cols'] = [
      { wch: 25 }, // Nombre
      { wch: 15 }, // Tipo
      { wch: 30 }, // Razón Social
      { wch: 35 }, // Dirección
      { wch: 18 }, // Teléfono
      { wch: 30 }, // Email
      { wch: 15 }, // CUIT
      { wch: 25 }, // Contacto Principal
      { wch: 10 }, // Activa
      { wch: 40 }, // Observaciones
    ];

    // Agregar validaciones de datos
    if (!ws[this.DATA_VALIDATION_KEY]) ws[this.DATA_VALIDATION_KEY] = [];

    // Validación para Tipo
    ws[this.DATA_VALIDATION_KEY].push({
      sqref: 'B2:B1000',
      type: 'list',
      formula1: '"Propia,Subcontratada"',
    });

    // Validación para Activa
    ws[this.DATA_VALIDATION_KEY].push({
      sqref: 'I2:I1000',
      type: 'list',
      formula1: '"Sí,No"',
    });

    XLSX.utils.book_append_sheet(wb, ws, 'Empresas');

    // Hoja de instrucciones
    const instructionsWs = this.createInstructionsSheet();
    XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instrucciones');

    return wb;
  }

  /**
   * Crea hoja de instrucciones
   */
  private static createInstructionsSheet(): WorkSheet {
    const instructions = [
      ['PLANTILLA PARA CARGA MASIVA DE EMPRESAS'],
      [''],
      ['INSTRUCCIONES DE USO:'],
      [''],
      ['1. Complete la información en la hoja "Empresas"'],
      ['2. Los campos marcados con (*) son obligatorios'],
      ['3. Formatos requeridos:'],
      ['   - Nombre: Texto único (máximo 100 caracteres)'],
      ['   - Tipo: Seleccione "Propia" o "Subcontratada"'],
      ['   - Email: Formato válido de correo electrónico'],
      ['   - CUIT: Formato XX-XXXXXXXX-X (opcional)'],
      ['   - Teléfono: Formato libre con código de área'],
      ['   - Activa: Seleccione "Sí" o "No"'],
      [''],
      ['TIPOS DE EMPRESA:'],
      [''],
      ['- Propia: Empresa del grupo, con flota y personal propios'],
      ['- Subcontratada: Empresa externa que brinda servicios'],
      [''],
      ['VALIDACIONES:'],
      [''],
      ['- El nombre debe ser único en el sistema'],
      ['- El email debe tener formato válido si se proporciona'],
      ['- El CUIT debe tener formato argentino válido si se proporciona'],
      ['- No pueden existir nombres duplicados en el archivo'],
      [''],
      ['NOTAS IMPORTANTES:'],
      [''],
      ['- Elimine las filas de ejemplo antes de cargar'],
      ['- El sistema validará duplicados con datos existentes'],
      ['- Las empresas se crearán como activas por defecto'],
      ['- Para empresas propias, asegúrese de tener toda la documentación'],
      ['- Para subcontratadas, verifique datos de contacto'],
      [''],
      ['CAMPOS OBLIGATORIOS (*)'],
      ['- Nombre: Denominación comercial de la empresa'],
      ['- Tipo: Clasificación de la empresa (Propia/Subcontratada)'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(instructions);

    // Configurar formato
    ws['!cols'] = [{ wch: 70 }];

    return ws;
  }

  /**
   * Valida datos de empresa desde Excel
   */
  static validateData(data: ExcelRowData[]): { valid: EmpresaTemplateData[]; errors: string[] } {
    const valid: EmpresaTemplateData[] = [];
    const errors: string[] = [];
    const nombresVistos = new Set<string>();

    data.forEach((row, index) => {
      const result = this.processRowValidation(row, index, nombresVistos);

      if (result.success && result.empresa) {
        valid.push(result.empresa);
      } else {
        errors.push(...result.errors);
      }
    });

    return { valid, errors };
  }

  /**
   * Genera archivo Excel para descarga
   */
  static downloadTemplate(filename = 'plantilla_empresas.xlsx'): void {
    const wb = this.generateTemplate();
    XLSX.writeFile(wb, filename);
  }
}

export default EmpresaTemplate;
