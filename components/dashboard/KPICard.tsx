import { ArrowUp, ArrowDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  icon?: LucideIcon;
}

export function KPICard({ title, value, subtitle, trend, icon: Icon }: KPICardProps) {
  return (
    <div className="rounded-xl border border-[#30363d] bg-[#1c2128] p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-[#8b949e]">{title}</p>
          <p className="text-2xl font-bold text-[#e6edf3]">{value}</p>
          {subtitle && (
            <p className="text-xs text-[#8b949e]">{subtitle}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {Icon && (
            <div className="rounded-lg bg-[#161b22] p-2">
              <Icon className="h-5 w-5 text-[#8b949e]" />
            </div>
          )}
          {trend !== undefined && trend !== 0 && (
            <span
              className={`flex items-center gap-0.5 text-xs font-medium ${
                trend > 0 ? "text-[#22c55e]" : "text-[#ef4444]"
              }`}
            >
              {trend > 0 ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
