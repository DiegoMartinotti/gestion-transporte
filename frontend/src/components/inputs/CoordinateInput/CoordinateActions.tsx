import React from 'react';
import { Group, ActionIcon, Tooltip } from '@mantine/core';
import { IconMapPin, IconCurrentLocation, IconCopy, IconClipboard } from '@tabler/icons-react';

interface CoordinateActionsProps {
  showCurrentLocation?: boolean;
  showCopyPaste?: boolean;
  showMapLink?: boolean;
  disabled?: boolean;
  isValid: boolean;
  isGettingLocation: boolean;
  onGetCurrentLocation: () => void;
  onCopyCoordinates: () => void;
  onPasteCoordinates: () => void;
  onOpenInGoogleMaps: () => void;
}

export default function CoordinateActions({
  showCurrentLocation,
  showCopyPaste,
  showMapLink,
  disabled,
  isValid,
  isGettingLocation,
  onGetCurrentLocation,
  onCopyCoordinates,
  onPasteCoordinates,
  onOpenInGoogleMaps,
}: CoordinateActionsProps) {
  return (
    <Group justify="space-between">
      <Group gap="xs">
        {showCurrentLocation && (
          <Tooltip label="Usar ubicación actual">
            <ActionIcon
              variant="light"
              color="blue"
              onClick={onGetCurrentLocation}
              loading={isGettingLocation}
              disabled={disabled}
            >
              <IconCurrentLocation size={16} />
            </ActionIcon>
          </Tooltip>
        )}

        {showCopyPaste && (
          <>
            <Tooltip label="Copiar coordenadas">
              <ActionIcon
                variant="light"
                color="gray"
                onClick={onCopyCoordinates}
                disabled={disabled || !isValid}
              >
                <IconCopy size={16} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Pegar coordenadas">
              <ActionIcon
                variant="light"
                color="gray"
                onClick={onPasteCoordinates}
                disabled={disabled}
              >
                <IconClipboard size={16} />
              </ActionIcon>
            </Tooltip>
          </>
        )}
      </Group>

      {showMapLink && isValid && (
        <Tooltip label="Ver en Google Maps">
          <ActionIcon variant="light" color="green" onClick={onOpenInGoogleMaps}>
            <IconMapPin size={16} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}
