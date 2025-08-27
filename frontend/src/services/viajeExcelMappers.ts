import type { Viaje } from '../types/viaje';
import type { ExcelRowData } from '../types/excel';

// Interfaces
interface Site {
  _id: string;
  nombre: string;
  cliente: string;
}

interface PersonalItem {
  _id: string;
  dni: string;
  nombre: string;
  apellido: string;
}

interface VehiculoItem {
  _id: string;
  dominio: string;
  empresa: string;
}

interface ClienteObject {
  _id: string;
  nombre?: string;
  Cliente?: string;
}

interface RowValues {
  origenNombre: string | number | boolean | Date | null | undefined;
  destinoNombre: string | number | boolean | Date | null | undefined;
  choferDni: string | number | boolean | Date | null | undefined;
  vehiculoDominio: string | number | boolean | Date | null | undefined;
  fechaValue: string | number | Date | boolean | null | undefined;
}

interface ResolvedIds {
  origenId: string | undefined;
  destinoId: string | undefined;
  choferId: string | undefined;
  vehiculoId: string | undefined;
}

interface ResolveIdsParams {
  origenNombre: string | number | boolean | Date | null | undefined;
  destinoNombre: string | number | boolean | Date | null | undefined;
  choferDni: string | number | boolean | Date | null | undefined;
  vehiculoDominio: string | number | boolean | Date | null | undefined;
  siteMap: Map<string, string>;
  personalMap: Map<string, string>;
  vehiculoMap: Map<string, string>;
}

interface ValidateIdsParams {
  origenId: string | undefined;
  destinoId: string | undefined;
  choferId: string | undefined;
  vehiculoId: string | undefined;
  origenNombre: string | number | boolean | Date | null | undefined;
  destinoNombre: string | number | boolean | Date | null | undefined;
  choferDniStr: string;
  vehiculoDominio: string | number | boolean | Date | null | undefined;
}

interface CreateViajeParams {
  row: ExcelRowData;
  clienteId: string;
  origenId: string;
  destinoId: string;
  choferId: string;
  vehiculoId: string;
  fechaValue: string | number | Date | boolean | null | undefined;
}

interface MapExcelParams {
  row: ExcelRowData;
  index: number;
  siteMap: Map<string, string>;
  personalMap: Map<string, string>;
  vehiculoMap: Map<string, string>;
  clienteId: string;
}

// Constantes para evitar duplicación de strings
const FIELD_KEYS = {
  ORIGEN: ['Site Origen *', 'Site Origen', 'origen'] as string[],
  DESTINO: ['Site Destino *', 'Site Destino', 'destino'] as string[],
  CHOFER: ['Chofer *', 'Chofer', 'chofer'] as string[],
};

export class ViajeExcelMappers {
  private static getFieldValue(
    row: ExcelRowData,
    fieldNames: string[]
  ): string | number | boolean | Date | null | undefined {
    const foundFieldName = fieldNames.find((fieldName) => row[fieldName]);
    return foundFieldName ? row[foundFieldName] : undefined;
  }

  private static extractRowValues(row: ExcelRowData): RowValues {
    return {
      origenNombre: this.getFieldValue(row, FIELD_KEYS.ORIGEN),
      destinoNombre: this.getFieldValue(row, FIELD_KEYS.DESTINO),
      choferDni: this.getFieldValue(row, FIELD_KEYS.CHOFER),
      vehiculoDominio: this.getFieldValue(row, [
        'Vehículo Principal *',
        'Vehículo Principal',
        'vehiculoPrincipal',
      ]),
      fechaValue: this.getFieldValue(row, ['Fecha *', 'Fecha', 'fecha']),
    };
  }

  private static resolveRowIds(params: ResolveIdsParams): ResolvedIds {
    const {
      origenNombre,
      destinoNombre,
      choferDni,
      vehiculoDominio,
      siteMap,
      personalMap,
      vehiculoMap,
    } = params;

    const origenId = siteMap.get(String(origenNombre || '').toLowerCase());
    const destinoId = siteMap.get(String(destinoNombre || '').toLowerCase());

    console.log(`Buscando chofer con DNI: "${choferDni}" (tipo: ${typeof choferDni})`);
    const choferDniStr = String(choferDni || '');
    const choferId = personalMap.get(choferDniStr);
    console.log(`Chofer encontrado: ${choferId ? 'SÍ' : 'NO'} (ID: ${choferId})`);

    const vehiculoId = vehiculoMap.get(String(vehiculoDominio || '').toLowerCase());

    return { origenId, destinoId, choferId, vehiculoId };
  }

  private static validateRowIds(params: ValidateIdsParams): void {
    const {
      origenId,
      destinoId,
      choferId,
      vehiculoId,
      origenNombre,
      destinoNombre,
      choferDniStr,
      vehiculoDominio,
    } = params;

    if (!origenId) throw new Error(`Site origen "${origenNombre}" no encontrado`);
    if (!destinoId) throw new Error(`Site destino "${destinoNombre}" no encontrado`);
    if (!choferId) throw new Error(`Chofer con DNI "${choferDniStr}" no encontrado`);
    if (!vehiculoId) throw new Error(`Vehículo con dominio "${vehiculoDominio}" no encontrado`);

    if (typeof choferId !== 'string' || choferId.length !== 24) {
      throw new Error(`ID de chofer inválido: "${choferId}" (DNI: ${choferDniStr})`);
    }

    if (typeof vehiculoId !== 'string' || vehiculoId.length !== 24) {
      throw new Error(`ID de vehículo inválido: "${vehiculoId}" (dominio: ${vehiculoDominio})`);
    }
  }

  /**
   * Convertir fecha de Excel a formato Date
   */
  private static parseExcelDate(
    dateValue: string | number | Date | boolean | null | undefined
  ): Date {
    if (!dateValue) return new Date();

    // Si ya es una fecha
    if (dateValue instanceof Date) return dateValue;

    // Si es string en formato DD/MM/YYYY
    if (typeof dateValue === 'string' && dateValue.includes('/')) {
      const [day, month, year] = dateValue.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Si es número de Excel (días desde 1900)
    if (typeof dateValue === 'number') {
      return new Date((dateValue - 25569) * 86400 * 1000);
    }

    // Fallback: intentar parsear como fecha
    return new Date(String(dateValue));
  }

  private static createViajeData(params: CreateViajeParams): Partial<Viaje> {
    const { row, clienteId, origenId, destinoId, choferId, vehiculoId, fechaValue } = params;

    const paletasValue = this.getFieldValue(row, ['Paletas', 'paletas']);
    const paletasNumber = paletasValue ? parseInt(String(paletasValue)) : 0;

    return {
      cliente: clienteId,
      origen: origenId,
      destino: destinoId,
      tipoTramo: String(this.getFieldValue(row, ['Tipo Tramo', 'tipoTramo']) || ''),
      fecha: this.parseExcelDate(fechaValue || new Date()).toISOString(),
      chofer: choferId,
      vehiculos: [{ vehiculo: vehiculoId, posicion: 1, _id: '' }],
      dt: String(this.getFieldValue(row, ['DT *', 'DT', 'dt']) || ''),
      paletas: paletasNumber,
      estado:
        (this.getFieldValue(row, ['Estado', 'estado']) as
          | 'Pendiente'
          | 'En Progreso'
          | 'Completado'
          | 'Cancelado'
          | 'Facturado') || 'Pendiente',
      observaciones: String(this.getFieldValue(row, ['Observaciones', 'observaciones']) || ''),
      total: 0,
    };
  }

  static mapExcelRowToViaje(params: MapExcelParams): Partial<Viaje> {
    const { row, index, siteMap, personalMap, vehiculoMap, clienteId } = params;

    const { origenNombre, destinoNombre, choferDni, vehiculoDominio, fechaValue } =
      this.extractRowValues(row);
    const { origenId, destinoId, choferId, vehiculoId } = this.resolveRowIds({
      origenNombre,
      destinoNombre,
      choferDni,
      vehiculoDominio,
      siteMap,
      personalMap,
      vehiculoMap,
    });

    const choferDniStr = String(choferDni || '');
    this.validateRowIds({
      origenId,
      destinoId,
      choferId,
      vehiculoId,
      origenNombre,
      destinoNombre,
      choferDniStr,
      vehiculoDominio,
    });

    // Después de la validación, sabemos que los IDs no son undefined
    const viajeData = this.createViajeData({
      row,
      clienteId,
      origenId: origenId as string,
      destinoId: destinoId as string,
      choferId: choferId as string,
      vehiculoId: vehiculoId as string,
      fechaValue,
    });

    console.log(`Viaje ${index + 1} mapeado:`, viajeData);
    return viajeData;
  }
}

// Exportar las interfaces para reutilización
export type { Site, PersonalItem, VehiculoItem, ClienteObject, MapExcelParams };
