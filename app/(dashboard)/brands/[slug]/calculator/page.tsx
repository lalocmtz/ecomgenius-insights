import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RentabilityCalculator } from "@/components/calculator/RentabilityCalculator";
import { AffiliateOfferCalculator } from "@/components/calculator/AffiliateOfferCalculator";

export const metadata = {
  title: "Calculadora de Rentabilidad - EcomGenius",
};

export default async function CalculatorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="min-h-screen bg-[#0d1117] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#e6edf3]">
            Calculadora de Rentabilidad
          </h1>
          <p className="text-sm text-[#8b949e] mt-1">
            Analiza la rentabilidad de tus ventas en TikTok Shop para{" "}
            <span className="text-[#f97316] font-medium">{slug}</span>
          </p>
        </div>

        <Tabs defaultValue="tiktok-shop">
          <TabsList variant="line" className="border-b border-[#30363d] w-full justify-start">
            <TabsTrigger value="tiktok-shop">
              Calculadora TikTok Shop
            </TabsTrigger>
            <TabsTrigger value="affiliate">
              Calculadora Oferta Afiliados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tiktok-shop" className="mt-6">
            <RentabilityCalculator />
          </TabsContent>

          <TabsContent value="affiliate" className="mt-6">
            <AffiliateOfferCalculator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
