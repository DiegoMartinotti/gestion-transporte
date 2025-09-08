import type { Personal } from '../../types';

// Tipos para helpers
export interface DocumentInfo {
  name: string;
  days: number;
  expired: boolean;
  expiring: boolean;
}

export interface DocumentStatus {
  expired: number;
  expiring: number;
  valid: number;
  total: number;
  documents: DocumentInfo[];
}

export interface PersonalCardProps {
  personal: Personal;
  onEdit?: (personal: Personal) => void;
  onDelete?: (personal: Personal) => void;
  onView?: (personal: Personal) => void;
  onToggleActive?: (personal: Personal) => void;
  showActions?: boolean;
  compact?: boolean;
}
