import React from 'react';
import { Card, Text, ScrollArea, Stack, Paper, Group, Badge } from '@mantine/core';
import { IconRoad, IconClock } from '@tabler/icons-react';
import { RouteResult } from '../types';

interface RouteInstructionsProps {
  route: RouteResult;
  height: number;
}

export const RouteInstructions: React.FC<RouteInstructionsProps> = ({ route, height }) => {
  return (
    <Card withBorder h={height}>
      <Text fw={500} mb="md">
        Instrucciones
      </Text>
      <ScrollArea h={height - 60}>
        <Stack gap="xs">
          {route.legs.map((leg, legIndex) =>
            leg.steps.map((step, stepIndex) => (
              <Paper key={`${legIndex}-${stepIndex}`} p="xs" bg="gray.0">
                <Group gap="xs" align="flex-start">
                  <IconRoad size={14} style={{ marginTop: 2 }} />
                  <Stack gap={2} flex={1}>
                    <Text
                      size="sm"
                      dangerouslySetInnerHTML={{
                        __html: step.instructions,
                      }}
                    />
                    <Group gap="xs">
                      <Badge size="xs" variant="light">
                        {step.distance.text}
                      </Badge>
                      <Badge size="xs" variant="light" color="blue">
                        <IconClock size={10} style={{ marginRight: 2 }} />
                        {step.duration.text}
                      </Badge>
                    </Group>
                  </Stack>
                </Group>
              </Paper>
            ))
          )}
        </Stack>
      </ScrollArea>
    </Card>
  );
};
