import { useState, useMemo } from 'react';
import { DocumentoVencimiento, ExpirationConfig } from '../ExpirationManagerBase';
import {
  DEFAULT_CONFIG,
  calculateDocumentsWithState,
  filterDocuments,
  calculateStatistics,
  groupDocumentsByDate,
} from '../helpers/expirationHelpers';

export const useExpirationManager = (
  documentos: DocumentoVencimiento[],
  config: ExpirationConfig = DEFAULT_CONFIG
) => {
  const [selectedTab, setSelectedTab] = useState('alerts');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filtroEntidad, setFiltroEntidad] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [tempConfig, setTempConfig] = useState<ExpirationConfig>(config);

  // Configuración efectiva memorizada
  const effectiveConfig = useMemo(
    () => ({
      ...DEFAULT_CONFIG,
      ...config,
    }),
    [config]
  );

  // Calcular estados de documentos
  const documentosConEstado = useMemo(() => {
    return calculateDocumentsWithState(documentos, effectiveConfig);
  }, [documentos, effectiveConfig]);

  // Filtrar documentos
  const documentosFiltrados = useMemo(() => {
    return filterDocuments(documentosConEstado, filtroEntidad, filtroEstado, effectiveConfig);
  }, [documentosConEstado, filtroEntidad, filtroEstado, effectiveConfig]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    return calculateStatistics(documentosFiltrados);
  }, [documentosFiltrados]);

  // Documentos por fecha (para calendario)
  const documentosPorFecha = useMemo(() => {
    return groupDocumentsByDate(documentosFiltrados);
  }, [documentosFiltrados]);

  return {
    // Estados
    selectedTab,
    selectedDate,
    filtroEntidad,
    filtroEstado,
    tempConfig,

    // Setters
    setSelectedTab,
    setSelectedDate,
    setFiltroEntidad,
    setFiltroEstado,
    setTempConfig,

    // Datos calculados
    effectiveConfig,
    documentosConEstado,
    documentosFiltrados,
    estadisticas,
    documentosPorFecha,
  };
};
