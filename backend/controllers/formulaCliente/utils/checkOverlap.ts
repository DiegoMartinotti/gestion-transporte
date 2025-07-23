// @allow-duplicate: migración legítima de controlador monolítico a modular
import FormulasPersonalizadasCliente, { IFormulasPersonalizadasCliente } from '../../../models/FormulasPersonalizadasCliente';

/**
 * Helper para validar solapamiento de fórmulas
 */
export async function checkOverlap(
  clienteId: string, 
  tipoUnidad: string, 
  vigenciaDesde: Date, 
  vigenciaHasta: Date | null, 
  excludeId: string | null = null
): Promise<IFormulasPersonalizadasCliente | null> {
  const query: any = {
    clienteId: clienteId,
    tipoUnidad: tipoUnidad,
    $or: [
      // Nueva fórmula empieza durante una existente
      { 
        vigenciaDesde: { $lt: vigenciaHasta || new Date(8640000000000000) }, 
        vigenciaHasta: { $gt: vigenciaDesde } 
      },
      // Nueva fórmula termina durante una existente
      { 
        vigenciaDesde: { $lt: vigenciaHasta || new Date(8640000000000000) }, 
        vigenciaHasta: null 
      }, // Existente activa
      // Nueva fórmula envuelve completamente una existente
      { 
        vigenciaDesde: { $gte: vigenciaDesde }, 
        vigenciaHasta: { $lte: vigenciaHasta || new Date(8640000000000000) } 
      },
      // Existente envuelve completamente la nueva
      { 
        vigenciaDesde: { $lte: vigenciaDesde }, 
        vigenciaHasta: { $gte: vigenciaHasta || new Date(8640000000000000) } 
      },
      { 
        vigenciaDesde: { $lte: vigenciaDesde }, 
        vigenciaHasta: null 
      } // Existente activa
    ]
  };
  
  // Si estamos actualizando, excluimos el propio documento de la verificación
  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const overlappingFormula = await FormulasPersonalizadasCliente.findOne(query);
  return overlappingFormula;
}