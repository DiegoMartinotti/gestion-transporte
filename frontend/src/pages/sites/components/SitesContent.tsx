import React from 'react';
import { DataTable } from '../../../components/base';
import SiteMap from '../../../components/maps/SiteMap';
import { Site, SiteFilters } from '../../../types';

type FilterValue = string | number | boolean | Date | null | undefined;

interface SitesContentProps {
  viewMode: 'list' | 'map';
  sites: Site[];
  loading: boolean;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  selectedSite: Site | undefined;
  columns: Array<{
    key: string;
    label: string;
    sortable?: boolean;
    render?: (site: Site) => React.ReactNode;
    align?: 'center' | 'left' | 'right';
  }>;
  onPageChange: (page: number, pageSize: number) => void;
  onFiltersChange: (key: keyof Omit<SiteFilters, 'page' | 'limit'>, value: FilterValue) => void;
  onSiteSelect: (site: Site | undefined) => void;
  onSiteEdit: (site: Site) => void;
  setBaseFilters: React.Dispatch<React.SetStateAction<SiteFilters>>;
}

export const SitesContent: React.FC<SitesContentProps> = ({
  viewMode,
  sites,
  loading,
  pagination,
  selectedSite,
  columns,
  onPageChange,
  onFiltersChange,
  onSiteSelect,
  onSiteEdit,
  setBaseFilters,
}) => {
  if (viewMode === 'map') {
    return (
      <SiteMap
        sites={sites}
        selectedSite={selectedSite}
        onSiteSelect={onSiteSelect}
        onSiteEdit={onSiteEdit}
      />
    );
  }

  return (
    <DataTable<Site>
      columns={columns}
      data={sites}
      loading={loading}
      totalItems={pagination.totalItems}
      currentPage={pagination.currentPage}
      pageSize={pagination.itemsPerPage}
      onPageChange={(page) => onPageChange(page, pagination.itemsPerPage)}
      onPageSizeChange={(pageSize) => onPageChange(pagination.currentPage, pageSize)}
      onFiltersChange={(tableFilters) => {
        if (tableFilters.sortBy && tableFilters.sortOrder) {
          setBaseFilters((prev) => ({
            ...prev,
            sortBy: tableFilters.sortBy,
            sortOrder: tableFilters.sortOrder,
          }));
        }
        if (tableFilters.search !== undefined) {
          onFiltersChange('search', tableFilters.search);
        }
      }}
      showSearch
    />
  );
};
