"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useMemo, useCallback } from "react";
import { subDays, parseISO, format } from "date-fns";
import type { DateRange, DatePreset } from "@/types";

export function useDateRange(): {
  dateRange: DateRange;
  setPreset: (preset: DatePreset) => void;
  setCustomRange: (start: Date, end: Date) => void;
} {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const dateRange = useMemo<DateRange>(() => {
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const presetParam = (searchParams.get("preset") as DatePreset) || "7d";

    if (fromParam && toParam) {
      return {
        start: parseISO(fromParam),
        end: parseISO(toParam),
        preset: presetParam === "custom" ? "custom" : presetParam,
      };
    }

    const now = new Date();
    const daysMap: Record<DatePreset, number> = {
      "1d": 0,
      "3d": 2,
      "7d": 6,
      "30d": 29,
      custom: 6,
    };

    return {
      start: subDays(now, daysMap[presetParam] || 6),
      end: now,
      preset: presetParam,
    };
  }, [searchParams]);

  const updateParams = useCallback(
    (start: Date, end: Date, preset: DatePreset) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("from", format(start, "yyyy-MM-dd"));
      params.set("to", format(end, "yyyy-MM-dd"));
      params.set("preset", preset);
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  const setPreset = useCallback(
    (preset: DatePreset) => {
      const now = new Date();
      const daysMap: Record<DatePreset, number> = {
        "1d": 0,
        "3d": 2,
        "7d": 6,
        "30d": 29,
        custom: 6,
      };
      updateParams(subDays(now, daysMap[preset] || 6), now, preset);
    },
    [updateParams]
  );

  const setCustomRange = useCallback(
    (start: Date, end: Date) => {
      updateParams(start, end, "custom");
    },
    [updateParams]
  );

  return { dateRange, setPreset, setCustomRange };
}
