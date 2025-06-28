import * as XLSX from 'xlsx';
import { WorkSheet, WorkBook } from 'xlsx';

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
}

export class EmpresaTemplate {
  private static HEADERS = [
    'Nombre (*)',
    'Tipo (*)',
    'Razón Social',
    'Dirección',
    'Teléfono',
    'Email',
    'CUIT',
    'Contacto Principal',
    'Activa',
    'Observaciones'
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
      observaciones: 'Empresa principal'
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
      observaciones: 'Subcontratista de confianza'
    }
  ];

  /**
   * Genera una plantilla Excel para carga masiva de empresas
   */
  static generateTemplate(): WorkBook {
    const wb = XLSX.utils.book_new();
    
    // Hoja principal con plantilla
    const wsData = [
      this.HEADERS,
      ...this.SAMPLE_DATA.map(row => [
        row.nombre || '',
        row.tipo || '',
        row.razonSocial || '',
        row.direccion || '',
        row.telefono || '',
        row.mail || '',
        row.cuit || '',
        row.contactoPrincipal || '',
        row.activa !== undefined ? (row.activa ? 'Sí' : 'No') : 'Sí',
        row.observaciones || ''
      ])
    ];

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
      { wch: 40 }  // Observaciones
    ];

    // Agregar validaciones de datos
    if (!ws['!dataValidation']) ws['!dataValidation'] = [];
    
    // Validación para Tipo
    ws['!dataValidation'].push({
      sqref: 'B2:B1000',
      type: 'list',
      formula1: '"Propia,Subcontratada"'
    });

    // Validación para Activa
    ws['!dataValidation'].push({
      sqref: 'I2:I1000',
      type: 'list',
      formula1: '"Sí,No"'
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
      ['- Tipo: Clasificación de la empresa (Propia/Subcontratada)']
    ];

    const ws = XLSX.utils.aoa_to_sheet(instructions);
    
    // Configurar formato
    ws['!cols'] = [{ wch: 70 }];
    
    return ws;
  }

  /**
   * Valida datos de empresa desde Excel
   */
  static validateData(data: any[]): { valid: EmpresaTemplateData[], errors: string[] } {
    const valid: EmpresaTemplateData[] = [];
    const errors: string[] = [];
    const nombresVistos = new Set<string>();

    data.forEach((row, index) => {
      const rowNum = index + 2; // Ajustar por header
      const nombre = row['Nombre (*)']?.toString()?.trim();
      const tipo = row['Tipo (*)']?.toString()?.trim();
      const razonSocial = row['Razón Social']?.toString()?.trim();
      const direccion = row['Dirección']?.toString()?.trim();
      const telefono = row['Teléfono']?.toString()?.trim();
      const mail = row['Email']?.toString()?.trim();
      const cuit = row['CUIT']?.toString()?.trim();
      const contactoPrincipal = row['Contacto Principal']?.toString()?.trim();
      const activa = row['Activa']?.toString()?.trim();
      const observaciones = row['Observaciones']?.toString()?.trim();

      // Validar campos obligatorios
      if (!nombre) {
        errors.push(`Fila ${rowNum}: El nombre es obligatorio`);
        return;
      }

      if (!tipo) {
        errors.push(`Fila ${rowNum}: El tipo es obligatorio`);
        return;
      }

      // Validar tipo
      if (tipo !== 'Propia' && tipo !== 'Subcontratada') {
        errors.push(`Fila ${rowNum}: El tipo debe ser "Propia" o "Subcontratada"`);
        return;
      }

      // Validar duplicados en el archivo
      if (nombresVistos.has(nombre.toLowerCase())) {
        errors.push(`Fila ${rowNum}: Nombre duplicado en el archivo`);
        return;
      }
      nombresVistos.add(nombre.toLowerCase());

      // Validar email si se proporciona
      if (mail && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
        errors.push(`Fila ${rowNum}: Email con formato inválido`);
        return;
      }

      // Validar CUIT si se proporciona
      if (cuit && !/^(20|23|24|25|26|27|30|33|34)([0-9]{9}|-[0-9]{8}-[0-9]{1})$/.test(cuit)) {
        errors.push(`Fila ${rowNum}: CUIT con formato inválido`);
        return;
      }

      // Validar activa
      let activaValue = true;
      if (activa) {
        if (activa.toLowerCase() === 'no') {
          activaValue = false;
        } else if (activa.toLowerCase() !== 'sí' && activa.toLowerCase() !== 'si') {
          errors.push(`Fila ${rowNum}: El campo Activa debe ser "Sí" o "No"`);
          return;
        }
      }

      const empresaData: EmpresaTemplateData = {
        nombre,
        tipo: tipo as 'Propia' | 'Subcontratada',
        activa: activaValue
      };

      // Agregar campos opcionales si están presentes
      if (razonSocial) empresaData.razonSocial = razonSocial;
      if (direccion) empresaData.direccion = direccion;
      if (telefono) empresaData.telefono = telefono;
      if (mail) empresaData.mail = mail;
      if (cuit) empresaData.cuit = cuit;
      if (contactoPrincipal) empresaData.contactoPrincipal = contactoPrincipal;
      if (observaciones) empresaData.observaciones = observaciones;

      valid.push(empresaData);
    });

    return { valid, errors };
  }

  /**
   * Genera archivo Excel para descarga
   */
  static downloadTemplate(filename: string = 'plantilla_empresas.xlsx'): void {
    const wb = this.generateTemplate();
    XLSX.writeFile(wb, filename);
  }
}

export default EmpresaTemplate;