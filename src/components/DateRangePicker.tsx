import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { format, startOfDay, subDays, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';

const today = () => startOfDay(new Date());

const presets = [
  { label: 'Hoy', fn: () => ({ from: today(), to: today() }) },
  { label: '7D', fn: () => ({ from: subDays(today(), 6), to: today() }) },
  { label: '30D', fn: () => ({ from: subDays(today(), 29), to: today() }) },
  { label: 'Este mes', fn: () => ({ from: startOfMonth(today()), to: today() }) },
  { label: 'Mes pasado', fn: () => ({ from: startOfMonth(subMonths(today(), 1)), to: endOfMonth(subMonths(today(), 1)) }) },
  { label: 'Q1', fn: () => ({ from: new Date(2025, 0, 1), to: new Date(2025, 2, 31) }) },
  { label: 'YTD', fn: () => ({ from: startOfYear(today()), to: today() }) },
] as const;

export function DateRangePicker() {
  const { dateRange, setDateRange } = useAppStore();
  const [open, setOpen] = useState(false);

  const label = `${format(dateRange.from, 'dd MMM', { locale: es })} — ${format(dateRange.to, 'dd MMM yyyy', { locale: es })}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs gap-2 border-border text-foreground">
          <CalendarIcon size={14} />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 pointer-events-auto" align="end">
        <div className="flex flex-wrap gap-1 mb-3">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => { setDateRange(p.fn()); setOpen(false); }}
              className="px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-full bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Calendar
            mode="range"
            selected={{ from: dateRange.from, to: dateRange.to }}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                setDateRange({ from: range.from, to: range.to });
              } else if (range?.from) {
                setDateRange({ from: range.from, to: range.from });
              }
            }}
            numberOfMonths={2}
            className="pointer-events-auto"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
