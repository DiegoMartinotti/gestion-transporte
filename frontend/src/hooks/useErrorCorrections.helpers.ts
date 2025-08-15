import { ImportError, CorrectionAction } from './useErrorCorrections';

const fixEmailError = (error: ImportError): CorrectionAction | null => {
  if (error.field === 'email' && error.error.includes('inválido')) {
    const cleanEmail = String(error.value).trim().toLowerCase();
    if (cleanEmail.includes('@') && !cleanEmail.includes(' ')) {
      return {
        type: 'edit',
        row: error.row,
        field: error.field,
        newValue: cleanEmail,
      };
    }
  }
  return null;
};

const fixPhoneError = (error: ImportError): CorrectionAction | null => {
  if (error.field === 'telefono' && error.error.includes('formato')) {
    const cleanPhone = String(error.value).replace(/\D/g, '');
    if (cleanPhone.length >= 8) {
      return {
        type: 'edit',
        row: error.row,
        field: error.field,
        newValue: cleanPhone,
      };
    }
  }
  return null;
};

const fixDateError = (error: ImportError): CorrectionAction | null => {
  if (error.field.includes('fecha') && error.error.includes('formato')) {
    const valueStr = String(error.value);
    const match = valueStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      const [, day, month, year] = match;
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      return {
        type: 'edit',
        row: error.row,
        field: error.field,
        newValue: isoDate,
      };
    }
  }
  return null;
};

export const generateCommonFixes = (errors: ImportError[]): CorrectionAction[] => {
  const commonFixes: CorrectionAction[] = [];

  errors.forEach((error) => {
    const emailFix = fixEmailError(error);
    const phoneFix = fixPhoneError(error);
    const dateFix = fixDateError(error);

    if (emailFix) commonFixes.push(emailFix);
    if (phoneFix) commonFixes.push(phoneFix);
    if (dateFix) commonFixes.push(dateFix);
  });

  return commonFixes;
};
