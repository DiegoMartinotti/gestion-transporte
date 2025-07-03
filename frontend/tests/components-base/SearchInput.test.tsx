import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import SearchInput from '../SearchInput';

const renderWithProvider = (component: React.ReactNode) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
};

describe('SearchInput', () => {
  it('should render search input with placeholder', () => {
    renderWithProvider(
      <SearchInput
        value=""
        onChange={() => {}}
        placeholder="Buscar elementos..."
      />
    );
    
    expect(screen.getByPlaceholderText('Buscar elementos...')).toBeInTheDocument();
  });

  it('should display current value', () => {
    renderWithProvider(
      <SearchInput
        value="test search"
        onChange={() => {}}
      />
    );
    
    expect(screen.getByDisplayValue('test search')).toBeInTheDocument();
  });

  it('should call onChange when typing', async () => {
    const mockOnChange = jest.fn();
    
    renderWithProvider(
      <SearchInput
        value=""
        onChange={mockOnChange}
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new search' } });
    
    // Esperar el debounce
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('new search');
    }, { timeout: 600 });
  });

  it('should debounce onChange calls', async () => {
    const mockOnChange = jest.fn();
    
    renderWithProvider(
      <SearchInput
        value=""
        onChange={mockOnChange}
        debounceMs={300}
      />
    );
    
    const input = screen.getByRole('textbox');
    
    // Escribir rápidamente
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.change(input, { target: { value: 'abc' } });
    
    // No debería haber llamado onChange todavía
    expect(mockOnChange).not.toHaveBeenCalled();
    
    // Esperar el debounce
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('abc');
    }, { timeout: 400 });
    
    // Debería haber sido llamado solo una vez
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it('should render clear button when value is not empty', () => {
    renderWithProvider(
      <SearchInput
        value="test"
        onChange={() => {}}
      />
    );
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should clear value when clear button is clicked', () => {
    const mockOnChange = jest.fn();
    
    renderWithProvider(
      <SearchInput
        value="test"
        onChange={mockOnChange}
      />
    );
    
    const clearButton = screen.getByRole('button');
    fireEvent.click(clearButton);
    
    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('should not render clear button when value is empty', () => {
    renderWithProvider(
      <SearchInput
        value=""
        onChange={() => {}}
      />
    );
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});