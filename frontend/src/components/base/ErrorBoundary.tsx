import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{ 
          padding: '2rem', 
          maxWidth: '500px', 
          margin: '2rem auto',
          textAlign: 'center',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          backgroundColor: '#fff'
        }}>
          <h2 style={{ color: '#e74c3c', marginBottom: '1rem' }}>
            ¡Oops! Algo salió mal
          </h2>
          
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Ha ocurrido un error inesperado en la aplicación. 
            Puedes intentar recargar la página o contactar al administrador.
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#fee', 
              borderRadius: '4px',
              marginBottom: '1.5rem',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              color: '#c33',
              textAlign: 'left'
            }}>
              <div>{this.state.error.message}</div>
              {this.state.errorInfo && (
                <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  {this.state.errorInfo.componentStack}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              onClick={this.handleReset}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #007bff',
                backgroundColor: 'transparent',
                color: '#007bff',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Intentar de nuevo
            </button>
            <button 
              onClick={this.handleReload}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                backgroundColor: '#007bff',
                color: 'white',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}