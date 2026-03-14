import { getOptionalUser } from "@/lib/supabase/server";
import { AppLayout } from "@/components/AppLayout";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOptionalUser();
  return <AppLayout user={user}>{children}</AppLayout>;
}
