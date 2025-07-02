export interface Cliente {
  _id: string;
  nombre: string;
  cuit?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  contacto?: string;
  activo: boolean;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClienteFormData {
  nombre: string;
  cuit?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  contacto?: string;
  activo: boolean;
  observaciones?: string;
}

export interface ClienteFilter {
  nombre?: string;
  cuit?: string;
  activo?: boolean;
}