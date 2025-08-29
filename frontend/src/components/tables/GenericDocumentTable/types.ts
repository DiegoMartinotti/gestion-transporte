// Tipos unificados para documentos
export const TIPOS_DOCUMENTO = {
  // Documentos de vehículos
  vtv: 'VTV',
  seguro: 'Seguro',
  ruta: 'RUTA',
  senasa: 'SENASA',
  rto: 'RTO',
  patente: 'Patente',
  // Documentos de personal
  licencia_conducir: 'Licencia de Conducir',
  curso_seguridad: 'Curso de Seguridad',
  examen_medico: 'Examen Médico',
  examen_psicotecnico: 'Examen Psicotécnico',
  // Documentos de empresa
  habilitacion_municipal: 'Habilitación Municipal',
  habilitacion_provincial: 'Habilitación Provincial',
  registro_conductor: 'Registro de Conductor',
  otros: 'Otros'
} as const;

export type TipoDocumento = keyof typeof TIPOS_DOCUMENTO;

export interface DocumentoGenerico {
  _id?: string;
  tipo: TipoDocumento;
  numero?: string;
  fechaVencimiento?: Date;
  fechaEmision?: Date;
  observaciones?: string;
  archivo?: string;
  entidadId?: string;
  entidadTipo?: 'vehiculo' | 'personal' | 'empresa';
  entidadNombre?: string;
}

export interface GenericDocumentTableProps {
  documentos: DocumentoGenerico[];
  entidadTipo: 'vehiculo' | 'personal' | 'empresa';
  onUpdate: (documentos: DocumentoGenerico[]) => void;
  onUpload?: (documento: DocumentoGenerico, file: File) => void;
  onDownload?: (documento: DocumentoGenerico) => void;
  readOnly?: boolean;
  title?: string;
  showEntidadInfo?: boolean;
  allowedTypes?: TipoDocumento[];
}

export interface DocumentStatus {
  status: 'vencido' | 'por-vencer' | 'vigente' | 'sin-fecha';
  color: string;
  label: string;
  diasRestantes?: number;
}

// Constantes
export const FILTER_ALL_VALUE = 'todos';
export const COLORS = {
  RED: 'red',
  ORANGE: 'orange',
  GREEN: 'green',
  GRAY: 'gray',
} as const;

export const SIZES = {
  SMALL: 'sm',
  EXTRA_SMALL: 'xs',
} as const;

export const VARIANTS = {
  LIGHT: 'light',
  SUBTLE: 'subtle',
} as const;