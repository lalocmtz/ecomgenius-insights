"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { formatMXN } from "@/lib/format";
import { Plus, X, Pencil, User } from "lucide-react";
import type { TeamMember, FixedCost, Brand } from "@/types";

const COST_TYPE_LABELS: Record<string, string> = {
  salary: "Nomina",
  freelance: "Freelance",
  agency: "Agencia",
};

const CATEGORIES = [
  { key: "all", label: "Todos" },
  { key: "software", label: "Software" },
  { key: "logistics", label: "Logistica" },
  { key: "production", label: "Produccion" },
  { key: "office", label: "Oficina" },
  { key: "other", label: "Otro" },
] as const;

interface Props {
  brandId: string;
  brand: Brand;
}

// --- Team Member Form ---
function TeamMemberForm({
  brandId,
  editing,
  onDone,
}: {
  brandId: string;
  editing?: TeamMember;
  onDone: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [role, setRole] = useState(editing?.role ?? "");
  const [roleDescription, setRoleDescription] = useState(editing?.role_description ?? "");
  const [costMonthly, setCostMonthly] = useState(editing?.cost_monthly ?? 0);
  const [costType, setCostType] = useState(editing?.cost_type ?? "salary");
  const [hoursPerWeek, setHoursPerWeek] = useState(editing?.hours_per_week ?? 0);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim() || !role.trim() || costMonthly <= 0) return;
    setSaving(true);

    const row = {
      brand_id: brandId,
      name: name.trim(),
      role: role.trim(),
      role_description: roleDescription.trim() || null,
      cost_monthly: costMonthly,
      cost_type: costType,
      hours_per_week: hoursPerWeek > 0 ? hoursPerWeek : null,
    };

    if (editing) {
      await supabase.from("team_members").update(row).eq("id", editing.id);
    } else {
      await supabase.from("team_members").insert(row);
    }

    setSaving(false);
    onDone();
  }

  return (
    <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[#8b949e]">Nombre</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#f97316]"
            placeholder="Carlos Ramirez"
          />
        </div>
        <div>
          <label className="text-xs text-[#8b949e]">Rol / Puesto</label>
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#f97316]"
            placeholder="Community Manager"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-[#8b949e]">Que hace exactamente?</label>
        <textarea
          value={roleDescription}
          onChange={(e) => setRoleDescription(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#f97316] resize-none"
          placeholder="Maneja comentarios, publica Reels, coordina calendario de contenido"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-[#8b949e]">Costo mensual (MX$)</label>
          <input
            type="number"
            value={costMonthly}
            onChange={(e) => setCostMonthly(parseFloat(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#f97316]"
          />
        </div>
        <div>
          <label className="text-xs text-[#8b949e]">Tipo</label>
          <select
            value={costType}
            onChange={(e) => setCostType(e.target.value as "salary" | "freelance" | "agency")}
            className="mt-1 w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#f97316]"
          >
            <option value="salary">Nomina</option>
            <option value="freelance">Freelance</option>
            <option value="agency">Agencia</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-[#8b949e]">Horas por semana</label>
          <input
            type="number"
            value={hoursPerWeek}
            onChange={(e) => setHoursPerWeek(parseFloat(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#f97316]"
            placeholder="Opcional"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !name.trim() || !role.trim() || costMonthly <= 0}
          className="rounded-lg bg-[#f97316] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ea580c] disabled:opacity-50"
        >
          {saving ? "Guardando..." : editing ? "Actualizar" : "Guardar"}
        </button>
        <button
          onClick={onDone}
          className="rounded-lg border border-[#30363d] px-4 py-2 text-sm text-[#8b949e] hover:text-[#e6edf3]"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// --- Fixed Cost Form ---
function FixedCostForm({
  brandId,
  editing,
  onDone,
}: {
  brandId: string;
  editing?: FixedCost;
  onDone: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [category, setCategory] = useState(editing?.category ?? "software");
  const [amount, setAmount] = useState(editing?.amount_monthly ?? 0);
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim() || amount <= 0) return;
    setSaving(true);

    const row = {
      brand_id: brandId,
      name: name.trim(),
      category,
      amount_monthly: amount,
      notes: notes.trim() || null,
    };

    if (editing) {
      await supabase.from("fixed_costs").update(row).eq("id", editing.id);
    } else {
      await supabase.from("fixed_costs").insert(row);
    }

    setSaving(false);
    onDone();
  }

  return (
    <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[#8b949e]">Nombre del gasto</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#f97316]"
            placeholder="Notion, Canva, CapCut Pro..."
          />
        </div>
        <div>
          <label className="text-xs text-[#8b949e]">Categoria</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as "software" | "logistics" | "production" | "office" | "other")}
            className="mt-1 w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#f97316]"
          >
            <option value="software">Software</option>
            <option value="logistics">Logistica</option>
            <option value="production">Produccion</option>
            <option value="office">Oficina</option>
            <option value="other">Otro</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[#8b949e]">Monto mensual (MX$)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#f97316]"
          />
        </div>
        <div>
          <label className="text-xs text-[#8b949e]">Notas (opcional)</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#f97316]"
            placeholder="Detalles adicionales"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !name.trim() || amount <= 0}
          className="rounded-lg bg-[#f97316] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ea580c] disabled:opacity-50"
        >
          {saving ? "Guardando..." : editing ? "Actualizar" : "Guardar"}
        </button>
        <button
          onClick={onDone}
          className="rounded-lg border border-[#30363d] px-4 py-2 text-sm text-[#8b949e] hover:text-[#e6edf3]"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// --- Main Component ---
export function GastosFijosTab({ brandId, brand }: Props) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [costs, setCosts] = useState<FixedCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | undefined>();
  const [showCostForm, setShowCostForm] = useState(false);
  const [editingCost, setEditingCost] = useState<FixedCost | undefined>();
  const [categoryFilter, setCategoryFilter] = useState("all");

  async function loadData() {
    setLoading(true);
    const [teamRes, costsRes] = await Promise.all([
      supabase
        .from("team_members")
        .select("*")
        .eq("brand_id", brandId)
        .eq("active", true)
        .order("created_at", { ascending: true }),
      supabase
        .from("fixed_costs")
        .select("*")
        .eq("brand_id", brandId)
        .eq("active", true)
        .order("category", { ascending: true }),
    ]);
    setTeam((teamRes.data as TeamMember[]) ?? []);
    setCosts((costsRes.data as FixedCost[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [brandId]);

  async function deleteMember(id: string) {
    await supabase.from("team_members").update({ active: false }).eq("id", id);
    loadData();
  }

  async function deleteCost(id: string) {
    await supabase.from("fixed_costs").update({ active: false }).eq("id", id);
    loadData();
  }

  function handleTeamFormDone() {
    setShowTeamForm(false);
    setEditingMember(undefined);
    loadData();
  }

  function handleCostFormDone() {
    setShowCostForm(false);
    setEditingCost(undefined);
    loadData();
  }

  const teamTotal = useMemo(() => team.reduce((s, m) => s + m.cost_monthly, 0), [team]);
  const filteredCosts = useMemo(
    () =>
      categoryFilter === "all"
        ? costs
        : costs.filter((c) => c.category === categoryFilter),
    [costs, categoryFilter]
  );
  const opsTotal = useMemo(() => costs.reduce((s, c) => s + c.amount_monthly, 0), [costs]);
  const grandTotal = teamTotal + opsTotal;

  // Break-even calculation
  const avgMarginPct = 100 - (brand.commission_tiktok + brand.commission_affiliates + brand.product_cost_pct + brand.retention_pct);
  const breakEvenSales = avgMarginPct > 0 ? grandTotal / (avgMarginPct / 100) : 0;
  const aov = 349; // default Feel Ink AOV
  const breakEvenOrders = aov > 0 ? Math.ceil(breakEvenSales / aov) : 0;

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-96 animate-pulse rounded-xl border border-[#30363d] bg-[#1c2128]" />
        <div className="h-96 animate-pulse rounded-xl border border-[#30363d] bg-[#1c2128]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Equipo */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#e6edf3]">Equipo</h2>
            <button
              onClick={() => {
                setEditingMember(undefined);
                setShowTeamForm(true);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-[#f97316] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#ea580c]"
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar persona
            </button>
          </div>

          {showTeamForm && (
            <TeamMemberForm
              brandId={brandId}
              editing={editingMember}
              onDone={handleTeamFormDone}
            />
          )}

          {team.length === 0 && !showTeamForm ? (
            <div className="flex h-32 items-center justify-center rounded-xl border border-[#30363d] bg-[#1c2128]">
              <p className="text-sm text-[#8b949e]">
                No hay miembros de equipo registrados
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {team.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-[#30363d] bg-[#1c2128] p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f97316]/10">
                        <User className="h-4 w-4 text-[#f97316]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#e6edf3]">
                          {m.name}
                        </p>
                        <p className="text-xs text-[#8b949e]">{m.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingMember(m);
                          setShowTeamForm(true);
                        }}
                        className="rounded p-1 text-[#8b949e] hover:text-[#e6edf3]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteMember(m.id)}
                        className="rounded p-1 text-[#8b949e] hover:text-[#ef4444]"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {m.role_description && (
                    <p className="mt-2 text-xs text-[#8b949e] leading-relaxed">
                      &quot;{m.role_description}&quot;
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-4 text-xs">
                    <span className="font-semibold text-[#e6edf3]">
                      {formatMXN(m.cost_monthly)} / mes
                    </span>
                    <span className="rounded bg-[#161b22] px-2 py-0.5 text-[#8b949e]">
                      {COST_TYPE_LABELS[m.cost_type] ?? m.cost_type}
                    </span>
                    {m.hours_per_week && (
                      <span className="text-[#8b949e]">
                        {m.hours_per_week} hrs/semana
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border border-[#30363d] bg-[#161b22] px-4 py-3">
            <span className="text-sm text-[#8b949e]">Total equipo/mes:</span>
            <span className="text-sm font-bold text-[#e6edf3]">
              {formatMXN(teamTotal)}
            </span>
          </div>
        </div>

        {/* RIGHT: Gastos Operativos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#e6edf3]">
              Gastos Operativos
            </h2>
            <button
              onClick={() => {
                setEditingCost(undefined);
                setShowCostForm(true);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-[#f97316] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#ea580c]"
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar gasto
            </button>
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategoryFilter(cat.key)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  categoryFilter === cat.key
                    ? "bg-[#f97316] text-white"
                    : "bg-[#161b22] text-[#8b949e] hover:text-[#e6edf3]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {showCostForm && (
            <FixedCostForm
              brandId={brandId}
              editing={editingCost}
              onDone={handleCostFormDone}
            />
          )}

          {filteredCosts.length === 0 && !showCostForm ? (
            <div className="flex h-32 items-center justify-center rounded-xl border border-[#30363d] bg-[#1c2128]">
              <p className="text-sm text-[#8b949e]">
                No hay gastos operativos registrados
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCosts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-[#30363d] bg-[#1c2128] px-4 py-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#161b22] px-2 py-0.5 text-xs text-[#8b949e] capitalize">
                        {CATEGORIES.find((cat) => cat.key === c.category)?.label ?? c.category}
                      </span>
                      <span className="text-sm font-medium text-[#e6edf3]">
                        {c.name}
                      </span>
                    </div>
                    {c.notes && (
                      <p className="mt-1 text-xs text-[#8b949e]">{c.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[#e6edf3]">
                      {formatMXN(c.amount_monthly)}/mes
                    </span>
                    <button
                      onClick={() => {
                        setEditingCost(c);
                        setShowCostForm(true);
                      }}
                      className="rounded p-1 text-[#8b949e] hover:text-[#e6edf3]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteCost(c.id)}
                      className="rounded p-1 text-[#8b949e] hover:text-[#ef4444]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border border-[#30363d] bg-[#161b22] px-4 py-3">
            <span className="text-sm text-[#8b949e]">
              Total operativos/mes:
            </span>
            <span className="text-sm font-bold text-[#e6edf3]">
              {formatMXN(opsTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Summary */}
      <div className="rounded-xl border border-[#f97316]/30 bg-[#1c2128] p-6">
        <h3 className="text-lg font-bold text-[#e6edf3] mb-4">
          TOTAL GASTOS FIJOS MENSUALES
        </h3>
        <div className="flex items-center gap-3 text-sm text-[#8b949e] mb-3">
          <span>
            Equipo: <span className="text-[#e6edf3] font-semibold">{formatMXN(teamTotal)}</span>
          </span>
          <span>+</span>
          <span>
            Operativos: <span className="text-[#e6edf3] font-semibold">{formatMXN(opsTotal)}</span>
          </span>
        </div>
        <p className="text-2xl font-bold text-[#f97316] mb-4">
          = {formatMXN(grandTotal)} / mes
        </p>

        {grandTotal > 0 && (
          <div className="rounded-lg bg-[#0d1117] border border-[#30363d] p-4 space-y-2">
            <p className="text-sm text-[#8b949e]">
              Para cubrir estos gastos fijos necesitas:
            </p>
            <p className="text-sm text-[#e6edf3]">
              Vender al menos{" "}
              <span className="font-bold text-[#f97316]">
                {formatMXN(breakEvenSales)}
              </span>{" "}
              en GMV{" "}
              <span className="text-xs text-[#8b949e]">
                (asumiendo margen variable promedio de {avgMarginPct.toFixed(1)}%)
              </span>
            </p>
            <p className="text-sm text-[#e6edf3]">
              O vender{" "}
              <span className="font-bold text-[#f97316]">
                {breakEvenOrders.toLocaleString("es-MX")}
              </span>{" "}
              pedidos a AOV promedio de {formatMXN(aov)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
