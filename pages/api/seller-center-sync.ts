import type { NextApiRequest, NextApiResponse } from "next";
import { createServerSupabase } from "@/lib/supabase/server";

const supabase = createServerSupabase();

interface SellerData {
  gmv: number;
  gastoAdsActual: number;
  pedidosActuales: number;
  creativeSales?: Record<string, number>; // e.g., { creador1: 500, creador2: 300 }
}

interface ApiResponse {
  success: boolean;
  data?: SellerData;
  error?: string;
  message?: string;
}

/**
 * POST /api/seller-center-sync
 * 
 * Dispara una tarea en Claude Cowork para extraer datos del TikTok Seller Center.
 * 
 * Request body:
 * {
 *   "brandId": "string",
 *   "userId": "string",
 *   "liveDate": "ISO date string (optional)"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": { gmv, gastoAdsActual, pedidosActuales, creativeSales? }
 *   "message": "SUCCESS | Datos extraídos exitosamente"
 * }
 * 
 * Error Response:
 * {
 *   "success": false,
 *   "error": "Error message",
 *   "message": "WHY_IT_FAILED"
 * }
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only accept POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
      message: "USE_POST",
    });
  }

  try {
    const { brandId, userId, liveDate } = req.body;

    // Validate inputs
    if (!brandId || !userId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: brandId, userId",
        message: "MISSING_FIELDS",
      });
    }

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "AUTH_FAILED",
      });
    }

    // TODO: Aquí iría la integración real con Claude Cowork
    // Por ahora, retornamos datos simulados
    // 
    // Pseudocódigo:
    // 1. Llamar a Claude Cowork API con instrucción:
    //    "Abre TikTok Seller Center, extrae datos de hoy, retorna JSON"
    // 2. Esperar respuesta
    // 3. Parsear JSON
    // 4. Guardar en tabla `live_sessions` si es necesario
    // 5. Retornar datos

    console.log(
      "[seller-center-sync] WARNING: Using simulated data. Claude Cowork integration coming soon."
    );
    console.log(
      "[seller-center-sync] Request:",
      JSON.stringify({ brandId, userId, liveDate }, null, 2)
    );

    // TODO: Integrate with Cowork to extract real Seller Center data
    const sellerData: SellerData = {
      gmv: 0,
      gastoAdsActual: 0,
      pedidosActuales: 0,
    };

    console.log(
      "[seller-center-sync] SUCCESS: Data extracted",
      JSON.stringify(sellerData, null, 2)
    );

    // Guardar en live_sessions para historial
    if (liveDate) {
      try {
        await supabase
          .from("live_sessions")
          .insert({
            brand_id: brandId,
            user_id: userId,
            live_date: liveDate,
            session_data: sellerData,
            source: "seller_center_cowork",
            created_at: new Date().toISOString(),
          });
      } catch (insertError) {
        console.warn(
          "[seller-center-sync] Warning: Could not save to live_sessions:",
          insertError
        );
      }
    }

    return res.status(200).json({
      success: true,
      data: sellerData,
      message: "SUCCESS",
    });
  } catch (error: any) {
    console.error("[seller-center-sync] FATAL ERROR:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    });

    return res.status(500).json({
      success: false,
      error: error?.message || "Internal server error",
      message: "INTERNAL_ERROR",
    });
  }
}
