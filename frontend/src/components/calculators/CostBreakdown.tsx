import React, { useMemo } from 'react';
import {
  Paper,
  Title,
  Grid,
  Badge,
  Group,
  Stack,
  Text,
  Divider,
  Card,
  SimpleGrid,
  Progress,
  Box,
  ActionIcon,
  Collapse,
  ThemeIcon,
  Timeline,
  RingProgress,
  Center,
  Code
} from '@mantine/core';
import { 
  IconReceipt,
  IconTruck,
  IconPlus,
  IconCalculator,
  IconPercentage,
  IconChevronDown,
  IconChevronUp,
  IconCoin,
  IconGasStation,
  IconRoad,
  IconClock,
  IconMath
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';

interface CostItem {
  id: string;
  concepto: string;
  valor: number;
  tipo: 'tarifa' | 'extra' | 'formula' | 'ajuste';
  categoria?: string;
  descripcion?: string;
  formula?: string;
  variables?: Record<string, number>;
  porcentaje?: number;
}

interface CostBreakdownProps {
  items: CostItem[];
  total: number;
  title?: string;
  showPercentages?: boolean;
  showFormulas?: boolean;
  showCategories?: boolean;
  readonly?: boolean;
  compact?: boolean;
}

interface CategorySummary {
  categoria: string;
  items: CostItem[];
  subtotal: number;
  porcentaje: number;
  icon: React.ReactNode;
  color: string;
}

export const CostBreakdown: React.FC<CostBreakdownProps> = ({
  items = [],
  total,
  title = "Desglose de Costos",
  showPercentages = true,
  showFormulas = false,
  showCategories = true,
  readonly = false,
  compact = false
}) => {
  const [formulasOpened, { toggle: toggleFormulas }] = useDisclosure(showFormulas);

  // Agrupar items por categoría
  const categorySummaries = useMemo<CategorySummary[]>(() => {
    const categories = new Map<string, CostItem[]>();
    
    items.forEach(item => {
      const categoria = item.categoria || getCategoryFromType(item.tipo);
      if (!categories.has(categoria)) {
        categories.set(categoria, []);
      }
      categories.get(categoria)!.push(item);
    });

    return Array.from(categories.entries()).map(([categoria, categoryItems]) => {
      const subtotal = categoryItems.reduce((sum, item) => sum + item.valor, 0);
      const porcentaje = total > 0 ? (subtotal / total) * 100 : 0;
      
      return {
        categoria,
        items: categoryItems,
        subtotal,
        porcentaje,
        icon: getCategoryIcon(categoria),
        color: getCategoryColor(categoria)
      };
    }).sort((a, b) => b.subtotal - a.subtotal);
  }, [items, total]);

  // Estadísticas generales
  const stats = useMemo(() => {
    const tarifaBase = items.filter(i => i.tipo === 'tarifa').reduce((sum, i) => sum + i.valor, 0);
    const extras = items.filter(i => i.tipo === 'extra').reduce((sum, i) => sum + i.valor, 0);
    const formulas = items.filter(i => i.tipo === 'formula').reduce((sum, i) => sum + i.valor, 0);
    const ajustes = items.filter(i => i.tipo === 'ajuste').reduce((sum, i) => sum + i.valor, 0);

    return { tarifaBase, extras, formulas, ajustes };
  }, [items]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  function getCategoryFromType(tipo: string): string {
    switch (tipo) {
      case 'tarifa': return 'Tarifa Base';
      case 'extra': return 'Extras';
      case 'formula': return 'Fórmulas Personalizadas';
      case 'ajuste': return 'Ajustes';
      default: return 'Otros';
    }
  }

  function getCategoryIcon(categoria: string): React.ReactNode {
    switch (categoria.toLowerCase()) {
      case 'tarifa base': return <IconTruck size={16} />;
      case 'extras': return <IconPlus size={16} />;
      case 'fórmulas personalizadas': return <IconMath size={16} />;
      case 'combustible': return <IconGasStation size={16} />;
      case 'peajes': return <IconRoad size={16} />;
      case 'tiempo': return <IconClock size={16} />;
      case 'ajustes': return <IconPercentage size={16} />;
      default: return <IconCoin size={16} />;
    }
  }

  function getCategoryColor(categoria: string): string {
    switch (categoria.toLowerCase()) {
      case 'tarifa base': return 'blue';
      case 'extras': return 'orange';
      case 'fórmulas personalizadas': return 'purple';
      case 'combustible': return 'red';
      case 'peajes': return 'yellow';
      case 'tiempo': return 'green';
      case 'ajustes': return 'gray';
      default: return 'cyan';
    }
  }

  if (compact) {
    return (
      <Card withBorder p="sm">
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm" fw={500}>{title}</Text>
            <Text size="sm" fw={600} c="green">
              {formatCurrency(total)}
            </Text>
          </Group>
          
          <Progress.Root size="sm">
            {categorySummaries.map((category, index) => (
              <Progress.Section
                key={category.categoria}
                value={category.porcentaje}
                color={category.color}
              />
            ))}
          </Progress.Root>
          
          <Group gap="xs">
            {categorySummaries.map(category => (
              <Badge
                key={category.categoria}
                size="xs"
                color={category.color}
                variant="light"
              >
                {formatPercentage(category.porcentaje)}
              </Badge>
            ))}
          </Group>
        </Stack>
      </Card>
    );
  }

  return (
    <Paper p="md">
      <Group justify="space-between" mb="md">
        <Title order={4}>
          <Group gap="xs">
            <IconReceipt size={20} />
            {title}
          </Group>
        </Title>
        <Group gap="sm">
          <Badge size="lg" color="green">
            Total: {formatCurrency(total)}
          </Badge>
          {showFormulas && (
            <ActionIcon
              variant="subtle"
              onClick={toggleFormulas}
              aria-label="Toggle formulas"
            >
              {formulasOpened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </ActionIcon>
          )}
        </Group>
      </Group>

      <Grid>
        {/* Resumen visual con ring progress */}
        <Grid.Col span={4}>
          <Card withBorder h="100%">
            <Stack align="center">
              <Title order={5}>Distribución</Title>
              
              <RingProgress
                size={160}
                thickness={16}
                sections={categorySummaries.map(category => ({
                  value: category.porcentaje,
                  color: category.color
                }))}
                label={
                  <Center>
                    <Stack align="center" gap="xs">
                      <Text size="xs" c="dimmed">Total</Text>
                      <Text size="sm" fw={700}>
                        {formatCurrency(total)}
                      </Text>
                    </Stack>
                  </Center>
                }
              />
              
              <Stack gap="xs" w="100%">
                {categorySummaries.map(category => (
                  <Group key={category.categoria} justify="space-between">
                    <Group gap="xs">
                      <ThemeIcon size="sm" color={category.color} variant="light">
                        {category.icon}
                      </ThemeIcon>
                      <Text size="xs">{category.categoria}</Text>
                    </Group>
                    <Text size="xs" fw={500}>
                      {formatPercentage(category.porcentaje)}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Estadísticas rápidas */}
        <Grid.Col span={4}>
          <Card withBorder h="100%">
            <Title order={5} mb="md">Estadísticas</Title>
            
            <SimpleGrid cols={2} spacing="xs">
              <Box ta="center">
                <Text size="xs" c="dimmed">Tarifa Base</Text>
                <Text size="sm" fw={600} c="blue">
                  {formatCurrency(stats.tarifaBase)}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatPercentage((stats.tarifaBase / total) * 100)}
                </Text>
              </Box>
              
              <Box ta="center">
                <Text size="xs" c="dimmed">Extras</Text>
                <Text size="sm" fw={600} c="orange">
                  {formatCurrency(stats.extras)}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatPercentage((stats.extras / total) * 100)}
                </Text>
              </Box>
              
              <Box ta="center">
                <Text size="xs" c="dimmed">Fórmulas</Text>
                <Text size="sm" fw={600} c="purple">
                  {formatCurrency(stats.formulas)}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatPercentage((stats.formulas / total) * 100)}
                </Text>
              </Box>
              
              <Box ta="center">
                <Text size="xs" c="dimmed">Ajustes</Text>
                <Text size="sm" fw={600} c="gray">
                  {formatCurrency(stats.ajustes)}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatPercentage((stats.ajustes / total) * 100)}
                </Text>
              </Box>
            </SimpleGrid>
          </Card>
        </Grid.Col>

        {/* Timeline de conceptos */}
        <Grid.Col span={4}>
          <Card withBorder h="100%">
            <Title order={5} mb="md">Conceptos</Title>
            
            <Timeline active={items.length} bulletSize={16} lineWidth={2}>
              {items.map((item, index) => (
                <Timeline.Item
                  key={item.id}
                  bullet={getCategoryIcon(item.categoria || getCategoryFromType(item.tipo))}
                  title={
                    <Group justify="space-between">
                      <Text size="sm" fw={500}>{item.concepto}</Text>
                      <Text size="sm" fw={600}>
                        {formatCurrency(item.valor)}
                      </Text>
                    </Group>
                  }
                >
                  {item.descripcion && (
                    <Text size="xs" c="dimmed">{item.descripcion}</Text>
                  )}
                  {showPercentages && (
                    <Badge size="xs" variant="light" mt="xs">
                      {formatPercentage((item.valor / total) * 100)}
                    </Badge>
                  )}
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Grid.Col>

        {/* Desglose detallado por categorías */}
        {showCategories && (
          <Grid.Col span={12}>
            <Card withBorder>
              <Title order={5} mb="md">Desglose por Categorías</Title>
              
              <Stack gap="md">
                {categorySummaries.map(category => (
                  <Box key={category.categoria}>
                    <Group justify="space-between" mb="xs">
                      <Group gap="xs">
                        <ThemeIcon size="sm" color={category.color} variant="light">
                          {category.icon}
                        </ThemeIcon>
                        <Text fw={500}>{category.categoria}</Text>
                      </Group>
                      <Group gap="sm">
                        <Badge color={category.color} variant="light">
                          {formatPercentage(category.porcentaje)}
                        </Badge>
                        <Text fw={600}>{formatCurrency(category.subtotal)}</Text>
                      </Group>
                    </Group>
                    
                    <Stack gap="xs" pl="md">
                      {category.items.map(item => (
                        <Group key={item.id} justify="space-between">
                          <Text size="sm">{item.concepto}</Text>
                          <Text size="sm" fw={500}>
                            {formatCurrency(item.valor)}
                          </Text>
                        </Group>
                      ))}
                    </Stack>
                    
                    <Divider mt="sm" />
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid.Col>
        )}

        {/* Fórmulas detalladas */}
        <Collapse in={formulasOpened} style={{ gridColumn: '1 / -1' }}>
          <Grid.Col span={12}>
            <Card withBorder>
              <Title order={5} mb="md">Fórmulas Aplicadas</Title>
              
              <Stack gap="md">
                {items.filter(item => item.formula || item.variables).map(item => (
                  <Box key={item.id} p="sm" bg="gray.0" style={{ borderRadius: 4 }}>
                    <Group justify="space-between" mb="xs">
                      <Text fw={500}>{item.concepto}</Text>
                      <Text fw={600} c="green">
                        {formatCurrency(item.valor)}
                      </Text>
                    </Group>
                    
                    {item.formula && (
                      <Box>
                        <Text size="xs" c="dimmed" mb="xs">Fórmula:</Text>
                        <Code block>{item.formula}</Code>
                      </Box>
                    )}
                    
                    {item.variables && Object.keys(item.variables).length > 0 && (
                      <Box mt="xs">
                        <Text size="xs" c="dimmed" mb="xs">Variables utilizadas:</Text>
                        <Group gap="xs">
                          {Object.entries(item.variables).map(([name, value]) => (
                            <Badge key={name} size="sm" variant="light">
                              {name}: {value}
                            </Badge>
                          ))}
                        </Group>
                      </Box>
                    )}
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid.Col>
        </Collapse>
      </Grid>

      {/* Total final destacado */}
      <Card withBorder mt="md" bg="green.0">
        <Group justify="space-between">
          <Text size="lg" fw={700}>TOTAL FINAL:</Text>
          <Text size="xl" fw={700} c="green">
            {formatCurrency(total)}
          </Text>
        </Group>
      </Card>
    </Paper>
  );
};