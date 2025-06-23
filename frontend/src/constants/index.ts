// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Auth
export const TOKEN_KEY = 'auth_token';
export const USER_KEY = 'auth_user';

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Date formats
export const DATE_FORMAT = 'DD/MM/YYYY';
export const DATETIME_FORMAT = 'DD/MM/YYYY HH:mm';

// Entity types
export const EMPRESA_TIPOS = ['Propia', 'Subcontratada'] as const;
export const PERSONAL_TIPOS = ['Chofer', 'Administrativo', 'Operativo'] as const;
export const VEHICULO_TIPOS = ['Camion', 'Trailer', 'Chasis'] as const;
export const VIAJE_ESTADOS = ['Pendiente', 'En Curso', 'Completado', 'Cancelado'] as const;
export const MONEDAS = ['USD', 'ARS'] as const;
export const TIPOS_CALCULO = ['Distancia', 'Peso', 'Tiempo', 'Formula'] as const;
export const EXTRA_TIPOS = ['Fijo', 'Variable'] as const;
export const ORDEN_COMPRA_ESTADOS = ['Abierta', 'Cerrada'] as const;

// Colors for status
export const STATUS_COLORS = {
  Pendiente: 'yellow',
  'En Curso': 'blue',
  Completado: 'green',
  Cancelado: 'red',
  Abierta: 'blue',
  Cerrada: 'green',
} as const;

// Navigation items
export const NAVIGATION_ITEMS = [
  {
    label: 'Dashboard',
    icon: 'dashboard',
    link: '/',
  },
  {
    label: 'Clientes',
    icon: 'users',
    link: '/clientes',
  },
  {
    label: 'Empresas',
    icon: 'building',
    link: '/empresas',
  },
  {
    label: 'Personal',
    icon: 'user',
    link: '/personal',
  },
  {
    label: 'Sites',
    icon: 'map-pin',
    link: '/sites',
  },
  {
    label: 'Tramos',
    icon: 'route',
    link: '/tramos',
  },
  {
    label: 'Vehículos',
    icon: 'truck',
    link: '/vehiculos',
  },
  {
    label: 'Viajes',
    icon: 'map',
    link: '/viajes',
  },
] as const;

// Excel templates configuration
export const EXCEL_TEMPLATES = {
  CLIENTES: {
    name: 'Plantilla_Clientes.xlsx',
    requiredFields: ['nombre'],
    optionalFields: ['email', 'telefono', 'direccion', 'contacto'],
  },
  EMPRESAS: {
    name: 'Plantilla_Empresas.xlsx',
    requiredFields: ['nombre', 'tipo'],
    optionalFields: ['email', 'telefono', 'direccion', 'contacto'],
  },
  PERSONAL: {
    name: 'Plantilla_Personal.xlsx',
    requiredFields: ['nombre', 'apellido', 'tipo', 'empresa'],
    optionalFields: ['email', 'telefono', 'direccion'],
  },
  SITES: {
    name: 'Plantilla_Sites.xlsx',
    requiredFields: ['nombre', 'direccion', 'ciudad', 'provincia', 'pais', 'cliente'],
    optionalFields: ['codigoPostal', 'contacto', 'telefono'],
  },
  VEHICULOS: {
    name: 'Plantilla_Vehiculos.xlsx',
    requiredFields: ['patente', 'tipo', 'empresa'],
    optionalFields: ['marca', 'modelo', 'año'],
  },
} as const;

// Validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'Este campo es obligatorio',
  EMAIL: 'Debe ser un email válido',
  MIN_LENGTH: (min: number) => `Debe tener al menos ${min} caracteres`,
  MAX_LENGTH: (max: number) => `No puede tener más de ${max} caracteres`,
  INVALID_DATE: 'Fecha inválida',
  INVALID_NUMBER: 'Debe ser un número válido',
  INVALID_PHONE: 'Debe ser un teléfono válido',
} as const;