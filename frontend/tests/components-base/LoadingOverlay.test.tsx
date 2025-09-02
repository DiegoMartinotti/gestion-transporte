import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import LoadingOverlay from '../../src/components/base/LoadingOverlay';

const renderWithProvider = (component: React.ReactNode) => {
  return render(<MantineProvider>{component}</MantineProvider>);
};

describe('LoadingOverlay', () => {
  it('should render loading overlay when loading is true', () => {
    renderWithProvider(
      <LoadingOverlay loading={true}>
        <div>Content</div>
      </LoadingOverlay>
    );

    expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should not render loading overlay when loading is false', () => {
    renderWithProvider(
      <LoadingOverlay loading={false}>
        <div>Content</div>
      </LoadingOverlay>
    );

    expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should render custom loading message', () => {
    renderWithProvider(
      <LoadingOverlay loading={true} message="Cargando datos...">
        <div>Content</div>
      </LoadingOverlay>
    );

    expect(screen.getByText('Cargando datos...')).toBeInTheDocument();
  });

  it('should render default loading message when no message provided', () => {
    renderWithProvider(
      <LoadingOverlay loading={true}>
        <div>Content</div>
      </LoadingOverlay>
    );

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('should render children content', () => {
    renderWithProvider(
      <LoadingOverlay loading={false}>
        <div>Test Content</div>
        <span>Another element</span>
      </LoadingOverlay>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('Another element')).toBeInTheDocument();
  });
});
