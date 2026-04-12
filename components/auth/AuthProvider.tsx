"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

interface AuthState {
  session: Session | null;
  user: User | null;
  allowedBrandIds: string[];
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  allowedBrandIds: [],
  isAdmin: false,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [allowedBrandIds, setAllowedBrandIds] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    async function loadAccess(currentUser: User | null) {
      if (!currentUser) {
        if (!mounted) return;
        setAllowedBrandIds([]);
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .from("user_brands")
        .select("brand_id, is_admin")
        .eq("user_id", currentUser.id);
      if (!mounted) return;
      const ids = (data ?? []).map((r: { brand_id: string }) => r.brand_id);
      const admin = (data ?? []).some(
        (r: { is_admin: boolean }) => r.is_admin === true
      );
      setAllowedBrandIds(ids);
      setIsAdmin(admin);
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      loadAccess(data.session?.user ?? null).finally(() => {
        if (mounted) setLoading(false);
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, newSession) => {
      setSession(newSession);
      loadAccess(newSession?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Redirect to /login when unauthenticated outside of /login itself
  useEffect(() => {
    if (loading) return;
    if (!session && pathname !== "/login") {
      router.replace("/login");
    }
    if (session && pathname === "/login") {
      router.replace("/");
    }
  }, [loading, session, pathname, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        allowedBrandIds,
        isAdmin,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
