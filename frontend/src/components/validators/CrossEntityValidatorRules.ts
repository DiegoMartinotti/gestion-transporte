// Reglas por defecto para CrossEntityValidator
import { CrossEntityRuleConfig } from './CrossEntityValidatorTypes';

export const defaultRules: CrossEntityRuleConfig[] = [
  {
    id: 'cliente-site-relationship',
    name: 'Relación Cliente-Site',
    description: 'Verificar que todos los sites pertenezcan a clientes existentes',
    entityType: 'sites',
    dependencies: ['clientes'],
    severity: 'error',
  },
  {
    id: 'empresa-personal-relationship',
    name: 'Relación Empresa-Personal',
    description: 'Verificar que todo el personal pertenezca a empresas existentes',
    entityType: 'personal',
    dependencies: ['empresas'],
    severity: 'error',
  },
  {
    id: 'empresa-vehiculo-relationship',
    name: 'Relación Empresa-Vehículo',
    description: 'Verificar que todos los vehículos pertenezcan a empresas existentes',
    entityType: 'vehiculos',
    dependencies: ['empresas'],
    severity: 'error',
  },
  {
    id: 'tramo-site-relationship',
    name: 'Relación Tramo-Site',
    description: 'Verificar que origen y destino de tramos sean sites existentes',
    entityType: 'tramos',
    dependencies: ['sites'],
    severity: 'error',
  },
  {
    id: 'tramo-cliente-relationship',
    name: 'Relación Tramo-Cliente',
    description: 'Verificar que los tramos pertenezcan a clientes existentes',
    entityType: 'tramos',
    dependencies: ['clientes'],
    severity: 'error',
  },
  {
    id: 'viaje-tramo-relationship',
    name: 'Relación Viaje-Tramo',
    description: 'Verificar que los viajes usen tramos existentes',
    entityType: 'viajes',
    dependencies: ['tramos'],
    severity: 'error',
  },
  {
    id: 'viaje-vehiculo-relationship',
    name: 'Relación Viaje-Vehículo',
    description: 'Verificar que los viajes usen vehículos existentes',
    entityType: 'viajes',
    dependencies: ['vehiculos'],
    severity: 'warning',
  },
  {
    id: 'extra-cliente-relationship',
    name: 'Relación Extra-Cliente',
    description: 'Verificar que los extras pertenezcan a clientes existentes',
    entityType: 'extras',
    dependencies: ['clientes'],
    severity: 'error',
  },
];
