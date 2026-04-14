import type { NextApiRequest, NextApiResponse } from "next";
import { createServerSupabase } from "@/lib/supabase/server";

const supabase = createServerSupabase();

interface HistoryResponse {
  success: boolean;
  sessions: any[];
  stats: {
    totalGmv: number;
    totalAdSpend: number;
    totalOrders: number;
    avgRoi: number;
    avgMargin: number;
    daysCount: number;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HistoryResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      sessions: [],
      stats: { totalGmv: 0, totalAdSpend: 0, totalOrders: 0, avgRoi: 0, avgMargin: 0, daysCount: 0 },
      error: "Method not allowed",
    });
  }

  try {
    const { brandId, userId, days = "60" } = req.query;
    const daysNum = parseInt(days as string) || 60;

    if (!brandId || !userId) {
      return res.status(400).json({
        success: false,
        sessions: [],
        stats: { totalGmv: 0, totalAdSpend: 0, totalOrders: 0, avgRoi: 0, avgMargin: 0, daysCount: 0 },
        error: "Missing brandId or userId",
      });
    }

    // Verify auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      return res.status(401).json({
        success: false,
        sessions: [],
        stats: { totalGmv: 0, totalAdSpend: 0, totalOrders: 0, avgRoi: 0, avgMargin: 0, daysCount: 0 },
        error: "Unauthorized",
      });
    }

    // Obtener últimas N sesiones
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const { data: sessions, error: dbError } = await supabase
      .from("live_sessions")
      .select("*")
      .eq("brand_id", brandId)
      .eq("user_id", userId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    if (dbError) {
      console.error("[History] DB error:", dbError);
      // Retornar datos vacíos si tabla no existe (es ok en desarrollo)
      return res.status(200).json({
        success: true,
        sessions: [],
        stats: {
          totalGmv: 0,
          totalAdSpend: 0,
          totalOrders: 0,
          avgRoi: 0,
          avgMargin: 0,
          daysCount: 0,
        },
      });
    }

    // Calcular estadísticas
    const stats = sessions?.reduce(
      (acc, session) => ({
        totalGmv: acc.totalGmv + (session.gmv || 0),
        totalAdSpend: acc.totalAdSpend + (session.gasto_ads || 0),
        totalOrders: acc.totalOrders + (session.pedidos || 0),
        roiSum: acc.roiSum + (session.roi || 0),
        marginSum: acc.marginSum + (session.margen || 0),
        count: acc.count + 1,
      }),
      {
        totalGmv: 0,
        totalAdSpend: 0,
        totalOrders: 0,
        roiSum: 0,
        marginSum: 0,
        count: 0,
      }
    ) || { totalGmv: 0, totalAdSpend: 0, totalOrders: 0, roiSum: 0, marginSum: 0, count: 0 };

    return res.status(200).json({
      success: true,
      sessions: sessions || [],
      stats: {
        totalGmv: stats.totalGmv,
        totalAdSpend: stats.totalAdSpend,
        totalOrders: stats.totalOrders,
        avgRoi: stats.count > 0 ? Math.round((stats.roiSum / stats.count) * 100) / 100 : 0,
        avgMargin: stats.count > 0 ? Math.round((stats.marginSum / stats.count) * 10000) / 10000 : 0,
        daysCount: stats.count,
      },
    });
  } catch (error: any) {
    console.error("[History] Error:", error?.message);
    return res.status(500).json({
      success: false,
      sessions: [],
      stats: { totalGmv: 0, totalAdSpend: 0, totalOrders: 0, avgRoi: 0, avgMargin: 0, daysCount: 0 },
      error: error?.message,
    });
  }
}
