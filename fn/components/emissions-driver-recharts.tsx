'use client'

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { formatNumber } from '@/lib/ui/locale'

type DriverGroup = { label: string; value: number; unit: 'tCO2' | 'tCO2e' }

const COLORS = ['#5b3cc4', '#7c5ce0', '#9b7ce8', '#b89ef0', '#d4c2f8']

export function EmissionsDriverRecharts({
  gross,
  groups,
}: {
  gross: number
  groups: DriverGroup[]
}) {
  const data = groups.map((g) => ({
    name: g.label,
    value: g.value,
    unit: g.unit,
    pct: gross > 0 ? (g.value / gross) * 100 : 0,
  }))

  if (data.length === 0) return null

  return (
    <div className="driver-recharts" aria-label="Emissions breakdown chart">
      <ResponsiveContainer width="100%" height={Math.max(180, data.length * 44)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number, _name, item) => {
              const row = item.payload as { unit: string; pct: number }
              return [
                `${formatNumber(value, 2)} ${row.unit} (${formatNumber(row.pct, 1)}%)`,
                'Emissions',
              ]
            }}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <ul className="driver-recharts-legend">
        {data.map((d) => (
          <li key={d.name}>
            <strong>{d.name}</strong>
            <span>
              {formatNumber(d.value, 2)} {d.unit} ({formatNumber(d.pct, 1)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
