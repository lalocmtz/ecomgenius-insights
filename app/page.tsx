"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";

export default function Home() {
  const { loading, session, allowedBrandIds } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (allowedBrandIds.length === 0) {
      router.replace("/no-access");
      return;
    }
    // Pick first allowed brand and resolve its slug
    (async () => {
      const { data } = await supabase
        .from("brands")
        .select("slug")
        .in("id", allowedBrandIds)
        .order("name", { ascending: true })
        .limit(1)
        .single();
      if (data?.slug) {
        router.replace(`/brands/${data.slug}`);
      } else {
        router.replace("/no-access");
      }
    })();
  }, [loading, session, allowedBrandIds, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1117]">
      <Loader2 className="h-6 w-6 animate-spin text-[#f97316]" />
    </div>
  );
}
