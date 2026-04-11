import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export function buildReportPrompt(
  brandName: string,
  startDate: string,
  endDate: string,
  financialSummary: string,
  campaignSummary: string,
  creativeSummary: string,
  affiliateSummary: string
): string {
  return `You are a senior e-commerce performance analyst specializing in TikTok Shop.
You are analyzing data for the brand: ${brandName}.
Period: ${startDate} to ${endDate}.

You speak directly to Eduardo, the creative director and commercial strategy lead.
Be direct, data-driven, and actionable. Use MX$ currency.
Format your response in Spanish with clear sections.

--- FINANCIAL DATA ---
${financialSummary}

--- CAMPAIGN DATA ---
${campaignSummary}

--- CREATIVE PERFORMANCE ---
${creativeSummary}

--- AFFILIATE DATA ---
${affiliateSummary}

Provide:
1. **Resumen ejecutivo** (3-4 bullets with the most important numbers)
2. **Analisis financiero**: Real margin, ROAS, refund impact
3. **Creativos que funcionaron** (and why - based on ROI, view rates, CVR)
4. **Creativos que no funcionaron** (and why)
5. **Analisis de campanas**: GMV Max vs Lives performance
6. **Top afiliados y recomendaciones**
7. **3 acciones concretas para la proxima semana**

Be specific. Cite actual numbers. Do not be generic.`;
}

export async function* streamReport(prompt: string) {
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}
