"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Loader2, Trash2 } from "lucide-react";
import type { Brand } from "@/types";

interface UserRecord {
  user_id: string;
  email: string;
  brands: { brand_id: string; is_admin: boolean }[];
}

export default function AdminUsersPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.replace("/");
      return;
    }
    loadData();
  }, [authLoading, isAdmin, router]);

  async function loadData() {
    setLoading(true);

    try {
      // Cargar todas las marcas
      const { data: brandsData } = await supabase
        .from("brands")
        .select("*")
        .order("name");
      if (brandsData) setBrands(brandsData);

      // Cargar todos los usuarios desde la API (usa service role en el servidor)
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("No authenticated session");
      }

      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const { users: usersWithBrands } = await response.json();
      setUsers(usersWithBrands);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function assignBrand() {
    if (!selectedUser || !selectedBrand) return;
    const { error } = await supabase
      .from("user_brands")
      .insert({
        user_id: selectedUser,
        brand_id: selectedBrand,
        is_admin: false,
      })
      .select()
      .single();

    if (!error) {
      setSelectedBrand(null);
      await loadData();
    }
  }

  async function removeBrand(userId: string, brandId: string) {
    const { error } = await supabase
      .from("user_brands")
      .delete()
      .eq("user_id", userId)
      .eq("brand_id", brandId);

    if (!error) {
      await loadData();
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#f97316]" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded-lg border border-[#30363d] bg-[#1c2128] p-6 text-center">
        <p className="text-[#e6edf3]">No tienes permiso para acceder aquí</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#e6edf3]">Usuarios</h1>
        <p className="mt-1 text-sm text-[#8b949e]">
          Gestiona usuarios y asigna marcas
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#30363d] bg-[#0d1117]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#30363d]">
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#8b949e]">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#8b949e]">
                Marcas asignadas
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#8b949e]">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id} className="border-b border-[#30363d]">
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-[#e6edf3]">
                      {user.email}
                    </p>
                    <p className="text-xs text-[#8b949e]">{user.user_id}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {user.brands.length === 0 ? (
                      <span className="text-xs text-[#8b949e]">
                        Sin marcas asignadas
                      </span>
                    ) : (
                      user.brands.map((ub) => {
                        const brandName = brands.find(
                          (b) => b.id === ub.brand_id
                        )?.name;
                        return (
                          <div
                            key={ub.brand_id}
                            className="inline-flex items-center gap-2 rounded-full bg-[#f97316]/10px-2 py-1 text-xs font-medium text-[#f97316]"
                          >
                            {brandName}
                            <button
                              onClick={() =>
                                removeBrand(user.user_id, ub.brand_id)
                              }
                              className="ml-1 hover:opacity-70"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {selectedUser === user.user_id ? (
                    <div className="flex gap-2">
                      <select
                        value={selectedBrand || ""}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        className="rounded-lg border border-[#30363d] bg-[#161b22] px-2 py-1 text-xs text-[#e6edf3]"
                      >
                        <option value="">Seleccionar marca</option>
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={assignBrand}
                        disabled={!selectedBrand}
                        className="rounded-lg bg-[#f97316] px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                      >
                        Asignar
                      </button>
                      <button
                        onClick={() => setSelectedUser(null)}
                        className="rounded-lg border border-[#30363d] px-3 py-1 text-xs text-[#8b949e] hover:bg-[#161b22]"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedUser(user.user_id)}
                      className="rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-1 text-xs text-[#e6edf3] hover:bg-[#1c2128]"
                    >
                      Agregar marca
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="rounded-lg border border-[#30363d] bg-[#1c2128] p-6 text-center">
          <p className="text-[#8b949e]">No hay usuarios registrados aún</p>
        </div>
      )}
    </div>
  );
}
