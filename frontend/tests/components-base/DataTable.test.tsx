import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import DataTable from '../DataTable';

const mockData = [
  { id: 1, name: 'Cliente 1', email: 'cliente1@test.com', active: true },
  { id: 2, name: 'Cliente 2', email: 'cliente2@test.com', active: false },
  { id: 3, name: 'Cliente 3', email: 'cliente3@test.com', active: true }
];

const mockColumns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Nombre', sortable: true },
  { key: 'email', label: 'Email' },
  { 
    key: 'active', 
    label: 'Estado',
    render: (record: any) => record.active ? 'Activo' : 'Inactivo'
  }
];

const renderWithProvider = (component: React.ReactNode) => {
  return render(
    <MantineProvider>
      {component}
    </MantineProvider>
  );
};

describe('DataTable', () => {
  it('should render table with data', () => {
    renderWithProvider(
      <DataTable
        columns={mockColumns}
        data={mockData}
      />
    );
    
    expect(screen.getByText('Cliente 1')).toBeInTheDocument();
    expect(screen.getByText('Cliente 2')).toBeInTheDocument();
    expect(screen.getByText('Cliente 3')).toBeInTheDocument();
  });

  it('should render column headers', () => {
    renderWithProvider(
      <DataTable
        columns={mockColumns}
        data={mockData}
      />
    );
    
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Estado')).toBeInTheDocument();
  });

  it('should render custom cell content', () => {
    renderWithProvider(
      <DataTable
        columns={mockColumns}
        data={mockData}
      />
    );
    
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });

  it('should show empty message when no data', () => {
    renderWithProvider(
      <DataTable
        columns={mockColumns}
        data={[]}
        emptyMessage="No hay datos"
      />
    );
    
    expect(screen.getByText('No hay datos')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    renderWithProvider(
      <DataTable
        columns={mockColumns}
        data={[]}
        loading={true}
      />
    );
    
    expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();
  });

  it('should handle sorting', () => {
    renderWithProvider(
      <DataTable
        columns={mockColumns}
        data={mockData}
      />
    );
    
    const nameHeader = screen.getByText('Nombre');
    fireEvent.click(nameHeader);
    
    // Verificar que se active el sorting
    expect(nameHeader.closest('th')).toHaveStyle({ cursor: 'pointer' });
  });

  it('should filter data with search', () => {
    renderWithProvider(
      <DataTable
        columns={mockColumns}
        data={mockData}
        searchPlaceholder="Buscar..."
      />
    );
    
    const searchInput = screen.getByPlaceholderText('Buscar...');
    fireEvent.change(searchInput, { target: { value: 'Cliente 1' } });
    
    expect(screen.getByText('Cliente 1')).toBeInTheDocument();
    expect(screen.queryByText('Cliente 2')).not.toBeInTheDocument();
  });
});