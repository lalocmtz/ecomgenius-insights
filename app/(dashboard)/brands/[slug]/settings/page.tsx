"use client";

import { use, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import type { Brand } from "@/types";

interface BrandForm {
  name: string;
  color: string;
  commission_tiktok: number;
  commission_affiliates: number;
  product_cost_mode: "pct" | "fixed";
  product_cost_pct: number;
  product_cost_fixed: number;
  iva_ads_pct: number;
  retention_pct: number;
}

const defaultValues: BrandForm = {
  name: "",
  color: "#f97316",
  commission_tiktok: 8,
  commission_affiliates: 6,
  product_cost_mode: "pct",
  product_cost_pct: 12,
  product_cost_fixed: 0,
  iva_ads_pct: 16,
  retention_pct: 9.03,
};

type FieldDef = {
  key: keyof BrandForm;
  label: string;
  type: "text" | "color" | "number";
  step?: string;
  suffix?: string;
};

const fields: FieldDef[] = [
  { key: "name", label: "Nombre de la marca", type: "text" },
  { key: "color", label: "Color de marca", type: "color" },
  {
    key: "commission_tiktok",
    label: "Comision TikTok",
    type: "number",
    step: "0.01",
    suffix: "%",
  },
  {
    key: "commission_affiliates",
    label: "Comision Afiliados/Guias",
    type: "number",
    step: "0.01",
    suffix: "%",
  },
  {
    key: "iva_ads_pct",
    label: "IVA Ads",
    type: "number",
    step: "0.01",
    suffix: "%",
  },
  {
    key: "retention_pct",
    label: "Retenciones",
    type: "number",
    step: "0.01",
    suffix: "%",
  },
];

export default function SettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [brand, setBrand] = useState<Brand | null>(null);
  const [form, setForm] = useState<BrandForm>(defaultValues);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBrand() {
      setIsLoading(true);
      const { data } = await supabase
        .from("brands")
        .select("*")
        .eq("slug", slug)
        .single();

      if (data) {
        const b = data as Brand;
        setBrand(b);
        setForm({
          name: b.name,
          color: b.color || "#f97316",
          commission_tiktok: b.commission_tiktok ?? 8,
          commission_affiliates: b.commission_affiliates ?? 6,
          product_cost_mode: b.product_cost_mode ?? "pct",
          product_cost_pct: b.product_cost_pct ?? 12,
          product_cost_fixed: b.product_cost_fixed ?? 0,
          iva_ads_pct: b.iva_ads_pct ?? 16,
          retention_pct: b.retention_pct ?? 9.03,
        });
      }
      setIsLoading(false);
    }
    loadBrand();
  }, [slug]);

  function handleChange(key: keyof BrandForm, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!brand) return;
    setIsSaving(true);

    const { error } = await supabase
      .from("brands")
      .update({
        name: form.name,
        color: form.color,
        commission_tiktok: form.commission_tiktok,
        commission_affiliates: form.commission_affiliates,
        product_cost_mode: form.product_cost_mode,
        product_cost_pct: form.product_cost_pct,
        product_cost_fixed: form.product_cost_fixed,
        iva_ads_pct: form.iva_ads_pct,
        retention_pct: form.retention_pct,
      })
      .eq("id", brand.id);

    setIsSaving(false);

    if (error) {
      toast.error("Error al guardar configuracion", {
        description: error.message,
      });
    } else {
      toast.success("Configuracion guardada", {
        description: "Los cambios se aplicaran en los calculos automaticamente.",
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#8b949e]" />
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#f97316] transition-colors";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#e6edf3]">Configuracion</h1>
        <p className="mt-1 text-sm text-[#8b949e]">
          Ajusta los parametros de {brand?.name || slug} para calculos de
          utilidad y comisiones.
        </p>
      </div>

      <div className="max-w-xl rounded-xl border border-[#30363d] bg-[#1c2128] p-6">
        <div className="space-y-5">
          {fields.map((field) => (
            <div key={field.key}>
              <label
                htmlFor={field.key}
                className="mb-1.5 block text-sm font-medium text-[#e6edf3]"
              >
                {field.label}
                {field.suffix && (
                  <span className="ml-1 text-[#8b949e]">({field.suffix})</span>
                )}
              </label>

              {field.type === "color" ? (
                <div className="flex items-center gap-3">
                  <input
                    id={field.key}
                    type="color"
                    value={form[field.key] as string}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border border-[#30363d] bg-[#161b22]"
                  />
                  <input
                    type="text"
                    value={form[field.key] as string}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="w-32 rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#f97316]"
                    placeholder="#f97316"
                  />
                  <div
                    className="h-10 w-10 rounded-lg border border-[#30363d]"
                    style={{ backgroundColor: form[field.key] as string }}
                  />
                </div>
              ) : (
                <input
                  id={field.key}
                  type={field.type}
                  step={field.step}
                  value={form[field.key]}
                  onChange={(e) =>
                    handleChange(
                      field.key,
                      field.type === "number"
                        ? parseFloat(e.target.value) || 0
                        : e.target.value
                    )
                  }
                  className={inputClass}
                />
              )}
            </div>
          ))}

          {/* Product cost — mode toggle + value */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#e6edf3]">
              Costo Producto
            </label>
            <div className="mb-2 flex gap-1 rounded-lg border border-[#30363d] bg-[#161b22] p-0.5 w-fit">
              <button
                type="button"
                onClick={() => handleChange("product_cost_mode", "pct")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  form.product_cost_mode === "pct"
                    ? "bg-[#f97316] text-white"
                    : "text-[#8b949e] hover:text-[#e6edf3]"
                }`}
              >
                Porcentaje (%)
              </button>
              <button
                type="button"
                onClick={() => handleChange("product_cost_mode", "fixed")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  form.product_cost_mode === "fixed"
                    ? "bg-[#f97316] text-white"
                    : "text-[#8b949e] hover:text-[#e6edf3]"
                }`}
              >
                Monto fijo (MXN)
              </button>
            </div>

            {form.product_cost_mode === "pct" ? (
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={form.product_cost_pct}
                  onChange={(e) =>
                    handleChange(
                      "product_cost_pct",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className={inputClass}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8b949e]">
                  % del GMV
                </span>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={form.product_cost_fixed}
                  onChange={(e) =>
                    handleChange(
                      "product_cost_fixed",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className={inputClass}
                  placeholder="65"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8b949e]">
                  MXN por unidad
                </span>
              </div>
            )}
            <p className="mt-1 text-xs text-[#8b949e]">
              {form.product_cost_mode === "pct"
                ? "Se calcula como porcentaje del GMV total."
                : "Se multiplica por el total de articulos vendidos."}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-[#30363d] pt-5">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-[#f97316] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#ea580c] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar cambios
              </>
            )}
          </button>
          <p className="text-xs text-[#8b949e]">
            Estos valores se usan en la Calculadora y los calculos de Utilidad.
          </p>
        </div>
      </div>
    </div>
  );
}
