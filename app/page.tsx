import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

// The root sends people where they belong: the operator console for the super admin, a workspace
// for a signed-in trader, otherwise the login screen.
export default async function Home() {
  const user = await getSessionUser();
  if (user?.isPlatformAdmin) redirect("/operator");
  if (user?.tenantId) redirect("/dashboard");
  redirect("/login");
}
