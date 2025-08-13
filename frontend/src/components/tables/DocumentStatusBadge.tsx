import React from 'react';
import { Badge } from '@mantine/core';
import { getStatusColor, getStatusLabel } from './helpers/documentacionHelpers';

interface DocumentStatusBadgeProps {
  status: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({
  status,
  size = 'sm',
}) => {
  return (
    <Badge color={getStatusColor(status)} variant="light" size={size}>
      {getStatusLabel(status)}
    </Badge>
  );
};
