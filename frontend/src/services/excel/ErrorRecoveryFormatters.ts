/**
 * Módulo de formateo para ErrorRecovery
 * Contiene métodos para corregir automáticamente formatos de datos
 */

export interface FormatCorrectionResult {
  success: boolean;
  value?: unknown;
  confidence: number;
  explanation: string;
}

export interface BooleanCorrectionResult {
  success: boolean;
  value?: string;
  confidence: number;
}

export interface ReferenceCorrectionResult {
  success: boolean;
  value?: string;
  confidence: number;
  explanation: string;
}

export class ErrorRecoveryFormatters {
  /**
   * Intenta corregir formato automáticamente
   */
  static attemptFormatCorrection(field: string, value: unknown): FormatCorrectionResult {
    if (!value) return { success: false, confidence: 0, explanation: 'Valor vacío' };

    const stringValue = value.toString().trim();

    // CUIT
    if (field.includes('CUIT')) {
      return this.formatCUIT(stringValue);
    }

    // CUIL
    if (field.includes('CUIL')) {
      return this.formatCUIL(stringValue);
    }

    // DNI
    if (field.includes('DNI')) {
      return this.formatDNI(stringValue);
    }

    // Email
    if (field.includes('Email') || field.includes('mail')) {
      return this.formatEmail(stringValue);
    }

    // Fechas
    if (field.includes('Fecha') || field.includes('Vencimiento')) {
      return this.formatDate(stringValue);
    }

    return { success: false, confidence: 0, explanation: 'No se pudo corregir automáticamente' };
  }

  /**
   * Intenta corregir valores booleanos
   */
  static attemptBooleanCorrection(value: unknown): BooleanCorrectionResult {
    if (!value) return { success: false, confidence: 0 };

    const stringValue = value.toString().toLowerCase().trim();

    // Mapeos comunes para "Sí"
    const yesValues = [
      'si',
      'sí',
      'yes',
      'y',
      'true',
      '1',
      'activo',
      'activa',
      'habilitado',
      'habilitada',
    ];
    // Mapeos comunes para "No"
    const noValues = [
      'no',
      'n',
      'false',
      '0',
      'inactivo',
      'inactiva',
      'deshabilitado',
      'deshabilitada',
    ];

    if (yesValues.includes(stringValue)) {
      return {
        success: true,
        value: 'Sí',
        confidence: 0.9,
      };
    }

    if (noValues.includes(stringValue)) {
      return {
        success: true,
        value: 'No',
        confidence: 0.9,
      };
    }

    return { success: false, confidence: 0 };
  }

  /**
   * Intenta corregir referencias (nombres similares)
   */
  static attemptReferenceCorrection(_field: string, _value: unknown): ReferenceCorrectionResult {
    // Esta función requeriría acceso a los datos de referencia
    // Por ahora devuelve false, pero podría implementarse con fuzzy matching
    return {
      success: false,
      confidence: 0,
      explanation: 'Corrección de referencias no implementada aún',
    };
  }

  /**
   * Formatea números CUIT
   */
  private static formatCUIT(stringValue: string): FormatCorrectionResult {
    const numbers = stringValue.replace(/\D/g, '');
    if (numbers.length === 11) {
      const formatted = `${numbers.substring(0, 2)}-${numbers.substring(2, 10)}-${numbers.substring(10)}`;
      return {
        success: true,
        value: formatted,
        confidence: 0.9,
        explanation: 'CUIT formateado correctamente',
      };
    }
    return { success: false, confidence: 0, explanation: 'CUIT no válido' };
  }

  /**
   * Formatea números CUIL
   */
  private static formatCUIL(stringValue: string): FormatCorrectionResult {
    const numbers = stringValue.replace(/\D/g, '');
    if (numbers.length === 11) {
      const formatted = `${numbers.substring(0, 2)}-${numbers.substring(2, 10)}-${numbers.substring(10)}`;
      return {
        success: true,
        value: formatted,
        confidence: 0.9,
        explanation: 'CUIL formateado correctamente',
      };
    }
    return { success: false, confidence: 0, explanation: 'CUIL no válido' };
  }

  /**
   * Formatea números DNI
   */
  private static formatDNI(stringValue: string): FormatCorrectionResult {
    const numbers = stringValue.replace(/\D/g, '');
    if (numbers.length >= 7 && numbers.length <= 8) {
      return {
        success: true,
        value: numbers,
        confidence: 0.95,
        explanation: 'DNI limpiado de caracteres no numéricos',
      };
    }
    return { success: false, confidence: 0, explanation: 'DNI no válido' };
  }

  /**
   * Formatea direcciones de email
   */
  private static formatEmail(stringValue: string): FormatCorrectionResult {
    const lowercased = stringValue.toLowerCase();
    if (lowercased.includes('@') && lowercased.includes('.')) {
      return {
        success: true,
        value: lowercased,
        confidence: 0.8,
        explanation: 'Email convertido a minúsculas',
      };
    }
    return { success: false, confidence: 0, explanation: 'Email no válido' };
  }

  /**
   * Formatea fechas a formato DD/MM/YYYY
   */
  private static formatDate(stringValue: string): FormatCorrectionResult {
    const dateFormats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    ];

    for (const format of dateFormats) {
      const match = stringValue.match(format);
      if (match) {
        const [, p1, p2, p3] = match;
        // Asumir DD/MM/YYYY como formato objetivo
        const day = format.source.startsWith('^(\\\\d{4})') ? p3 : p1;
        const month = p2;
        const year = format.source.startsWith('^(\\\\d{4})') ? p1 : p3;

        return {
          success: true,
          value: `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`,
          confidence: 0.85,
          explanation: 'Fecha reformateada a DD/MM/YYYY',
        };
      }
    }
    return { success: false, confidence: 0, explanation: 'Fecha no válida' };
  }
}
