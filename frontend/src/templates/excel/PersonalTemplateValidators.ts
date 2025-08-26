import { PersonalRawData } from '../../types/excel';
import { PersonalTemplateData } from './PersonalTemplateConstants';
import { EXCEL_SHARED_CONSTANTS } from './constants';
import {
  validateRequiredFields,
  validateEmailFormat,
  validateDNIFormat,
  validateCUILFormat,
  validateDuplicates,
  validateInReferenceList,
  validateEnumValue,
  combineValidationResults,
  formatRowError,
} from '../../utils/excel/validationHelpers';

export class PersonalTemplateValidators {
  static validatePersonalRequiredFields(
    personal: PersonalRawData,
    rowNum: number
  ): { isValid: boolean; errors: string[] } {
    return validateRequiredFields([
      { value: personal.nombre as string, fieldName: 'Nombre', rowNum, required: true },
      { value: personal.apellido as string, fieldName: 'Apellido', rowNum, required: true },
      { value: personal.dni as string, fieldName: 'DNI', rowNum, required: true },
      { value: personal.tipo as string, fieldName: 'Tipo', rowNum, required: true },
      { value: personal.empresaNombre as string, fieldName: 'Empresa', rowNum, required: true },
    ]);
  }

  static validatePersonalFormats(
    personal: PersonalRawData,
    rowNum: number
  ): { isValid: boolean; errors: string[] } {
    const validationResults = [];
    if (personal.dni) {
      validationResults.push(validateDNIFormat(personal.dni, rowNum));
    }
    const validTypes = Object.values(EXCEL_SHARED_CONSTANTS.PERSONAL.TIPOS);
    if (personal.tipo) {
      validationResults.push(
        validateEnumValue(personal.tipo as string, rowNum, validTypes, 'Tipo')
      );
    }
    if (personal.cuil) {
      validationResults.push(validateCUILFormat(personal.cuil, rowNum));
    }
    if (personal.email) {
      validationResults.push(validateEmailFormat(personal.email as string, rowNum));
    }

    return combineValidationResults(...validationResults);
  }

  static validatePersonalDuplicates(
    dni: string,
    rowNum: number,
    dnisVistos: Set<string>
  ): { isValid: boolean; errors: string[] } {
    return validateDuplicates(dni, rowNum, dnisVistos, 'DNI');
  }

  static validatePersonalEmpresa(
    empresaNombre: string,
    rowNum: number,
    empresaMap: Map<string, string>,
    _empresas: { id: string; nombre: string }[]
  ): { isValid: boolean; errors: string[]; empresaId?: string } {
    const result = validateInReferenceList(empresaNombre, empresaMap, {
      rowNum,
      fieldName: 'Empresa',
    });

    return {
      isValid: result.isValid,
      errors: result.errors,
      empresaId: result.referenceId,
    };
  }

  static validatePersonalSpecificFields(
    personal: PersonalRawData,
    rowNum: number
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const typeValidations: { [key: string]: () => void } = {
      [EXCEL_SHARED_CONSTANTS.PERSONAL.TIPOS.CONDUCTOR]: () => {
        if (!personal.licenciaNumero) {
          errors.push(formatRowError(rowNum, 'Licencia obligatoria para conductores'));
        }
      },
    };
    const validation = personal.tipo ? typeValidations[personal.tipo as string] : undefined;
    if (validation) {
      validation();
    }
    return { isValid: errors.length === 0, errors };
  }

  static validatePersonalRow(params: {
    personal: PersonalRawData;
    rowNum: number;
    dnisVistos: Set<string>;
    empresaMap: Map<string, string>;
    empresas: { id: string; nombre: string }[];
    buildPersonalData: (personal: PersonalRawData, empresaId?: string) => PersonalTemplateData;
  }): { isValid: boolean; personalData?: PersonalTemplateData; errors: string[] } {
    const { personal, rowNum, dnisVistos, empresaMap, empresas, buildPersonalData } = params;

    const requiredResult = this.validatePersonalRequiredFields(personal, rowNum);
    if (!requiredResult.isValid) {
      return { isValid: false, errors: requiredResult.errors };
    }

    const formatResult = this.validatePersonalFormats(personal, rowNum);
    if (!formatResult.isValid) {
      return { isValid: false, errors: formatResult.errors };
    }

    const duplicateResult = this.validatePersonalDuplicates(personal.dni || '', rowNum, dnisVistos);
    if (!duplicateResult.isValid) {
      return { isValid: false, errors: duplicateResult.errors };
    }

    const empresaResult = this.validatePersonalEmpresa(
      personal.empresaNombre as string,
      rowNum,
      empresaMap,
      empresas
    );
    if (!empresaResult.isValid) {
      return { isValid: false, errors: empresaResult.errors };
    }

    const specificResult = this.validatePersonalSpecificFields(personal, rowNum);
    if (!specificResult.isValid) {
      return { isValid: false, errors: specificResult.errors };
    }

    const personalData = buildPersonalData(personal, empresaResult.empresaId);

    return { isValid: true, personalData, errors: [] };
  }
}
