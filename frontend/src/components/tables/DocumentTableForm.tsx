import React from 'react';
import { Modal, Stack, Select, TextInput, Group, Button } from '@mantine/core';
import dayjs from 'dayjs';
import { Documento, TIPOS_DOCUMENTO, TipoDocumento } from './DocumentTable';

interface DocumentTableFormProps {
  opened: boolean;
  onClose: () => void;
  editingDoc: Documento | null;
  setEditingDoc: (doc: Documento | null) => void;
  onSave: () => void;
}

export const DocumentTableForm: React.FC<DocumentTableFormProps> = ({
  opened,
  onClose,
  editingDoc,
  setEditingDoc,
  onSave
}) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={editingDoc?._id?.startsWith('temp_') ? 'Agregar Documento' : 'Editar Documento'}
      size="md"
    >
      {editingDoc && (
        <Stack>
          <Select
            label="Tipo de Documento"
            value={editingDoc.tipo}
            onChange={(value) => setEditingDoc(prev => prev ? { ...prev, tipo: value as TipoDocumento } : null)}
            data={Object.entries(TIPOS_DOCUMENTO).map(([key, label]) => ({
              value: key,
              label
            }))}
            required
          />
          
          <TextInput
            label="Número"
            value={editingDoc.numero || ''}
            onChange={(e) => setEditingDoc(prev => prev ? { ...prev, numero: e.currentTarget.value } : null)}
            placeholder="Número del documento"
          />
          
          <TextInput
            label="Fecha de Emisión"
            type="date"
            value={editingDoc.fechaEmision ? dayjs(editingDoc.fechaEmision).format('YYYY-MM-DD') : ''}
            onChange={(e) => setEditingDoc(prev => prev ? { 
              ...prev, 
              fechaEmision: e.currentTarget.value ? new Date(e.currentTarget.value) : undefined 
            } : null)}
          />
          
          <TextInput
            label="Fecha de Vencimiento"
            type="date"
            value={editingDoc.fechaVencimiento ? dayjs(editingDoc.fechaVencimiento).format('YYYY-MM-DD') : ''}
            onChange={(e) => setEditingDoc(prev => prev ? { 
              ...prev, 
              fechaVencimiento: e.currentTarget.value ? new Date(e.currentTarget.value) : undefined 
            } : null)}
          />
          
          <TextInput
            label="Observaciones"
            value={editingDoc.observaciones || ''}
            onChange={(e) => setEditingDoc(prev => prev ? { ...prev, observaciones: e.currentTarget.value } : null)}
            placeholder="Observaciones adicionales"
          />
          
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={onSave}>
              Guardar
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
};