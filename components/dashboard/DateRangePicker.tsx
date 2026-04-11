"use client";

import { useDateRange } from "@/hooks/use-date-range";
import type { DatePreset } from "@/types";

const presets: { label: string; value: DatePreset }[] = [
  { label: "Hoy", value: "1d" },
  { label: "3 dias", value: "3d" },
  { label: "7 dias", value: "7d" },
  { label: "30 dias", value: "30d" },
  { label: "Personalizado", value: "custom" },
];

export function DateRangePicker() {
  const { dateRange, setPreset } = useDateRange();

  return (
    <div className="flex items-center gap-2">
      {presets.map((p) => (
        <button
          key={p.value}
          onClick={() => setPreset(p.value)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            dateRange.preset === p.value
              ? "bg-[#f97316] text-white"
              : "bg-[#161b22] text-[#8b949e] hover:bg-[#1c2128] hover:text-[#e6edf3]"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
