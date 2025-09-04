import { ReportDefinition, ReportTemplate } from '../types/reports';

interface UseReportsPageHandlersProps {
  setSelectedReport: (report: ReportDefinition | null) => void;
  setActiveTab: (tab: string) => void;
  handleExecuteReport: (definition: ReportDefinition, onSuccess?: () => void) => void;
  handleEditReport: (definition: ReportDefinition, onEdit?: () => void) => void;
  handleReportSaved: (report: ReportDefinition) => void;
  handleUseTemplate: (
    template: ReportTemplate,
    onReportCreated: (report: ReportDefinition) => void
  ) => void;
  loadReportDefinitions: () => void;
}

export const useReportsPageHandlers = ({
  setSelectedReport,
  setActiveTab,
  handleExecuteReport,
  handleEditReport,
  handleReportSaved,
  handleUseTemplate,
  loadReportDefinitions,
}: UseReportsPageHandlersProps) => {
  const handleCreateNew = () => {
    setSelectedReport(null);
    setActiveTab('builder');
  };

  const onReportSaved = (report: ReportDefinition) => {
    handleReportSaved(report);
    setActiveTab('dashboard');
  };

  const onExecuteReport = (definition: ReportDefinition) => {
    handleExecuteReport(definition, () => setActiveTab('viewer'));
  };

  const onEditReport = (definition: ReportDefinition) => {
    handleEditReport(definition, () => setActiveTab('builder'));
  };

  const onUseTemplate = (template: ReportTemplate) => {
    handleUseTemplate(template, (newReport: ReportDefinition) => {
      loadReportDefinitions();
      setSelectedReport(newReport);
      setActiveTab('builder');
    });
  };

  return {
    handleCreateNew,
    onReportSaved,
    onExecuteReport,
    onEditReport,
    onUseTemplate,
  };
};
