import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { validateFormula } from '../../../../services/tarifaService';
import type { TipoCalculo, CalculoConfig } from '../constants/tiposCalculo';

export function useTipoCalculoLogic(
  value: TipoCalculo,
  onChange?: (tipo: TipoCalculo, config: CalculoConfig) => void
) {
  const [selectedTipo, setSelectedTipo] = useState<TipoCalculo>(value);
  const [config, setConfig] = useState<CalculoConfig>({
    tipo: value,
    parametros: {
      factorMultiplicador: 1,
      valorMinimo: 0,
      redondeo: 'pesos',
      aplicarIVA: false,
      porcentajeIVA: 21,
    },
  });
  const [formulaError, setFormulaError] = useState<string | null>(null);
  const [formulaValid, setFormulaValid] = useState<boolean | null>(null);

  const formulaValidation = useMutation({
    mutationFn: validateFormula,
    onSuccess: (result: { valid: boolean; error?: string; variables?: string[] }) => {
      setFormulaValid(result.valid);
      setFormulaError(result.error || null);
      if (result.valid) {
        setConfig((prev) => ({
          ...prev,
          parametros: { ...prev.parametros, variables: result.variables },
        }));
      }
    },
  });

  const handleTipoChange = (tipo: TipoCalculo) => {
    setSelectedTipo(tipo);
    const newConfig = {
      tipo,
      parametros: {
        factorMultiplicador: 1,
        valorMinimo: 0,
        redondeo: 'pesos' as const,
        aplicarIVA: false,
        porcentajeIVA: 21,
      },
    };
    setConfig(newConfig);
    onChange?.(tipo, newConfig);
  };

  const handleConfigChange = (key: string, value: unknown) => {
    const newConfig = { ...config, parametros: { ...config.parametros, [key]: value } };
    setConfig(newConfig);
    onChange?.(selectedTipo, newConfig);
  };

  const handleFormulaChange = (formula: string) => {
    handleConfigChange('formula', formula);
    if (formula.trim()) {
      formulaValidation.mutateAsync(formula);
    } else {
      setFormulaValid(null);
      setFormulaError(null);
    }
  };

  return {
    selectedTipo,
    config,
    formulaError,
    formulaValid,
    handleTipoChange,
    handleConfigChange,
    handleFormulaChange,
  };
}
