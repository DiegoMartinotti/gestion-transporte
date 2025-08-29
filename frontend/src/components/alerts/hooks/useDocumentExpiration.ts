import React, { useState, useEffect, useRef, useMemo } from 'react';
import { notifications } from '@mantine/notifications';

interface DocumentoVencimiento {
  id: string;
  entidad: 'vehiculo' | 'personal';
  entidadId: string;
  entidadNombre: string;
  tipoDocumento: string;
  numeroDocumento?: string;
  fechaVencimiento: Date;
  diasRestantes: number;
  estado: 'vencido' | 'proximo' | 'vigente';
  empresa?: string;
}

interface Vehiculo {
  _id: string;
  dominio: string;
  empresa?: { nombre: string };
  documentacion?: Record<string, { vencimiento?: string; numero?: string }>;
}

interface Personal {
  _id: string;
  nombre: string;
  apellido: string;
  empresa?: { nombre: string };
  documentacion?: Record<string, { vencimiento?: string; numero?: string }>;
}

interface UseDocumentExpirationParams {
  vehiculos: Vehiculo[];
  personal: Personal[];
  diasAlerta: number;
  mostrarVencidos: boolean;
  mostrarProximos: boolean;
  mostrarVigentes: boolean;
  procesarDocumentosVehiculos: (
    vehiculos: Vehiculo[],
    diasAlerta: number
  ) => DocumentoVencimiento[];
  procesarDocumentosPersonal: (personal: Personal[], diasAlerta: number) => DocumentoVencimiento[];
}

export const useDocumentExpiration = ({
  vehiculos,
  personal,
  diasAlerta,
  mostrarVencidos,
  mostrarProximos,
  mostrarVigentes,
  procesarDocumentosVehiculos,
  procesarDocumentosPersonal,
}: UseDocumentExpirationParams) => {
  const [alertasHabilitadas, setAlertasHabilitadas] = useState(true);
  const notificationShownRef = useRef(false);

  const documentos = useMemo(() => {
    const docsVehiculos = procesarDocumentosVehiculos(vehiculos, diasAlerta);
    const docsPersonal = procesarDocumentosPersonal(personal, diasAlerta);
    const todosDocumentos = [...docsVehiculos, ...docsPersonal];

    return todosDocumentos
      .filter((doc) => {
        if (doc.estado === 'vencido' && !mostrarVencidos) return false;
        if (doc.estado === 'proximo' && !mostrarProximos) return false;
        if (doc.estado === 'vigente' && !mostrarVigentes) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.estado !== b.estado) {
          const orden = { vencido: 0, proximo: 1, vigente: 2 };
          return orden[a.estado] - orden[b.estado];
        }
        return a.diasRestantes - b.diasRestantes;
      });
  }, [
    vehiculos,
    personal,
    diasAlerta,
    mostrarVencidos,
    mostrarProximos,
    mostrarVigentes,
    procesarDocumentosVehiculos,
    procesarDocumentosPersonal,
  ]);

  const { vencidos, proximos } = useMemo(
    () => ({
      vencidos: documentos.filter((doc) => doc.estado === 'vencido'),
      proximos: documentos.filter((doc) => doc.estado === 'proximo'),
    }),
    [documentos]
  );

  useEffect(() => {
    notificationShownRef.current = false;
  }, [vehiculos, personal, diasAlerta, mostrarVencidos, mostrarProximos, mostrarVigentes]);

  useEffect(() => {
    if (!alertasHabilitadas || notificationShownRef.current) return;

    const vencidosCount = vencidos.length;
    const proximosCount = proximos.length;

    if (vencidosCount > 0) {
      notifications.show({
        title: 'Documentos Vencidos',
        message: `${vencidosCount} documento${vencidosCount > 1 ? 's' : ''} vencido${vencidosCount > 1 ? 's' : ''}`,
        color: 'red',
        icon: React.createElement('div'),
        autoClose: 5000,
      });
      notificationShownRef.current = true;
    } else if (proximosCount > 0) {
      notifications.show({
        title: 'Documentos por Vencer',
        message: `${proximosCount} documento${proximosCount > 1 ? 's' : ''} próximo${proximosCount > 1 ? 's' : ''} a vencer`,
        color: 'yellow',
        icon: React.createElement('div'),
        autoClose: 5000,
      });
      notificationShownRef.current = true;
    }
  }, [documentos, alertasHabilitadas, vencidos.length, proximos.length]);

  return {
    documentos,
    vencidos,
    proximos,
    alertasHabilitadas,
    setAlertasHabilitadas,
  };
};
