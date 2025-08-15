import { useState, useMemo } from 'react';
import { ImportError } from './useErrorCorrections';

export const useErrorFilters = (errors: ImportError[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const filteredErrors = useMemo(() => {
    return errors.filter((error) => {
      const valueStr = String(error.value);
      const matchesSearch =
        searchTerm === '' ||
        error.field.toLowerCase().includes(searchTerm.toLowerCase()) ||
        error.error.toLowerCase().includes(searchTerm.toLowerCase()) ||
        valueStr.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSeverity = filterSeverity === 'all' || error.severity === filterSeverity;

      return matchesSearch && matchesSeverity;
    });
  }, [errors, searchTerm, filterSeverity]);

  return {
    searchTerm,
    setSearchTerm,
    filterSeverity,
    setFilterSeverity,
    filteredErrors,
  };
};
