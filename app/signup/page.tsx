import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { Card } from "@/components/ui";
import { SignupForm } from "@/components/auth/AuthForms";

export default async function SignupPage() {
  const user = await getSessionUser();
  if (user?.tenantId) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <h1 className="text-xl font-semibold tracking-tight text-navy mb-1">Create your workspace</h1>
      <p className="text-sm text-muted mb-6">
        It is free to sign up and to record and track your own trades.
      </p>
      <Card>
        <SignupForm />
      </Card>
    </main>
  );
}
