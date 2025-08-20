import React from 'react';
import { DataTable } from '../../../components/base';
import SiteMap from '../../../components/maps/SiteMap';
import { Site, PaginationData, SiteFilters } from '../../../types';

type FilterValue = string | number | boolean | Date | null | undefined;

interface SitesContentProps {
  viewMode: 'list' | 'map';
  sites: Site[];
  loading: boolean;
  pagination: PaginationData;
  selectedSite: Site | null;
  columns: Array<{
    accessor: string;
    title: string;
    sortable?: boolean;
    render?: (site: Site) => React.ReactNode;
    textAlign?: 'center' | 'left' | 'right';
  }>;
  onPageChange: (page: number, pageSize: number) => void;
  onFiltersChange: (key: keyof Omit<SiteFilters, 'page' | 'limit'>, value: FilterValue) => void;
  onSiteSelect: (site: Site | null) => void;
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
      pagination={pagination}
      onPageChange={onPageChange}
      onFiltersChange={(tableFilters) => {
        if (tableFilters.sortBy && tableFilters.sortOrder) {
          setBaseFilters((prev) => ({
            ...prev,
            sortBy: tableFilters.sortBy,
            sortOrder: tableFilters.sortOrder,
          }));
        }
      }}
      searchable
      onSearchChange={(search) => onFiltersChange('search', search)}
    />
  );
};
