import { BusinessRuleBaseValidator, BusinessRuleValidationRule } from './BaseValidator';

// Interface legacy para compatibilidad con el código existente
interface BusinessRule {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'operational' | 'temporal' | 'capacity' | 'documentation';
  entityType: string;
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
  validationFn: (record: any, context?: any) => {
    passed: boolean;
    message?: string;
    details?: any;
  };
}

/**
 * Implementación concreta de BusinessRuleBaseValidator que utiliza las reglas de negocio por defecto
 */
export class DefaultBusinessRuleValidator extends BusinessRuleBaseValidator {
  private businessRules: BusinessRule[];

  constructor(businessRules: BusinessRule[], contextData?: any, enabledRuleIds?: string[]) {
    // Si no se proporcionan enabledRuleIds, usar las reglas habilitadas por defecto
    const defaultEnabled = enabledRuleIds || businessRules.filter(r => r.enabled).map(r => r.id);
    super(contextData, defaultEnabled);
    this.businessRules = businessRules;
  }

  getBusinessRules(): BusinessRuleValidationRule[] {
    return this.businessRules.map(rule => ({
      id: rule.id,
      category: rule.category,
      name: rule.name,
      description: rule.description,
      severity: rule.severity,
      required: rule.severity === 'error', // Los errores se consideran requeridos
      entityType: rule.entityType,
      enabled: rule.enabled,
      validationFn: rule.validationFn,
      validator: (data: Record<string, any[]>) => {
        // Esta implementación será manejada por BusinessRuleBaseValidator
        throw new Error('Este método no debe ser llamado directamente');
      }
    }));
  }

  // Método para actualizar las reglas de negocio
  updateBusinessRules(newRules: BusinessRule[]): void {
    this.businessRules = newRules;
  }

  // Método para obtener las reglas originales (para compatibilidad)
  getOriginalBusinessRules(): BusinessRule[] {
    return this.businessRules;
  }
}

// Reglas de negocio por defecto (migradas del archivo original)
export const defaultBusinessRules: BusinessRule[] = [
  // Reglas Financieras
  {
    id: 'tarifa-positive-amount',
    name: 'Tarifas con Montos Positivos',
    description: 'Las tarifas deben tener montos mayores a cero',
    category: 'financial',
    entityType: 'tramos',
    severity: 'error',
    enabled: true,
    validationFn: (tramo) => {
      const tarifas = tramo.tarifas || [];
      for (const tarifa of tarifas) {
        if (tarifa.monto <= 0) {
          return {
            passed: false,
            message: `Tarifa con monto inválido: ${tarifa.monto}`,
            details: { tarifa, tramo: tramo.nombre }
          };
        }
      }
      return { passed: true };
    }
  },
  {
    id: 'extra-valid-pricing',
    name: 'Precios de Extras Válidos',
    description: 'Los extras deben tener precios unitarios válidos',
    category: 'financial',
    entityType: 'extras',
    severity: 'error',
    enabled: true,
    validationFn: (extra) => {
      if (!extra.precioUnitario || extra.precioUnitario <= 0) {
        return {
          passed: false,
          message: `Extra con precio inválido: ${extra.precioUnitario}`,
          details: { extra: extra.nombre }
        };
      }
      return { passed: true };
    }
  },

  // Reglas Operacionales
  {
    id: 'vehiculo-capacity-consistency',
    name: 'Consistencia de Capacidad Vehicular',
    description: 'La capacidad del vehículo debe ser coherente con su tipo',
    category: 'operational',
    entityType: 'vehiculos',
    severity: 'warning',
    enabled: true,
    validationFn: (vehiculo) => {
      const { tipoUnidad, capacidadKg, capacidadM3 } = vehiculo;
      
      // Reglas básicas por tipo de unidad
      const capacityRules: Record<string, { minKg: number; maxKg: number; minM3?: number; maxM3?: number }> = {
        'Camión': { minKg: 3000, maxKg: 50000, minM3: 10, maxM3: 100 },
        'Camioneta': { minKg: 500, maxKg: 3000, minM3: 2, maxM3: 15 },
        'Utilitario': { minKg: 200, maxKg: 1500, minM3: 1, maxM3: 8 },
      };

      const rule = capacityRules[tipoUnidad];
      if (rule) {
        if (capacidadKg < rule.minKg || capacidadKg > rule.maxKg) {
          return {
            passed: false,
            message: `Capacidad en kg inconsistente para ${tipoUnidad}: ${capacidadKg}kg`,
            details: { expected: `${rule.minKg}-${rule.maxKg}kg`, actual: `${capacidadKg}kg` }
          };
        }
      }
      
      return { passed: true };
    }
  },
  {
    id: 'personal-driver-license',
    name: 'Licencia de Conducir Válida',
    description: 'Los choferes deben tener licencia de conducir vigente',
    category: 'operational',
    entityType: 'personal',
    severity: 'error',
    enabled: true,
    validationFn: (personal) => {
      if (personal.tipoPersonal === 'Chofer') {
        const documentacion = personal.documentacion || {};
        const licencia = documentacion.licenciaConducir;
        
        if (!licencia || !licencia.numero) {
          return {
            passed: false,
            message: 'Chofer sin licencia de conducir',
            details: { personal: `${personal.nombre} ${personal.apellido}` }
          };
        }

        const vencimiento = new Date(licencia.vencimiento);
        const hoy = new Date();
        
        if (vencimiento < hoy) {
          return {
            passed: false,
            message: 'Licencia de conducir vencida',
            details: { 
              personal: `${personal.nombre} ${personal.apellido}`,
              vencimiento: licencia.vencimiento 
            }
          };
        }
      }
      
      return { passed: true };
    }
  },

  // Reglas Temporales
  {
    id: 'tarifa-date-overlap',
    name: 'Superposición de Fechas en Tarifas',
    description: 'No debe haber superposición de fechas en tarifas del mismo tramo',
    category: 'temporal',
    entityType: 'tramos',
    severity: 'error',
    enabled: true,
    validationFn: (tramo) => {
      const tarifas = (tramo.tarifas || []).filter((t: any) => t.activa);
      
      for (let i = 0; i < tarifas.length; i++) {
        for (let j = i + 1; j < tarifas.length; j++) {
          const tarifa1 = tarifas[i];
          const tarifa2 = tarifas[j];
          
          const inicio1 = new Date(tarifa1.fechaDesde);
          const fin1 = tarifa1.fechaHasta ? new Date(tarifa1.fechaHasta) : new Date('2099-12-31');
          const inicio2 = new Date(tarifa2.fechaDesde);
          const fin2 = tarifa2.fechaHasta ? new Date(tarifa2.fechaHasta) : new Date('2099-12-31');
          
          // Verificar superposición
          if (inicio1 <= fin2 && inicio2 <= fin1) {
            return {
              passed: false,
              message: 'Superposición de fechas en tarifas',
              details: {
                tarifa1: `${tarifa1.fechaDesde} - ${tarifa1.fechaHasta || 'indefinido'}`,
                tarifa2: `${tarifa2.fechaDesde} - ${tarifa2.fechaHasta || 'indefinido'}`
              }
            };
          }
        }
      }
      
      return { passed: true };
    }
  },
  {
    id: 'viaje-future-date',
    name: 'Fechas de Viaje Válidas',
    description: 'Los viajes no pueden tener fechas muy alejadas en el futuro',
    category: 'temporal',
    entityType: 'viajes',
    severity: 'warning',
    enabled: true,
    validationFn: (viaje) => {
      const fechaViaje = new Date(viaje.fecha);
      const hoy = new Date();
      const unAñoEnFuturo = new Date();
      unAñoEnFuturo.setFullYear(hoy.getFullYear() + 1);
      
      if (fechaViaje > unAñoEnFuturo) {
        return {
          passed: false,
          message: 'Fecha de viaje muy alejada en el futuro',
          details: { fecha: viaje.fecha }
        };
      }
      
      return { passed: true };
    }
  },

  // Reglas de Capacidad
  {
    id: 'site-coordinates-valid',
    name: 'Coordenadas de Site Válidas',
    description: 'Los sites deben tener coordenadas dentro de rangos válidos',
    category: 'capacity',
    entityType: 'sites',
    severity: 'error',
    enabled: true,
    validationFn: (site) => {
      const { latitud, longitud } = site.coordenadas || {};
      
      if (!latitud || !longitud) {
        return {
          passed: false,
          message: 'Site sin coordenadas',
          details: { site: site.nombre }
        };
      }
      
      // Validar rangos (Argentina aproximadamente)
      if (latitud < -55 || latitud > -21 || longitud < -73 || longitud > -53) {
        return {
          passed: false,
          message: 'Coordenadas fuera del rango esperado',
          details: { latitud, longitud, site: site.nombre }
        };
      }
      
      return { passed: true };
    }
  },

  // Reglas de Documentación
  {
    id: 'vehiculo-required-docs',
    name: 'Documentación Obligatoria de Vehículos',
    description: 'Los vehículos deben tener documentación obligatoria',
    category: 'documentation',
    entityType: 'vehiculos',
    severity: 'error',
    enabled: true,
    validationFn: (vehiculo) => {
      const documentacion = vehiculo.documentacion || {};
      const requiredDocs = ['tarjetaVerde', 'seguro', 'vtv'];
      
      for (const doc of requiredDocs) {
        if (!documentacion[doc] || !documentacion[doc].numero) {
          return {
            passed: false,
            message: `Falta documentación obligatoria: ${doc}`,
            details: { vehiculo: vehiculo.patente }
          };
        }
      }
      
      return { passed: true };
    }
  }
];