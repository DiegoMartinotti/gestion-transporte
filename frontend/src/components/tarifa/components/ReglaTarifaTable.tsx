import React from 'react';
import { Stack, Alert, Text, Box } from '@mantine/core';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import DataTable, { DataTableColumn } from '../../base/DataTable';
import { IReglaTarifa } from '../../../types/tarifa';
import { FiltersChangeEvent, DragEndResult } from '../types/ReglaTarifaBuilderTypes';

interface ReglaTarifaTableProps {
  reglas: IReglaTarifa[];
  columns: DataTableColumn<IReglaTarifa>[];
  onDragEnd: (result: DragEndResult) => void;
  onFiltersChange: (filters: FiltersChangeEvent) => void;
}

const ReglaTarifaTable: React.FC<ReglaTarifaTableProps> = ({
  reglas,
  columns,
  onDragEnd,
  onFiltersChange,
}) => {
  if (reglas.length === 0) {
    return (
      <Alert color="blue" variant="light">
        <Stack gap="xs">
          <Text fw={600}>No hay reglas de tarifa creadas</Text>
          <Text size="sm">
            Las reglas de tarifa permiten aplicar modificaciones automáticas a los precios base
            según condiciones específicas.
          </Text>
        </Stack>
      </Alert>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="rules-table">
        {(provided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            {reglas.map((regla, index) => (
              <Draggable key={regla._id} draggableId={regla._id} index={index}>
                {(provided) => (
                  <Box ref={provided.innerRef} {...provided.draggableProps}>
                    <DataTable<IReglaTarifa>
                      data={[regla]}
                      columns={columns}
                      onFiltersChange={onFiltersChange}
                      dragHandleProps={provided.dragHandleProps}
                    />
                  </Box>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default ReglaTarifaTable;
