"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export default function NewBrandPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#f97316");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Ingresa un nombre para la marca");
      return;
    }

    setSaving(true);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check if slug already exists
    const { data: existing } = await supabase
      .from("brands")
      .select("id,slug")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      setSaving(false);
      toast.success(`La marca "${name}" ya existe, redirigiendo...`);
      router.push(`/brands/${existing.slug}/settings`);
      return;
    }

    const { data, error } = await supabase
      .from("brands")
      .insert({
        name: name.trim(),
        slug,
        color,
        commission_tiktok: 8,
        commission_affiliates: 6,
        product_cost_pct: 12,
        product_cost_mode: "pct",
        product_cost_fixed: 0,
        iva_ads_pct: 16,
        retention_pct: 9.03,
      })
      .select()
      .single();

    setSaving(false);

    if (error) {
      toast.error("Error al crear marca", { description: error.message });
      return;
    }

    toast.success(`Marca "${name}" creada`);
    router.push(`/brands/${data.slug}/settings`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#e6edf3]">Nueva Marca</h1>
        <p className="mt-1 text-sm text-[#8b949e]">
          Crea una marca para comenzar a subir datos y analizar rendimiento.
        </p>
      </div>

      <div className="max-w-xl rounded-xl border border-[#30363d] bg-[#1c2128] p-6 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#e6edf3]">
            Nombre de la marca
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Skinglow, Feel Ink..."
            className="w-full rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#f97316] transition-colors"
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#e6edf3]">
            Color de marca
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-[#30363d] bg-[#161b22]"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-32 rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#f97316]"
            />
            <div
              className="h-10 w-10 rounded-lg border border-[#30363d]"
              style={{ backgroundColor: color }}
            />
          </div>
        </div>

        <p className="text-xs text-[#8b949e]">
          Los porcentajes de comision, costos e impuestos se pueden ajustar
          despues en Configuracion.
        </p>

        <button
          onClick={handleCreate}
          disabled={saving || !name.trim()}
          className="flex items-center gap-2 rounded-lg bg-[#f97316] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#ea580c] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Crear marca
            </>
          )}
        </button>
      </div>
    </div>
  );
}
