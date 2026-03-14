import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/supabase/server";
import { RequestToAdminForm } from "@/components/RequestToAdminForm";

export default async function RequestToAdminPage() {
  const user = await getOptionalUser();
  if (!user) redirect("/login");

  return <RequestToAdminForm />;
}
