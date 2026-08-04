import { describe, expect, it } from 'vitest'
import { formatMetricValue, metricDefinitions } from '../src/config/metrics'

describe('catálogo de métricas', () => {
  it('inclui as oito colunas operacionais', () => {
    expect(metricDefinitions.map((metric) => metric.key)).toEqual([
      'transactionCount',
      'transactionAmount',
      'activeTransactionDays',
      'replenishmentCount',
      'replenishmentAmount',
      'dispensedAmount',
      'collectedAmount',
      'cashShortageDowntime',
    ])
  })

  it('apresenta downtime decimal como percentagem', () => {
    const downtime = metricDefinitions.find((metric) => metric.key === 'cashShortageDowntime')!
    expect(formatMetricValue(downtime, 0.125)).toContain('12,5')
    expect(downtime.direction).toBe('lower-is-better')
  })
})
