import Link from "next/link";
import { requireInternal } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewUserButton, EditUserNameButton } from "@/components/UserFormModal";
import { UserActiveToggle } from "@/components/UserActiveToggle";
import { DeleteUserButton } from "@/components/DeleteUserButton";

export default async function UsersPage() {
  const session = await requireInternal();

  const internal = await prisma.user.findMany({
    where: { role: "INTERNAL" },
    orderBy: { name: "asc" },
    include: {
      responsibleForAircraft: { where: { active: true }, orderBy: { registration: "asc" } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Equipe</h1>
          <p className="text-sm text-muted mt-0.5">Gerencie os usuários internos.</p>
        </div>
        <NewUserButton />
      </div>

      <section>
        <h2 className="text-sm font-semibold text-foreground mb-2">Equipe interna</h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-2.5 font-medium">Nome</th>
                <th className="px-4 py-2.5 font-medium">E-mail</th>
                <th className="px-4 py-2.5 font-medium">Cuida de</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {internal.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex size-6 items-center justify-center rounded-full text-[10px] font-semibold text-white shrink-0"
                        style={{ backgroundColor: u.color }}
                      >
                        {u.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="font-medium text-foreground">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted">{u.email}</td>
                  <td className="px-4 py-2.5">
                    {u.responsibleForAircraft.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {u.responsibleForAircraft.map((a) => (
                          <Link
                            key={a.id}
                            href={`/aircraft/${a.id}/tarefas`}
                            className="rounded-md bg-background border border-border px-1.5 py-0.5 text-xs text-foreground hover:border-brand-blue hover:text-brand-blue transition-colors"
                          >
                            {a.registration}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <UserActiveToggle userId={u.id} active={u.active} />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-2.5">
                      <EditUserNameButton userId={u.id} name={u.name} />
                      {u.id !== session.id && <DeleteUserButton userId={u.id} name={u.name} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
