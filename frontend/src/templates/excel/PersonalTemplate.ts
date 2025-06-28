import * as XLSX from 'xlsx';
import { WorkSheet, WorkBook } from 'xlsx';

export interface PersonalTemplateData {
  nombre: string;
  apellido: string;
  dni: string;
  cuil?: string;
  tipo: 'Conductor' | 'Administrativo' | 'Mecánico' | 'Supervisor' | 'Otro';
  fechaNacimiento?: Date;
  empresaId?: string;
  empresaNombre?: string;
  numeroLegajo?: string;
  fechaIngreso?: Date;
  // Dirección
  direccionCalle?: string;
  direccionNumero?: string;
  direccionLocalidad?: string;
  direccionProvincia?: string;
  direccionCodigoPostal?: string;
  // Contacto
  telefono?: string;
  telefonoEmergencia?: string;
  email?: string;
  // Documentación
  licenciaNumero?: string;
  licenciaCategoria?: string;
  licenciaVencimiento?: Date;
  carnetProfesionalNumero?: string;
  carnetProfesionalVencimiento?: Date;
  evaluacionMedicaFecha?: Date;
  evaluacionMedicaVencimiento?: Date;
  psicofisicoFecha?: Date;
  psicofisicoVencimiento?: Date;
  // Datos laborales
  categoria?: string;
  obraSocial?: string;
  art?: string;
  activo?: boolean;
  observaciones?: string;
}

export class PersonalTemplate {
  private static HEADERS = [
    // Datos básicos
    'Nombre (*)',
    'Apellido (*)',
    'DNI (*)',
    'CUIL',
    'Tipo (*)',
    'Fecha Nacimiento',
    'Empresa (*)',
    'N° Legajo',
    'Fecha Ingreso',
    
    // Dirección
    'Dirección - Calle',
    'Dirección - Número',
    'Dirección - Localidad',
    'Dirección - Provincia',
    'Dirección - Código Postal',
    
    // Contacto
    'Teléfono',
    'Teléfono Emergencia',
    'Email',
    
    // Documentación - Licencia
    'Licencia - Número',
    'Licencia - Categoría',
    'Licencia - Vencimiento',
    
    // Documentación - Carnet Profesional
    'Carnet Prof. - Número',
    'Carnet Prof. - Vencimiento',
    
    // Documentación - Evaluaciones
    'Eval. Médica - Fecha',
    'Eval. Médica - Vencimiento',
    'Psicofísico - Fecha',
    'Psicofísico - Vencimiento',
    
    // Datos laborales
    'Categoría',
    'Obra Social',
    'ART',
    'Activo',
    'Observaciones'
  ];

  private static SAMPLE_DATA: Partial<PersonalTemplateData>[] = [
    {
      nombre: 'Juan Carlos',
      apellido: 'Pérez',
      dni: '12345678',
      cuil: '20-12345678-9',
      tipo: 'Conductor',
      fechaNacimiento: new Date('1985-03-15'),
      empresaNombre: 'Transportes del Norte',
      numeroLegajo: '0001',
      fechaIngreso: new Date('2020-01-15'),
      direccionCalle: 'San Martín',
      direccionNumero: '1234',
      direccionLocalidad: 'Buenos Aires',
      direccionProvincia: 'Buenos Aires',
      direccionCodigoPostal: '1000',
      telefono: '+54 11 1234-5678',
      telefonoEmergencia: '+54 11 8765-4321',
      email: 'jperez@email.com',
      licenciaNumero: 'BA123456789',
      licenciaCategoria: 'D1',
      licenciaVencimiento: new Date('2025-12-31'),
      carnetProfesionalNumero: 'CP123456',
      carnetProfesionalVencimiento: new Date('2024-06-30'),
      evaluacionMedicaFecha: new Date('2023-01-15'),
      evaluacionMedicaVencimiento: new Date('2024-01-15'),
      psicofisicoFecha: new Date('2023-01-20'),
      psicofisicoVencimiento: new Date('2024-01-20'),
      categoria: 'Chofer',
      obraSocial: 'OSDE',
      art: 'La Caja ART',
      activo: true,
      observaciones: 'Conductor experimentado'
    },
    {
      nombre: 'María',
      apellido: 'González',
      dni: '87654321',
      cuil: '27-87654321-4',
      tipo: 'Administrativo',
      fechaNacimiento: new Date('1990-08-22'),
      empresaNombre: 'Transportes del Norte',
      numeroLegajo: '0002',
      fechaIngreso: new Date('2021-03-01'),
      direccionCalle: 'Rivadavia',
      direccionNumero: '567',
      direccionLocalidad: 'CABA',
      direccionProvincia: 'Ciudad Autónoma de Buenos Aires',
      direccionCodigoPostal: '1002',
      telefono: '+54 11 2345-6789',
      email: 'mgonzalez@email.com',
      categoria: 'Administrativa',
      obraSocial: 'Swiss Medical',
      art: 'Galeno ART',
      activo: true,
      observaciones: 'Encargada de facturación'
    }
  ];

  /**
   * Genera una plantilla Excel para carga masiva de personal
   */
  static generateTemplate(empresas: { id: string, nombre: string }[] = []): WorkBook {
    const wb = XLSX.utils.book_new();
    
    // Hoja principal con plantilla
    const wsData = [
      this.HEADERS,
      ...this.SAMPLE_DATA.map(row => [
        row.nombre || '',
        row.apellido || '',
        row.dni || '',
        row.cuil || '',
        row.tipo || '',
        row.fechaNacimiento ? this.formatDate(row.fechaNacimiento) : '',
        row.empresaNombre || '',
        row.numeroLegajo || '',
        row.fechaIngreso ? this.formatDate(row.fechaIngreso) : '',
        row.direccionCalle || '',
        row.direccionNumero || '',
        row.direccionLocalidad || '',
        row.direccionProvincia || '',
        row.direccionCodigoPostal || '',
        row.telefono || '',
        row.telefonoEmergencia || '',
        row.email || '',
        row.licenciaNumero || '',
        row.licenciaCategoria || '',
        row.licenciaVencimiento ? this.formatDate(row.licenciaVencimiento) : '',
        row.carnetProfesionalNumero || '',
        row.carnetProfesionalVencimiento ? this.formatDate(row.carnetProfesionalVencimiento) : '',
        row.evaluacionMedicaFecha ? this.formatDate(row.evaluacionMedicaFecha) : '',
        row.evaluacionMedicaVencimiento ? this.formatDate(row.evaluacionMedicaVencimiento) : '',
        row.psicofisicoFecha ? this.formatDate(row.psicofisicoFecha) : '',
        row.psicofisicoVencimiento ? this.formatDate(row.psicofisicoVencimiento) : '',
        row.categoria || '',
        row.obraSocial || '',
        row.art || '',
        row.activo !== undefined ? (row.activo ? 'Sí' : 'No') : 'Sí',
        row.observaciones || ''
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Configurar ancho de columnas
    ws['!cols'] = [
      { wch: 15 }, // Nombre
      { wch: 15 }, // Apellido
      { wch: 12 }, // DNI
      { wch: 15 }, // CUIL
      { wch: 15 }, // Tipo
      { wch: 12 }, // Fecha Nacimiento
      { wch: 20 }, // Empresa
      { wch: 10 }, // N° Legajo
      { wch: 12 }, // Fecha Ingreso
      { wch: 20 }, // Dir. Calle
      { wch: 8 },  // Dir. Número
      { wch: 15 }, // Dir. Localidad
      { wch: 15 }, // Dir. Provincia
      { wch: 10 }, // Dir. CP
      { wch: 15 }, // Teléfono
      { wch: 15 }, // Tel. Emergencia
      { wch: 25 }, // Email
      { wch: 15 }, // Lic. Número
      { wch: 10 }, // Lic. Categoría
      { wch: 12 }, // Lic. Vencimiento
      { wch: 15 }, // Carnet Número
      { wch: 12 }, // Carnet Vencimiento
      { wch: 12 }, // Eval. Médica Fecha
      { wch: 12 }, // Eval. Médica Venc.
      { wch: 12 }, // Psicofísico Fecha
      { wch: 12 }, // Psicofísico Venc.
      { wch: 15 }, // Categoría
      { wch: 15 }, // Obra Social
      { wch: 15 }, // ART
      { wch: 8 },  // Activo
      { wch: 30 }  // Observaciones
    ];

    // Agregar validaciones de datos
    if (!ws['!dataValidation']) ws['!dataValidation'] = [];
    
    // Validación para Tipo
    ws['!dataValidation'].push({
      sqref: 'E2:E1000',
      type: 'list',
      formula1: '"Conductor,Administrativo,Mecánico,Supervisor,Otro"'
    });

    // Validación para Empresa (si se proporcionan empresas)
    if (empresas.length > 0) {
      const empresaNames = empresas.map(e => e.nombre).join(',');
      ws['!dataValidation'].push({
        sqref: 'G2:G1000',
        type: 'list',
        formula1: `"${empresaNames}"`
      });
    }

    // Validación para Activo
    ws['!dataValidation'].push({
      sqref: 'AE2:AE1000',
      type: 'list',
      formula1: '"Sí,No"'
    });

    XLSX.utils.book_append_sheet(wb, ws, 'Personal');

    // Hoja de instrucciones
    const instructionsWs = this.createInstructionsSheet();
    XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instrucciones');

    // Hoja de referencia de empresas si se proporcionan
    if (empresas.length > 0) {
      const empresasWs = this.createEmpresasReferenceSheet(empresas);
      XLSX.utils.book_append_sheet(wb, empresasWs, 'Ref_Empresas');
    }

    return wb;
  }

  /**
   * Crea hoja de instrucciones
   */
  private static createInstructionsSheet(): WorkSheet {
    const instructions = [
      ['PLANTILLA PARA CARGA MASIVA DE PERSONAL'],
      [''],
      ['INSTRUCCIONES DE USO:'],
      [''],
      ['1. Complete la información en la hoja "Personal"'],
      ['2. Los campos marcados con (*) son obligatorios'],
      ['3. Formatos requeridos:'],
      ['   - DNI: Solo números, 7-8 dígitos'],
      ['   - CUIL: Formato XX-XXXXXXXX-X'],
      ['   - Fechas: DD/MM/AAAA'],
      ['   - Email: Formato válido de correo'],
      ['   - Tipo: Seleccione del menú desplegable'],
      ['   - Empresa: Seleccione del menú (ver hoja Ref_Empresas)'],
      [''],
      ['TIPOS DE PERSONAL:'],
      ['- Conductor: Personal autorizado para manejar vehículos'],
      ['- Administrativo: Personal de oficina y gestión'],
      ['- Mecánico: Personal de mantenimiento'],
      ['- Supervisor: Personal de supervisión y control'],
      ['- Otro: Otros tipos no especificados'],
      [''],
      ['DOCUMENTACIÓN REQUERIDA PARA CONDUCTORES:'],
      ['- Licencia de Conducir: Obligatoria para tipo "Conductor"'],
      ['- Carnet Profesional: Requerido para transporte comercial'],
      ['- Evaluación Médica: Renovación anual obligatoria'],
      ['- Psicofísico: Evaluación psicológica anual'],
      [''],
      ['VALIDACIONES:'],
      ['- El DNI debe ser único en el sistema'],
      ['- La empresa debe existir en el sistema'],
      ['- El número de legajo debe ser único por empresa'],
      ['- Las fechas de vencimiento deben ser futuras'],
      ['- Para conductores, la licencia es obligatoria'],
      [''],
      ['NOTAS IMPORTANTES:'],
      ['- Elimine las filas de ejemplo antes de cargar'],
      ['- El sistema generará legajos automáticamente si no se especifican'],
      ['- Verifique las fechas de vencimiento de documentos'],
      ['- Para personal nuevo, la fecha de ingreso es obligatoria'],
      ['- Use la hoja "Ref_Empresas" para ver empresas disponibles'],
      [''],
      ['CAMPOS OBLIGATORIOS (*)'],
      ['- Nombre: Nombre de pila'],
      ['- Apellido: Apellido completo'],
      ['- DNI: Documento Nacional de Identidad'],
      ['- Tipo: Clasificación del personal'],
      ['- Empresa: Empresa a la que pertenece']
    ];

    const ws = XLSX.utils.aoa_to_sheet(instructions);
    ws['!cols'] = [{ wch: 70 }];
    
    return ws;
  }

  /**
   * Crea hoja de referencia de empresas
   */
  private static createEmpresasReferenceSheet(empresas: { id: string, nombre: string }[]): WorkSheet {
    const data = [
      ['ID', 'Nombre de Empresa'],
      ...empresas.map(empresa => [empresa.id, empresa.nombre])
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 25 }, { wch: 40 }];
    
    return ws;
  }

  /**
   * Formatea fecha para Excel
   */
  private static formatDate(date: Date): string {
    return date.toLocaleDateString('es-AR');
  }

  /**
   * Parsea fecha desde string
   */
  private static parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const [day, month, year] = parts.map(p => parseInt(p, 10));
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    return new Date(year, month - 1, day);
  }

  /**
   * Valida datos de personal desde Excel
   */
  static validateData(data: any[], empresas: { id: string, nombre: string }[] = []): { valid: PersonalTemplateData[], errors: string[] } {
    const valid: PersonalTemplateData[] = [];
    const errors: string[] = [];
    const dnisVistos = new Set<string>();
    const empresaMap = new Map(empresas.map(e => [e.nombre, e.id]));

    data.forEach((row, index) => {
      const rowNum = index + 2;
      const nombre = row['Nombre (*)']?.toString()?.trim();
      const apellido = row['Apellido (*)']?.toString()?.trim();
      const dni = row['DNI (*)']?.toString()?.trim()?.replace(/\D/g, '');
      const cuil = row['CUIL']?.toString()?.trim();
      const tipo = row['Tipo (*)']?.toString()?.trim();
      const empresaNombre = row['Empresa (*)']?.toString()?.trim();

      // Validar campos obligatorios
      if (!nombre) {
        errors.push(`Fila ${rowNum}: El nombre es obligatorio`);
        return;
      }

      if (!apellido) {
        errors.push(`Fila ${rowNum}: El apellido es obligatorio`);
        return;
      }

      if (!dni) {
        errors.push(`Fila ${rowNum}: El DNI es obligatorio`);
        return;
      }

      if (!tipo) {
        errors.push(`Fila ${rowNum}: El tipo es obligatorio`);
        return;
      }

      if (!empresaNombre) {
        errors.push(`Fila ${rowNum}: La empresa es obligatoria`);
        return;
      }

      // Validar formato DNI
      if (!/^[0-9]{7,8}$/.test(dni)) {
        errors.push(`Fila ${rowNum}: DNI con formato inválido`);
        return;
      }

      // Validar duplicados DNI
      if (dnisVistos.has(dni)) {
        errors.push(`Fila ${rowNum}: DNI duplicado en el archivo`);
        return;
      }
      dnisVistos.add(dni);

      // Validar tipo
      const tiposValidos = ['Conductor', 'Administrativo', 'Mecánico', 'Supervisor', 'Otro'];
      if (!tiposValidos.includes(tipo)) {
        errors.push(`Fila ${rowNum}: Tipo inválido`);
        return;
      }

      // Validar empresa
      const empresaId = empresaMap.get(empresaNombre);
      if (empresas.length > 0 && !empresaId) {
        errors.push(`Fila ${rowNum}: Empresa no encontrada`);
        return;
      }

      // Validar CUIL si se proporciona
      if (cuil && !/^[0-9]{2}-[0-9]{8}-[0-9]$/.test(cuil)) {
        errors.push(`Fila ${rowNum}: CUIL con formato inválido`);
        return;
      }

      // Validar email si se proporciona
      const email = row['Email']?.toString()?.trim();
      if (email && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        errors.push(`Fila ${rowNum}: Email con formato inválido`);
        return;
      }

      // Para conductores, validar licencia
      if (tipo === 'Conductor') {
        const licenciaNumero = row['Licencia - Número']?.toString()?.trim();
        if (!licenciaNumero) {
          errors.push(`Fila ${rowNum}: Licencia obligatoria para conductores`);
          return;
        }
      }

      const personalData: PersonalTemplateData = {
        nombre,
        apellido,
        dni,
        tipo: tipo as any,
        empresaId,
        empresaNombre
      };

      // Agregar campos opcionales procesados
      if (cuil) personalData.cuil = cuil;
      if (email) personalData.email = email;

      // Procesar fechas
      const fechaNacimiento = this.parseDate(row['Fecha Nacimiento']?.toString()?.trim());
      if (fechaNacimiento) personalData.fechaNacimiento = fechaNacimiento;

      const fechaIngreso = this.parseDate(row['Fecha Ingreso']?.toString()?.trim());
      if (fechaIngreso) personalData.fechaIngreso = fechaIngreso;

      // Agregar más campos según necesidad...

      valid.push(personalData);
    });

    return { valid, errors };
  }

  /**
   * Genera archivo Excel para descarga
   */
  static downloadTemplate(empresas: { id: string, nombre: string }[] = [], filename: string = 'plantilla_personal.xlsx'): void {
    const wb = this.generateTemplate(empresas);
    XLSX.writeFile(wb, filename);
  }
}

export default PersonalTemplate;