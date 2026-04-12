import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Verify user is admin
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminCheck } = await admin
      .from("user_brands")
      .select("is_admin")
      .eq("user_id", user.id)
      .eq("is_admin", true)
      .single();

    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get stats
    const { data: allUsers } = await admin.auth.admin.listUsers();
    const totalUsers = allUsers?.users.length || 0;

    const { data: brands } = await admin.from("brands").select("id");
    const totalBrands = brands?.length || 0;

    const { data: userBrands } = await admin
      .from("user_brands")
      .select("user_id, brand_id");

    const usersWithBrands = new Set(userBrands?.map((ub) => ub.user_id) || []);
    const usersWithoutBrands = totalUsers - usersWithBrands.size;

    // Users by brand
    const brandCounts: Record<string, { name: string; count: number }> = {};
    if (brands) {
      for (const brand of brands) {
        brandCounts[brand.id] = { name: brand.id, count: 0 };
      }
    }

    userBrands?.forEach((ub) => {
      if (brandCounts[ub.brand_id]) {
        brandCounts[ub.brand_id].count++;
      }
    });

    // Get brand names
    const { data: brandDetails } = await admin
      .from("brands")
      .select("id, name");

    const usersByBrand = Object.entries(brandCounts).map(([brandId, data]) => ({
      brand_id: brandId,
      brand_name: brandDetails?.find((b) => b.id === brandId)?.name || brandId,
      count: data.count,
    }));

    return NextResponse.json({
      total_users: totalUsers,
      total_brands: totalBrands,
      users_without_brands: usersWithoutBrands,
      users_by_brand: usersByBrand,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
