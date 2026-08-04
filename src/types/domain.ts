export type UserRole = 'admin' | 'analyst' | 'viewer'
export type ImportSeverity = 'error' | 'warning' | 'info'
export interface MonthlyMetrics { terminalCode: string; bat: string; transactionCount: number; transactionAmount: number; activeTransactionDays: number; replenishmentCount: number; replenishmentAmount: number; dispensedAmount: number; collectedAmount: number; cashShortageDowntime: number }
export interface ImportMetadata { reportName?: string; reference?: string; period?: string; generatedDate?: string; entityCode?: string; provider?: string; classification?: string }
export interface ImportIssue { severity: ImportSeverity; code: string; message: string; row?: number; field?: string }
export interface ParsedFilename { reference: string | null; period: string | null; reportType: string | null; client: string | null }
export interface ImportPreview { filename: string; mainSheet: string | null; metadata: ImportMetadata; detected: ParsedFilename; rows: MonthlyMetrics[]; totalRows: number; recognizedColumns: string[]; issues: ImportIssue[] }
