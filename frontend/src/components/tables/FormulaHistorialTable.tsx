import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
  Table,
  ActionIcon,
  Group,
  Badge,
  Text,
  Menu,
  Button,
  Stack,
  Alert,
  Code,
  Modal,
  Timeline,
  Paper,
  Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconEdit,
  IconTrash,
  IconDots,
  IconEye,
  IconHistory,
  IconCalendar,
  IconCopy,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { formulaService, Formula } from '../../services/formulaService';
import { FormulaPreview } from '../preview/FormulaPreview';
import DataTable from '../base/DataTable';

// Lazy load del formulario complejo de fórmulas
const FormulaForm = lazy(() => import('../forms/FormulaForm').then(module => ({ default: module.FormulaForm })));

interface FormulaHistorialTableProps {
  clienteId: string;
  clienteNombre: string;
  tipoUnidad?: string;
  onFormulaChange?: () => void;
}

export const FormulaHistorialTable: React.FC<FormulaHistorialTableProps> = ({
  clienteId,
  clienteNombre,
  tipoUnidad,
  onFormulaChange
}) => {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);
  const [editingFormulaId, setEditingFormulaId] = useState<string | null>(null);
  
  const [formModalOpened, { open: openFormModal, close: closeFormModal }] = useDisclosure(false);
  const [previewModalOpened, { open: openPreviewModal, close: closePreviewModal }] = useDisclosure(false);
  const [timelineModalOpened, { open: openTimelineModal, close: closeTimelineModal }] = useDisclosure(false);

  useEffect(() => {
    loadFormulas();
  }, [clienteId, tipoUnidad]);

  const loadFormulas = async () => {
    try {
      setLoading(true);
      const response = await formulaService.getHistory(clienteId, tipoUnidad);
      setFormulas(response.data || []);
    } catch (error) {
      console.error('Error loading formulas:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudieron cargar las fórmulas',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (formula: Formula) => {
    setEditingFormulaId(formula._id);
    openFormModal();
  };

  const handleDelete = async (formulaId: string) => {
    try {
      await formulaService.delete(formulaId);
      notifications.show({
        title: 'Éxito',
        message: 'Fórmula eliminada correctamente',
        color: 'green'
      });
      loadFormulas();
      onFormulaChange?.();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Error al eliminar la fórmula',
        color: 'red'
      });
    }
  };

  const handlePreview = (formula: Formula) => {
    setSelectedFormula(formula);
    openPreviewModal();
  };

  const handleCopyFormula = (formula: string) => {
    navigator.clipboard.writeText(formula);
    notifications.show({
      title: 'Copiado',
      message: 'Fórmula copiada al portapapeles',
      color: 'green'
    });
  };

  const handleFormSave = () => {
    closeFormModal();
    setEditingFormulaId(null);
    loadFormulas();
    onFormulaChange?.();
  };

  const handleFormCancel = () => {
    closeFormModal();
    setEditingFormulaId(null);
  };

  const getEstadoVigencia = (formula: Formula) => {
    const now = new Date();
    const desde = new Date(formula.vigenciaDesde);
    const hasta = formula.vigenciaHasta ? new Date(formula.vigenciaHasta) : null;

    if (desde > now) {
      return { status: 'future', label: 'Futura', color: 'blue' };
    }

    if (hasta && hasta < now) {
      return { status: 'expired', label: 'Expirada', color: 'red' };
    }

    return { status: 'active', label: 'Activa', color: 'green' };
  };

  const columns = [
    {
      key: 'tipoUnidad',
      label: 'Tipo',
      render: (formula: Formula) => (
        <Badge 
          variant="light" 
          color={formula.tipoUnidad === 'General' ? 'gray' : 'blue'}
        >
          {formula.tipoUnidad}
        </Badge>
      )
    },
    {
      key: 'formula',
      label: 'Fórmula',
      render: (formula: Formula) => (
        <Group gap="xs">
          <Code fz="sm" style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {formula.formula}
          </Code>
          <ActionIcon
            size="xs"
            variant="light"
            onClick={() => handleCopyFormula(formula.formula)}
          >
            <IconCopy size={12} />
          </ActionIcon>
        </Group>
      )
    },
    {
      key: 'vigencia',
      label: 'Vigencia',
      render: (formula: Formula) => {
        const estado = getEstadoVigencia(formula);
        return (
          <Stack gap={4}>
            <Badge color={estado.color} size="sm">
              {estado.label}
            </Badge>
            <Text size="xs" c="dimmed">
              {new Date(formula.vigenciaDesde).toLocaleDateString()} - {' '}
              {formula.vigenciaHasta 
                ? new Date(formula.vigenciaHasta).toLocaleDateString()
                : 'Sin límite'
              }
            </Text>
          </Stack>
        );
      }
    },
    {
      key: 'createdAt',
      label: 'Creación',
      render: (formula: Formula) => (
        <Text size="sm" c="dimmed">
          {new Date(formula.createdAt).toLocaleDateString()}
        </Text>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      align: 'center' as const,
      render: (formula: Formula) => (
        <Group gap="xs" justify="center">
          <Tooltip label="Vista previa">
            <ActionIcon
              variant="light"
              color="blue"
              onClick={() => handlePreview(formula)}
            >
              <IconEye size={16} />
            </ActionIcon>
          </Tooltip>

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="light">
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconEdit size={14} />}
                onClick={() => handleEdit(formula)}
              >
                Editar
              </Menu.Item>
              <Menu.Item
                leftSection={<IconCopy size={14} />}
                onClick={() => handleCopyFormula(formula.formula)}
              >
                Copiar fórmula
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconTrash size={14} />}
                color="red"
                onClick={() => handleDelete(formula._id)}
              >
                Eliminar
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      )
    }
  ];

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Text fw={500} size="lg">Historial de Fórmulas</Text>
            <Text size="sm" c="dimmed">
              {clienteNombre} {tipoUnidad ? `• ${tipoUnidad}` : ''}
            </Text>
          </div>
          <Group>
            <Button
              leftSection={<IconHistory size={16} />}
              variant="light"
              onClick={openTimelineModal}
              disabled={formulas.length === 0}
            >
              Timeline
            </Button>
            <Button
              leftSection={<IconCalendar size={16} />}
              onClick={() => {
                setEditingFormulaId(null);
                openFormModal();
              }}
            >
              Nueva Fórmula
            </Button>
          </Group>
        </Group>

        {formulas.length === 0 && !loading ? (
          <Alert color="blue" variant="light">
            <Text>No hay fórmulas personalizadas para este cliente.</Text>
            <Text size="sm" c="dimmed" mt="xs">
              Se utilizará la fórmula estándar: <Code>Valor * Palets + Peaje</Code>
            </Text>
          </Alert>
        ) : (
          <DataTable
            data={formulas}
            columns={columns}
            loading={loading}
          />
        )}
      </Stack>

      {/* Modal de formulario */}
      <Modal
        opened={formModalOpened}
        onClose={handleFormCancel}
        title={editingFormulaId ? 'Editar Fórmula' : 'Nueva Fórmula'}
        size="xl"
      >
        <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Cargando formulario...</div>}>
          <FormulaForm
            clienteId={clienteId}
            formulaId={editingFormulaId || undefined}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
          />
        </Suspense>
      </Modal>

      {/* Modal de vista previa */}
      <Modal
        opened={previewModalOpened}
        onClose={closePreviewModal}
        title="Vista Previa de Fórmula"
        size="xl"
      >
        {selectedFormula && (
          <FormulaPreview
            formula={selectedFormula.formula}
            clienteNombre={clienteNombre}
            tipoUnidad={selectedFormula.tipoUnidad}
          />
        )}
      </Modal>

      {/* Modal de timeline */}
      <Modal
        opened={timelineModalOpened}
        onClose={closeTimelineModal}
        title="Timeline de Fórmulas"
        size="lg"
      >
        <Timeline active={formulas.length - 1} bulletSize={24} lineWidth={2}>
          {formulas
            .sort((a, b) => new Date(a.vigenciaDesde).getTime() - new Date(b.vigenciaDesde).getTime())
            .map((formula, index) => {
              const estado = getEstadoVigencia(formula);
              return (
                <Timeline.Item
                  key={formula._id}
                  bullet={estado.status === 'active' ? <IconCheck size={12} /> : <IconX size={12} />}
                  title={
                    <Group gap="xs">
                      <Text fw={500}>{formula.tipoUnidad}</Text>
                      <Badge color={estado.color} size="sm">
                        {estado.label}
                      </Badge>
                    </Group>
                  }
                >
                  <Paper withBorder p="sm" mt="xs">
                    <Code block fz="sm" mb="xs">
                      {formula.formula}
                    </Code>
                    <Text size="xs" c="dimmed">
                      {new Date(formula.vigenciaDesde).toLocaleDateString()} - {' '}
                      {formula.vigenciaHasta 
                        ? new Date(formula.vigenciaHasta).toLocaleDateString()
                        : 'Sin límite'
                      }
                    </Text>
                  </Paper>
                </Timeline.Item>
              );
            })}
        </Timeline>
      </Modal>
    </>
  );
};