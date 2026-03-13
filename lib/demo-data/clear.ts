import { createAdminClient } from "@/lib/supabase/admin";
import { DEMO_EMAIL_DOMAIN, DEMO_COMPANY_SLUG } from "@/lib/demo";

export async function clearDemoData() {
  const admin = createAdminClient();

  // 1. Delete all demo auth users (cascades to profiles and linked rows)
  const { data: usersResponse } = await admin.auth.admin.listUsers({
    perPage: 100,
  });

  const demoUsers = (usersResponse?.users ?? []).filter((u) =>
    u.email?.endsWith(DEMO_EMAIL_DOMAIN)
  );

  for (const user of demoUsers) {
    await admin.auth.admin.deleteUser(user.id);
  }

  // 2. Delete the demo company (cascades to services, rewards, etc.)
  await admin
    .from("businesses")
    .delete()
    .eq("slug", DEMO_COMPANY_SLUG);

  console.log(
    `Cleared ${demoUsers.length} demo users and demo company "${DEMO_COMPANY_SLUG}".`
  );
}
