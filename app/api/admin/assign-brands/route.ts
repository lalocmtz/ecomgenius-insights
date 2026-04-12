import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { user_id, brand_ids } = await request.json();

    if (!user_id || !Array.isArray(brand_ids)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Verify admin
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

    // Delete existing brand assignments for this user
    await admin.from("user_brands").delete().eq("user_id", user_id);

    // Insert new assignments
    if (brand_ids.length > 0) {
      const assignments = brand_ids.map((brand_id) => ({
        user_id,
        brand_id,
        is_admin: false,
      }));

      const { error: insertError } = await admin
        .from("user_brands")
        .insert(assignments);

      if (insertError) {
        console.error("Insert error:", insertError);
        return NextResponse.json({ error: "Failed to assign brands" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Assign brands error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
