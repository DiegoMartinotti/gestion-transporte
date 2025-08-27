import React from 'react';
import { UseFormReturnType } from '@mantine/form';

// Tipos base para formularios
export interface BaseFormValues {
  [key: string]: unknown;
}

// Tipos para eventos de React
export type ChangeEvent = React.ChangeEvent<HTMLInputElement>;
export type SelectChangeEvent = React.ChangeEvent<HTMLSelectElement>;
export type TextAreaChangeEvent = React.ChangeEvent<HTMLTextAreaElement>;
export type FormEvent = React.FormEvent<HTMLFormElement>;
export type MouseEvent = React.MouseEvent<HTMLButtonElement>;
export type ClickEvent = React.MouseEvent<HTMLElement>;

// Tipos para handlers
export type ChangeHandler = (event: ChangeEvent) => void;
export type SelectChangeHandler = (event: SelectChangeEvent) => void;
export type SubmitHandler<T = BaseFormValues> = (values: T) => void | Promise<void>;
export type ClickHandler = (event: ClickEvent) => void;

// Tipos genéricos para formularios
export type FormReturn<T = BaseFormValues> = UseFormReturnType<T>;

// Tipos para validadores dinámicos
export type ValidationValue = string | number | boolean | Date | null | undefined;
export type ValidationHandler = (value: ValidationValue) => string | null;
export type ValidationRules = Record<string, ValidationHandler>;

// Tipos para campos dinámicos
export interface DynamicFieldConfig {
  name: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean' | 'textarea';
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string | number; label: string }>;
  validation?: ValidationHandler;
}

// Tipos para listas dinámicas
export interface DynamicListFieldProps<T = Record<string, unknown>> {
  title: string;
  form: UseFormReturnType<{ [key: string]: T[] }>;
  path: string;
  initialItem: T;
  renderFields: (
    item: T,
    index: number,
    form: UseFormReturnType<{ [key: string]: T[] }>
  ) => React.ReactNode;
  minItems?: number;
  maxItems?: number;
  canRemove?: (index: number) => boolean;
  itemLabel?: (index: number) => string;
  addButtonText?: string;
  validation?: ValidationRules;
}

// Tipos específicos para formularios de entidades
export interface ClienteFormValues {
  nombre: string;
  cuit: string;
  email: string;
  telefono: string;
  direccion: string;
  contacto: string;
  activo: boolean;
  observaciones: string;
}

export interface EmpresaFormValues {
  nombre: string;
  tipo: 'Propia' | 'Subcontratada';
  razonSocial: string;
  direccion: string;
  telefono: string;
  mail: string;
  cuit: string;
  rut: string;
  activa: boolean;
  observaciones: string;
}

export interface VehiculoFormValues {
  patente: string;
  tipo: 'Camion' | 'Trailer' | 'Chasis';
  marca: string;
  modelo: string;
  año: number;
  empresa: string;
  activo: boolean;
}

export interface PersonalFormValues {
  nombre: string;
  apellido: string;
  dni: string;
  cuil: string;
  tipo: 'Conductor' | 'Administrativo' | 'Mecánico' | 'Supervisor' | 'Otro';
  empresa: string;
  activo: boolean;
  fechaNacimiento?: Date;
  direccion?: {
    calle?: string;
    numero?: string;
    localidad?: string;
    provincia?: string;
    codigoPostal?: string;
  };
  contacto?: {
    telefono?: string;
    telefonoEmergencia?: string;
    email?: string;
  };
}

// Tipos para componentes de mapas
export interface MapLocation {
  lat: number;
  lng: number;
}

export interface MapMarker {
  id: string;
  position: MapLocation;
  title: string;
  type?: 'origen' | 'destino' | 'site';
  color?: string;
}

export interface MapRoute {
  points: MapLocation[];
  color?: string;
  weight?: number;
}

// Tipos para selectors
export interface SelectorItem {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface SelectorProps<T = SelectorItem> {
  data: T[];
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  multiple?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
}
