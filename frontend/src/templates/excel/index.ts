import ClienteTemplate, { type ClienteTemplateData } from './ClienteTemplate';
import EmpresaTemplate, { type EmpresaTemplateData } from './EmpresaTemplate';
import PersonalTemplate, { type PersonalTemplateData } from './PersonalTemplate';
import ReferenceDataSheets, { type ReferenceData } from './ReferenceDataSheets';

export { ClienteTemplate, EmpresaTemplate, PersonalTemplate, ReferenceDataSheets };
export type { ClienteTemplateData, EmpresaTemplateData, PersonalTemplateData, ReferenceData };

/**
 * Tipos unificados para templates Excel
 */
export type TemplateType = 'cliente' | 'empresa' | 'personal';

export interface TemplateInfo {
  name: string;
  description: string;
  requiredFields: string[];
  optionalFields: string[];
  validations: string[];
}

export const TEMPLATE_INFO: Record<TemplateType, TemplateInfo> = {
  cliente: {
    name: 'Clientes',
    description: 'Plantilla para carga masiva de clientes',
    requiredFields: ['Nombre', 'CUIT'],
    optionalFields: ['Activo'],
    validations: [
      'Nombre único en el sistema',
      'CUIT con formato argentino válido',
      'Sin duplicados en el archivo'
    ]
  },
  empresa: {
    name: 'Empresas',
    description: 'Plantilla para carga masiva de empresas',
    requiredFields: ['Nombre', 'Tipo'],
    optionalFields: ['Razón Social', 'Dirección', 'Teléfono', 'Email', 'CUIT', 'Contacto Principal', 'Activa', 'Observaciones'],
    validations: [
      'Nombre único en el sistema',
      'Tipo: Propia o Subcontratada',
      'Email con formato válido',
      'CUIT con formato argentino válido'
    ]
  },
  personal: {
    name: 'Personal',
    description: 'Plantilla para carga masiva de personal',
    requiredFields: ['Nombre', 'Apellido', 'DNI', 'Tipo', 'Empresa'],
    optionalFields: [
      'CUIL', 'Fecha Nacimiento', 'Dirección completa', 'Contacto',
      'Documentación (Licencia, Carnet Profesional, Evaluaciones)',
      'Datos Laborales', 'Observaciones'
    ],
    validations: [
      'DNI único con 7-8 dígitos',
      'Tipo válido del menú desplegable',
      'Empresa existente en el sistema',
      'Licencia obligatoria para conductores',
      'Fechas en formato DD/MM/AAAA'
    ]
  }
};

/**
 * Factory para generar templates
 */
export class TemplateFactory {
  /**
   * Genera template según el tipo
   */
  static async generateTemplate(type: TemplateType, options: any = {}) {
    switch (type) {
      case 'cliente':
        return ClienteTemplate.generateTemplate();
      
      case 'empresa':
        return EmpresaTemplate.generateTemplate();
      
      case 'personal':
        const empresas = options.empresas || await ReferenceDataSheets.getEmpresasForTemplate();
        return PersonalTemplate.generateTemplate(empresas);
      
      default:
        throw new Error(`Tipo de template no válido: ${type}`);
    }
  }

  /**
   * Descarga template según el tipo
   */
  static async downloadTemplate(type: TemplateType, options: any = {}) {
    const filename = options.filename || `plantilla_${type}.xlsx`;
    
    switch (type) {
      case 'cliente':
        ClienteTemplate.downloadTemplate(filename);
        break;
      
      case 'empresa':
        EmpresaTemplate.downloadTemplate(filename);
        break;
      
      case 'personal':
        const empresas = options.empresas || await ReferenceDataSheets.getEmpresasForTemplate();
        PersonalTemplate.downloadTemplate(empresas, filename);
        break;
      
      default:
        throw new Error(`Tipo de template no válido: ${type}`);
    }
  }

  /**
   * Valida datos según el tipo
   */
  static async validateData(type: TemplateType, data: any[], options: any = {}) {
    switch (type) {
      case 'cliente':
        return ClienteTemplate.validateData(data);
      
      case 'empresa':
        return EmpresaTemplate.validateData(data);
      
      case 'personal':
        const empresas = options.empresas || await ReferenceDataSheets.getEmpresasForTemplate();
        return PersonalTemplate.validateData(data, empresas);
      
      default:
        throw new Error(`Tipo de template no válido: ${type}`);
    }
  }

  /**
   * Obtiene información del template
   */
  static getTemplateInfo(type: TemplateType): TemplateInfo {
    return TEMPLATE_INFO[type];
  }

  /**
   * Lista todos los tipos de templates disponibles
   */
  static getAvailableTemplates(): TemplateType[] {
    return Object.keys(TEMPLATE_INFO) as TemplateType[];
  }
}

export default TemplateFactory;