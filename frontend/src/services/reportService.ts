import { apiService as api } from './api';
import {
  ReportDefinition,
  ReportData,
  ScheduledReport,
  ReportHistory,
  ReportTemplate,
  DataSource,
  ExportConfig,
  ExportFormat,
  ReportApiResponse,
  PaginatedReportResponse,
  ReportExecution,
} from '../types/reports';

export class ReportService {
  private baseUrl = '/api/reports';

  // Report Definitions
  async getReportDefinitions(): Promise<ReportDefinition[]> {
    const response = await api.get<ReportApiResponse<ReportDefinition[]>>(
      `${this.baseUrl}/definitions`
    );
    return response.data?.data || [];
  }

  async getReportDefinition(id: string): Promise<ReportDefinition> {
    const response = await api.get<ReportApiResponse<ReportDefinition>>(
      `${this.baseUrl}/definitions/${id}`
    );
    if (!response.data?.data) {
      throw new Error(response.data?.error || 'Report not found');
    }
    return response.data.data;
  }

  async createReportDefinition(
    definition: Omit<ReportDefinition, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ): Promise<ReportDefinition> {
    const response = await api.post<ReportApiResponse<ReportDefinition>>(
      `${this.baseUrl}/definitions`,
      definition
    );
    if (!response.data?.data) {
      throw new Error(response.data?.error || 'Failed to create report');
    }
    return response.data.data;
  }

  async updateReportDefinition(
    id: string,
    definition: Partial<ReportDefinition>
  ): Promise<ReportDefinition> {
    const response = await api.put<ReportApiResponse<ReportDefinition>>(
      `${this.baseUrl}/definitions/${id}`,
      definition
    );
    if (!response.data?.data) {
      throw new Error(response.data?.error || 'Failed to update report');
    }
    return response.data.data;
  }

  async deleteReportDefinition(id: string): Promise<void> {
    const response = await api.delete<ReportApiResponse<void>>(`${this.baseUrl}/definitions/${id}`);
    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Failed to delete report');
    }
  }

  // Report Execution
  async executeReport(
    definitionId: string,
    options?: {
      limit?: number;
      offset?: number;
      exportFormat?: ExportFormat;
    }
  ): Promise<ReportData> {
    const response = await api.post<ReportApiResponse<ReportData>>(
      `${this.baseUrl}/execute/${definitionId}`,
      options
    );
    if (!response.data?.data) {
      throw new Error(response.data?.error || 'Failed to execute report');
    }
    return response.data?.data;
  }

  async previewReport(definition: Partial<ReportDefinition>): Promise<ReportData> {
    const response = await api.post<ReportApiResponse<ReportData>>(`${this.baseUrl}/preview`, {
      ...definition,
      limit: 100, // Limit preview data
    });
    if (!response.data?.data) {
      throw new Error(response.data?.error || 'Failed to generate preview');
    }
    return response.data?.data;
  }

  // Export Functions
  async exportReport(definitionId: string, config: ExportConfig): Promise<Blob> {
    const client = api.getClient();
    const response = await client.post(`${this.baseUrl}/export/${definitionId}`, config, {
      responseType: 'blob',
    });
    return response.data as Blob;
  }

  async exportReportData(data: ReportData, config: ExportConfig): Promise<Blob> {
    const client = api.getClient();
    const response = await client.post(
      `${this.baseUrl}/export-data`,
      { data, config },
      {
        responseType: 'blob',
      }
    );
    return response.data as Blob;
  }

  // Scheduled Reports
  async getScheduledReports(): Promise<ScheduledReport[]> {
    const response = await api.get<ReportApiResponse<ScheduledReport[]>>(
      `${this.baseUrl}/scheduled`
    );
    return response.data?.data || [];
  }

  async createScheduledReport(
    scheduledReport: Omit<ScheduledReport, 'id' | 'createdAt' | 'createdBy' | 'lastRun' | 'nextRun'>
  ): Promise<ScheduledReport> {
    const response = await api.post<ReportApiResponse<ScheduledReport>>(
      `${this.baseUrl}/scheduled`,
      scheduledReport
    );
    if (!response.data?.data) {
      throw new Error(response.data?.error || 'Failed to create scheduled report');
    }
    return response.data?.data;
  }

  async updateScheduledReport(
    id: string,
    updates: Partial<ScheduledReport>
  ): Promise<ScheduledReport> {
    const response = await api.put<ReportApiResponse<ScheduledReport>>(
      `${this.baseUrl}/scheduled/${id}`,
      updates
    );
    if (!response.data?.data) {
      throw new Error(response.data?.error || 'Failed to update scheduled report');
    }
    return response.data.data;
  }

  async deleteScheduledReport(id: string): Promise<void> {
    const response = await api.delete<ReportApiResponse<void>>(`${this.baseUrl}/scheduled/${id}`);
    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Failed to delete scheduled report');
    }
  }

  async toggleScheduledReport(id: string): Promise<ScheduledReport> {
    const response = await api.post<ReportApiResponse<ScheduledReport>>(
      `${this.baseUrl}/scheduled/${id}/toggle`
    );
    if (!response.data?.data) {
      throw new Error(response.data?.error || 'Failed to toggle scheduled report');
    }
    return response.data?.data;
  }

  // Report History
  async getReportHistory(page = 1, pageSize = 20): Promise<PaginatedReportResponse<ReportHistory>> {
    const response = await api.get<ReportApiResponse<PaginatedReportResponse<ReportHistory>>>(
      `${this.baseUrl}/history?page=${page}&pageSize=${pageSize}`
    );
    return (
      response.data?.data || {
        items: [],
        totalItems: 0,
        currentPage: 1,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      }
    );
  }

  async getReportHistoryById(id: string): Promise<ReportHistory> {
    const response = await api.get<ReportApiResponse<ReportHistory>>(
      `${this.baseUrl}/history/${id}`
    );
    if (!response.data?.data) {
      throw new Error(response.data?.error || 'Report history not found');
    }
    return response.data?.data;
  }

  async downloadReportFromHistory(historyId: string): Promise<Blob> {
    const response = await api.getClient().get(`${this.baseUrl}/history/${historyId}/download`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  }

  async deleteReportHistory(id: string): Promise<void> {
    const response = await api.delete<ReportApiResponse<void>>(`${this.baseUrl}/history/${id}`);
    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Failed to delete report history');
    }
  }

  // Report Executions
  async getReportExecutions(params?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    reportId?: string;
    status?: string;
    format?: string;
    startDate?: Date;
    endDate?: Date;
    createdBy?: string;
    searchTerm?: string;
  }): Promise<ReportExecution[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }

    const response = await api.get<ReportApiResponse<ReportExecution[]>>(
      `${this.baseUrl}/executions?${searchParams.toString()}`
    );
    return response.data?.data || [];
  }

  async downloadReportExecution(executionId: string): Promise<Blob> {
    const response = await api
      .getClient()
      .get(`${this.baseUrl}/executions/${executionId}/download`, {
        responseType: 'blob',
      });
    return response.data as Blob;
  }

  async rerunReportExecution(executionId: string): Promise<void> {
    const response = await api.post<ReportApiResponse<void>>(
      `${this.baseUrl}/executions/${executionId}/rerun`
    );
    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Failed to rerun report execution');
    }
  }

  async cancelReportExecution(executionId: string): Promise<void> {
    const response = await api.post<ReportApiResponse<void>>(
      `${this.baseUrl}/executions/${executionId}/cancel`
    );
    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Failed to cancel report execution');
    }
  }

  async deleteReportExecutions(executionIds: string[]): Promise<void> {
    const response = await api
      .getClient()
      .delete<ReportApiResponse<void>>(`${this.baseUrl}/executions`, {
        data: { ids: executionIds },
      });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete report executions');
    }
  }

  async archiveReportExecutions(executionIds: string[]): Promise<void> {
    const response = await api.post<ReportApiResponse<void>>(`${this.baseUrl}/executions/archive`, {
      ids: executionIds,
    });
    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Failed to archive report executions');
    }
  }

  // Templates
  async getReportTemplates(): Promise<ReportTemplate[]> {
    const response = await api.get<ReportApiResponse<ReportTemplate[]>>(
      `${this.baseUrl}/templates`
    );
    return response.data?.data || [];
  }

  async createReportFromTemplate(
    templateId: string,
    customization?: Partial<ReportDefinition>
  ): Promise<ReportDefinition> {
    const response = await api.post<ReportApiResponse<ReportDefinition>>(
      `${this.baseUrl}/templates/${templateId}/create`,
      customization
    );
    if (!response.data?.data) {
      throw new Error(response.data?.error || 'Failed to create report from template');
    }
    return response.data?.data;
  }

  // Data Sources
  async getDataSources(): Promise<DataSource[]> {
    const response = await api.get<ReportApiResponse<DataSource[]>>(`${this.baseUrl}/data-sources`);
    return response.data?.data || [];
  }

  async getFieldOptions(
    dataSource: string,
    field: string
  ): Promise<Array<{ label: string; value: string | number }>> {
    const response = await api.get<
      ReportApiResponse<Array<{ label: string; value: string | number }>>
    >(`${this.baseUrl}/data-sources/${dataSource}/fields/${field}/options`);
    return response.data?.data || [];
  }

  // Utility Methods
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  generateFileName(reportName: string, format: ExportFormat, timestamp?: Date): string {
    const date = timestamp || new Date();
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
    const cleanName = reportName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    return `${cleanName}-${dateStr}-${timeStr}.${format === 'excel' ? 'xlsx' : format}`;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Mock Data Generation (for development)
  generateMockData(definition: Partial<ReportDefinition>): ReportData {
    const mockRows: (string | number | boolean | Date | null)[][] = [];
    const rowCount = Math.min(definition.limit || 50, 100);

    for (let i = 0; i < rowCount; i++) {
      const row: (string | number | boolean | Date | null)[] = [];
      definition.fields?.forEach((field) => {
        switch (field.type) {
          case 'string':
            row.push(`${field.label} ${i + 1}`);
            break;
          case 'number':
            row.push(Math.floor(Math.random() * 1000));
            break;
          case 'currency':
            row.push(Math.floor(Math.random() * 100000));
            break;
          case 'date':
            row.push(new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000));
            break;
          case 'boolean':
            row.push(Math.random() > 0.5);
            break;
          default:
            row.push(`Data ${i + 1}`);
        }
      });
      mockRows.push(row);
    }

    return {
      headers: definition.fields?.map((f) => f.label) || [],
      rows: mockRows,
      totalRows: mockRows.length,
      metadata: {
        executionTime: Math.random() * 1000,
        generatedAt: new Date(),
        filters: definition.filters || [],
      },
    };
  }
}

export const reportService = new ReportService();
