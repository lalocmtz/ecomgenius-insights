"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatMXN } from "@/lib/format";

interface GMVChartProps {
  data: { date: string; gmv: number }[];
}

export function GMVChart({ data }: GMVChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-[#30363d] bg-[#1c2128] p-4">
        <p className="text-sm text-[#8b949e]">No hay datos de GMV disponibles</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-4">
      <h3 className="mb-4 text-sm font-medium text-[#e6edf3]">
        GMV Diario
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#8b949e", fontSize: 12 }}
            axisLine={{ stroke: "#30363d" }}
            tickLine={{ stroke: "#30363d" }}
          />
          <YAxis
            tick={{ fill: "#8b949e", fontSize: 12 }}
            axisLine={{ stroke: "#30363d" }}
            tickLine={{ stroke: "#30363d" }}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1c2128",
              border: "1px solid #30363d",
              borderRadius: "8px",
              color: "#e6edf3",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#8b949e" }}
            formatter={(value) => [formatMXN(Number(value ?? 0)), "GMV"]}
          />
          <Line
            type="monotone"
            dataKey="gmv"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ fill: "#f97316", r: 3 }}
            activeDot={{ r: 5, fill: "#f97316" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
