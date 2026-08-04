import { useCallback, useState, type FormEvent } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import {
  BarChart3,
  Building2,
  ChevronDown,
  FileSpreadsheet,
  LayoutDashboard,
  Menu,
  Settings,
  Trophy,
  UploadCloud,
} from 'lucide-react'
import { Link, NavLink, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { parseWorkbook } from './lib/excel/importer'
import type { ImportPreview } from './types/domain'
import { formatMetricValue, metricDefinitions, type MetricKey } from './config/metrics'
import { supabase } from './lib/supabase/client'

const queryClient = new QueryClient()
const clients = [
  { code: 'BCI', name: 'Banco BCI', shortName: 'BCI' },
  { code: 'BKEVE', name: 'Banco Keve', shortName: 'KEVE' },
]
const nav = [
  { to: '/', label: 'Visão geral', icon: LayoutDashboard },
  { to: '/equipamentos', label: 'Equipamentos', icon: Building2 },
  { to: '/rankings', label: 'Rankings', icon: Trophy },
  { to: '/importacoes', label: 'Importações', icon: FileSpreadsheet },
  { to: '/definicoes', label: 'Definições', icon: Settings },
]
const money = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 })

function Shell() {
  const [open, setOpen] = useState(false)
  const { clientCode = 'BCI' } = useParams()
  const clientBase = `/clientes/${clientCode}`
  return (
    <div className="min-h-screen bg-[#f4f7f5] lg:grid lg:grid-cols-[260px_1fr]">
      <aside
        className={`${open ? 'block' : 'max-lg:hidden'} fixed inset-y-0 z-20 w-64 bg-[#102b22] p-5 text-white lg:static lg:block lg:w-auto`}
      >
        <div className="mb-9 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-400 p-2 text-[#102b22]">
            <BarChart3 />
          </div>
          <div>
            <b>ATM Insight</b>
            <p className="m-0 text-xs text-emerald-100">Análise de desempenho</p>
          </div>
        </div>
        <nav className="space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={`${clientBase}${to === '/' ? '' : to}`}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${isActive ? 'bg-white/14 font-semibold text-white' : 'text-slate-300 hover:bg-white/8'}`
              }
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
          <div className="my-4 border-t border-white/10" />
          <NavLink
            to="/clientes/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-emerald-100 hover:bg-white/8"
          >
            <BarChart3 size={19} />
            Dashboard consolidado
          </NavLink>
          <NavLink
            to="/clientes"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-emerald-100 hover:bg-white/8"
          >
            <Building2 size={19} />
            Todos os clientes
          </NavLink>
        </nav>
        <div className="absolute bottom-5 left-5 right-5 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
          <b className="text-white">Dados organizados por cliente</b>
          <p className="mb-0">Acesso simples por utilizador e perfil.</p>
        </div>
      </aside>
      <main>
        <header className="flex h-18 items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Abrir menu">
            <Menu />
          </button>
          <div className="hidden text-sm text-slate-500 sm:block">
            Cliente <b className="text-emerald-800">{clientCode}</b> · Julho de 2026
          </div>
          <button className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 text-left">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-800">
              DA
            </div>
            <span className="hidden text-sm sm:block">
              <b>Diogo Almeida</b>
              <small className="block text-slate-500">Analista</small>
            </span>
            <ChevronDown size={16} />
          </button>
        </header>
        <div className="p-5 lg:p-8">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="equipamentos" element={<Equipment />} />
            <Route path="rankings" element={<Rankings />} />
            <Route path="importacoes" element={<Imports />} />
            <Route
              path="definicoes"
              element={<Base title="Definições" text="Clientes, limites de alerta e perfis de utilizador." />}
            />
            <Route path="*" element={<Navigate to={clientBase} replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

function Heading({ title, text }: { title: string; text: string }) {
  const { clientCode = 'BCI' } = useParams()
  const navigate = useNavigate()
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="m-0 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{text}</p>
      </div>
      <div className="flex gap-2">
        <Link
          to="/clientes"
          className="rounded-xl border border-emerald-700 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 no-underline hover:bg-emerald-50"
        >
          Trocar banco
        </Link>
        <select
          value={clientCode}
          onChange={(event) => navigate(`/clientes/${event.target.value}`)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2"
        >
          {clients.map((client) => (
            <option value={client.code} key={client.code}>
              {client.shortName}
            </option>
          ))}
        </select>
        <select className="rounded-xl border border-slate-200 bg-white px-4 py-2">
          <option>Julho 2026</option>
        </select>
      </div>
    </div>
  )
}
function Overview() {
  const stats = [
    ['Total de ATMs', '128', '+4 este mês'],
    ['Transacções', '1 284 520', '+8,4% vs. Jun'],
    ['Montante transaccionado', money.format(14820000000), '+6,2% vs. Jun'],
    ['Downtime médio', '3,8%', '-0,7 p.p. vs. Jun'],
    ['ATMs em alerta', '12', '3 críticos'],
  ]
  return (
    <>
      <Heading title="Visão geral" text="Uma leitura clara do desempenho mensal da rede." />
      <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
        <b>Modo demonstração:</b> os indicadores abaixo são fictícios e serão substituídos quando ligar o
        Supabase.
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map(([label, value, trend], i) => (
          <article className="card" key={label}>
            <p className="label">{label}</p>
            <strong className="mt-3 block text-2xl text-slate-900">{value}</strong>
            <p className={`mb-0 text-xs ${i === 4 ? 'text-orange-600' : 'text-emerald-700'}`}>{trend}</p>
          </article>
        ))}
      </section>
      <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Dias com transacções', '29,4 dias', '+1,2 vs. Jun'],
          ['Abastecimentos', '2 418', '+7,1% vs. Jun'],
          ['Montante abastecido', money.format(18640000000), '+5,8% vs. Jun'],
          ['Montante dispensado', money.format(14190000000), '76,1% do abastecido'],
        ].map(([label, value, detail]) => (
          <article className="card" key={label}>
            <p className="label">{label}</p>
            <strong className="mt-3 block text-xl text-slate-900">{value}</strong>
            <p className="mb-0 text-xs text-emerald-700">{detail}</p>
          </article>
        ))}
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-3">
        <article className="card xl:col-span-2">
          <h2 className="mt-0 text-base">Evolução mensal</h2>
          <div className="mt-8 flex h-52 items-end gap-3">
            {[55, 62, 58, 70, 76, 84, 91].map((n, i) => (
              <div className="flex h-full flex-1 flex-col items-center justify-end gap-2" key={i}>
                <div className="w-full rounded-t-lg bg-emerald-600/90" style={{ height: `${n}%` }} />
                <small className="text-slate-400">
                  {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'][i]}
                </small>
              </div>
            ))}
          </div>
        </article>
        <article className="card">
          <h2 className="mt-0 text-base">Atenção necessária</h2>
          {[
            ['ATM 0048', 'Downtime 14,2%', 'Crítico'],
            ['ATM 0103', 'Transacções -42%', 'Alto'],
            ['ATM 0081', '8 dias activos', 'Médio'],
          ].map((x) => (
            <div className="border-b border-slate-100 py-3" key={x[0]}>
              <b className="text-sm">{x[0]}</b>
              <p className="my-1 text-xs text-slate-500">{x[1]}</p>
              <span className="text-xs font-semibold text-orange-600">{x[2]}</span>
            </div>
          ))}
        </article>
      </section>
    </>
  )
}

type RankingRow = {
  terminal: string
  transactions: number
  amount: number
  downtime: number
  activeDays: number
  replenishments: number
  variation: number
}

const rankingRows: RankingRow[] = Array.from({ length: 24 }, (_, index) => ({
  terminal: `ATM-${String(index + 1).padStart(4, '0')}`,
  transactions: 5200 + ((index * 3791) % 16800),
  amount: 58_000_000 + ((index * 47_300_000) % 210_000_000),
  downtime: 0.008 + ((index * 17) % 143) / 1000,
  activeDays: 17 + ((index * 7) % 15),
  replenishments: 8 + ((index * 11) % 25),
  variation: -38 + ((index * 13) % 77),
}))

function RankingWidget({
  title,
  subtitle,
  rows,
  value,
  numericValue,
  variant = 'list',
  tone = 'emerald',
}: {
  title: string
  subtitle: string
  rows: RankingRow[]
  value: (row: RankingRow) => string
  numericValue: (row: RankingRow) => number
  variant?: 'list' | 'bars' | 'area' | 'donut'
  tone?: 'emerald' | 'orange' | 'red' | 'sky'
}) {
  const colors = {
    emerald: 'bg-emerald-600',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    sky: 'bg-sky-600',
  }
  const chartColors = { emerald: '#059669', orange: '#f97316', red: '#ef4444', sky: '#0284c7' }
  const data = rows.slice(0, 10).map((row) => ({
    name: row.terminal.replace('ATM-', ''),
    value: numericValue(row),
  }))
  return (
    <article className="card">
      <div className="mb-4">
        <h2 className="m-0 text-base">{title}</h2>
        <p className="mb-0 mt-1 text-xs text-slate-400">{subtitle}</p>
      </div>
      {variant === 'bars' && (
        <div className="mb-5 h-44 rounded-xl bg-slate-50 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: '#94a3b8' }}
              />
              <Tooltip formatter={(chartValue) => Number(chartValue).toLocaleString('pt-AO')} />
              <Bar dataKey="value" radius={[5, 5, 0, 0]} fill={chartColors[tone]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {variant === 'area' && (
        <div className="mb-5 h-44 rounded-xl bg-slate-50 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id={`fill-${tone}-${title.length}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors[tone]} stopOpacity={0.45} />
                  <stop offset="95%" stopColor={chartColors[tone]} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: '#94a3b8' }}
              />
              <Tooltip formatter={(chartValue) => Number(chartValue).toLocaleString('pt-AO')} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColors[tone]}
                strokeWidth={3}
                fill={`url(#fill-${tone}-${title.length})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      {variant === 'donut' && (
        <div className="mb-5 grid grid-cols-[145px_1fr] items-center gap-3 rounded-xl bg-slate-50 p-2">
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  innerRadius={38}
                  outerRadius={62}
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={
                        index === 0 ? chartColors[tone] : `hsl(${155 - index * 7} 42% ${46 + index * 3}%)`
                      }
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(chartValue) => Number(chartValue).toLocaleString('pt-AO')} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <strong className="block text-3xl" style={{ color: chartColors[tone] }}>
              {value(rows[0])}
            </strong>
            <span className="text-xs text-slate-500">Maior valor do grupo</span>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {rows.slice(0, 10).map((row, index) => (
          <div className="grid grid-cols-[28px_1fr_auto] items-center gap-2" key={row.terminal}>
            <span className="text-xs font-bold text-slate-400">{index + 1}</span>
            <div className="min-w-0">
              <div className="mb-1 flex justify-between gap-2 text-xs">
                <b>{row.terminal}</b>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${colors[tone]}`}
                  style={{ width: `${100 - index * 6}%` }}
                />
              </div>
            </div>
            <strong className="whitespace-nowrap text-xs text-slate-700">{value(row)}</strong>
          </div>
        ))}
      </div>
    </article>
  )
}

function Rankings() {
  const descending = <K extends keyof RankingRow>(key: K) =>
    [...rankingRows].sort((a, b) => Number(b[key]) - Number(a[key]))
  const ascending = <K extends keyof RankingRow>(key: K) =>
    [...rankingRows].sort((a, b) => Number(a[key]) - Number(b[key]))

  const widgets = [
    {
      title: 'Top 10 transacções',
      subtitle: 'ATMs com maior número de operações',
      rows: descending('transactions'),
      value: (row: RankingRow) => row.transactions.toLocaleString('pt-AO'),
      numericValue: (row: RankingRow) => row.transactions,
      variant: 'bars' as const,
      tone: 'emerald' as const,
    },
    {
      title: '10 menos transacções',
      subtitle: 'ATMs com menor actividade no mês',
      rows: ascending('transactions'),
      value: (row: RankingRow) => row.transactions.toLocaleString('pt-AO'),
      numericValue: (row: RankingRow) => row.transactions,
      variant: 'list' as const,
      tone: 'orange' as const,
    },
    {
      title: 'Top 10 montantes',
      subtitle: 'Maior montante transaccionado',
      rows: descending('amount'),
      value: (row: RankingRow) => money.format(row.amount),
      numericValue: (row: RankingRow) => row.amount,
      variant: 'area' as const,
      tone: 'sky' as const,
    },
    {
      title: 'Top 10 downtime',
      subtitle: 'Maior indisponibilidade por falta de notas',
      rows: descending('downtime'),
      value: (row: RankingRow) =>
        `${(row.downtime * 100).toLocaleString('pt-AO', { maximumFractionDigits: 1 })}%`,
      numericValue: (row: RankingRow) => row.downtime * 100,
      variant: 'donut' as const,
      tone: 'red' as const,
    },
    {
      title: '10 maiores subidas',
      subtitle: 'Variação de transacções face ao mês anterior',
      rows: descending('variation'),
      value: (row: RankingRow) => `+${row.variation}%`,
      numericValue: (row: RankingRow) => row.variation,
      variant: 'bars' as const,
      tone: 'emerald' as const,
    },
    {
      title: '10 maiores descidas',
      subtitle: 'Quebras de transacções face ao mês anterior',
      rows: ascending('variation'),
      value: (row: RankingRow) => `${row.variation}%`,
      numericValue: (row: RankingRow) => Math.abs(row.variation),
      variant: 'area' as const,
      tone: 'red' as const,
    },
    {
      title: 'Top 10 dias activos',
      subtitle: 'Mais dias com transacções',
      rows: descending('activeDays'),
      value: (row: RankingRow) => `${row.activeDays} dias`,
      numericValue: (row: RankingRow) => row.activeDays,
      variant: 'donut' as const,
      tone: 'sky' as const,
    },
    {
      title: '10 menos dias activos',
      subtitle: 'ATMs que exigem acompanhamento',
      rows: ascending('activeDays'),
      value: (row: RankingRow) => `${row.activeDays} dias`,
      numericValue: (row: RankingRow) => row.activeDays,
      variant: 'list' as const,
      tone: 'orange' as const,
    },
    {
      title: 'Top 10 abastecimentos',
      subtitle: 'Maior frequência de reposição de numerário',
      rows: descending('replenishments'),
      value: (row: RankingRow) => `${row.replenishments} vezes`,
      numericValue: (row: RankingRow) => row.replenishments,
      variant: 'bars' as const,
      tone: 'emerald' as const,
    },
    {
      title: '10 menos abastecimentos',
      subtitle: 'Menor frequência de reposição',
      rows: ascending('replenishments'),
      value: (row: RankingRow) => `${row.replenishments} vezes`,
      numericValue: (row: RankingRow) => row.replenishments,
      variant: 'area' as const,
      tone: 'orange' as const,
    },
  ]

  return (
    <>
      <Heading
        title="Rankings e variações"
        text="Top 10, bottom 10, subidas e descidas dos principais indicadores."
      />
      <div className="mb-5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
        Cada widget apresenta <b>10 equipamentos</b>. Os valores serão alimentados pelas importações mensais.
      </div>
      <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-500 p-5 text-white shadow-sm">
          <p className="m-0 text-xs uppercase tracking-wider text-emerald-100">Melhor desempenho</p>
          <strong className="mt-3 block text-3xl">ATM-0023</strong>
          <span className="text-sm">21 402 transacções</span>
        </article>
        <article className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
          <p className="m-0 text-xs uppercase tracking-wider text-red-500">Downtime crítico</p>
          <div className="mt-3 flex items-end justify-between">
            <strong className="text-3xl text-red-600">14,4%</strong>
            <span className="text-sm font-semibold">ATM-0009</span>
          </div>
        </article>
        <article className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
          <p className="m-0 text-xs uppercase tracking-wider text-sky-600">Maior subida</p>
          <div className="mt-3 flex items-end justify-between">
            <strong className="text-3xl text-emerald-600">+38%</strong>
            <span className="text-sm font-semibold">ATM-0007</span>
          </div>
        </article>
        <article className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
          <p className="m-0 text-xs uppercase tracking-wider text-orange-600">Acção prioritária</p>
          <strong className="mt-3 block text-xl">10 ATMs</strong>
          <span className="text-sm text-slate-500">abaixo de 25 dias activos</span>
        </article>
      </section>
      <section className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        {widgets.map((widget) => (
          <RankingWidget key={widget.title} {...widget} />
        ))}
      </section>
    </>
  )
}
function Equipment() {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('transactionCount')
  const selectedDefinition = metricDefinitions.find((metric) => metric.key === selectedMetric)!
  const demoEquipment = [
    {
      terminalCode: 'ATM-0048',
      bat: 'BCI',
      transactionCount: 8420,
      transactionAmount: 94_200_000,
      activeTransactionDays: 24,
      replenishmentCount: 18,
      replenishmentAmount: 126_000_000,
      dispensedAmount: 91_400_000,
      collectedAmount: 31_800_000,
      cashShortageDowntime: 0.142,
      variation: -31,
      alert: 'Crítico',
    },
    {
      terminalCode: 'ATM-0081',
      bat: 'BCI',
      transactionCount: 12780,
      transactionAmount: 151_800_000,
      activeTransactionDays: 31,
      replenishmentCount: 22,
      replenishmentAmount: 184_500_000,
      dispensedAmount: 148_200_000,
      collectedAmount: 34_900_000,
      cashShortageDowntime: 0.021,
      variation: 8,
      alert: 'Normal',
    },
    {
      terminalCode: 'ATM-0103',
      bat: 'BCI',
      transactionCount: 6340,
      transactionAmount: 70_400_000,
      activeTransactionDays: 19,
      replenishmentCount: 14,
      replenishmentAmount: 102_300_000,
      dispensedAmount: 68_100_000,
      collectedAmount: 33_200_000,
      cashShortageDowntime: 0.048,
      variation: -42,
      alert: 'Alto',
    },
  ]
  return (
    <>
      <Heading
        title="Equipamentos"
        text="Analise todas as métricas operacionais por terminal e compare com o mês anterior."
      />
      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricDefinitions.map((metric) => {
          const active = selectedMetric === metric.key
          return (
            <button
              key={metric.key}
              type="button"
              onClick={() => setSelectedMetric(metric.key)}
              title={metric.description}
              className={`rounded-2xl border p-4 text-left transition ${active ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/10' : 'border-slate-200 bg-white hover:border-emerald-300'}`}
            >
              <span className="label">{metric.shortLabel}</span>
              <strong className="mt-2 block text-base text-slate-900">{metric.label}</strong>
              <small
                className={metric.direction === 'lower-is-better' ? 'text-orange-700' : 'text-slate-500'}
              >
                {metric.direction === 'lower-is-better'
                  ? 'Menor valor é favorável'
                  : 'Analisar no contexto operacional'}
              </small>
            </button>
          )
        })}
      </section>
      <div className="card mb-5 flex flex-wrap items-center justify-between gap-4 border-emerald-200 bg-emerald-50/50">
        <div>
          <p className="label mb-1">Métrica em análise</p>
          <h2 className="m-0 text-lg">{selectedDefinition.label}</h2>
          <p className="mb-0 mt-1 text-sm text-slate-600">{selectedDefinition.description}</p>
        </div>
        <div className="rounded-xl bg-white px-4 py-3 text-right shadow-sm">
          <span className="label">Média da rede</span>
          <strong className="block text-xl text-emerald-800">
            {formatMetricValue(
              selectedDefinition,
              demoEquipment.reduce((sum, row) => sum + row[selectedMetric], 0) / demoEquipment.length,
            )}
          </strong>
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[1500px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="pb-4 pr-5">Terminal</th>
              <th className="pb-4 pr-5">Cliente</th>
              {metricDefinitions.map((metric) => (
                <th
                  className={`pb-4 pr-5 ${metric.key === selectedMetric ? 'text-emerald-700' : ''}`}
                  key={metric.key}
                >
                  {metric.shortLabel}
                </th>
              ))}
              <th className="pb-4 pr-5">Variação mensal</th>
              <th className="pb-4">Alerta</th>
            </tr>
          </thead>
          <tbody>
            {demoEquipment.map((row) => (
              <tr className="border-t border-slate-100 hover:bg-slate-50" key={row.terminalCode}>
                <td className="py-4 pr-5 font-semibold">{row.terminalCode}</td>
                <td className="py-4 pr-5">{row.bat}</td>
                {metricDefinitions.map((metric) => (
                  <td
                    className={`whitespace-nowrap py-4 pr-5 ${metric.key === selectedMetric ? 'bg-emerald-50 font-semibold text-emerald-900' : ''}`}
                    key={metric.key}
                  >
                    {formatMetricValue(metric, row[metric.key])}
                  </td>
                ))}
                <td
                  className={`whitespace-nowrap py-4 pr-5 font-semibold ${row.variation >= 0 ? 'text-emerald-700' : 'text-red-700'}`}
                >
                  {row.variation >= 0 ? '↑' : '↓'} {Math.abs(row.variation)}%
                </td>
                <td className="py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.alert === 'Normal' ? 'bg-emerald-100 text-emerald-800' : row.alert === 'Crítico' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}
                  >
                    {row.alert}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mb-0 mt-4 text-xs text-sky-700">
          Dados de demonstração. A variação apresentada acompanha a métrica seleccionada.
        </p>
      </div>
    </>
  )
}
function Imports() {
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [busy, setBusy] = useState(false)
  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setBusy(true)
    setPreview(parseWorkbook(await file.arrayBuffer(), file.name))
    setBusy(false)
  }, [])
  const drop = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    multiple: false,
  })
  return (
    <>
      <Heading title="Importações" text="Valide o relatório antes de guardar qualquer dado." />
      <div
        {...drop.getRootProps()}
        className={`card cursor-pointer border-2 border-dashed py-12 text-center ${drop.isDragActive ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300'}`}
      >
        <input {...drop.getInputProps()} />
        <UploadCloud className="mx-auto text-emerald-700" size={42} />
        <h2 className="mb-1 text-lg">{busy ? 'A analisar…' : 'Arraste o ficheiro Excel para aqui'}</h2>
        <p className="text-sm text-slate-500">ou clique para seleccionar um ficheiro .xlsx</p>
      </div>
      {preview && (
        <section className="mt-5 grid gap-5 lg:grid-cols-3">
          <article className="card">
            <p className="label">Detecção automática</p>
            <dl className="text-sm">
              <dt className="text-slate-500">Cliente</dt>
              <dd className="font-semibold">{preview.detected.client ?? 'Não detectado'}</dd>
              <dt className="text-slate-500">Período</dt>
              <dd>{preview.detected.period ?? 'Não detectado'}</dd>
              <dt className="text-slate-500">Folha principal</dt>
              <dd>{preview.mainSheet ?? 'Não encontrada'}</dd>
              <dt className="text-slate-500">Linhas</dt>
              <dd>{preview.totalRows}</dd>
            </dl>
          </article>
          <article className="card lg:col-span-2">
            <p className="label">Validação</p>
            {preview.issues.length === 0 ? (
              <p className="text-emerald-700">Nenhum problema encontrado.</p>
            ) : (
              preview.issues.map((issue, i) => (
                <p
                  key={i}
                  className={`rounded-lg p-2 text-sm ${issue.severity === 'error' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}
                >
                  <b>{issue.code}</b> — {issue.message}
                </p>
              ))
            )}
          </article>
        </section>
      )}
    </>
  )
}
function Base({ title, text }: { title: string; text: string }) {
  return (
    <>
      <Heading title={title} text={text} />
      <div className="card">
        <p className="text-sm text-slate-500">Estrutura preparada para a próxima fase.</p>
      </div>
    </>
  )
}

function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!/^\d{4}$/.test(pin)) return setError('Introduza exactamente quatro algarismos.')
    if (!supabase) return setError('A ligação ao Supabase ainda não está configurada neste ambiente.')
    setBusy(true)
    setError('')
    const { data, error: functionError } = await supabase.functions.invoke('pin-login', {
      body: { username, pin },
    })
    if (functionError || !data?.session) {
      setBusy(false)
      return setError('Utilizador ou PIN inválido.')
    }
    await supabase.auth.setSession(data.session)
    navigate(data.session.user?.app_metadata?.must_change_pin ? '/alterar-pin' : '/clientes')
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#0d2b22] p-5">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-7 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-400 p-2 text-[#102b22]">
            <BarChart3 />
          </div>
          <div>
            <h1 className="m-0 text-xl">ATM Insight</h1>
            <p className="m-0 text-sm text-slate-500">Acesso à análise mensal</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <label className="block text-sm font-semibold">
            Utilizador
            <input
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-emerald-600"
              placeholder="Ex.: diogo"
              required
            />
          </label>
          <label className="block text-sm font-semibold">
            PIN de 4 algarismos
            <input
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={4}
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-emerald-600"
              placeholder="••••"
              required
            />
          </label>
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button
            disabled={busy}
            className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {busy ? 'A validar…' : 'Entrar'}
          </button>
        </form>
        <button
          type="button"
          onClick={() => navigate('/clientes')}
          className="mt-4 w-full text-sm text-slate-500 underline"
        >
          Pré-visualizar organização dos clientes
        </button>
      </div>
    </main>
  )
}

function ChangePinPage() {
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!/^\d{4}$/.test(pin) || pin === '0000')
      return setError('Escolha um PIN diferente de 0000 com quatro algarismos.')
    if (pin !== confirmation) return setError('Os dois PINs não coincidem.')
    if (!supabase) return setError('A ligação ao Supabase não está configurada.')
    setBusy(true)
    setError('')
    const { error: functionError } = await supabase.functions.invoke('change-pin', { body: { pin } })
    if (functionError) {
      setBusy(false)
      return setError('Não foi possível alterar o PIN. Tente novamente.')
    }
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#0d2b22] p-5">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <h1 className="mt-0 text-2xl">Definir novo PIN</h1>
        <p className="text-sm text-slate-600">Por segurança, altere o PIN inicial antes de continuar.</p>
        <form onSubmit={submit} className="space-y-5">
          {[
            { label: 'Novo PIN', value: pin, set: setPin },
            { label: 'Confirmar novo PIN', value: confirmation, set: setConfirmation },
          ].map((field) => (
            <label key={field.label} className="block text-sm font-semibold">
              {field.label}
              <input
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={4}
                value={field.value}
                onChange={(event) => field.set(event.target.value.replace(/\D/g, ''))}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-emerald-600"
                required
              />
            </label>
          ))}
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button
            disabled={busy}
            className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {busy ? 'A guardar…' : 'Guardar novo PIN'}
          </button>
        </form>
      </div>
    </main>
  )
}

function ClientChooser() {
  return (
    <main className="min-h-screen bg-[#f4f7f5] p-6 lg:p-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="label">ATM Insight</p>
            <h1 className="mb-2 mt-1 text-3xl">Escolha o cliente</h1>
            <p className="text-slate-500">Cada espaço mantém dados, filtros e navegação separados.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/clientes/dashboard"
              className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white no-underline hover:bg-emerald-800"
            >
              Dashboard consolidado
            </Link>
            <Link to="/" className="text-sm text-slate-600 underline">
              Sair
            </Link>
          </div>
        </div>
        <section className="grid gap-6 md:grid-cols-2">
          {clients.map((client) => (
            <Link
              to={`/clientes/${client.code}`}
              key={client.code}
              className="group rounded-3xl border border-slate-200 bg-white p-7 text-inherit no-underline shadow-sm transition hover:-translate-y-1 hover:border-emerald-500 hover:shadow-lg"
            >
              <div className="mb-8 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-xl font-bold text-emerald-800">
                {client.code.slice(0, 2)}
              </div>
              <p className="label">Espaço do cliente</p>
              <h2 className="mb-2 mt-1 text-2xl">{client.name}</h2>
              <p className="text-sm text-slate-500">
                Indicadores, equipamentos, rankings e importações de {client.shortName}.
              </p>
              <span className="mt-6 inline-block font-semibold text-emerald-700">
                Entrar em {client.code} →
              </span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  )
}

function ConsolidatedDashboard() {
  const bankMetrics = [
    { code: 'BCI', atms: 128, transactions: 1284520, amount: 14820000000, uptime: 96.2, alerts: 12 },
    { code: 'BKEVE', atms: 74, transactions: 692840, amount: 7310000000, uptime: 94.8, alerts: 9 },
  ]
  const totals = bankMetrics.reduce(
    (sum, bank) => ({
      atms: sum.atms + bank.atms,
      transactions: sum.transactions + bank.transactions,
      amount: sum.amount + bank.amount,
      alerts: sum.alerts + bank.alerts,
    }),
    { atms: 0, transactions: 0, amount: 0, alerts: 0 },
  )
  const maxTransactions = Math.max(...bankMetrics.map((bank) => bank.transactions))

  return (
    <main className="min-h-screen bg-[#f4f7f5] p-5 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="label">ATM Insight · Todos os clientes</p>
            <h1 className="mb-2 mt-1 text-3xl">Dashboard consolidado</h1>
            <p className="m-0 text-slate-500">Visão cruzada do desempenho da rede por banco.</p>
          </div>
          <Link
            to="/clientes"
            className="rounded-xl border border-emerald-700 bg-white px-4 py-3 text-sm font-semibold text-emerald-800 no-underline hover:bg-emerald-50"
          >
            Ver todos os clientes
          </Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['ATMs geridos', totals.atms.toLocaleString('pt-AO')],
            ['Transacções', totals.transactions.toLocaleString('pt-AO')],
            ['Montante total', money.format(totals.amount)],
            ['Alertas activos', totals.alerts.toLocaleString('pt-AO')],
          ].map(([label, value]) => (
            <article className="card" key={label}>
              <p className="label">{label}</p>
              <strong className="mt-3 block text-2xl text-slate-900">{value}</strong>
            </article>
          ))}
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
          <article className="card overflow-x-auto">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="m-0 text-lg">Comparação entre bancos</h2>
              <span className="text-xs text-slate-400">Julho 2026</span>
            </div>
            <table className="w-full min-w-[650px] border-collapse text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  {['Banco', 'ATMs', 'Transacções', 'Montante', 'Disponibilidade', 'Alertas'].map((title) => (
                    <th className="border-b border-slate-200 px-3 py-3" key={title}>
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bankMetrics.map((bank) => (
                  <tr key={bank.code} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-4">
                      <Link className="font-bold text-emerald-800" to={`/clientes/${bank.code}`}>
                        {bank.code}
                      </Link>
                    </td>
                    <td className="px-3 py-4">{bank.atms}</td>
                    <td className="px-3 py-4">{bank.transactions.toLocaleString('pt-AO')}</td>
                    <td className="px-3 py-4">{money.format(bank.amount)}</td>
                    <td className="px-3 py-4">{bank.uptime.toLocaleString('pt-AO')}%</td>
                    <td className="px-3 py-4 font-semibold text-orange-600">{bank.alerts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          <article className="card">
            <h2 className="mt-0 text-lg">Peso das transacções</h2>
            <div className="mt-7 space-y-7">
              {bankMetrics.map((bank) => (
                <div key={bank.code}>
                  <div className="mb-2 flex justify-between text-sm">
                    <b>{bank.code}</b>
                    <span>{Math.round((bank.transactions / totals.transactions) * 100)}%</span>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{ width: `${(bank.transactions / maxTransactions) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
              <b>Leitura cruzada:</b> BCI representa{' '}
              {Math.round((bankMetrics[0].transactions / totals.transactions) * 100)}% das transacções e
              apresenta a melhor disponibilidade da rede.
            </div>
          </article>
        </section>
      </div>
    </main>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/alterar-pin" element={<ChangePinPage />} />
        <Route path="/clientes" element={<ClientChooser />} />
        <Route path="/clientes/dashboard" element={<ConsolidatedDashboard />} />
        <Route path="/clientes/:clientCode/*" element={<Shell />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </QueryClientProvider>
  )
}
