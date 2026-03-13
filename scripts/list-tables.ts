import { config } from "dotenv";
config({ path: ".env.local" });
import { createAdminClient } from "@/lib/supabase/admin";

async function main() {
  const admin = createAdminClient();

  // List all tables in the public schema
  const { data, error } = await admin.rpc("", {}).maybeSingle();

  // Use a raw SQL approach via a simple query
  const { data: tables, error: err } = await admin
    .from("information_schema.tables" as any)
    .select("table_name")
    .eq("table_schema", "public");

  if (err) {
    // Fallback: try querying known table names to see which exist
    const candidates = ["companies", "businesses", "business", "company"];
    for (const name of candidates) {
      const { data, error } = await admin.from(name).select("id").limit(1);
      if (!error) {
        console.log(`✓ Table "${name}" EXISTS`);
      } else {
        console.log(`✗ Table "${name}" — ${error.message}`);
      }
    }

    // Also check services
    const svcCheck = await admin.from("services").select("id").limit(1);
    console.log(svcCheck.error ? `✗ services — ${svcCheck.error.message}` : "✓ Table \"services\" EXISTS");

    // Check profiles
    const profCheck = await admin.from("profiles").select("id").limit(1);
    console.log(profCheck.error ? `✗ profiles — ${profCheck.error.message}` : "✓ Table \"profiles\" EXISTS");

    return;
  }

  console.log("Tables:", tables);
}

main();
