import type { MonthlyMetrics } from '../types/domain'

export type MetricKey = Exclude<keyof MonthlyMetrics, 'terminalCode' | 'bat'>
export type MetricDirection = 'higher-is-contextual' | 'lower-is-better'
export type MetricFormat = 'integer' | 'money' | 'percentage'

export interface MetricDefinition {
  key: MetricKey
  label: string
  shortLabel: string
  format: MetricFormat
  direction: MetricDirection
  description: string
}

export const metricDefinitions: MetricDefinition[] = [
  {
    key: 'transactionCount',
    label: 'Número de transacções',
    shortLabel: 'Transacções',
    format: 'integer',
    direction: 'higher-is-contextual',
    description: 'Quantidade total de transacções realizadas pelo ATM no período.',
  },
  {
    key: 'transactionAmount',
    label: 'Montante de transacções',
    shortLabel: 'Montante transaccionado',
    format: 'money',
    direction: 'higher-is-contextual',
    description: 'Valor monetário total das transacções realizadas.',
  },
  {
    key: 'activeTransactionDays',
    label: 'Número de dias com transacções',
    shortLabel: 'Dias activos',
    format: 'integer',
    direction: 'higher-is-contextual',
    description: 'Dias do mês em que o ATM registou pelo menos uma transacção.',
  },
  {
    key: 'replenishmentCount',
    label: 'Número de abastecimentos',
    shortLabel: 'Abastecimentos',
    format: 'integer',
    direction: 'higher-is-contextual',
    description: 'Quantidade de operações de abastecimento realizadas.',
  },
  {
    key: 'replenishmentAmount',
    label: 'Montante de abastecimentos',
    shortLabel: 'Montante abastecido',
    format: 'money',
    direction: 'higher-is-contextual',
    description: 'Valor total introduzido no ATM através de abastecimentos.',
  },
  {
    key: 'dispensedAmount',
    label: 'Montante dispensado',
    shortLabel: 'Montante dispensado',
    format: 'money',
    direction: 'higher-is-contextual',
    description: 'Valor total de numerário dispensado pelo ATM.',
  },
  {
    key: 'collectedAmount',
    label: 'Montante recolhido',
    shortLabel: 'Montante recolhido',
    format: 'money',
    direction: 'higher-is-contextual',
    description: 'Valor total de numerário recolhido do ATM.',
  },
  {
    key: 'cashShortageDowntime',
    label: 'Down-time (falta notas)',
    shortLabel: 'Downtime',
    format: 'percentage',
    direction: 'lower-is-better',
    description: 'Percentagem do período em indisponibilidade por falta de notas; uma descida é favorável.',
  },
]

const integer = new Intl.NumberFormat('pt-AO', { maximumFractionDigits: 0 })
const currency = new Intl.NumberFormat('pt-AO', {
  style: 'currency',
  currency: 'AOA',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const percentage = new Intl.NumberFormat('pt-AO', { style: 'percent', maximumFractionDigits: 1 })

export function formatMetricValue(definition: MetricDefinition, value: number): string {
  if (definition.format === 'money') return currency.format(value)
  if (definition.format === 'percentage') return percentage.format(value)
  return integer.format(value)
}
