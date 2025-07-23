import { renderHook, act } from '@testing-library/react';
import { useModal } from './useModal';

interface TestEntity {
  id: string;
  name: string;
}

describe('useModal', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useModal<TestEntity>());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.selectedItem).toBe(null);
    expect(result.current.loading).toBe(false);
  });

  it('should open modal for creating new item', () => {
    const { result } = renderHook(() => useModal<TestEntity>());

    act(() => {
      result.current.openCreate();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.selectedItem).toBe(null);
  });

  it('should open modal for editing existing item', () => {
    const { result } = renderHook(() => useModal<TestEntity>());
    const testItem: TestEntity = { id: '1', name: 'Test Item' };

    act(() => {
      result.current.openEdit(testItem);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.selectedItem).toBe(testItem);
  });

  it('should open modal for viewing item', () => {
    const { result } = renderHook(() => useModal<TestEntity>());
    const testItem: TestEntity = { id: '2', name: 'View Item' };

    act(() => {
      result.current.openView(testItem);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.selectedItem).toBe(testItem);
  });

  it('should open modal for deleting item', () => {
    const { result } = renderHook(() => useModal<TestEntity>());
    const testItem: TestEntity = { id: '3', name: 'Delete Item' };

    act(() => {
      result.current.openDelete(testItem);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.selectedItem).toBe(testItem);
  });

  it('should close modal and reset state', () => {
    const { result } = renderHook(() => useModal<TestEntity>());
    const testItem: TestEntity = { id: '4', name: 'Close Item' };

    // Open modal first
    act(() => {
      result.current.openEdit(testItem);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.selectedItem).toBe(testItem);

    // Close modal
    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.selectedItem).toBe(null);
    expect(result.current.loading).toBe(false);
  });

  it('should not reset selectedItem when resetOnClose is false', () => {
    const { result } = renderHook(() => 
      useModal<TestEntity>({ resetOnClose: false })
    );
    const testItem: TestEntity = { id: '5', name: 'Persist Item' };

    act(() => {
      result.current.openEdit(testItem);
    });

    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.selectedItem).toBe(testItem); // Should persist
  });

  it('should set loading state', () => {
    const { result } = renderHook(() => useModal<TestEntity>());

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.loading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.loading).toBe(false);
  });

  it('should call onOpen callback when modal opens', () => {
    const onOpen = jest.fn();
    const { result } = renderHook(() => useModal<TestEntity>({ onOpen }));
    const testItem: TestEntity = { id: '6', name: 'Callback Item' };

    act(() => {
      result.current.openEdit(testItem);
    });

    expect(onOpen).toHaveBeenCalledWith(testItem);
  });

  it('should call onClose callback when modal closes', () => {
    const onClose = jest.fn();
    const { result } = renderHook(() => useModal<TestEntity>({ onClose }));

    act(() => {
      result.current.openCreate();
    });

    act(() => {
      result.current.close();
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('should call onSuccess callback and close modal', () => {
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useModal<TestEntity>({ onSuccess }));

    act(() => {
      result.current.openCreate();
    });

    act(() => {
      result.current.onSuccess();
    });

    expect(onSuccess).toHaveBeenCalled();
    expect(result.current.isOpen).toBe(false);
  });

  it('should handle generic open method', () => {
    const { result } = renderHook(() => useModal<TestEntity>());
    const testItem: TestEntity = { id: '7', name: 'Generic Item' };

    // Open without item (create mode)
    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.selectedItem).toBe(null);

    // Close and open with item (edit mode)
    act(() => {
      result.current.close();
    });

    act(() => {
      result.current.open(testItem);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.selectedItem).toBe(testItem);
  });

  it('should maintain type safety', () => {
    const { result } = renderHook(() => useModal<TestEntity>());
    const testItem: TestEntity = { id: '8', name: 'Type Safe Item' };

    act(() => {
      result.current.openEdit(testItem);
    });

    // TypeScript should ensure selectedItem is of type TestEntity | null
    if (result.current.selectedItem) {
      expect(result.current.selectedItem.id).toBe('8');
      expect(result.current.selectedItem.name).toBe('Type Safe Item');
    }
  });
});