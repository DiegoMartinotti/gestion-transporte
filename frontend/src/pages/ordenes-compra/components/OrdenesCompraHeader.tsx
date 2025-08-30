import React from 'react';
import { Group, Title, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';

/**
 * Header principal de la página de órdenes de compra
 */
export const OrdenesCompraHeader: React.FC = () => {
  return (
    <Group justify="space-between">
      <Title order={2}>Órdenes de Compra</Title>
      <Button leftSection={<IconPlus size={16} />}>Nueva Orden de Compra</Button>
    </Group>
  );
};
