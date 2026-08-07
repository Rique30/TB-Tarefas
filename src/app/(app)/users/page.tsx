import Link from "next/link";
import { requireInternal } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewUserButton } from "@/components/UserFormModal";
import { UserActiveToggle } from "@/components/UserActiveToggle";
import { AccessGrants } from "@/components/AccessGrants";

export default async function UsersPage() {
  await requireInternal();

  const [users, aircraftList] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      include: {
        aircraftAccess: { include: { aircraft: true } },
        responsibleForAircraft: { where: { active: true }, orderBy: { registration: "asc" } },
      },
    }),
    prisma.aircraft.findMany({ where: { active: true }, orderBy: { registration: "asc" } }),
  ]);

  const internal = users.filter((u) => u.role === "INTERNAL");
  const clients = users.filter((u) => u.role === "CLIENT");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Equipe & acessos</h1>
          <p className="text-sm text-muted mt-0.5">Gerencie usuários internos e o acesso de clientes às aeronaves.</p>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-foreground mb-2">Clientes / proprietários</h2>
        <div className="flex flex-col gap-3">
          {clients.map((u) => (
            <div key={u.id} className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{u.name}</p>
                  <p className="text-xs text-muted">{u.email}</p>
                </div>
                <UserActiveToggle userId={u.id} active={u.active} />
              </div>
              <AccessGrants
                userId={u.id}
                aircraftOptions={aircraftList.map((a) => ({ id: a.id, registration: a.registration, model: a.model }))}
                grants={u.aircraftAccess.map((g) => ({
                  id: g.id,
                  aircraftId: g.aircraftId,
                  canEdit: g.canEdit,
                  aircraft: { registration: g.aircraft.registration, model: g.aircraft.model },
                }))}
              />
            </div>
          ))}
          {clients.length === 0 && (
            <p className="text-sm text-muted bg-surface border border-border rounded-xl px-4 py-6 text-center">
              Nenhum cliente cadastrado ainda.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
