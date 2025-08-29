import React from 'react';
import { Tabs, Paper, Stack, Title, Text, Button } from '@mantine/core';
import {
  IconFileText,
  IconMathFunction,
  IconMapPin,
  IconRoute,
  IconPlus,
} from '@tabler/icons-react';
import { Cliente } from '../../../types';
import { ClienteDetail } from '../../../components/details';
import { FormulaHistorialTable } from '../../../components/tables/FormulaHistorialTable';

interface ClienteDetailTabsProps {
  cliente: Cliente;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewSites: (cliente: Cliente) => void;
  onViewTramos: (cliente: Cliente) => void;
  onCreateSite: (cliente: Cliente) => void;
  onCreateTramo: (cliente: Cliente) => void;
  onFormulaChange: () => void;
}

export const ClienteDetailTabs = ({
  cliente,
  activeTab,
  setActiveTab,
  onEdit,
  onDelete,
  onViewSites,
  onViewTramos,
  onCreateSite,
  onCreateTramo,
  onFormulaChange,
}: ClienteDetailTabsProps) => {
  return (
    <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'general')}>
      <Tabs.List>
        <Tabs.Tab value="general" leftSection={<IconFileText size={16} />}>
          Información General
        </Tabs.Tab>
        <Tabs.Tab value="formulas" leftSection={<IconMathFunction size={16} />}>
          Fórmulas Personalizadas
        </Tabs.Tab>
        <Tabs.Tab value="sites" leftSection={<IconMapPin size={16} />}>
          Ubicaciones
        </Tabs.Tab>
        <Tabs.Tab value="tramos" leftSection={<IconRoute size={16} />}>
          Rutas y Tarifas
        </Tabs.Tab>
      </Tabs.List>

      {/* Panel General */}
      <Tabs.Panel value="general" pt="md">
        <ClienteDetail
          cliente={cliente}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewSites={onViewSites}
          onViewTramos={onViewTramos}
          onCreateSite={onCreateSite}
          onCreateTramo={onCreateTramo}
        />
      </Tabs.Panel>

      {/* Panel Fórmulas */}
      <Tabs.Panel value="formulas" pt="md">
        <FormulaHistorialTable
          clienteId={cliente._id}
          clienteNombre={cliente.nombre}
          onFormulaChange={onFormulaChange}
        />
      </Tabs.Panel>

      {/* Panel Sites - Placeholder */}
      <Tabs.Panel value="sites" pt="md">
        <Paper withBorder p="xl" ta="center">
          <Stack gap="md" align="center">
            <IconMapPin size={48} stroke={1} />
            <div>
              <Title order={3}>Ubicaciones del Cliente</Title>
              <Text c="dimmed">
                Aquí se mostrarán las ubicaciones (sites) asociadas a este cliente
              </Text>
            </div>
            <Button 
              leftSection={<IconPlus size={16} />}
              onClick={() => onCreateSite(cliente)}
            >
              Agregar Ubicación
            </Button>
          </Stack>
        </Paper>
      </Tabs.Panel>

      {/* Panel Tramos - Placeholder */}
      <Tabs.Panel value="tramos" pt="md">
        <Paper withBorder p="xl" ta="center">
          <Stack gap="md" align="center">
            <IconRoute size={48} stroke={1} />
            <div>
              <Title order={3}>Rutas y Tarifas</Title>
              <Text c="dimmed">
                Aquí se mostrarán las rutas y tarifas configuradas para este cliente
              </Text>
            </div>
            <Button 
              leftSection={<IconPlus size={16} />}
              onClick={() => onCreateTramo(cliente)}
            >
              Configurar Ruta
            </Button>
          </Stack>
        </Paper>
      </Tabs.Panel>
    </Tabs>
  );
};