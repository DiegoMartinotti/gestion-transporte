import { UseFormReturnType } from '@mantine/form';
import type { OrdenCompraFormData, ViajeItem } from '../../../types/ordenCompra';
import type { Viaje } from '../../../types/viaje';

export interface OrdenCompraFormProps {
  initialData?: Partial<OrdenCompraFormData>;
  onSubmit: (data: OrdenCompraFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export type OrdenCompraFormType = UseFormReturnType<OrdenCompraFormData>;

export interface OrdenCompraFormContentProps {
  form: OrdenCompraFormType;
  showViajeAssigner: boolean;
  setShowViajeAssigner: (value: boolean) => void;
  viajesDisponibles: Viaje[];
  viajesData: Map<string, Viaje>;
  loadingViajes: boolean;
  loading: boolean;
  initialData?: Partial<OrdenCompraFormData>;
  onCancel: () => void;
  handleSubmit: (values: OrdenCompraFormData) => void;
  handleAddViaje: (viajes: ViajeItem[]) => void;
  handleRemoveViaje: (index: number) => void;
  handleUpdateImporte: (index: number, importe: number) => void;
  calculateTotal: () => number;
  getViajeInfo: (viajeId: string) => Viaje | undefined;
}

export interface InformacionBasicaCardProps {
  form: OrdenCompraFormType;
}

export interface ViajesCardProps {
  form: OrdenCompraFormType;
  loadingViajes: boolean;
  setShowViajeAssigner: (value: boolean) => void;
  handleRemoveViaje: (index: number) => void;
  handleUpdateImporte: (index: number, importe: number) => void;
  calculateTotal: () => number;
  getViajeInfo: (viajeId: string) => Viaje | undefined;
}

export interface ViajesTableProps {
  viajes: ViajeItem[];
  handleRemoveViaje: (index: number) => void;
  handleUpdateImporte: (index: number, importe: number) => void;
  calculateTotal: () => number;
  getViajeInfo: (viajeId: string) => Viaje | undefined;
}

export interface ActionsCardProps {
  onCancel: () => void;
  loading: boolean;
  initialData?: Partial<OrdenCompraFormData>;
}
