import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);

    // Create client with service role to verify admin status
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Verify the user making the request is an admin
    const {
      data: { user },
      error: authError,
    } = await admin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin in user_brands table
    const { data: adminCheck } = await admin
      .from("user_brands")
      .select("is_admin")
      .eq("user_id", user.id)
      .eq("is_admin", true)
      .single();

    if (!adminCheck) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Fetch all users with service role
    const { data: allUsers, error: listError } = await admin.auth.admin.listUsers();

    if (listError || !allUsers) {
      return NextResponse.json(
        { error: listError?.message || "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Fetch user-brand mappings
    const { data: userBrands } = await admin
      .from("user_brands")
      .select("user_id, brand_id, is_admin");

    // Combine user data with brand assignments
    const usersWithBrands = allUsers.users.map((user) => ({
      user_id: user.id,
      email: user.email || "sin-email",
      brands: (userBrands || [])
        .filter((ub) => ub.user_id === user.id)
        .map((ub) => ({
          brand_id: ub.brand_id,
          is_admin: ub.is_admin,
        })),
    }));

    return NextResponse.json({ users: usersWithBrands });
  } catch (error) {
    console.error("Admin users API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
