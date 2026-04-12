"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Loader2, Plus, X, Filter } from "lucide-react";
import { toast } from "sonner";

interface UserRecord {
  user_id: string;
  email: string;
  brands: Array<{ brand_id: string; brand_name?: string }>;
}

interface Brand {
  id: string;
  name: string;
}

interface DashboardStats {
  total_users: number;
  total_brands: number;
  users_without_brands: number;
  users_by_brand: Array<{ brand_id: string; brand_name: string; count: number }>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      router.replace("/no-access");
      return;
    }
    loadData();
  }, [isAdmin, router]);

  async function loadData() {
    setLoading(true);

    try {
      // Cargar marcas
      const { data: brandsData } = await supabase
        .from("brands")
        .select("*")
        .order("name");
      if (brandsData) setBrands(brandsData);

      // Cargar usuarios desde API
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) throw new Error("No authenticated");

      const response = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch users");

      const { users: usersWithBrands } = await response.json();

      // Enriquecer con nombres de marcas
      const enriched = usersWithBrands.map((u: any) => ({
        ...u,
        brands: u.brands.map((b: any) => ({
          brand_id: b.brand_id,
          brand_name: brandsData?.find((br) => br.id === b.brand_id)?.name || "Unknown",
        })),
      }));

      setUsers(enriched);

      // Cargar estadísticas
      const statsResponse = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(userId: string, currentBrands: Array<{ brand_id: string }>) {
    setSelectedUserId(userId);
    setSelectedBrands(new Set(currentBrands.map((b) => b.brand_id)));
    setShowModal(true);
  }

  async function saveBrandAssignments() {
    if (!selectedUserId || !selectedBrands) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) throw new Error("No authenticated");

      const response = await fetch("/api/admin/assign-brands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({
          user_id: selectedUserId,
          brand_ids: Array.from(selectedBrands),
        }),
      });

      if (!response.ok) throw new Error("Failed to save assignments");

      toast.success("Asignaciones actualizadas");
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error guardando asignaciones");
    }
  }

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchEmail.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1117]">
        <Loader2 className="h-8 w-8 animate-spin text-[#f97316]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#e6edf3]">Panel Admin</h1>
          <p className="mt-1 text-sm text-[#8b949e]">Gestión de usuarios y marcas</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4">
              <p className="text-xs font-medium text-[#8b949e]">Total Usuarios</p>
              <p className="mt-2 text-2xl font-bold text-[#e6edf3]">{stats.total_users}</p>
            </div>

            <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4">
              <p className="text-xs font-medium text-[#8b949e]">Total Marcas</p>
              <p className="mt-2 text-2xl font-bold text-[#e6edf3]">{stats.total_brands}</p>
            </div>

            <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4">
              <p className="text-xs font-medium text-[#8b949e]">Sin Asignar</p>
              <p className="mt-2 text-2xl font-bold text-red-400">{stats.users_without_brands}</p>
            </div>

            <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4">
              <p className="text-xs font-medium text-[#8b949e]">% Cubierto</p>
              <p className="mt-2 text-2xl font-bold text-green-400">
                {stats.total_users > 0
                  ? Math.round(
                      ((stats.total_users - stats.users_without_brands) / stats.total_users) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-6 flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="w-full rounded-lg border border-[#30363d] bg-[#161b22] px-4 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#f97316]"
            />
          </div>
          <button
            onClick={loadData}
            className="rounded-lg bg-[#f97316] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Actualizar
          </button>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-lg border border-[#30363d] bg-[#161b22]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#30363d] bg-[#0d1117]">
                <th className="px-6 py-3 text-left font-semibold text-[#8b949e]">Email</th>
                <th className="px-6 py-3 text-left font-semibold text-[#8b949e]">Marcas Asignadas</th>
                <th className="px-6 py-3 text-left font-semibold text-[#8b949e]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.user_id}
                  className="border-b border-[#30363d] transition-colors hover:bg-[#0d1117]"
                >
                  <td className="px-6 py-4 text-[#e6edf3]">{user.email}</td>
                  <td className="px-6 py-4">
                    {user.brands.length === 0 ? (
                      <span className="text-xs text-[#8b949e]">Sin marcas</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {user.brands.map((brand) => (
                          <span
                            key={brand.brand_id}
                            className="rounded-full bg-[#f97316]/10 px-3 py-1 text-xs text-[#f97316]"
                          >
                            {brand.brand_name}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => openEditModal(user.user_id, user.brands)}
                      className="text-xs text-[#f97316] hover:underline"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="px-6 py-8 text-center text-[#8b949e]">
              No se encontraron usuarios
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-96 max-w-md rounded-lg border border-[#30363d] bg-[#161b22] p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#e6edf3]">Asignar Marcas</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-[#8b949e] hover:text-[#e6edf3]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6 max-h-64 space-y-2 overflow-y-auto">
                {brands.map((brand) => (
                  <label
                    key={brand.id}
                    className="flex items-center gap-3 rounded-lg border border-[#30363d] bg-[#0d1117] p-3 cursor-pointer hover:border-[#f97316]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBrands.has(brand.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedBrands);
                        if (e.target.checked) {
                          newSet.add(brand.id);
                        } else {
                          newSet.delete(brand.id);
                        }
                        setSelectedBrands(newSet);
                      }}
                      className="h-4 w-4 rounded border-[#30363d] bg-[#0d1117] text-[#f97316]"
                    />
                    <span className="text-sm text-[#e6edf3]">{brand.name}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-[#30363d] px-4 py-2 text-sm font-semibold text-[#e6edf3] hover:bg-[#0d1117]"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveBrandAssignments}
                  className="flex-1 rounded-lg bg-[#f97316] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
