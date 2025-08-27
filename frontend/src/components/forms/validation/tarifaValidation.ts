export interface TarifaHistorica {
  _id?: string;
  tipo: 'TRMC' | 'TRMI';
  metodoCalculo: 'Kilometro' | 'Palet' | 'Fijo';
  valor: number;
  valorPeaje: number;
  vigenciaDesde: string;
  vigenciaHasta: string;
}

export const tarifaValidationRules = {
  valor: (value: number) => (value <= 0 ? 'El valor debe ser mayor a 0' : null),
  valorPeaje: (value: number) => (value < 0 ? 'El valor del peaje no puede ser negativo' : null),
  vigenciaDesde: (value: Date | null) => (!value ? 'Fecha de inicio es requerida' : null),
  vigenciaHasta: (value: Date | null, values: Record<string, unknown>) => {
    if (!value) return 'Fecha de fin es requerida';
    if (values.vigenciaDesde && value < values.vigenciaDesde) {
      return 'La fecha de fin debe ser posterior a la fecha de inicio';
    }
    return null;
  },
};

export const getInitialValues = (tarifa?: TarifaHistorica | null) => ({
  tipo: (tarifa?.tipo || 'TRMC') as 'TRMC' | 'TRMI',
  metodoCalculo: (tarifa?.metodoCalculo || 'Kilometro') as 'Kilometro' | 'Palet' | 'Fijo',
  valor: tarifa?.valor || 0,
  valorPeaje: tarifa?.valorPeaje || 0,
  vigenciaDesde: tarifa ? new Date(tarifa.vigenciaDesde) : new Date(),
  vigenciaHasta: tarifa ? new Date(tarifa.vigenciaHasta) : new Date(),
});

export function validateTarifaConflicts(
  formValues: Record<string, unknown>,
  existingTarifas: TarifaHistorica[],
  currentTarifa?: TarifaHistorica | null
): string[] {
  const conflicts: string[] = [];
  const { tipo, metodoCalculo, vigenciaDesde, vigenciaHasta } = formValues;

  if (!vigenciaDesde || !vigenciaHasta) return conflicts;

  // Filtrar tarifas existentes (excluyendo la que se está editando)
  const otherTarifas = existingTarifas.filter((t) => {
    if (currentTarifa && t._id === currentTarifa._id) return false;
    return true;
  });

  for (const existingTarifa of otherTarifas) {
    // Solo validar conflictos si tienen el mismo tipo y método de cálculo
    if (existingTarifa.tipo === tipo && existingTarifa.metodoCalculo === metodoCalculo) {
      const existingDesde = new Date(existingTarifa.vigenciaDesde);
      const existingHasta = new Date(existingTarifa.vigenciaHasta);

      // Verificar si hay superposición de fechas
      const noOverlap = vigenciaHasta < existingDesde || vigenciaDesde > existingHasta;

      if (!noOverlap) {
        conflicts.push(
          `Conflicto con tarifa ${existingTarifa.tipo}/${existingTarifa.metodoCalculo} vigente del ${existingDesde.toLocaleDateString()} al ${existingHasta.toLocaleDateString()}`
        );
      }
    }
  }

  return conflicts;
}
