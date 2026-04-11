"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import type { Brand } from "@/types";

interface BrandSwitcherProps {
  currentSlug: string;
}

export function BrandSwitcher({ currentSlug }: BrandSwitcherProps) {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchBrands() {
      const { data } = await supabase
        .from("brands")
        .select("*")
        .order("name");
      if (data) setBrands(data);
    }
    fetchBrands();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentBrand = brands.find((b) => b.slug === currentSlug);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-[#e6edf3] transition-colors hover:border-[#8b949e]"
      >
        <span className="truncate">
          {currentBrand?.name || currentSlug || "Seleccionar marca"}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[#8b949e] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-[#30363d] bg-[#1c2128] shadow-lg">
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => {
                router.push(`/brands/${brand.slug}`);
                setOpen(false);
              }}
              className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors ${
                brand.slug === currentSlug
                  ? "bg-[#f97316]/10 text-[#f97316]"
                  : "text-[#e6edf3] hover:bg-[#161b22]"
              }`}
            >
              {brand.name}
            </button>
          ))}
          <div className="border-t border-[#30363d]">
            <button
              onClick={() => {
                router.push("/brands/new");
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#8b949e] transition-colors hover:bg-[#161b22] hover:text-[#e6edf3]"
            >
              <Plus className="h-4 w-4" />
              Agregar marca
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
