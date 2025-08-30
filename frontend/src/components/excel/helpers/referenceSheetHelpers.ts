import React from 'react';
import * as XLSX from 'xlsx';
import { notifications } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';
import type { ReferenceEntity, ReferenceConfig } from '../ReferenceDataSheets';

export const createInstructionsSheet = () => {
  const instructions = [
    ['INSTRUCCIONES PARA USO DE HOJAS DE REFERENCIA'],
    [''],
    ['¿Qué son las hojas de referencia?'],
    ['Las hojas de referencia contienen datos existentes en el sistema que puedes'],
    ['usar para completar correctamente tu plantilla de importación.'],
    [''],
    ['¿Cómo usar las referencias?'],
    ['1. Identifica el campo que necesitas completar en tu plantilla principal'],
    ['2. Busca la hoja de referencia correspondiente (Ref_NombreEntidad)'],
    ['3. Copia el ID o valor exacto desde la hoja de referencia'],
    ['4. Pega el valor en tu plantilla principal'],
    [''],
    ['Ejemplo práctico:'],
    ['Si necesitas asignar una empresa a un empleado:'],
    ['- Ve a la hoja "Ref_Empresas"'],
    ['- Busca la empresa deseada'],
    ['- Copia el ID de la primera columna'],
    ['- Pega ese ID en el campo "empresaId" de tu plantilla'],
    [''],
    ['Campos importantes:'],
    ['- ID: Valor único que debes usar para referencias'],
    ['- Nombre/Descripción: Te ayuda a identificar el registro correcto'],
    ['- Estado: Solo usa registros activos para nuevas asignaciones'],
    [''],
    ['Notas:'],
    ['- Los IDs deben copiarse exactamente como aparecen'],
    ['- No modifiques las hojas de referencia'],
    ['- Si no encuentras un dato, créalo primero en el sistema'],
  ];

  return XLSX.utils.aoa_to_sheet(instructions);
};

export const createReferenceSheet = (entity: ReferenceEntity, config: ReferenceConfig) => {
  const referenceFields = entity.fields.filter((f) => f.includeInReference !== false);
  const headers = referenceFields.map((f) => f.label);

  // Filter data based on config
  let data = entity.data;
  if (config.onlyActiveRecords) {
    data = data.filter((item) => item.activo !== false && item.estado !== 'inactivo');
  }

  // Limit records if specified
  if (config.maxRecordsPerSheet > 0) {
    data = data.slice(0, config.maxRecordsPerSheet);
  }

  const rows = data.map((item) =>
    referenceFields.map((field) => {
      const value = item[field.key];
      if (field.type === 'date' && value) {
        return new Date(value as string).toLocaleDateString();
      }
      if (field.type === 'boolean') {
        return value ? 'VERDADERO' : 'FALSO';
      }
      return value || '';
    })
  );

  return XLSX.utils.aoa_to_sheet([headers, ...rows]);
};

export const generateAndDownloadReferenceSheets = async (
  entities: ReferenceEntity[],
  config: ReferenceConfig,
  targetEntity: string,
  onDownload?: (config: ReferenceConfig) => void
) => {
  try {
    const workbook = XLSX.utils.book_new();

    // Add instruction sheet if enabled
    if (config.includeInstructions) {
      const instructionsSheet = createInstructionsSheet();
      XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucciones');
    }

    // Add reference sheets for selected entities
    for (const entityId of config.selectedEntities) {
      const entity = entities.find((e) => e.id === entityId);
      if (!entity) continue;

      const referenceSheet = createReferenceSheet(entity, config);
      const sheetName = `Ref_${entity.name.replace(/\s+/g, '_')}`;
      XLSX.utils.book_append_sheet(workbook, referenceSheet, sheetName);
    }

    // Generate and download file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const filename = `referencias_${targetEntity}_${new Date().toISOString().split('T')[0]}.xlsx`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onDownload?.(config);

    notifications.show({
      title: 'Referencias generadas',
      message: `Se descargaron las hojas de referencia para ${config.selectedEntities.length} entidades`,
      color: 'green',
      icon: React.createElement(IconCheck, { size: 16 }),
    });
  } catch (error) {
    console.error('Error generating reference sheets:', error);
    notifications.show({
      title: 'Error',
      message: 'No se pudieron generar las hojas de referencia',
      color: 'red',
    });
  }
};
