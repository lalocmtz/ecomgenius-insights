"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SimuladorGmvTab } from "./SimuladorGmvTab";
import { SimuladorLivesTab } from "./SimuladorLivesTab";
import type { Brand } from "@/types";

export function SimuladorTab({ brand }: { brand: Brand }) {
  return (
    <Tabs defaultValue="gmv">
      <TabsList
        variant="line"
        className="mb-6 border-b border-[#30363d] pb-px"
      >
        <TabsTrigger value="gmv">Simulador GMV</TabsTrigger>
        <TabsTrigger value="lives">Simulador Lives</TabsTrigger>
      </TabsList>

      <TabsContent value="gmv">
        <SimuladorGmvTab brand={brand} />
      </TabsContent>

      <TabsContent value="lives">
        <SimuladorLivesTab brand={brand} />
      </TabsContent>
    </Tabs>
  );
}
