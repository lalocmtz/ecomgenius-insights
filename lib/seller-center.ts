/**
 * Helper para integración con Seller Center Sync API (V2 - con histórico de 60 días)
 * 
 * Este módulo proporciona la función para extraer datos del TikTok Seller Center
 * a través del endpoint backend /api/seller-center-sync-v2.
 */

export interface SellerData {
  gmv: number;
  gastoAdsActual: number;
  pedidosActuales: number;
  creativeSales?: Record<string, number>;
}

export interface HistoricalData {
  date: string;
  gmv: number;
  gastoAds: number;
  pedidos: number;
  roi?: number;
  margen?: number;
}

export interface CoworkExtractionResult {
  current: SellerData;
  historical: HistoricalData[];
  summary: {
    gmv_60d: number;
    gasto_ads_60d: number;
    roi_promedio: number;
    margen_promedio: number;
    total_lives: number;
  };
}

export interface SellerCenterData extends SellerData {} // Keep for backward compatibility

export interface SellerCenterSyncResponse {
  success: boolean;
  data?: CoworkExtractionResult;
  error?: string;
  message?: string;
}

/**
 * Llamar al backend para extraer datos del Seller Center (V2 - con Cowork)
 * 
 * @param brandId - Brand ID
 * @param userId - User ID (debe coincidir con usuario autenticado)
 * @param liveDate - ISO date string (optional)
 * @returns Promise<SellerCenterData> - Retorna solo datos actuales para backward compatibility
 */
export async function syncSellerCenterData(
  brandId: string,
  userId: string,
  liveDate?: string
): Promise<SellerCenterData> {
  try {
    const response = await fetch("/api/seller-center-sync-v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        brandId,
        userId,
        liveDate: liveDate || new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result: SellerCenterSyncResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Unknown error");
    }

    if (!result.data) {
      throw new Error("No data returned from API");
    }

    // La nueva respuesta es CoworkExtractionResult, retornar solo datos actuales
    const currentData = (result.data as any).current || result.data;
    return currentData as SellerCenterData;
  } catch (error: any) {
    console.error("[syncSellerCenterData] Error:", {
      message: error?.message,
      details: error,
    });
    throw error;
  }
}

/**
 * Mapear datos del Seller Center a state del simulador
 */
export function mapSellerDataToSimulatorState(data: SellerCenterData) {
  return {
    ventaActual: data.gmv,
    gastoAdsActual: data.gastoAdsActual,
    pedidosActuales: data.pedidosActuales,
  };
}
