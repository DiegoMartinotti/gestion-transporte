import {
  IconTruck,
  IconUser,
  IconMapPin,
  IconFileInvoice,
  IconAlertTriangle,
} from '@tabler/icons-react';

export interface ActivityItem {
  id: string;
  type: 'viaje' | 'cliente' | 'vehiculo' | 'factura' | 'alerta';
  title: string;
  description: string;
  timestamp: Date;
  user?: string;
  status?: 'success' | 'warning' | 'error' | 'info';
  entityId?: string;
  icon?: React.ComponentType<{ size?: number }>;
}

export const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    type: 'viaje',
    title: 'Viaje completado',
    description: 'Viaje #VJ-2024-0156 - Buenos Aires → Córdoba',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    user: 'Carlos Mendez',
    status: 'success',
    entityId: 'VJ-2024-0156',
    icon: IconTruck,
  },
  {
    id: '2',
    type: 'cliente',
    title: 'Nuevo cliente registrado',
    description: 'Transportes San Juan S.A. - Registro completado',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    user: 'Admin Sistema',
    status: 'info',
    entityId: 'CLI-0028',
    icon: IconUser,
  },
  {
    id: '3',
    type: 'alerta',
    title: 'Documento vencido',
    description: 'Seguro vehículo PAT123 vence en 3 días',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    user: 'Sistema',
    status: 'warning',
    entityId: 'VEH-PAT123',
    icon: IconAlertTriangle,
  },
  {
    id: '4',
    type: 'factura',
    title: 'Factura generada',
    description: 'Factura #FC-2024-0089 - Monto: $450.000',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    user: 'María González',
    status: 'success',
    entityId: 'FC-2024-0089',
    icon: IconFileInvoice,
  },
  {
    id: '5',
    type: 'vehiculo',
    title: 'Vehículo en mantenimiento',
    description: 'Camión PAT456 ingresó a mantenimiento programado',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    user: 'Juan Pérez',
    status: 'info',
    entityId: 'VEH-PAT456',
    icon: IconTruck,
  },
  {
    id: '6',
    type: 'viaje',
    title: 'Viaje iniciado',
    description: 'Viaje #VJ-2024-0157 - Rosario → Mendoza',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    user: 'Roberto Silva',
    status: 'info',
    entityId: 'VJ-2024-0157',
    icon: IconTruck,
  },
  {
    id: '7',
    type: 'cliente',
    title: 'Site actualizado',
    description: 'Nuevas coordenadas para depósito central - Logística Norte',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
    user: 'Ana Rodríguez',
    status: 'info',
    entityId: 'SITE-0142',
    icon: IconMapPin,
  },
  {
    id: '8',
    type: 'alerta',
    title: 'Licencia por vencer',
    description: 'Licencia de conducir Juan Pérez vence en 7 días',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    user: 'Sistema',
    status: 'warning',
    entityId: 'PER-0015',
    icon: IconAlertTriangle,
  },
];
