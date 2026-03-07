import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoAccount } from "@/lib/demo";
import { clearDemoData } from "@/lib/demo-data/clear";
import { seedDemoData } from "@/lib/demo-data/seed";

export async function POST() {
  // Verify caller is a demo account
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isDemoAccount(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await clearDemoData();
    await seedDemoData();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Demo reset failed:", err);
    return NextResponse.json(
      { error: "Reset failed" },
      { status: 500 }
    );
  }
}
