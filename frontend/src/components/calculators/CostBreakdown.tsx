import React, { useMemo } from 'react';
import {
  Paper,
  Grid,
  SimpleGrid,
  Stack,
  Group,
  Title,
  Badge,
  ActionIcon,
  Collapse,
} from '@mantine/core';
import { IconReceipt, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';

import { DistributionChart } from './cost-breakdown/DistributionChart';
import { CategorySummaryCard } from './cost-breakdown/CategorySummaryCard';
import {
  CostBreakdownProps,
  categorizeItems,
  defaultFormatCurrency,
  defaultFormatPercentage,
} from './cost-breakdown';

const CostBreakdown: React.FC<CostBreakdownProps> = ({
  items,
  title = 'Desglose de Costos',
  showFormulas = false,
  showDistribution = true,
  variant = 'default',
  formatCurrency = defaultFormatCurrency,
  formatPercentage = defaultFormatPercentage,
}) => {
  const [formulasOpened, { toggle: toggleFormulas }] = useDisclosure(false);

  const total = useMemo(() => items.reduce((sum, item) => sum + item.valor, 0), [items]);

  const categorySummaries = useMemo(() => categorizeItems(items), [items]);

  if (!items.length) return null;

  const renderHeader = () => (
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
          <ActionIcon variant="subtle" onClick={toggleFormulas} aria-label="Toggle formulas">
            {formulasOpened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </ActionIcon>
        )}
      </Group>
    </Group>
  );

  const renderCompactView = () => (
    <Paper p="md">
      {renderHeader()}
      <SimpleGrid cols={2} spacing="md">
        {categorySummaries.map((category) => (
          <CategorySummaryCard
            key={category.categoria}
            category={category}
            _total={total}
            formatCurrency={formatCurrency}
            formatPercentage={formatPercentage}
          />
        ))}
      </SimpleGrid>
    </Paper>
  );

  const renderDefaultView = () => (
    <Paper p="md">
      {renderHeader()}
      <Grid>
        <Grid.Col span={{ base: 12, md: showDistribution ? 8 : 12 }}>
          <SimpleGrid cols={2} spacing="md">
            {categorySummaries.map((category) => (
              <CategorySummaryCard
                key={category.categoria}
                category={category}
                _total={total}
                formatCurrency={formatCurrency}
                formatPercentage={formatPercentage}
              />
            ))}
          </SimpleGrid>
        </Grid.Col>

        {showDistribution && (
          <Grid.Col span={{ base: 12, md: 4 }}>
            <DistributionChart
              categorySummaries={categorySummaries}
              total={total}
              formatCurrency={formatCurrency}
              formatPercentage={formatPercentage}
            />
          </Grid.Col>
        )}
      </Grid>

      {showFormulas && (
        <Collapse in={formulasOpened}>
          <Stack gap="sm" mt="md">
            {/* Formulas section - simplified for now */}
          </Stack>
        </Collapse>
      )}
    </Paper>
  );

  return variant === 'compact' ? renderCompactView() : renderDefaultView();
};

export default CostBreakdown;
export * from './cost-breakdown';
