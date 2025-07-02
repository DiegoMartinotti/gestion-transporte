import React, { useState, useCallback } from 'react';
import {
  Paper,
  Title,
  Group,
  Button,
  Stack,
  Grid,
  Card,
  Text,
  Select,
  TextInput,
  Switch,
  NumberInput,
  Alert,
  Progress,
  Badge,
  ActionIcon,
  Modal,
  Loader,
  Divider,
  Radio,
  Checkbox,
  Tabs,
  Container,
  Box,
  Tooltip,
  Code
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconFileTypePdf,
  IconFileTypeXls,
  IconFileTypeCsv,
  IconPhoto,
  IconDownload,
  IconSettings,
  IconCheck,
  IconX,
  IconRefresh,
  IconEye,
  IconFile,
  IconTableExport,
  IconFileText,
  IconChartBar,
  IconPalette,
  IconTemplate,
  IconCalendar,
  IconMail
} from '@tabler/icons-react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ReportData,
  ExportConfig,
  ExportFormat,
  ReportDefinition,
  ChartConfig
} from '../../types/reports';
import { reportService } from '../../services/reportService';

interface ExportOptionsProps {
  reportDefinition: ReportDefinition;
  reportData: ReportData;
  onExportComplete?: (blob: Blob, filename: string) => void;
  onExportStart?: () => void;
  onExportError?: (error: string) => void;
}

interface ExportState {
  format: ExportFormat;
  fileName: string;
  title: string;
  includeCharts: boolean;
  includeTable: boolean;
  includeMetadata: boolean;
  pageOrientation: 'portrait' | 'landscape';
  paperSize: 'a4' | 'letter' | 'legal';
  chartSize: 'small' | 'medium' | 'large';
  tableStyle: 'simple' | 'striped' | 'bordered';
  fontSize: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
  };
  watermark?: string;
  logo?: string;
  isExporting: boolean;
  progress: number;
}

const FORMAT_OPTIONS = [
  {
    value: 'pdf' as ExportFormat,
    label: 'PDF Document',
    icon: IconFileTypePdf,
    color: 'red',
    description: 'Documento portable con formato preservado'
  },
  {
    value: 'excel' as ExportFormat,
    label: 'Excel Spreadsheet',
    icon: IconFileTypeXls,
    color: 'green',
    description: 'Hoja de cálculo editable con múltiples pestañas'
  },
  {
    value: 'csv' as ExportFormat,
    label: 'CSV Data',
    icon: IconFileTypeCsv,
    color: 'blue',
    description: 'Datos separados por comas, compatible universalmente'
  },
  {
    value: 'image' as ExportFormat,
    label: 'Image (PNG)',
    icon: IconPhoto,
    color: 'orange',
    description: 'Imagen estática de alta resolución'
  }
];

const CHART_SIZE_OPTIONS = [
  { value: 'small', label: 'Pequeño (400x300)', width: 400, height: 300 },
  { value: 'medium', label: 'Mediano (800x600)', width: 800, height: 600 },
  { value: 'large', label: 'Grande (1200x900)', width: 1200, height: 900 }
];

const TABLE_STYLE_OPTIONS = [
  { value: 'simple', label: 'Simple' },
  { value: 'striped', label: 'Rayado' },
  { value: 'bordered', label: 'Con bordes' }
];

export const ExportOptions: React.FC<ExportOptionsProps> = ({
  reportDefinition,
  reportData,
  onExportComplete,
  onExportStart,
  onExportError
}) => {
  const [exportState, setExportState] = useState<ExportState>({
    format: 'pdf',
    fileName: reportService.generateFileName(reportDefinition.name, 'pdf'),
    title: reportDefinition.name,
    includeCharts: true,
    includeTable: true,
    includeMetadata: true,
    pageOrientation: 'portrait',
    paperSize: 'a4',
    chartSize: 'medium',
    tableStyle: 'striped',
    fontSize: 12,
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    colors: {
      primary: '#228be6',
      secondary: '#868e96',
      text: '#212529',
      background: '#ffffff'
    },
    isExporting: false,
    progress: 0
  });

  const [previewModalOpened, { open: openPreviewModal, close: closePreviewModal }] = useDisclosure(false);
  const [advancedModalOpened, { open: openAdvancedModal, close: closeAdvancedModal }] = useDisclosure(false);

  const updateExportState = (updates: Partial<ExportState>) => {
    setExportState(prev => ({ ...prev, ...updates }));
  };

  const updateFileName = () => {
    const newFileName = reportService.generateFileName(
      reportDefinition.name,
      exportState.format
    );
    updateExportState({ fileName: newFileName });
  };

  const validateExportConfig = (): string | null => {
    if (!exportState.fileName.trim()) {
      return 'Debe especificar un nombre de archivo';
    }
    
    if (!exportState.includeCharts && !exportState.includeTable) {
      return 'Debe incluir al menos gráficos o tabla';
    }
    
    if (exportState.format === 'image' && !exportState.includeCharts) {
      return 'La exportación a imagen requiere incluir gráficos';
    }
    
    return null;
  };

  const simulateProgress = (duration: number = 3000) => {
    let progress = 0;
    const interval = 50;
    const increment = 100 / (duration / interval);
    
    const timer = setInterval(() => {
      progress += increment;
      if (progress >= 100) {
        progress = 100;
        clearInterval(timer);
        updateExportState({ progress: 100 });
      } else {
        updateExportState({ progress: Math.floor(progress) });
      }
    }, interval);
    
    return timer;
  };

  const exportToPDF = async (): Promise<Blob> => {
    const pdf = new jsPDF({
      orientation: exportState.pageOrientation,
      unit: 'mm',
      format: exportState.paperSize
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = exportState.margins.left;
    const contentWidth = pageWidth - (margin * 2);
    
    let yPosition = exportState.margins.top;

    // Título del reporte
    pdf.setFontSize(20);
    pdf.setTextColor(exportState.colors.primary);
    pdf.text(exportState.title, margin, yPosition);
    yPosition += 15;

    // Metadata
    if (exportState.includeMetadata) {
      pdf.setFontSize(10);
      pdf.setTextColor(exportState.colors.secondary);
      pdf.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, margin, yPosition);
      yPosition += 5;
      pdf.text(`Total de registros: ${reportData.totalRows}`, margin, yPosition);
      yPosition += 5;
      if (reportData.metadata?.executionTime) {
        pdf.text(`Tiempo de ejecución: ${reportData.metadata.executionTime}ms`, margin, yPosition);
        yPosition += 5;
      }
      yPosition += 10;
    }

    // Descripción
    if (reportDefinition.description) {
      pdf.setFontSize(exportState.fontSize);
      pdf.setTextColor(exportState.colors.text);
      const descriptionLines = pdf.splitTextToSize(reportDefinition.description, contentWidth);
      pdf.text(descriptionLines, margin, yPosition);
      yPosition += descriptionLines.length * 5 + 10;
    }

    // Tabla de datos
    if (exportState.includeTable && reportData.rows.length > 0) {
      pdf.setFontSize(14);
      pdf.setTextColor(exportState.colors.primary);
      pdf.text('Datos', margin, yPosition);
      yPosition += 10;

      // Headers
      pdf.setFontSize(10);
      pdf.setTextColor(exportState.colors.text);
      const colWidth = contentWidth / reportData.headers.length;
      
      // Draw headers with background
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPosition - 5, contentWidth, 8, 'F');
      
      reportData.headers.forEach((header, index) => {
        pdf.text(header, margin + (index * colWidth) + 2, yPosition);
      });
      yPosition += 10;

      // Data rows (limited to first 50 for PDF)
      const maxRows = Math.min(reportData.rows.length, 50);
      for (let i = 0; i < maxRows; i++) {
        const row = reportData.rows[i];
        
        // Check if we need a new page
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = exportState.margins.top;
        }
        
        // Alternate row colors
        if (exportState.tableStyle === 'striped' && i % 2 === 0) {
          pdf.setFillColor(248, 249, 250);
          pdf.rect(margin, yPosition - 3, contentWidth, 6, 'F');
        }
        
        row.forEach((cell, index) => {
          const cellText = String(cell || '');
          const truncatedText = cellText.length > 20 ? cellText.substring(0, 20) + '...' : cellText;
          pdf.text(truncatedText, margin + (index * colWidth) + 2, yPosition);
        });
        
        yPosition += 6;
      }
      
      if (reportData.rows.length > maxRows) {
        yPosition += 5;
        pdf.setFontSize(8);
        pdf.setTextColor(exportState.colors.secondary);
        pdf.text(`Nota: Mostrando solo los primeros ${maxRows} registros de ${reportData.totalRows} totales.`, margin, yPosition);
      }
    }

    // Watermark
    if (exportState.watermark) {
      pdf.setFontSize(48);
      pdf.setTextColor(200, 200, 200);
      pdf.text(exportState.watermark, pageWidth / 2, pageHeight / 2, {
        angle: 45,
        align: 'center'
      });
    }

    return pdf.output('blob');
  };

  const exportToExcel = async (): Promise<Blob> => {
    const workbook = XLSX.utils.book_new();
    
    // Hoja de datos
    if (exportState.includeTable) {
      const wsData = [reportData.headers, ...reportData.rows];
      const worksheet = XLSX.utils.aoa_to_sheet(wsData);
      
      // Aplicar estilos básicos
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      
      // Headers en negrita
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!worksheet[cellAddress]) continue;
        worksheet[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'F0F0F0' } }
        };
      }
      
      // Auto-ajustar anchos de columna
      const colWidths = reportData.headers.map((header, index) => {
        const maxLength = Math.max(
          header.length,
          ...reportData.rows.slice(0, 100).map(row => String(row[index] || '').length)
        );
        return { wch: Math.min(maxLength + 2, 50) };
      });
      worksheet['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
    }
    
    // Hoja de metadatos
    if (exportState.includeMetadata) {
      const metadataData = [
        ['Reporte', exportState.title],
        ['Descripción', reportDefinition.description || ''],
        ['Tipo', reportDefinition.type],
        ['Generado', format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })],
        ['Total registros', reportData.totalRows],
        ['Tiempo ejecución (ms)', reportData.metadata?.executionTime || ''],
        ['Filtros aplicados', reportData.metadata?.filters?.length || 0]
      ];
      
      const metadataWs = XLSX.utils.aoa_to_sheet(metadataData);
      metadataWs['!cols'] = [{ wch: 20 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(workbook, metadataWs, 'Información');
    }
    
    // Hoja de configuración de gráficos
    if (exportState.includeCharts && reportDefinition.charts?.length) {
      const chartsData = [
        ['Título', 'Tipo', 'Eje X', 'Eje Y', 'Altura']
      ];
      
      reportDefinition.charts.forEach(chart => {
        chartsData.push([
          chart.title,
          chart.type,
          chart.xAxis,
          chart.yAxis.join(', '),
          String(chart.height || 300)
        ]);
      });
      
      const chartsWs = XLSX.utils.aoa_to_sheet(chartsData);
      chartsWs['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(workbook, chartsWs, 'Gráficos');
    }
    
    return new Blob([XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  };

  const exportToCSV = async (): Promise<Blob> => {
    const csvContent = [
      reportData.headers.join(','),
      ...reportData.rows.map(row => 
        row.map(cell => {
          const stringCell = String(cell || '');
          // Escape commas and quotes
          if (stringCell.includes(',') || stringCell.includes('"') || stringCell.includes('\n')) {
            return `"${stringCell.replace(/"/g, '""')}"`;
          }
          return stringCell;
        }).join(',')
      )
    ].join('\n');
    
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  };

  const handleExport = async () => {
    const validationError = validateExportConfig();
    if (validationError) {
      notifications.show({
        title: 'Error de validación',
        message: validationError,
        color: 'red'
      });
      return;
    }

    try {
      updateExportState({ isExporting: true, progress: 0 });
      onExportStart?.();
      
      // Simular progreso
      const progressTimer = simulateProgress(2000);
      
      let blob: Blob;
      
      switch (exportState.format) {
        case 'pdf':
          blob = await exportToPDF();
          break;
        case 'excel':
          blob = await exportToExcel();
          break;
        case 'csv':
          blob = await exportToCSV();
          break;
        case 'image':
          // Para imagen, usaríamos html2canvas para capturar gráficos
          throw new Error('Exportación a imagen aún no implementada');
        default:
          throw new Error(`Formato no soportado: ${exportState.format}`);
      }
      
      clearInterval(progressTimer);
      updateExportState({ progress: 100 });
      
      // Descargar archivo
      reportService.downloadBlob(blob, exportState.fileName);
      
      onExportComplete?.(blob, exportState.fileName);
      
      notifications.show({
        title: 'Exportación exitosa',
        message: `Archivo ${exportState.fileName} descargado correctamente`,
        color: 'green',
        icon: <IconCheck size={16} />
      });
      
    } catch (error) {
      console.error('Error during export:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      onExportError?.(errorMessage);
      
      notifications.show({
        title: 'Error de exportación',
        message: errorMessage,
        color: 'red',
        icon: <IconX size={16} />
      });
    } finally {
      updateExportState({ isExporting: false, progress: 0 });
    }
  };

  const renderFormatSelector = () => (
    <Stack gap="sm">
      <Text fw={500} size="sm">Formato de Exportación</Text>
      <Grid>
        {FORMAT_OPTIONS.map((option) => {
          const IconComponent = option.icon;
          return (
            <Grid.Col key={option.value} span={6}>
              <Card
                withBorder
                p="sm"
                style={{
                  cursor: 'pointer',
                  backgroundColor: exportState.format === option.value ? 
                    'var(--mantine-color-blue-0)' : undefined,
                  borderColor: exportState.format === option.value ? 
                    'var(--mantine-color-blue-5)' : undefined
                }}
                onClick={() => {
                  updateExportState({ format: option.value });
                  updateFileName();
                }}
              >
                <Group gap="xs">
                  <IconComponent size={24} color={`var(--mantine-color-${option.color}-6)`} />
                  <div style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>{option.label}</Text>
                    <Text size="xs" c="dimmed">{option.description}</Text>
                  </div>
                  {exportState.format === option.value && (
                    <IconCheck size={16} color="var(--mantine-color-blue-6)" />
                  )}
                </Group>
              </Card>
            </Grid.Col>
          );
        })}
      </Grid>
    </Stack>
  );

  const renderBasicOptions = () => (
    <Stack gap="md">
      <TextInput
        label="Nombre del Archivo"
        placeholder="nombre-del-archivo"
        value={exportState.fileName}
        onChange={(e) => updateExportState({ fileName: e.target.value })}
        required
        rightSection={
          <Tooltip label="Generar nombre automático">
            <div>
              <ActionIcon
                variant="subtle"
                onClick={updateFileName}
              >
                <IconRefresh size={16} />
              </ActionIcon>
            </div>
          </Tooltip>
        }
      />
      
      <TextInput
        label="Título del Reporte"
        placeholder="Título personalizado"
        value={exportState.title}
        onChange={(e) => updateExportState({ title: e.target.value })}
      />
      
      <Group grow>
        <Switch
          label="Incluir Gráficos"
          description="Exportar visualizaciones del reporte"
          checked={exportState.includeCharts}
          onChange={(e) => updateExportState({ includeCharts: e.currentTarget.checked })}
          disabled={!reportDefinition.charts?.length}
        />
        
        <Switch
          label="Incluir Tabla"
          description="Exportar datos tabulares"
          checked={exportState.includeTable}
          onChange={(e) => updateExportState({ includeTable: e.currentTarget.checked })}
        />
      </Group>
      
      <Switch
        label="Incluir Metadatos"
        description="Información adicional del reporte"
        checked={exportState.includeMetadata}
        onChange={(e) => updateExportState({ includeMetadata: e.currentTarget.checked })}
      />
    </Stack>
  );

  const renderAdvancedOptions = () => {
    if (!['pdf', 'image'].includes(exportState.format)) return null;
    
    return (
      <Stack gap="md">
        <Group grow>
          <Select
            label="Orientación"
            data={[
              { value: 'portrait', label: 'Vertical' },
              { value: 'landscape', label: 'Horizontal' }
            ]}
            value={exportState.pageOrientation}
            onChange={(value) => updateExportState({ pageOrientation: value as any })}
          />
          
          <Select
            label="Tamaño de Página"
            data={[
              { value: 'a4', label: 'A4' },
              { value: 'letter', label: 'Carta' },
              { value: 'legal', label: 'Legal' }
            ]}
            value={exportState.paperSize}
            onChange={(value) => updateExportState({ paperSize: value as any })}
          />
        </Group>
        
        {exportState.includeCharts && (
          <Select
            label="Tamaño de Gráficos"
            data={CHART_SIZE_OPTIONS}
            value={exportState.chartSize}
            onChange={(value) => updateExportState({ chartSize: value as any })}
          />
        )}
        
        {exportState.includeTable && (
          <Select
            label="Estilo de Tabla"
            data={TABLE_STYLE_OPTIONS}
            value={exportState.tableStyle}
            onChange={(value) => updateExportState({ tableStyle: value as any })}
          />
        )}
        
        <NumberInput
          label="Tamaño de Fuente"
          value={exportState.fontSize}
          onChange={(value) => updateExportState({ fontSize: Number(value) })}
          min={8}
          max={24}
        />
        
        <TextInput
          label="Marca de Agua (Opcional)"
          placeholder="CONFIDENCIAL, BORRADOR, etc."
          value={exportState.watermark || ''}
          onChange={(e) => updateExportState({ watermark: e.target.value })}
        />
      </Stack>
    );
  };

  const renderPreview = () => (
    <Card withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={500}>Vista Previa de Exportación</Text>
          <Badge color={FORMAT_OPTIONS.find(f => f.value === exportState.format)?.color}>
            {FORMAT_OPTIONS.find(f => f.value === exportState.format)?.label}
          </Badge>
        </Group>
        
        <Divider />
        
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm">Archivo:</Text>
            <Code>{exportState.fileName}</Code>
          </Group>
          
          <Group justify="space-between">
            <Text size="sm">Contenido:</Text>
            <Group gap="xs">
              {exportState.includeTable && <Badge size="sm" variant="light">Tabla</Badge>}
              {exportState.includeCharts && <Badge size="sm" variant="light">Gráficos</Badge>}
              {exportState.includeMetadata && <Badge size="sm" variant="light">Metadatos</Badge>}
            </Group>
          </Group>
          
          <Group justify="space-between">
            <Text size="sm">Registros:</Text>
            <Text size="sm" fw={500}>{reportData.totalRows.toLocaleString('es-AR')}</Text>
          </Group>
          
          {exportState.format === 'pdf' && (
            <Group justify="space-between">
              <Text size="sm">Configuración:</Text>
              <Text size="sm">
                {exportState.paperSize.toUpperCase()} - {exportState.pageOrientation === 'portrait' ? 'Vertical' : 'Horizontal'}
              </Text>
            </Group>
          )}
        </Stack>
      </Stack>
    </Card>
  );

  return (
    <Container size="md">
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Title order={3}>Opciones de Exportación</Title>
            <Text c="dimmed" size="sm">
              Configure las opciones para exportar el reporte "{reportDefinition.name}"
            </Text>
          </div>
          
          <Button
            leftSection={<IconEye size={16} />}
            variant="light"
            onClick={openPreviewModal}
          >
            Vista Previa
          </Button>
        </Group>

        <Tabs defaultValue="format">
          <Tabs.List>
            <Tabs.Tab value="format" leftSection={<IconFileText size={16} />}>
              Formato
            </Tabs.Tab>
            <Tabs.Tab value="content" leftSection={<IconSettings size={16} />}>
              Contenido
            </Tabs.Tab>
            <Tabs.Tab value="style" leftSection={<IconPalette size={16} />}>
              Presentación
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="format" pt="md">
            {renderFormatSelector()}
          </Tabs.Panel>

          <Tabs.Panel value="content" pt="md">
            {renderBasicOptions()}
          </Tabs.Panel>

          <Tabs.Panel value="style" pt="md">
            {renderAdvancedOptions() || (
              <Alert color="blue">
                Las opciones de presentación están disponibles para formatos PDF e Imagen.
              </Alert>
            )}
          </Tabs.Panel>
        </Tabs>

        {renderPreview()}

        {exportState.isExporting && (
          <Card withBorder>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={500}>Exportando...</Text>
                <Text size="sm" c="dimmed">{exportState.progress}%</Text>
              </Group>
              <Progress value={exportState.progress} animated />
            </Stack>
          </Card>
        )}

        <Group justify="space-between">
          <Group>
            <Text size="sm" c="dimmed">
              Tamaño estimado: ~{Math.round(reportData.totalRows * 0.1)}KB
            </Text>
          </Group>
          
          <Group>
            <Button
              variant="light"
              onClick={openAdvancedModal}
              leftSection={<IconSettings size={16} />}
            >
              Opciones Avanzadas
            </Button>
            
            <Button
              leftSection={<IconDownload size={16} />}
              onClick={handleExport}
              loading={exportState.isExporting}
              disabled={!!validateExportConfig()}
            >
              Exportar
            </Button>
          </Group>
        </Group>
      </Stack>

      {/* Modal de Vista Previa */}
      <Modal
        opened={previewModalOpened}
        onClose={closePreviewModal}
        title="Vista Previa de Exportación"
        size="md"
      >
        <Stack gap="md">
          {renderPreview()}
          
          <Alert color="blue" icon={<IconEye size={16} />}>
            Esta es una vista previa de la configuración. El archivo final puede variar según el formato seleccionado.
          </Alert>
          
          <Group justify="flex-end">
            <Button variant="light" onClick={closePreviewModal}>
              Cerrar
            </Button>
            <Button onClick={() => {
              closePreviewModal();
              handleExport();
            }}>
              Exportar Ahora
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal de Opciones Avanzadas */}
      <Modal
        opened={advancedModalOpened}
        onClose={closeAdvancedModal}
        title="Opciones Avanzadas de Exportación"
        size="lg"
      >
        <Stack gap="md">
          {renderAdvancedOptions()}
          
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeAdvancedModal}>
              Cancelar
            </Button>
            <Button onClick={closeAdvancedModal}>
              Aplicar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};