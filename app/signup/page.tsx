"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.replace("/login");
    }, 2000);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1117] p-6">
      <div className="w-full max-w-sm rounded-2xl border border-[#30363d] bg-[#0d1117] p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[#e6edf3]">
            Ecom<span className="text-[#f97316]">Genius</span>
          </h1>
          <p className="mt-1 text-xs text-[#8b949e]">Intelligence</p>
        </div>

        {success ? (
          <div className="space-y-3 text-center">
            <div className="rounded-lg border border-[#22c55e]/30 bg-[#22c55e]/10 px-3 py-3">
              <p className="text-sm font-medium text-[#22c55e]">
                ✓ Registro exitoso
              </p>
              <p className="mt-1 text-xs text-[#8b949e]">
                Te redirigimos a login...
              </p>
            </div>
            <p className="text-xs text-[#8b949e]">
              El admin te asignará una marca pronto.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#8b949e]">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#f97316]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#8b949e]">
                Contraseña (min. 8 caracteres)
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#f97316]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#8b949e]">
                Confirmar contraseña
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#f97316]"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#f97316] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Registrarse
            </button>
          </form>
        )}

        <div className="mt-6 border-t border-[#30363d] pt-4">
          <p className="text-center text-xs text-[#8b949e]">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="text-[#f97316] hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
