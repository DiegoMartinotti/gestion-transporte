import { createContext, useContext, useCallback, ReactNode } from 'react';
import { clienteService } from '../services/clienteService';
import { empresaService } from '../services/empresaService';

interface EntityNamesContextType {
  getClienteName: (id: string) => Promise<string>;
  getEmpresaName: (id: string) => Promise<string>;
  clearCache: () => void;
}

const EntityNamesContext = createContext<EntityNamesContextType | undefined>(undefined);

// Cache para evitar múltiples llamadas a la API
const clienteNamesCache = new Map<string, string>();
const empresaNamesCache = new Map<string, string>();

export const EntityNamesProvider = ({ children }: { children: ReactNode }) => {
  const getClienteName = useCallback(async (id: string): Promise<string> => {
    if (clienteNamesCache.has(id)) {
      return clienteNamesCache.get(id)!;
    }

    try {
      const cliente = await clienteService.getById(id);
      const name = cliente.nombre;
      clienteNamesCache.set(id, name);
      return name;
    } catch (error) {
      console.error('Error fetching cliente name:', error);
      return id; // Fallback to ID if name can't be fetched
    }
  }, []);

  const getEmpresaName = useCallback(async (id: string): Promise<string> => {
    if (empresaNamesCache.has(id)) {
      return empresaNamesCache.get(id)!;
    }

    try {
      const empresa = await empresaService.getById(id);
      const name = empresa.nombre;
      empresaNamesCache.set(id, name);
      return name;
    } catch (error) {
      console.error('Error fetching empresa name:', error);
      return id; // Fallback to ID if name can't be fetched
    }
  }, []);

  const clearCache = useCallback(() => {
    clienteNamesCache.clear();
    empresaNamesCache.clear();
  }, []);

  return (
    <EntityNamesContext.Provider value={{ getClienteName, getEmpresaName, clearCache }}>
      {children}
    </EntityNamesContext.Provider>
  );
};

export const useEntityNames = () => {
  const context = useContext(EntityNamesContext);
  if (!context) {
    throw new Error('useEntityNames must be used within an EntityNamesProvider');
  }
  return context;
};
