import * as React from 'react';

export interface FailedDataItem {
  id: string | number;
  row: number;
  data: Record<string, unknown>;
  error: string;
}

export interface RecoveryDetails {
  action?: string;
  error?: Error;
  timestamp?: Date;
  additionalInfo?: Record<string, unknown>;
}

export interface RetryConfig {
  batchSize: number;
  retryDelay: number;
  maxRetries: number;
  skipErrors: boolean;
}

export interface FailureDetails {
  timestamp: Date;
  entityType: string;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  errorType: 'validation' | 'network' | 'server' | 'timeout' | 'unknown';
  errorMessage: string;
  stackTrace?: string;
  lastSuccessfulRow?: number;
  failedData?: FailedDataItem[];
  recoveryOptions: RecoveryOption[];
}

export interface RecoveryOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  action: () => Promise<void>;
  available: boolean;
  reason?: string;
}

export interface RecoveryState {
  status: 'idle' | 'analyzing' | 'recovering' | 'completed' | 'failed';
  progress: number;
  currentAction?: string;
  logs: RecoveryLog[];
}

export interface RecoveryLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: RecoveryDetails;
}

export interface FailureRecoveryProps {
  failure: FailureDetails;
  onRecover?: (result: RecoveryResult) => void;
  onCancel?: () => void;
}

export interface RecoveryResult {
  success: boolean;
  recoveredRecords: number;
  remainingErrors: number;
  logs: RecoveryLog[];
}

export interface RecoveryProcessConfig {
  selectedOptions: Set<string>;
  recoveryOptions: RecoveryOption[];
  failure: FailureDetails;
  addLog: (level: RecoveryLog['level'], message: string, details?: RecoveryDetails) => void;
  setRecoveryState: React.Dispatch<React.SetStateAction<RecoveryState>>;
  onRecover?: (result: RecoveryResult) => void;
  recoveryLogs?: RecoveryLog[];
}

export interface FailureAnalysis {
  successRate: number;
  canRetryFromCheckpoint: boolean;
  hasPartialData: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}
