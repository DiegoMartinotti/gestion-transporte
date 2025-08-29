// Helpers para LocationPicker
import { notifications } from '@mantine/notifications';

export interface LocationPickerState {
  selectedLocation: { lat: number; lng: number } | null;
  searchAddress: string;
  searchLoading: boolean;
  mapCenter: { lat: number; lng: number };
  manualLat: number;
  manualLng: number;
  manualMode: boolean;
}

// Helper para buscar dirección usando Google Geocoding API
export const searchAddressWithGeocoding = async (
  searchAddress: string,
  onChange: (location: { lat: number; lng: number } | null) => void,
  onAddressChange?: (address: string) => void
) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchAddress)}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const newPosition = { lat: location.lat, lng: location.lng };
        
        onChange(newPosition);
        
        if (onAddressChange) {
          onAddressChange(data.results[0].formatted_address);
        }
        
        notifications.show({
          title: 'Dirección encontrada',
          message: data.results[0].formatted_address,
          color: 'green'
        });

        return newPosition;
      } else {
        notifications.show({
          title: 'No encontrado',
          message: 'No se pudo encontrar la dirección especificada',
          color: 'orange'
        });
      }
    }
  } catch {
    notifications.show({
      title: 'Error',
      message: 'Error al buscar la dirección',
      color: 'red'
    });
  }
  return null;
};

// Helper para obtener ubicación actual del usuario
export const getCurrentUserLocation = (
  onChange: (location: { lat: number; lng: number } | null) => void
) => {
  if (!navigator.geolocation) {
    notifications.show({
      title: 'No soportado',
      message: 'La geolocalización no está soportada en este navegador',
      color: 'orange'
    });
    return;
  }

  notifications.show({
    title: 'Obteniendo ubicación',
    message: 'Solicitando acceso a su ubicación...',
    color: 'blue',
    autoClose: 2000
  });

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      onChange(newLocation);
      
      notifications.show({
        title: 'Ubicación obtenida',
        message: `Lat: ${newLocation.lat.toFixed(6)}, Lng: ${newLocation.lng.toFixed(6)}`,
        color: 'green'
      });

      return newLocation;
    },
    (error) => {
      let message = 'Error al obtener la ubicación';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Acceso a la ubicación denegado';
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'Ubicación no disponible';
          break;
        case error.TIMEOUT:
          message = 'Tiempo de espera agotado';
          break;
      }
      
      notifications.show({
        title: 'Error de geolocalización',
        message,
        color: 'red'
      });
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
};

// Helper para manejar click en el mapa
export const handleMapClick = (
  position: { lat: number; lng: number },
  disabled: boolean,
  onChange: (location: { lat: number; lng: number } | null) => void
) => {
  if (disabled) return;
  
  onChange(position);
  
  notifications.show({
    title: 'Ubicación seleccionada',
    message: `Lat: ${position.lat.toFixed(6)}, Lng: ${position.lng.toFixed(6)}`,
    color: 'green',
    autoClose: 2000
  });
  
  return position;
};

// Helper para validar y aplicar coordenadas manuales
export const applyManualCoordinates = (
  lat: number,
  lng: number,
  onChange: (location: { lat: number; lng: number } | null) => void
) => {
  if (!lat || !lng || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    notifications.show({
      title: 'Coordenadas inválidas',
      message: 'Por favor ingrese coordenadas válidas',
      color: 'red'
    });
    return null;
  }

  const newPosition = { lat, lng };
  onChange(newPosition);
  
  notifications.show({
    title: 'Coordenadas aplicadas',
    message: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`,
    color: 'green'
  });

  return newPosition;
};

// Helper para limpiar/borrar la ubicación seleccionada
export const clearLocation = (
  onChange: (location: { lat: number; lng: number } | null) => void
) => {
  onChange(null);
  
  notifications.show({
    title: 'Ubicación borrada',
    message: 'Se ha borrado la ubicación seleccionada',
    color: 'blue'
  });
};

// Constantes por defecto
export const DEFAULT_CENTER = { lat: -34.6037, lng: -58.3816 }; // Buenos Aires