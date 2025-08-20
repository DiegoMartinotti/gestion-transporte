import { useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { siteService } from '../../../services/siteService';
import { Site, SiteFilters } from '../../../types';
import { ModalReturn } from '../../../hooks/useModal';

type FilterValue = string | number | boolean | Date | null | undefined;

interface ImportResult {
  success: boolean;
  summary?: {
    totalRows: number;
    insertedRows: number;
    errorRows: number;
  };
  hasMissingData?: boolean;
  importId?: string;
  errors?: unknown[];
}

export const useSitesActions = (
  loadSites: () => Promise<void>,
  deleteModal: ModalReturn<Site>,
  excelOperations: { handleImportComplete: (result: ImportResult) => void }
) => {
  const handleDelete = useCallback(
    async (site: Site) => {
      try {
        await siteService.delete(site._id);
        notifications.show({
          title: 'Éxito',
          message: 'Site eliminado correctamente',
          color: 'green',
        });
        await loadSites();
        deleteModal.close();
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: 'Error al eliminar site',
          color: 'red',
        });
      }
    },
    [loadSites, deleteModal]
  );

  const handleImportComplete = useCallback(
    async (result: ImportResult) => {
      excelOperations.handleImportComplete(result);
    },
    [excelOperations]
  );

  const handleFilterChange = useCallback(
    (key: keyof Omit<SiteFilters, 'page' | 'limit'>, value: FilterValue) => {
      // This will be handled by the parent component
      return { key, value };
    },
    []
  );

  const handlePageChange = useCallback((page: number, pageSize: number) => {
    return { page, pageSize };
  }, []);

  const openGoogleMaps = useCallback((site: Site) => {
    if (site.ubicacion?.latitud && site.ubicacion?.longitud) {
      const url = `https://www.google.com/maps?q=${site.ubicacion.latitud},${site.ubicacion.longitud}`;
      window.open(url, '_blank');
    }
  }, []);

  return {
    handleDelete,
    handleImportComplete,
    handleFilterChange,
    handlePageChange,
    openGoogleMaps,
  };
};
