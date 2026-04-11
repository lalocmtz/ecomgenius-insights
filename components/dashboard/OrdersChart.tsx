"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatNumber } from "@/lib/format";

interface OrdersChartProps {
  data: { date: string; orders: number }[];
}

export function OrdersChart({ data }: OrdersChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-[#30363d] bg-[#1c2128] p-4">
        <p className="text-sm text-[#8b949e]">No hay datos de pedidos disponibles</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-4">
      <h3 className="mb-4 text-sm font-medium text-[#e6edf3]">
        Pedidos Diarios
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
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
            formatter={(value) => [formatNumber(Number(value ?? 0)), "Pedidos"]}
          />
          <Bar
            dataKey="orders"
            fill="#f97316"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
