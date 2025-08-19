import React from 'react';
import type { Personal } from '../../types';
import { DocumentacionTable } from '../../components/tables/DocumentacionTable';

interface PersonalDocumentationTabProps {
  personal: Personal[];
  onViewPersonal: (person: Personal) => void;
  onEditPersonal: (person: Personal) => void;
}

export const PersonalDocumentationTab: React.FC<PersonalDocumentationTabProps> = ({
  personal,
  onViewPersonal,
  onEditPersonal,
}) => {
  return (
    <DocumentacionTable
      personal={personal.filter((p) => p.tipo === 'Conductor')}
      onViewPersonal={onViewPersonal}
      onEditPersonal={onEditPersonal}
      showFilters={true}
      maxExpireDays={90}
    />
  );
};
