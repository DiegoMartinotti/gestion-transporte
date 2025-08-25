import React from 'react';
import { Grid, Stack } from '@mantine/core';
import type { PersonalDetailProps } from './personal/PersonalDetailTypes';
import { calculateAge, isCurrentlyEmployed } from './personal/PersonalDetailHelpers';
import { PersonalHeaderCard } from './personal/PersonalHeaderCard';
import {
  PersonalInfoCard,
  PersonalContactInfoCard,
  PersonalAddressCard,
} from './personal/PersonalInfoCards';
import { PersonalDocumentationCard } from './personal/PersonalDocumentationCard';
import { PersonalEmploymentCard } from './personal/PersonalEmploymentCard';
import { PersonalLaborDataCard } from './personal/PersonalLaborDataCard';
import { PersonalTrainingCard } from './personal/PersonalTrainingCard';
import { PersonalIncidentsCard } from './personal/PersonalIncidentsCard';
import { PersonalObservationsCard, PersonalMetadataCard } from './personal/PersonalMetadataCard';

export const PersonalDetail: React.FC<PersonalDetailProps> = ({
  personal,
  onEdit,
  showEditButton = true,
}) => {
  const empresa = typeof personal.empresa === 'object' ? personal.empresa : null;
  const age = calculateAge(personal.fechaNacimiento);
  const isEmployed = isCurrentlyEmployed(personal.periodosEmpleo || []);

  return (
    <Stack gap="md">
      <PersonalHeaderCard
        personal={personal}
        empresa={empresa}
        onEdit={onEdit}
        showEditButton={showEditButton}
        isEmployed={isEmployed}
      />

      <Grid>
        <Grid.Col span={6}>
          <PersonalInfoCard personal={personal} empresa={empresa} age={age} />
        </Grid.Col>
        <Grid.Col span={6}>
          <PersonalContactInfoCard personal={personal} />
        </Grid.Col>
      </Grid>

      <PersonalAddressCard personal={personal} />
      <PersonalEmploymentCard personal={personal} />
      <PersonalDocumentationCard personal={personal} />
      <PersonalLaborDataCard personal={personal} />
      <PersonalTrainingCard personal={personal} />
      <PersonalIncidentsCard personal={personal} />
      <PersonalObservationsCard personal={personal} />
      <PersonalMetadataCard personal={personal} />
    </Stack>
  );
};
