import { useState } from 'react';
import * as XLSX from 'xlsx';
import { notifications } from '@mantine/notifications';
import { TemplateConfig } from '../types/ExcelTemplateTypes';
import {
  createTemplateSheet,
  createInstructionsSheet,
  createReferenceSheet,
  applySheetFormatting,
} from '../helpers/templateHelpers';

export const useTemplateGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTemplate = async (
    config: TemplateConfig,
    selectedFields: string[],
    referenceData: Record<string, unknown[]>,
    onTemplateGenerated?: (blob: Blob, filename: string) => void
  ) => {
    setIsGenerating(true);

    try {
      const workbook = XLSX.utils.book_new();

      // Crear hoja principal con plantilla
      const templateData = createTemplateSheet(config, selectedFields);
      const templateSheet = XLSX.utils.aoa_to_sheet(templateData);

      // Aplicar estilos y validaciones
      applySheetFormatting(templateSheet);

      XLSX.utils.book_append_sheet(workbook, templateSheet, 'Plantilla');

      // Agregar hoja de instrucciones si está habilitada
      if (config.includeInstructions) {
        const instructionsSheet = createInstructionsSheet(config, selectedFields);
        XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucciones');
      }

      // Agregar hojas de referencia si está habilitada
      if (config.includeReferenceData && Object.keys(referenceData).length > 0) {
        Object.entries(referenceData).forEach(([key, data]) => {
          const refSheet = createReferenceSheet(key, data);
          XLSX.utils.book_append_sheet(workbook, refSheet, `Ref_${key}`);
        });
      }

      // Generar archivo
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const filename = `plantilla_${config.entityType}_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Descargar archivo
      downloadFile(blob, filename);

      onTemplateGenerated?.(blob, filename);

      notifications.show({
        title: 'Plantilla generada',
        message: `La plantilla de ${config.entityName} se descargó correctamente`,
        color: 'green',
      });
    } catch (error) {
      console.error('Error generating template:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudo generar la plantilla',
        color: 'red',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    isGenerating,
    generateTemplate,
  };
};
