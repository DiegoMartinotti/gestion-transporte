import { useState, useCallback } from 'react';
import { useDataLoader } from './useDataLoader';
import { extraService, type Extra } from '../services/extraService';
import { clienteService } from '../services/clienteService';
import { Cliente } from '../types';
import { getVigenciaStatus, filterExtrasBySearch } from '../utils/extrasUtils';

interface UseExtrasDataReturn {
  // Estados
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedCliente: string;
  setSelectedCliente: (value: string) => void;
  selectedTipo: string;
  setSelectedTipo: (value: string) => void;
  activeTab: string;
  setActiveTab: (value: string) => void;

  // Datos
  extras: Extra[];
  filteredExtras: Extra[];
  loading: boolean;
  loadData: () => void;

  // Estadísticas
  vigenteCount: number;
  vencidoCount: number;
}

export const useExtrasData = (): UseExtrasDataReturn => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<string>('');
  const [selectedTipo, setSelectedTipo] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('vigentes');

  // Hook para cargar extras con filtros dinámicos
  const extrasLoader = useDataLoader<Extra>({
    fetchFunction: useCallback(async () => {
      const filters: Record<string, unknown> = {};
      if (selectedCliente) filters.cliente = selectedCliente;
      if (selectedTipo) filters.tipo = selectedTipo;
      if (activeTab === 'vigentes') filters.vigente = true;

      const response = await extraService.getExtras(filters);
      const data = Array.isArray(response) ? response : [];
      return {
        data,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: data.length,
          itemsPerPage: data.length,
        },
      };
    }, [selectedCliente, selectedTipo, activeTab]),
    dependencies: [selectedCliente, selectedTipo, activeTab],
    errorMessage: 'Error al cargar extras',
  });

  // Hook para cargar clientes (solo una vez)
  const clientesLoader = useDataLoader<Cliente>({
    fetchFunction: useCallback(async () => {
      const response = await clienteService.getAll();
      const data = response.data || response;
      return {
        data: Array.isArray(data) ? data : [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: Array.isArray(data) ? data.length : 0,
          itemsPerPage: Array.isArray(data) ? data.length : 0,
        },
      };
    }, []),
    errorMessage: 'Error cargando clientes',
  });

  const extras = extrasLoader.data;
  const loading = extrasLoader.loading || clientesLoader.loading;
  const loadData = extrasLoader.refresh;

  const filteredExtras = filterExtrasBySearch(extras, searchTerm);

  const vigenteCount = extras.filter((e) => getVigenciaStatus(e).status === 'vigente').length;
  const vencidoCount = extras.filter((e) => getVigenciaStatus(e).status === 'vencido').length;

  return {
    searchTerm,
    setSearchTerm,
    selectedCliente,
    setSelectedCliente,
    selectedTipo,
    setSelectedTipo,
    activeTab,
    setActiveTab,
    extras,
    filteredExtras,
    loading,
    loadData,
    vigenteCount,
    vencidoCount,
  };
};
