import React from 'react';
import { Paper, Group, Box, Text, Badge, ThemeIcon } from '@mantine/core';
import { IconFileSpreadsheet } from '@tabler/icons-react';

interface ValidationCounts {
  errorCount: number;
  warningCount: number;
  successCount: number;
}

interface ExcelPreviewHeaderProps {
  fileName: string;
  entityType: string;
  dataLength: number;
  showValidationStatus?: boolean;
  validationCounts?: ValidationCounts;
}

export const ExcelPreviewHeader: React.FC<ExcelPreviewHeaderProps> = ({
  fileName,
  entityType,
  dataLength,
  showValidationStatus = true,
  validationCounts,
}) => {
  const renderValidationBadges = () => {
    if (!validationCounts) return null;

    const { successCount, warningCount, errorCount } = validationCounts;

    return (
      <Group gap="sm">
        <Badge color="green" variant="light" size="sm">
          {successCount} válidos
        </Badge>
        {warningCount > 0 && (
          <Badge color="yellow" variant="light" size="sm">
            {warningCount} advertencias
          </Badge>
        )}
        {errorCount > 0 && (
          <Badge color="red" variant="light" size="sm">
            {errorCount} errores
          </Badge>
        )}
      </Group>
    );
  };

  return (
    <Paper p="md" withBorder>
      <Group justify="space-between" align="center">
        <Group gap="sm">
          <ThemeIcon size="lg" variant="light" color="blue">
            <IconFileSpreadsheet size={20} />
          </ThemeIcon>
          <Box>
            <Text fw={500} size="sm">
              Vista Previa de Datos
            </Text>
            <Text size="xs" c="dimmed">
              {fileName} • {dataLength} registros • {entityType}
            </Text>
          </Box>
        </Group>

        {showValidationStatus && renderValidationBadges()}
      </Group>
    </Paper>
  );
};

export default ExcelPreviewHeader;
