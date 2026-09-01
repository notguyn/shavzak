"use client"

import { useLocale } from "next-intl"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { dir, type Locale } from "@/i18n/config"

export function WorkloadChart({ data }: { data: { platoon: string; assignments: number }[] }) {
  const locale = useLocale() as Locale
  const rtl = dir[locale] === "rtl"

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, inline: 8 } as never}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis
          dataKey="platoon"
          reversed={rtl}
          tickLine={false}
          axisLine={false}
          className="text-xs"
        />
        <YAxis
          orientation={rtl ? "right" : "left"}
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          className="text-xs"
          width={32}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="assignments" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
