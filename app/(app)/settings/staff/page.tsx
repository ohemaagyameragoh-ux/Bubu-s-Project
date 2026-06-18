import { Role } from "@prisma/client";
import { requireRole } from "@/lib/session";
import { listStaff } from "@/lib/services/staff";
import { PageHeader, Card } from "@/components/ui";
import { ROLE_OPTIONS } from "@/lib/roles";
import { AddStaffForm } from "@/components/settings/AddStaffForm";
import { removeStaffAction, updateStaffRoleAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const me = await requireRole([Role.ADMIN]);
  const staff = await listStaff();

  return (
    <div>
      <PageHeader
        title="Staff"
        subtitle="Add the people in your business and give each one a role. Roles decide what each person can do."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <h2 className="text-sm font-medium text-navy mb-4">Add a staff member</h2>
          <AddStaffForm />
        </Card>

        <div>
          <h2 className="text-sm font-medium text-navy mb-3">Your team</h2>
          <div className="space-y-3">
            {staff.map((person) => {
              const isMe = person.id === me.id;
              return (
                <Card key={person.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-navy">
                        {person.name}
                        {isMe ? " (you)" : ""}
                      </div>
                      <div className="text-sm text-muted">{person.email}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <form action={updateStaffRoleAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={person.id} />
                      <select
                        name="role"
                        defaultValue={person.role ?? Role.SALES}
                        className="rounded-md border border-line bg-white px-2 py-1 text-sm"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-md border border-line px-2 py-1 text-xs text-navy hover:border-navy/40"
                      >
                        Update role
                      </button>
                    </form>
                    {!isMe ? (
                      <form action={removeStaffAction}>
                        <input type="hidden" name="id" value={person.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-line px-2 py-1 text-xs text-red-700 hover:border-red-300"
                        >
                          Remove
                        </button>
                      </form>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
