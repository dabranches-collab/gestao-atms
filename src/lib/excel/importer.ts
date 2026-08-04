import * as XLSX from 'xlsx'
import type { ImportIssue, ImportMetadata, ImportPreview, MonthlyMetrics } from '../../types/domain'
import { mapHeaders, REQUIRED_COLUMNS, type MetricField, normalizeText } from './columns'
import { parseReportFilename } from './filename'

const METADATA_KEYS: Record<string, keyof ImportMetadata> = { 'NOME DO REPORT': 'reportName', REFERENCIA: 'reference', 'DATA DA INFORMACAO': 'period', 'DATA DA GERACAO': 'generatedDate', 'BANCO ENTIDADE': 'entityCode', PROVEDOR: 'provider', CLASSIFICACAO: 'classification' }
const CLIENT_ENTITY_CODES: Record<string, string> = { BCI: '5', BKEVE: '47' }
const numericFields: MetricField[] = ['transactionCount', 'transactionAmount', 'activeTransactionDays', 'replenishmentCount', 'replenishmentAmount', 'dispensedAmount', 'collectedAmount', 'cashShortageDowntime']

function readMetadata(sheet: XLSX.WorkSheet): ImportMetadata {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false })
  const metadata: ImportMetadata = {}
  for (const row of rows) { const key = METADATA_KEYS[normalizeText(row[0])]; if (key) metadata[key] = String(row[1] ?? '').trim() }
  return metadata
}

export function parseWorkbook(data: ArrayBuffer, filename: string): ImportPreview {
  const issues: ImportIssue[] = []
  if (!/\.xlsx$/i.test(filename)) issues.push({ severity: 'error', code: 'INVALID_EXTENSION', message: 'Apenas ficheiros .xlsx são aceites.' })
  const detected = parseReportFilename(filename)
  if (!detected.client) issues.push({ severity: 'error', code: 'CLIENT_NOT_DETECTED', message: 'Não foi possível detectar o cliente no nome.' })
  if (!detected.period) issues.push({ severity: 'error', code: 'PERIOD_NOT_DETECTED', message: 'Não foi possível detectar um período AAAAMM válido.' })
  let workbook: XLSX.WorkBook
  try { workbook = XLSX.read(data, { type: 'array', cellDates: true }) } catch { return { filename, mainSheet: null, metadata: {}, detected, rows: [], totalRows: 0, recognizedColumns: [], issues: [...issues, { severity: 'error', code: 'INVALID_WORKBOOK', message: 'O ficheiro não é um Excel válido.' }] } }
  const infoName = workbook.SheetNames.find((name) => normalizeText(name) === 'INFO REPORT')
  if (!infoName) issues.push({ severity: 'error', code: 'MISSING_INFO_REPORT', message: 'A folha INFO_REPORT não existe.' })
  const metadata = infoName ? readMetadata(workbook.Sheets[infoName]) : {}
  const mainSheet = workbook.SheetNames.find((name) => name !== infoName && /CA[-_ ]?(BCI|BKEVE)|LISTAGEM/i.test(name)) ?? workbook.SheetNames.find((name) => name !== infoName) ?? null
  if (!mainSheet) issues.push({ severity: 'error', code: 'MISSING_MAIN_SHEET', message: 'Não foi encontrada a folha principal.' })
  const matrix = mainSheet ? XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[mainSheet], { header: 1, defval: null }) : []
  const headerMap = mapHeaders(matrix[0] ?? [])
  const missing = (Object.keys(REQUIRED_COLUMNS) as MetricField[]).filter((field) => headerMap[field] === undefined)
  missing.forEach((field) => issues.push({ severity: 'error', code: 'MISSING_COLUMN', field, message: `Coluna obrigatória não reconhecida: ${field}.` }))
  const seen = new Set<string>(); const rows: MonthlyMetrics[] = []
  matrix.slice(1).forEach((raw, index) => {
    const rowNumber = index + 2
    const terminal = String(raw[headerMap.terminalCode ?? -1] ?? '').trim()
    const bat = String(raw[headerMap.bat ?? -1] ?? '').trim().toUpperCase()
    if (!terminal) { issues.push({ severity: 'error', code: 'MISSING_TERMINAL', row: rowNumber, field: 'terminalCode', message: 'Terminal não preenchido.' }); return }
    if (seen.has(terminal)) issues.push({ severity: 'error', code: 'DUPLICATE_TERMINAL', row: rowNumber, field: 'terminalCode', message: `Terminal duplicado: ${terminal}.` })
    seen.add(terminal)
    const values = Object.fromEntries(numericFields.map((field) => [field, Number(raw[headerMap[field] ?? -1])])) as Record<MetricField, number>
    numericFields.forEach((field) => { if (!Number.isFinite(values[field])) issues.push({ severity: 'error', code: 'INVALID_NUMBER', row: rowNumber, field, message: `Valor numérico inválido em ${field}.` }); else if (values[field] < 0) issues.push({ severity: 'warning', code: 'NEGATIVE_VALUE', row: rowNumber, field, message: `Valor negativo inesperado em ${field}.` }) })
    if (Number.isFinite(values.cashShortageDowntime) && (values.cashShortageDowntime < 0 || values.cashShortageDowntime > 1)) issues.push({ severity: 'error', code: 'DOWNTIME_OUT_OF_RANGE', row: rowNumber, field: 'cashShortageDowntime', message: 'Downtime deve estar entre 0 e 1.' })
    if (detected.client && bat && !normalizeText(bat).includes(detected.client)) issues.push({ severity: 'warning', code: 'CLIENT_MISMATCH', row: rowNumber, field: 'bat', message: `BAT ${bat} difere do cliente ${detected.client}.` })
    rows.push({ terminalCode: terminal, bat, transactionCount: values.transactionCount, transactionAmount: values.transactionAmount, activeTransactionDays: values.activeTransactionDays, replenishmentCount: values.replenishmentCount, replenishmentAmount: values.replenishmentAmount, dispensedAmount: values.dispensedAmount, collectedAmount: values.collectedAmount, cashShortageDowntime: values.cashShortageDowntime })
  })
  if (metadata.entityCode && detected.client && CLIENT_ENTITY_CODES[detected.client] && normalizeText(metadata.entityCode) !== CLIENT_ENTITY_CODES[detected.client]) issues.push({ severity: 'warning', code: 'METADATA_CLIENT_MISMATCH', message: 'O código Banco/Entidade difere do cliente detectado.' })
  const metadataPeriod = metadata.period?.match(/20\d{4}/)?.[0]
  const detectedPeriod = detected.period?.replaceAll('-', '').slice(0, 6)
  if (metadataPeriod && detectedPeriod && metadataPeriod !== detectedPeriod) issues.push({ severity: 'error', code: 'METADATA_PERIOD_MISMATCH', message: 'A Data da Informação difere do período no nome do ficheiro.' })
  return { filename, mainSheet, metadata, detected, rows: rows.slice(0, 5), totalRows: matrix.length > 0 ? matrix.length - 1 : 0, recognizedColumns: Object.keys(headerMap), issues }
}
