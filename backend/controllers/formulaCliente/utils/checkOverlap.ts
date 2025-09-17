// @allow-duplicate: migración legítima de controlador monolítico a modular
import FormulasPersonalizadasCliente, {
  IFormulasPersonalizadasCliente,
} from '../../../models/FormulasPersonalizadasCliente';

/**
 * Helper para validar solapamiento de fórmulas
 */
interface CheckOverlapParams {
  clienteId: string;
  tipoUnidad: string;
  vigenciaDesde: Date;
  vigenciaHasta: Date | null;
  excludeId?: string | null;
}

export async function checkOverlap(
  params: CheckOverlapParams
): Promise<IFormulasPersonalizadasCliente | null> {
  const { clienteId, tipoUnidad, vigenciaDesde, vigenciaHasta, excludeId = null } = params;
  const query: Record<string, unknown> = {
    clienteId: clienteId,
    tipoUnidad: tipoUnidad,
    $or: [
      // Nueva fórmula empieza durante una existente
      {
        vigenciaDesde: { $lt: vigenciaHasta || new Date(8640000000000000) },
        vigenciaHasta: { $gt: vigenciaDesde },
      },
      // Nueva fórmula termina durante una existente
      {
        vigenciaDesde: { $lt: vigenciaHasta || new Date(8640000000000000) },
        vigenciaHasta: null,
      }, // Existente activa
      // Nueva fórmula envuelve completamente una existente
      {
        vigenciaDesde: { $gte: vigenciaDesde },
        vigenciaHasta: { $lte: vigenciaHasta || new Date(8640000000000000) },
      },
      // Existente envuelve completamente la nueva
      {
        vigenciaDesde: { $lte: vigenciaDesde },
        vigenciaHasta: { $gte: vigenciaHasta || new Date(8640000000000000) },
      },
      {
        vigenciaDesde: { $lte: vigenciaDesde },
        vigenciaHasta: null,
      }, // Existente activa
    ],
  };

  // Si estamos actualizando, excluimos el propio documento de la verificación
  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return await FormulasPersonalizadasCliente.findOne(query);
}
