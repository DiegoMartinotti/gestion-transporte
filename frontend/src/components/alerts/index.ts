// Sistema Unificado de Alertas
export { 
  AlertSystemUnified as AlertSystem,
  type AlertData,
  type AlertSystemConfig,
  type AlertSystemProps
} from './AlertSystemUnified';

// Componentes base (mantener compatibilidad)
export { ExpirationManagerBase } from '../expiration/ExpirationManagerBase';

// Hooks relacionados
export { useNotifications } from '../../hooks/useNotifications';

// Re-exportar como aliases para migración gradual
export { AlertSystemUnified as DocumentExpirationSystem } from './AlertSystemUnified';
export { AlertSystemUnified as ExpirationAlerts } from './AlertSystemUnified';
export { AlertSystemUnified as DocumentExpiration } from './AlertSystemUnified';

// Configuraciones predefinidas para casos comunes
export const ALERT_PRESETS = {
  // Para documentación vehicular
  vehicleDocuments: {
    categoria: 'documentacion',
    entidadesPermitidas: ['vehiculo'],
    tiposAlerta: ['vtv', 'seguro', 'ruta', 'senasa', 'rto'],
    diasCritico: 7,
    diasProximo: 30
  },
  
  // Para documentación personal
  personalDocuments: {
    categoria: 'documentacion',
    entidadesPermitidas: ['personal'],
    tiposAlerta: ['licenciaConducir', 'aptitudPsicofisica', 'cargaPeligrosa'],
    diasCritico: 7,
    diasProximo: 30
  },
  
  // Para contratos
  contracts: {
    categoria: 'contratos',
    entidadesPermitidas: ['cliente', 'empresa'],
    tiposAlerta: ['contrato'],
    diasCritico: 15,
    diasProximo: 60
  },
  
  // Para seguros
  insurance: {
    categoria: 'seguros',
    entidadesPermitidas: ['vehiculo', 'empresa'],
    tiposAlerta: ['seguro'],
    diasCritico: 7,
    diasProximo: 30
  }
} as const;