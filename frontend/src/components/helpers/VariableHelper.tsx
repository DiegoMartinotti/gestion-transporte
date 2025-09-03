import React from 'react';
import { Card, Text, Stack, Group, ThemeIcon, Grid } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { VariablesSection } from './sections/VariablesSection';
import { OperatorsSection } from './sections/OperatorsSection';
import { FunctionsSection } from './sections/FunctionsSection';
import { ExamplesSection } from './sections/ExamplesSection';
import { ImportantNotesSection } from './sections/ImportantNotesSection';

export const VariableHelper: React.FC = () => {
  return (
    <Card withBorder p="md" bg="blue.0">
      <Stack gap="md">
        <Group>
          <ThemeIcon color="blue" variant="light">
            <IconInfoCircle size={16} />
          </ThemeIcon>
          <Text fw={500}>Ayuda para Fórmulas Personalizadas</Text>
        </Group>

        <Grid>
          <Grid.Col span={6}>
            <VariablesSection />
          </Grid.Col>
          <Grid.Col span={6}>
            <OperatorsSection />
          </Grid.Col>
        </Grid>

        <FunctionsSection />
        <ExamplesSection />
        <ImportantNotesSection />
      </Stack>
    </Card>
  );
};
