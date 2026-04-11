"use client";

import { use, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GMVMaxCalculator } from "@/components/calculator/GMVMaxCalculator";
import { LivesCalculator } from "@/components/calculator/LivesCalculator";
import { supabase } from "@/lib/supabase/client";

interface BrandDefaults {
  comisionTT: number;
  guiasPct: number;
  costoPct: number;
  ivaAdsPct: number;
}

export default function CalculatorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [brandName, setBrandName] = useState(slug);
  const [defaults, setDefaults] = useState<BrandDefaults | undefined>();

  useEffect(() => {
    async function loadBrand() {
      const { data } = await supabase
        .from("brands")
        .select("name, commission_tiktok, commission_affiliates, product_cost_pct, iva_ads_pct")
        .eq("slug", slug)
        .single();

      if (data) {
        setBrandName(data.name);
        setDefaults({
          comisionTT: data.commission_tiktok ?? 8,
          guiasPct: data.commission_affiliates ?? 6,
          costoPct: data.product_cost_pct ?? 12,
          ivaAdsPct: data.iva_ads_pct ?? 16,
        });
      }
    }
    loadBrand();
  }, [slug]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#e6edf3]">
          Calculadora de Rentabilidad
        </h1>
        <p className="text-sm text-[#8b949e] mt-1">
          Analiza GMV Max y Lives para{" "}
          <span className="text-[#f97316] font-medium">{brandName}</span>
        </p>
      </div>

      <Tabs defaultValue="gmv-max">
        <TabsList variant="line" className="border-b border-[#30363d] w-full justify-start">
          <TabsTrigger value="gmv-max">Calculadora GMV Max</TabsTrigger>
          <TabsTrigger value="lives">Calculadora Lives</TabsTrigger>
        </TabsList>

        <TabsContent value="gmv-max" className="mt-6">
          <GMVMaxCalculator defaults={defaults} />
        </TabsContent>

        <TabsContent value="lives" className="mt-6">
          <LivesCalculator defaults={defaults} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
