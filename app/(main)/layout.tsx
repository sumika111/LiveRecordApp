import { getOptionalUser } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { AppLayout } from "@/components/AppLayout";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOptionalUser();
  const admin = user ? await isAdmin(user) : false;
  return <AppLayout user={user} isAdmin={admin}>{children}</AppLayout>;
}
