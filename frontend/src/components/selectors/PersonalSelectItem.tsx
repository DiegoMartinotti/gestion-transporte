import React, { forwardRef } from 'react';
import { Group, Text, Badge, Avatar, Box } from '@mantine/core';
import { IconUser, IconTruck, IconLicense } from '@tabler/icons-react';
import { getAvatarColor, getBadgeColor } from './helpers/personalSelectorHelpers';

// Interface para las props del SelectItem
interface SelectItemProps {
  label: string;
  nombre: string;
  apellido: string;
  tipo: string;
  licencia?: string;
  categoria?: string;
  dni?: string;
  empresa?: string;
  showLicencia?: boolean;
  showEmpresa?: boolean;
  showDni?: boolean;
  withAvatar?: boolean;
  compact?: boolean;
  [key: string]: unknown;
}

// Helper para renderizar avatar
const renderAvatar = (tipo: string, withAvatar?: boolean) => {
  if (!withAvatar) return null;

  return (
    <Avatar size="sm" color={getAvatarColor(tipo)}>
      {tipo === 'Conductor' ? <IconTruck size={16} /> : <IconUser size={16} />}
    </Avatar>
  );
};

// Helper para renderizar información adicional
const renderAdditionalInfo = (props: {
  showDni?: boolean;
  dni?: string;
  showLicencia?: boolean;
  licencia?: string;
  categoria?: string;
  showEmpresa?: boolean;
  empresa?: string;
}) => {
  const { showDni, dni, showLicencia, licencia, categoria, showEmpresa, empresa } = props;

  return (
    <>
      {showDni && dni && (
        <Text size="xs" c="dimmed">
          DNI: {dni}
        </Text>
      )}
      {showLicencia && licencia && (
        <Group gap={4} mt={2}>
          <IconLicense size={12} />
          <Text size="xs" c="dimmed">
            {licencia}
            {categoria && ` (${categoria})`}
          </Text>
        </Group>
      )}
      {showEmpresa && empresa && (
        <Text size="xs" c="dimmed">
          Empresa: {empresa}
        </Text>
      )}
    </>
  );
};

// Componente para renderizar items del selector
export const PersonalSelectItem = forwardRef<HTMLDivElement, SelectItemProps>(
  (
    {
      label: _label,
      nombre,
      apellido,
      tipo,
      licencia,
      categoria,
      dni,
      empresa,
      showLicencia,
      showEmpresa,
      showDni,
      withAvatar,
      compact,
      ...others
    },
    ref
  ) => {
    return (
      <div ref={ref} {...others}>
        <Group gap="sm" wrap="nowrap">
          {renderAvatar(tipo, withAvatar)}

          <Box style={{ flex: 1 }}>
            <Group gap="xs" align="center">
              <Text size="sm" fw={500}>
                {nombre} {apellido}
              </Text>
              <Badge size="xs" variant="light" color={getBadgeColor(tipo)}>
                {tipo}
              </Badge>
            </Group>

            {!compact &&
              renderAdditionalInfo({
                showDni,
                dni,
                showLicencia,
                licencia,
                categoria,
                showEmpresa,
                empresa,
              })}
          </Box>
        </Group>
      </div>
    );
  }
);

PersonalSelectItem.displayName = 'PersonalSelectItem';
