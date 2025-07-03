import { renderHook, act } from '@testing-library/react';
import { useSearch } from '../useSearch';

describe('useSearch', () => {
  it('should initialize with empty search term', () => {
    const { result } = renderHook(() => useSearch());
    
    expect(result.current.searchTerm).toBe('');
    expect(result.current.debouncedSearchTerm).toBe('');
  });

  it('should update search term immediately', () => {
    const { result } = renderHook(() => useSearch());
    
    act(() => {
      result.current.setSearchTerm('test search');
    });
    
    expect(result.current.searchTerm).toBe('test search');
  });

  it('should debounce search term updates', async () => {
    const { result } = renderHook(() => useSearch(300));
    
    act(() => {
      result.current.setSearchTerm('test');
    });
    
    // Debounced value should not change immediately
    expect(result.current.debouncedSearchTerm).toBe('');
    
    // Wait for debounce
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 350));
    });
    
    expect(result.current.debouncedSearchTerm).toBe('test');
  });

  it('should clear search term', () => {
    const { result } = renderHook(() => useSearch());
    
    act(() => {
      result.current.setSearchTerm('test search');
    });
    
    expect(result.current.searchTerm).toBe('test search');
    
    act(() => {
      result.current.clearSearch();
    });
    
    expect(result.current.searchTerm).toBe('');
  });

  it('should handle rapid search term changes', async () => {
    const { result } = renderHook(() => useSearch(200));
    
    act(() => {
      result.current.setSearchTerm('a');
    });
    
    act(() => {
      result.current.setSearchTerm('ab');
    });
    
    act(() => {
      result.current.setSearchTerm('abc');
    });
    
    // Should still show empty debounced value
    expect(result.current.debouncedSearchTerm).toBe('');
    expect(result.current.searchTerm).toBe('abc');
    
    // Wait for debounce
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 250));
    });
    
    // Should show final value
    expect(result.current.debouncedSearchTerm).toBe('abc');
  });

  it('should filter data based on search term', () => {
    const mockData = [
      { id: 1, name: 'Cliente A', email: 'clientea@test.com' },
      { id: 2, name: 'Cliente B', email: 'clienteb@test.com' },
      { id: 3, name: 'Empresa C', email: 'empresac@test.com' }
    ];
    
    const searchFields = ['name', 'email'];
    const { result } = renderHook(() => useSearch(0, mockData, searchFields));
    
    // Test search in name
    act(() => {
      result.current.setSearchTerm('Cliente');
    });
    
    expect(result.current.filteredData).toHaveLength(2);
    expect(result.current.filteredData[0].name).toBe('Cliente A');
    expect(result.current.filteredData[1].name).toBe('Cliente B');
    
    // Test search in email
    act(() => {
      result.current.setSearchTerm('empresac');
    });
    
    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].name).toBe('Empresa C');
  });

  it('should return all data when search term is empty', () => {
    const mockData = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' }
    ];
    
    const { result } = renderHook(() => useSearch(0, mockData, ['name']));
    
    expect(result.current.filteredData).toHaveLength(2);
    
    act(() => {
      result.current.setSearchTerm('');
    });
    
    expect(result.current.filteredData).toHaveLength(2);
  });
});