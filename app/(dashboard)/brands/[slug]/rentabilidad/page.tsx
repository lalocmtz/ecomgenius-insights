"use client";

import { use, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GastosFijosTab } from "@/components/rentabilidad/GastosFijosTab";
import { PLRealTab } from "@/components/rentabilidad/PLRealTab";
import { AsesorIATab } from "@/components/rentabilidad/AsesorIATab";
import { SimuladorTab } from "@/components/rentabilidad/SimuladorTab";
import type { Brand } from "@/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function RentabilidadPage({ params }: PageProps) {
  const { slug } = use(params);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBrand() {
      const { data } = await supabase
        .from("brands")
        .select("*")
        .eq("slug", slug)
        .single();
      if (data) setBrand(data as Brand);
      setLoading(false);
    }
    loadBrand();
  }, [slug]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-[#30363d]" />
        <div className="h-[500px] animate-pulse rounded-xl border border-[#30363d] bg-[#1c2128]" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[#30363d] bg-[#1c2128] p-12">
        <p className="text-sm font-medium text-[#e6edf3]">Marca no encontrada</p>
        <p className="mt-1 text-xs text-[#8b949e]">Verifica el slug: {slug}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#e6edf3]">Rentabilidad</h1>
        <p className="mt-1 text-sm text-[#8b949e]">
          P&amp;L real, gastos fijos y asesor estrategico &middot; {brand.name}
        </p>
      </div>

      <Tabs defaultValue="pl">
        <TabsList variant="line" className="border-b border-[#30363d] pb-px">
          <TabsTrigger value="pl">P&amp;L Real</TabsTrigger>
          <TabsTrigger value="gastos">Gastos Fijos</TabsTrigger>
          <TabsTrigger value="simulador">Simulador</TabsTrigger>
          <TabsTrigger value="asesor">Asesor IA</TabsTrigger>
        </TabsList>

        <TabsContent value="pl" className="pt-6">
          <PLRealTab brandId={brand.id} brand={brand} />
        </TabsContent>

        <TabsContent value="gastos" className="pt-6">
          <GastosFijosTab brandId={brand.id} brand={brand} />
        </TabsContent>

        <TabsContent value="simulador" className="pt-6">
          <SimuladorTab brand={brand} />
        </TabsContent>

        <TabsContent value="asesor" className="pt-6">
          <AsesorIATab brandId={brand.id} brand={brand} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
