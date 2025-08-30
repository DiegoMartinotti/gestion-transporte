import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';

interface Coordinates {
  lat: number;
  lng: number;
}

interface UseCoordinateInputProps {
  value: Coordinates;
  onChange: (coords: Coordinates) => void;
  precision: number;
}

// Helper functions
const isValidCoordinate = (coords: Coordinates): boolean => {
  return (
    coords.lat !== 0 &&
    coords.lng !== 0 &&
    coords.lat >= -90 &&
    coords.lat <= 90 &&
    coords.lng >= -180 &&
    coords.lng <= 180
  );
};

const showNotification = (title: string, message: string, color: string) => {
  notifications.show({ title, message, color });
};

const formatCoordinateString = (coords: Coordinates, precision: number): string => {
  return `${coords.lat.toFixed(precision)},${coords.lng.toFixed(precision)}`;
};

const parseCoordinatesFromText = (text: string, precision: number): Coordinates | null => {
  const cleaned = text.trim().replace(/[^\d.,-]/g, '');
  const coords = cleaned.split(/[,\s]+/).map((s) => parseFloat(s));

  if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
    const newCoords = {
      lat: parseFloat(coords[0].toFixed(precision)),
      lng: parseFloat(coords[1].toFixed(precision)),
    };

    if (
      newCoords.lat >= -90 &&
      newCoords.lat <= 90 &&
      newCoords.lng >= -180 &&
      newCoords.lng <= 180
    ) {
      return newCoords;
    }
  }
  return null;
};

const getGeolocationErrorMessage = (error: GeolocationPositionError): string => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Permiso de ubicación denegado';
    case error.POSITION_UNAVAILABLE:
      return 'Ubicación no disponible';
    case error.TIMEOUT:
      return 'Tiempo de espera agotado';
    default:
      return 'No se pudo obtener la ubicación actual';
  }
};

export const useCoordinateInput = ({ value, onChange, precision }: UseCoordinateInputProps) => {
  const [internalValue, setInternalValue] = useState<Coordinates>(value);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const isValid = isValidCoordinate(internalValue);

  const handleLatChange = (val: number | string) => {
    const lat = typeof val === 'number' ? val : parseFloat(val) || 0;
    const newCoords = { ...internalValue, lat };
    setInternalValue(newCoords);
    onChange(newCoords);
  };

  const handleLngChange = (val: number | string) => {
    const lng = typeof val === 'number' ? val : parseFloat(val) || 0;
    const newCoords = { ...internalValue, lng };
    setInternalValue(newCoords);
    onChange(newCoords);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      showNotification('Error', 'La geolocalización no está disponible en este navegador', 'red');
      return;
    }

    setIsGettingLocation(true);

    const onSuccess = (position: GeolocationPosition) => {
      const coords = {
        lat: parseFloat(position.coords.latitude.toFixed(precision)),
        lng: parseFloat(position.coords.longitude.toFixed(precision)),
      };
      setInternalValue(coords);
      onChange(coords);
      setIsGettingLocation(false);
      showNotification('Éxito', 'Ubicación actual obtenida correctamente', 'green');
    };

    const onError = (error: GeolocationPositionError) => {
      setIsGettingLocation(false);
      const message = getGeolocationErrorMessage(error);
      showNotification('Error', message, 'red');
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    });
  };

  const handleCopyCoordinates = async () => {
    if (!isValid) {
      showNotification('Error', 'No hay coordenadas válidas para copiar', 'orange');
      return;
    }

    const coordString = formatCoordinateString(internalValue, precision);

    try {
      await navigator.clipboard.writeText(coordString);
      showNotification('Copiado', 'Coordenadas copiadas al portapapeles', 'green');
    } catch {
      showNotification('Error', 'No se pudieron copiar las coordenadas', 'red');
    }
  };

  const handlePasteCoordinates = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const newCoords = parseCoordinatesFromText(text, precision);

      if (newCoords) {
        setInternalValue(newCoords);
        onChange(newCoords);
        showNotification('Éxito', 'Coordenadas pegadas correctamente', 'green');
      } else {
        showNotification('Error', 'Formato inválido. Use: "latitud,longitud"', 'red');
      }
    } catch {
      showNotification('Error', 'No se pudieron leer las coordenadas del portapapeles', 'red');
    }
  };

  const openInGoogleMaps = () => {
    if (!isValid) return;

    const url = `https://maps.google.com/?q=${internalValue.lat},${internalValue.lng}`;
    window.open(url, '_blank');
  };

  return {
    internalValue,
    isValid,
    isGettingLocation,
    handleLatChange,
    handleLngChange,
    handleGetCurrentLocation,
    handleCopyCoordinates,
    handlePasteCoordinates,
    openInGoogleMaps,
  };
};
