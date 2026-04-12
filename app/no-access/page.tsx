"use client";

import { useAuth } from "@/components/auth/AuthProvider";

export default function NoAccessPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1117] p-6">
      <div className="w-full max-w-md rounded-2xl border border-[#30363d] bg-[#0d1117] p-8 text-center shadow-2xl">
        <h1 className="text-2xl font-bold text-[#e6edf3]">Sin acceso</h1>
        <p className="mt-2 text-sm text-[#8b949e]">
          Tu cuenta {user?.email ? `(${user.email})` : ""} aun no tiene acceso a
          ninguna marca. Pide al admin que te asigne una marca en{" "}
          <code className="rounded bg-[#161b22] px-1 text-[11px] text-[#e6edf3]">
            user_brands
          </code>
          .
        </p>
        <button
          onClick={signOut}
          className="mt-6 rounded-lg border border-[#30363d] bg-[#161b22] px-4 py-2 text-sm font-medium text-[#e6edf3] hover:bg-[#1c2128]"
        >
          Cerrar sesion
        </button>
      </div>
    </div>
  );
}
