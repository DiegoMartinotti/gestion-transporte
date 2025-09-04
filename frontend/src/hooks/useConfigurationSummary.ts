import { useMemo } from 'react';
import { VehiculoAssignment } from '../components/viajes/VehiculoAssigner';

interface ConfigurationSummary {
  totalVehiculos: number;
  totalCamiones: number;
  capacidadTotal: number;
  costoEstimado: number;
  utilizacionPromedio: number;
  riesgos: Array<{
    tipo: 'warning' | 'error' | 'info';
    mensaje: string;
    vehiculoId?: string;
  }>;
}

interface ViajeData {
  tramo?: unknown;
  extras?: unknown[];
  cargaTotal?: number;
  distanciaTotal?: number;
  fechaViaje?: Date;
}

const calculateBasicRisks = (assignment: VehiculoAssignment): ConfigurationSummary['riesgos'] => {
  const risks: ConfigurationSummary['riesgos'] = [];

  if (!assignment.vehiculo) {
    risks.push({
      tipo: 'error',
      mensaje: 'Vehículo no seleccionado',
      vehiculoId: assignment.id,
    });
  }

  if (!assignment.conductor) {
    risks.push({
      tipo: 'error',
      mensaje: 'Conductor no asignado',
      vehiculoId: assignment.id,
    });
  }

  return risks;
};

const calculateDocumentationRisks = (
  assignment: VehiculoAssignment
): ConfigurationSummary['riesgos'] => {
  const risks: ConfigurationSummary['riesgos'] = [];

  if (assignment.vehiculo?.documentacion) {
    const docVencidos = assignment.vehiculo.documentacion.filter(
      (doc) => doc.fechaVencimiento && new Date(doc.fechaVencimiento) < new Date()
    );

    if (docVencidos.length > 0) {
      risks.push({
        tipo: 'warning',
        mensaje: `${docVencidos.length} documento(s) vencido(s)`,
        vehiculoId: assignment.id,
      });
    }
  }

  if (assignment.conductor?.documentacion?.licenciaConducir?.vencimiento) {
    const hasExpiredDocs =
      new Date(assignment.conductor.documentacion.licenciaConducir.vencimiento) < new Date();

    if (hasExpiredDocs) {
      risks.push({
        tipo: 'warning',
        mensaje: `Conductor con documentación vencida`,
        vehiculoId: assignment.id,
      });
    }
  }

  return risks;
};

export function useConfigurationSummary(
  assignments: VehiculoAssignment[],
  viajeData?: ViajeData
): ConfigurationSummary {
  return useMemo((): ConfigurationSummary => {
    const totalVehiculos = assignments.length;
    const totalCamiones = assignments.reduce((sum, a) => sum + (a.cantidadCamiones || 0), 0);
    const capacidadTotal = assignments.reduce(
      (sum, a) => sum + 10000 * (a.cantidadCamiones || 0),
      0
    );

    const riesgos: ConfigurationSummary['riesgos'] = [];

    assignments.forEach((assignment) => {
      riesgos.push(...calculateBasicRisks(assignment));
      riesgos.push(...calculateDocumentationRisks(assignment));
    });

    // Calcular utilización promedio
    const utilizacionPromedio =
      viajeData?.cargaTotal && capacidadTotal > 0
        ? (viajeData.cargaTotal / capacidadTotal) * 100
        : 0;

    // Costo estimado (simplificado)
    const costoEstimado = assignments.reduce((sum, assignment) => {
      const costoBase = 50000;
      const costoPorKm = 150;
      const distancia = viajeData?.distanciaTotal || 0;
      const cantidadCamiones = assignment.cantidadCamiones || 0;

      return sum + (costoBase + costoPorKm * distancia) * cantidadCamiones;
    }, 0);

    return {
      totalVehiculos,
      totalCamiones,
      capacidadTotal,
      costoEstimado,
      utilizacionPromedio,
      riesgos,
    };
  }, [assignments, viajeData]);
}
