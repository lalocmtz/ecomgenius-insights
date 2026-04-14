import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const agentRoles: Record<string, string> = {
  director: "ROL: Director Estratégico / CEO. Visión completa de ambas marcas. Detecta patrones macro, oportunidades y riesgos críticos.",
  financiero: "ROL: CFO / Analista Financiero. Analiza márgenes, P&L, flujo de caja y KPIs financieros. Alerta sobre desviaciones vs target.",
  publicidad: "ROL: Media Buyer Senior. Evalúa ROAS (incluir IVA 4% sobre ads), CPA, creativos y distribución de presupuesto. ROAS target: >3.5x.",
  lives: "ROL: Analista de Lives. Evalúa rentabilidad por sesión. Factores: costo host, ROAS, AOV, duración. Detecta mejor host+horario+inversión.",
  logistica: "ROL: Analista de Logística. Monitorea guías (meta 6% AOV), devoluciones, contracargos. Skinglow: bajísima retención clientes.",
  datos: "ROL: Data Analyst. Sintetiza datos del período. Identifica: anomalías, KPIs fuera de meta, oportunidades, alertas. Max 5 puntos.",
  creativo: "ROL: Analista Creativo. Evalúa ángulos ganadores por ROAS, detecta fatigue (ROAS cae >20% en 7d), sugiere nuevos hooks y formatos.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { agentId, brand, messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch context data
    const [livesRes, kpisRes, creativosRes] = await Promise.all([
      supabase.from("lives_analysis").select("*").eq("brand", brand).order("fecha", { ascending: false }).limit(10),
      supabase.from("kpis_monthly").select("*").eq("brand", brand).order("periodo", { ascending: false }).limit(10),
      supabase.from("creativos").select("*").eq("brand", brand).limit(10),
    ]);

    const brandName = brand === "feel_ink" ? "Feel Ink (tatuajes temporales, TikTok-first)" : "Skinglow (suplementos belleza, Shopify-first)";
    const systemPrompt = `Eres un agente especializado de EcomGenius, empresa de ecommerce mexicana.
Marca activa: ${brandName}
Fecha: ${new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

CONTEXTO FINANCIERO:
Feel Ink: COGS 12%, Guías 6%, Comisión TTS 8%, IVA CPA 4%, Retenciones 9.03%. Hosts: DENISSE, EMILIO, FER, KARO ($500-$1600/sesión). ROAS hist: 4.02x. Margen: 2.04%.
Skinglow: 95% Shopify. Ticket $1,021. Descuento 33.9% (CRÍTICO). Retención 6.89% (CRÍTICO). Producto estrella: Crema Aclarante 77%.

DATOS ACTUALES:
Lives: ${JSON.stringify(livesRes.data?.slice(0, 5) || [])}
KPIs: ${JSON.stringify(kpisRes.data || [])}
Creativos: ${JSON.stringify(creativosRes.data?.slice(0, 5) || [])}

${agentRoles[agentId] || agentRoles.director}

Reglas: Español MX, directo, números específicos, max 5 bullets, termina con recomendación prioritaria.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("claude-agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
