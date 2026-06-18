import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { Card } from "@/components/ui";
import { LoginForm } from "@/components/auth/AuthForms";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user?.isPlatformAdmin) redirect("/operator");
  if (user?.tenantId) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <h1 className="text-xl font-semibold tracking-tight text-navy mb-1">Ace Mobility</h1>
      <p className="text-sm text-muted mb-6">Sign in to your workspace.</p>
      <Card>
        <LoginForm />
      </Card>
    </main>
  );
}
