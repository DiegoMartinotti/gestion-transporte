import { notifications } from '@mantine/notifications';
import { RouteResult } from '../types';

export const useRouteHandlers = (route: RouteResult | null) => {
  const downloadGpx = () => {
    if (!route) {
      notifications.show({
        title: 'Error',
        message: 'No hay ruta para descargar',
        color: 'red',
      });
      return;
    }

    // Generar GPX básico
    const gpxContent = generateGPXContent(route);
    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'ruta.gpx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    notifications.show({
      title: 'Descarga completada',
      message: 'Archivo GPX descargado exitosamente',
      color: 'green',
    });
  };

  const generateGPXContent = (routeData: RouteResult) => {
    const points = routeData.overview_path
      .map((point) => `<trkpt lat="${point.lat}" lon="${point.lng}"></trkpt>`)
      .join('\n      ');

    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1">
  <trk>
    <name>Ruta calculada</name>
    <trkseg>
      ${points}
    </trkseg>
  </trk>
</gpx>`;
  };

  return {
    downloadGpx,
  };
};
