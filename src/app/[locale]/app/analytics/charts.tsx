'use client'

import { useTranslations } from 'next-intl'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const INK = '#0A0A0A'
const STEEL = '#767676'
const BONE = '#E5E5E5'
const SIGNAL = '#FF3B00'

const CHART_PALETTE = [INK, STEEL, SIGNAL, '#1A1A1A', '#888888', '#FFB39A']

export function AnalyticsCharts({
  propertiesByType,
  leadsByStatus,
  leadsOverTime,
}: {
  propertiesByType: Array<{ name: string; count: number }>
  leadsByStatus: Array<{ name: string; count: number }>
  leadsOverTime: Array<{ week: string; count: number }>
}) {
  const t = useTranslations('analytics')
  const tProp = useTranslations('properties')
  const tLead = useTranslations('leads')

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Properties by type */}
      <div className="rounded-[4px] border border-bone bg-paper p-5">
        <h3 className="mb-4 text-[14px] font-medium text-ink">
          {t('chart.propertiesByType')}
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={propertiesByType.map((d) => ({
              ...d,
              label: tProp(`type.${d.name}`),
            }))}
          >
            <CartesianGrid stroke={BONE} strokeDasharray="0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: STEEL, fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={{ stroke: BONE }}
            />
            <YAxis
              tick={{ fill: STEEL, fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={{ stroke: BONE }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: '#FFFFFF',
                border: `1px solid ${INK}`,
                borderRadius: 4,
                fontSize: 12,
                fontFamily: 'monospace',
              }}
              cursor={{ fill: BONE, opacity: 0.4 }}
            />
            <Bar dataKey="count" radius={0}>
              {propertiesByType.map((_, i) => (
                <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Leads by status */}
      <div className="rounded-[4px] border border-bone bg-paper p-5">
        <h3 className="mb-4 text-[14px] font-medium text-ink">
          {t('chart.leadsByStatus')}
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={leadsByStatus.map((d) => ({
              ...d,
              label: tLead(`status.${d.name}`),
            }))}
            layout="vertical"
          >
            <CartesianGrid
              stroke={BONE}
              strokeDasharray="0"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fill: STEEL, fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={{ stroke: BONE }}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fill: STEEL, fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={{ stroke: BONE }}
              width={110}
            />
            <Tooltip
              contentStyle={{
                background: '#FFFFFF',
                border: `1px solid ${INK}`,
                borderRadius: 4,
                fontSize: 12,
                fontFamily: 'monospace',
              }}
              cursor={{ fill: BONE, opacity: 0.4 }}
            />
            <Bar dataKey="count" fill={SIGNAL} radius={0} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Leads over time */}
      <div className="rounded-[4px] border border-bone bg-paper p-5 lg:col-span-2">
        <h3 className="mb-4 text-[14px] font-medium text-ink">
          {t('chart.leadsOverTime')}
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={leadsOverTime}>
            <CartesianGrid stroke={BONE} strokeDasharray="0" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fill: STEEL, fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={{ stroke: BONE }}
            />
            <YAxis
              tick={{ fill: STEEL, fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={{ stroke: BONE }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: '#FFFFFF',
                border: `1px solid ${INK}`,
                borderRadius: 4,
                fontSize: 12,
                fontFamily: 'monospace',
              }}
              cursor={{ stroke: BONE }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke={INK}
              strokeWidth={2}
              dot={{ fill: SIGNAL, r: 3, stroke: 'none' }}
              activeDot={{ fill: SIGNAL, r: 5, stroke: INK, strokeWidth: 1 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
