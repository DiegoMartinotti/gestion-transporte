import * as XLSX from 'xlsx';
import { WorkSheet, WorkBook } from 'xlsx';

export interface ClienteTemplateData {
  nombre: string;
  cuit: string;
  activo?: boolean;
}

export class ClienteTemplate {
  private static HEADERS = [
    'Nombre (*)',
    'CUIT (*)',
    'Activo'
  ];

  private static SAMPLE_DATA: Partial<ClienteTemplateData>[] = [
    {
      nombre: 'Empresa Ejemplo S.A.',
      cuit: '20-12345678-9',
      activo: true
    },
    {
      nombre: 'Transportes ABC S.R.L.',
      cuit: '30-87654321-0',
      activo: true
    }
  ];

  /**
   * Genera una plantilla Excel para carga masiva de clientes
   */
  static generateTemplate(): WorkBook {
    const wb = XLSX.utils.book_new();
    
    // Hoja principal con plantilla
    const wsData = [
      this.HEADERS,
      ...this.SAMPLE_DATA.map(row => [
        row.nombre || '',
        row.cuit || '',
        row.activo !== undefined ? (row.activo ? 'Sí' : 'No') : 'Sí'
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Configurar ancho de columnas
    ws['!cols'] = [
      { wch: 30 }, // Nombre
      { wch: 15 }, // CUIT
      { wch: 10 }  // Activo
    ];

    // Agregar validación de datos para columna Activo
    if (!ws['!dataValidation']) ws['!dataValidation'] = [];
    ws['!dataValidation'].push({
      sqref: 'C2:C1000',
      type: 'list',
      formula1: '"Sí,No"'
    });

    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');

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
      ['PLANTILLA PARA CARGA MASIVA DE CLIENTES'],
      [''],
      ['INSTRUCCIONES DE USO:'],
      [''],
      ['1. Complete la información en la hoja "Clientes"'],
      ['2. Los campos marcados con (*) son obligatorios'],
      ['3. Formatos requeridos:'],
      ['   - Nombre: Texto (máximo 100 caracteres)'],
      ['   - CUIT: Formato XX-XXXXXXXX-X'],
      ['   - Activo: Seleccione "Sí" o "No"'],
      [''],
      ['VALIDACIONES:'],
      [''],
      ['- El nombre debe ser único en el sistema'],
      ['- El CUIT debe tener formato válido argentino'],
      ['- No pueden existir nombres duplicados en el archivo'],
      [''],
      ['NOTAS IMPORTANTES:'],
      [''],
      ['- Elimine las filas de ejemplo antes de cargar'],
      ['- El sistema validará duplicados con datos existentes'],
      ['- Los clientes se crearán como activos por defecto'],
      ['- Revise el reporte de validación antes de confirmar'],
      [''],
      ['CAMPOS OBLIGATORIOS (*)'],
      ['- Nombre: Denominación de la empresa cliente'],
      ['- CUIT: Código Único de Identificación Tributaria']
    ];

    const ws = XLSX.utils.aoa_to_sheet(instructions);
    
    // Configurar formato
    ws['!cols'] = [{ wch: 60 }];
    
    return ws;
  }

  /**
   * Valida datos de cliente desde Excel
   */
  static validateData(data: any[]): { valid: ClienteTemplateData[], errors: string[] } {
    const valid: ClienteTemplateData[] = [];
    const errors: string[] = [];
    const nombresVistos = new Set<string>();

    data.forEach((row, index) => {
      const rowNum = index + 2; // Ajustar por header
      const nombre = row['Nombre (*)']?.toString()?.trim();
      const cuit = row['CUIT (*)']?.toString()?.trim();
      const activo = row['Activo']?.toString()?.trim();

      // Validar campos obligatorios
      if (!nombre) {
        errors.push(`Fila ${rowNum}: El nombre es obligatorio`);
        return;
      }

      if (!cuit) {
        errors.push(`Fila ${rowNum}: El CUIT es obligatorio`);
        return;
      }

      // Validar formato CUIT
      if (!/^(20|23|24|25|26|27|30|33|34)([0-9]{9}|-[0-9]{8}-[0-9]{1})$/.test(cuit)) {
        errors.push(`Fila ${rowNum}: CUIT con formato inválido`);
        return;
      }

      // Validar duplicados en el archivo
      if (nombresVistos.has(nombre.toLowerCase())) {
        errors.push(`Fila ${rowNum}: Nombre duplicado en el archivo`);
        return;
      }
      nombresVistos.add(nombre.toLowerCase());

      // Validar activo
      let activoValue = true;
      if (activo) {
        if (activo.toLowerCase() === 'no') {
          activoValue = false;
        } else if (activo.toLowerCase() !== 'sí' && activo.toLowerCase() !== 'si') {
          errors.push(`Fila ${rowNum}: El campo Activo debe ser "Sí" o "No"`);
          return;
        }
      }

      valid.push({
        nombre,
        cuit,
        activo: activoValue
      });
    });

    return { valid, errors };
  }

  /**
   * Genera archivo Excel para descarga
   */
  static downloadTemplate(filename: string = 'plantilla_clientes.xlsx'): void {
    const wb = this.generateTemplate();
    XLSX.writeFile(wb, filename);
  }
}

export default ClienteTemplate;