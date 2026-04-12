"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Popover } from "@base-ui/react/popover";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  parseISO,
  isAfter,
  isBefore,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useDateRange } from "@/hooks/use-date-range";
import { supabase } from "@/lib/supabase/client";
import type { DatePreset } from "@/types";

const presets: { label: string; value: DatePreset }[] = [
  { label: "Hoy", value: "1d" },
  { label: "3 dias", value: "3d" },
  { label: "7 dias", value: "7d" },
  { label: "30 dias", value: "30d" },
];

export function DateRangePicker() {
  const { dateRange, setPreset, setCustomRange } = useDateRange();
  const pathname = usePathname();
  const slug = pathname.split("/")[2] || "";

  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => startOfMonth(dateRange.end));
  const [pendingStart, setPendingStart] = useState<Date | null>(dateRange.start);
  const [pendingEnd, setPendingEnd] = useState<Date | null>(dateRange.end);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());

  // Fetch which dates have data for this brand
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    async function load() {
      const { data: brand } = await supabase
        .from("brands")
        .select("id")
        .eq("slug", slug)
        .single();
      if (!brand || cancelled) return;
      const { data } = await supabase
        .from("daily_overview")
        .select("date")
        .eq("brand_id", brand.id)
        .order("date", { ascending: false })
        .limit(400);
      if (cancelled || !data) return;
      setAvailableDates(new Set(data.map((d: { date: string }) => d.date)));
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Sync internal state when popover opens
  useEffect(() => {
    if (open) {
      setPendingStart(dateRange.start);
      setPendingEnd(dateRange.end);
      setMonth(startOfMonth(dateRange.end));
    }
  }, [open, dateRange.start, dateRange.end]);

  const handleDayClick = (day: Date) => {
    if (!pendingStart || (pendingStart && pendingEnd)) {
      setPendingStart(day);
      setPendingEnd(null);
      return;
    }
    if (isBefore(day, pendingStart)) {
      setPendingStart(day);
      setPendingEnd(pendingStart);
    } else {
      setPendingEnd(day);
    }
  };

  const handleApply = () => {
    if (pendingStart && pendingEnd) {
      setCustomRange(pendingStart, pendingEnd);
      setOpen(false);
    }
  };

  const summary = useMemo(() => {
    if (dateRange.preset !== "custom") {
      const labels: Record<DatePreset, string> = {
        "1d": "Hoy",
        "3d": "Ultimos 3 dias",
        "7d": "Ultimos 7 dias",
        "30d": "Ultimos 30 dias",
        custom: "",
      };
      return labels[dateRange.preset] || "";
    }
    return `${format(dateRange.start, "d MMM", { locale: es })} - ${format(
      dateRange.end,
      "d MMM yyyy",
      { locale: es }
    )}`;
  }, [dateRange]);

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

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          render={
            <button
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                dateRange.preset === "custom"
                  ? "bg-[#f97316] text-white"
                  : "bg-[#161b22] text-[#8b949e] hover:bg-[#1c2128] hover:text-[#e6edf3]"
              }`}
            >
              <CalendarIcon className="h-4 w-4" />
              {dateRange.preset === "custom" ? summary : "Personalizado"}
            </button>
          }
        />
        <Popover.Portal>
          <Popover.Positioner sideOffset={8} align="end">
            <Popover.Popup className="z-50 rounded-xl border border-[#30363d] bg-[#0d1117] p-4 shadow-2xl outline-none">
              <CalendarPanel
                month={month}
                onMonthChange={setMonth}
                pendingStart={pendingStart}
                pendingEnd={pendingEnd}
                availableDates={availableDates}
                onDayClick={handleDayClick}
              />
              <div className="mt-3 flex items-center justify-between border-t border-[#30363d] pt-3">
                <div className="text-xs text-[#8b949e]">
                  {pendingStart && pendingEnd ? (
                    <>
                      {format(pendingStart, "d MMM yyyy", { locale: es })} -{" "}
                      {format(pendingEnd, "d MMM yyyy", { locale: es })}
                    </>
                  ) : pendingStart ? (
                    <>Selecciona fecha final</>
                  ) : (
                    <>Selecciona fecha inicial</>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPendingStart(null);
                      setPendingEnd(null);
                    }}
                    className="rounded-md px-3 py-1.5 text-xs font-medium text-[#8b949e] hover:bg-[#161b22] hover:text-[#e6edf3]"
                  >
                    Limpiar
                  </button>
                  <button
                    onClick={handleApply}
                    disabled={!pendingStart || !pendingEnd}
                    className="rounded-md bg-[#f97316] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 text-[10px] text-[#8b949e]">
                <span className="inline-flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-[#22c55e]" />
                  Con datos
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-[#f97316]" />
                  Seleccionado
                </span>
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

interface CalendarPanelProps {
  month: Date;
  onMonthChange: (m: Date) => void;
  pendingStart: Date | null;
  pendingEnd: Date | null;
  availableDates: Set<string>;
  onDayClick: (d: Date) => void;
}

function CalendarPanel({
  month,
  onMonthChange,
  pendingStart,
  pendingEnd,
  availableDates,
  onDayClick,
}: CalendarPanelProps) {
  const months = [month, addMonths(month, 1)];

  return (
    <div className="flex items-start gap-4">
      <button
        onClick={() => onMonthChange(subMonths(month, 1))}
        className="mt-1 rounded-md p-1 text-[#8b949e] hover:bg-[#161b22] hover:text-[#e6edf3]"
        aria-label="Mes anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex gap-6">
        {months.map((m) => (
          <MonthGrid
            key={m.toISOString()}
            month={m}
            pendingStart={pendingStart}
            pendingEnd={pendingEnd}
            availableDates={availableDates}
            onDayClick={onDayClick}
          />
        ))}
      </div>

      <button
        onClick={() => onMonthChange(addMonths(month, 1))}
        className="mt-1 rounded-md p-1 text-[#8b949e] hover:bg-[#161b22] hover:text-[#e6edf3]"
        aria-label="Mes siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

interface MonthGridProps {
  month: Date;
  pendingStart: Date | null;
  pendingEnd: Date | null;
  availableDates: Set<string>;
  onDayClick: (d: Date) => void;
}

function MonthGrid({
  month,
  pendingStart,
  pendingEnd,
  availableDates,
  onDayClick,
}: MonthGridProps) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days: Date[] = [];
  let cursor = start;
  while (!isAfter(cursor, end)) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  const weekHeaders = ["L", "M", "X", "J", "V", "S", "D"];
  const today = new Date();

  return (
    <div className="w-[15rem]">
      <div className="mb-2 text-center text-sm font-semibold capitalize text-[#e6edf3]">
        {format(month, "MMMM yyyy", { locale: es })}
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-[10px] font-medium text-[#6b7480]">
        {weekHeaders.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, month);
          const iso = format(day, "yyyy-MM-dd");
          const hasData = availableDates.has(iso);
          const isStart = pendingStart && isSameDay(day, pendingStart);
          const isEnd = pendingEnd && isSameDay(day, pendingEnd);
          const inRange =
            pendingStart &&
            pendingEnd &&
            isWithinInterval(day, { start: pendingStart, end: pendingEnd });
          const isToday = isSameDay(day, today);

          return (
            <button
              key={iso}
              onClick={() => onDayClick(day)}
              disabled={!inMonth}
              className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-md text-xs transition-colors ${
                !inMonth
                  ? "text-transparent"
                  : isStart || isEnd
                    ? "bg-[#f97316] font-semibold text-white"
                    : inRange
                      ? "bg-[#f97316]/20 text-[#e6edf3]"
                      : isToday
                        ? "border border-[#30363d] text-[#e6edf3] hover:bg-[#161b22]"
                        : "text-[#e6edf3] hover:bg-[#161b22]"
              }`}
            >
              {format(day, "d")}
              {inMonth && hasData && !(isStart || isEnd) && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-[#22c55e]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
