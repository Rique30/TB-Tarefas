import bcrypt from "bcryptjs";
import type { PrismaClient } from "@/generated/prisma/client";

const TEAM_PASSWORD = "tbaviation123";
const CLIENT_PASSWORD = "cliente123";
const ADMIN_PASSWORD = "1234";

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(12, 0, 0, 0);
  return d;
}

/** Populates the database with the TB Aviation team, sample aircraft, tasks, expiry items and maintenance events. */
export async function seedDatabase(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash(TEAM_PASSWORD, 10);

  const team = [
    { name: "Rafa", email: "rafa@tbaviation.com.br", color: "#1f8fe0" },
    { name: "Thomas", email: "thomas@tbaviation.com.br", color: "#14285e" },
    { name: "Rafael", email: "rafael@tbaviation.com.br", color: "#0f766e" },
    { name: "Matheus", email: "matheus@tbaviation.com.br", color: "#b45309" },
    { name: "Caio", email: "caio@tbaviation.com.br", color: "#be185d" },
    { name: "Gabi", email: "gabi@tbaviation.com.br", color: "#0891b2" },
  ];

  const users: Record<string, Awaited<ReturnType<typeof prisma.user.upsert>>> = {};
  for (const member of team) {
    users[member.name] = await prisma.user.upsert({
      where: { email: member.email },
      update: {},
      create: { name: member.name, email: member.email, passwordHash, role: "INTERNAL", color: member.color },
    });
  }

  // ---- Admin: login rápido pelo primeiro nome do e-mail (ex: "ltavares") ----
  const ltavares = await prisma.user.upsert({
    where: { email: "ltavares@tbaviation.com.br" },
    update: {},
    create: {
      name: "Luis Henrique",
      email: "ltavares@tbaviation.com.br",
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "INTERNAL",
      color: "#4d7c0f",
    },
  });
  users["Luis Henrique"] = ltavares;

  // ---- Equipe adicional (acesso interno, senha simples "1234") ----
  const shortPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const extraTeam = [
    { name: "Gabriela Pereira", email: "gpereira@tbaviation.com.br", color: "#db2777" },
    { name: "Caio Chiavelli", email: "cchiavelli@tbaviation.com.br", color: "#7c3aed" },
    { name: "Thomas Antonelli", email: "tantonelli@tbaviation.com.br", color: "#0369a1" },
    { name: "Henrique Cuin", email: "hcuin@tbaviation.com.br", color: "#ca8a04" },
    { name: "Matheus Gonzalez", email: "mgonzalez@tbaviation.com.br", color: "#059669" },
    { name: "Rafael Braz", email: "rbraz@tbaviation.com.br", color: "#9333ea" },
    { name: "Rafael Henrique Leonardi", email: "rleonardi@tbaviation.com.br", color: "#dc2626" },
  ];
  for (const member of extraTeam) {
    users[member.name] = await prisma.user.upsert({
      where: { email: member.email },
      update: {},
      create: { name: member.name, email: member.email, passwordHash: shortPasswordHash, role: "INTERNAL", color: member.color },
    });
  }

  const aircraftData = [
    { registration: "PS-WRA", model: "Falcon 900EX", nickname: "Falcon 1", responsibles: ["Rafa", "Thomas"] },
    { registration: "PP-JMJ", model: "Phenom 300", nickname: null, responsibles: ["Rafael"] },
    { registration: "PR-TBX", model: "Legacy 650", nickname: null, responsibles: ["Matheus", "Caio"] },
  ];

  const aircraft: Record<string, Awaited<ReturnType<typeof prisma.aircraft.upsert>>> = {};
  for (const a of aircraftData) {
    const { responsibles, ...data } = a;
    aircraft[a.registration] = await prisma.aircraft.upsert({
      where: { registration: a.registration },
      update: {},
      create: data,
    });
    await prisma.aircraft.update({
      where: { id: aircraft[a.registration].id },
      data: { responsibles: { set: responsibles.map((name) => ({ id: users[name].id })) } },
    });
  }

  // ---- Cliente de exemplo, com acesso somente-leitura a uma aeronave ----
  const clientHash = await bcrypt.hash(CLIENT_PASSWORD, 10);
  const clientUser = await prisma.user.upsert({
    where: { email: "cliente@exemplo.com" },
    update: {},
    create: {
      name: "Cliente PS-WRA",
      email: "cliente@exemplo.com",
      passwordHash: clientHash,
      role: "CLIENT",
      color: "#8a94a6",
    },
  });
  await prisma.aircraftAccess.upsert({
    where: { userId_aircraftId: { userId: clientUser.id, aircraftId: aircraft["PS-WRA"].id } },
    update: {},
    create: { userId: clientUser.id, aircraftId: aircraft["PS-WRA"].id, canEdit: false },
  });

  // ---- Tarefas ----
  const taskSeed: Array<{
    aircraft: string;
    title: string;
    description: string;
    assignees: string[];
    status: "TODO" | "IN_PROGRESS" | "DONE";
    dueInDays: number;
    checklist: string[];
  }> = [
    {
      aircraft: "PS-WRA",
      title: "Renovar apólice de seguro casco",
      description: "Contatar corretora e enviar documentação atualizada da aeronave.",
      assignees: ["Rafa"],
      status: "IN_PROGRESS",
      dueInDays: 12,
      checklist: ["Solicitar cotação", "Enviar documentos", "Assinar apólice"],
    },
    {
      aircraft: "PS-WRA",
      title: "Agendar inspeção de rotina com o proprietário",
      description: "",
      assignees: ["Thomas"],
      status: "TODO",
      dueInDays: -3,
      checklist: [],
    },
    {
      aircraft: "PS-WRA",
      title: "Atualizar cadastro ANAC",
      description: "Conferir dados cadastrais após troca de tripulação.",
      assignees: ["Luis Henrique"],
      status: "DONE",
      dueInDays: -10,
      checklist: ["Conferir dados", "Protocolar atualização"],
    },
    {
      aircraft: "PP-JMJ",
      title: "Levantar orçamento de manutenção não programada",
      description: "Discrepância reportada pela tripulação — ver detalhes na aba Manutenção.",
      assignees: ["Rafael", "Matheus"],
      status: "IN_PROGRESS",
      dueInDays: 4,
      checklist: ["Diagnóstico", "Orçamento com oficina", "Aprovação do proprietário"],
    },
    {
      aircraft: "PP-JMJ",
      title: "Enviar relatório mensal ao proprietário",
      description: "",
      assignees: ["Matheus"],
      status: "TODO",
      dueInDays: 6,
      checklist: [],
    },
    {
      aircraft: "PR-TBX",
      title: "Revisar checklist de sobrevivência selva/mar",
      description: "Conferir validade dos kits antes da próxima viagem internacional.",
      assignees: ["Caio"],
      status: "TODO",
      dueInDays: -1,
      checklist: ["Conferir kit selva", "Conferir bote salva-vidas"],
    },
    {
      aircraft: "PR-TBX",
      title: "Negociar renovação do contrato de hangaragem",
      description: "",
      assignees: ["Gabi", "Caio", "Rafa"],
      status: "IN_PROGRESS",
      dueInDays: 20,
      checklist: [],
    },
  ];

  for (const t of taskSeed) {
    const task = await prisma.task.create({
      data: {
        aircraftId: aircraft[t.aircraft].id,
        title: t.title,
        description: t.description || null,
        assignees: { connect: t.assignees.map((name) => ({ id: users[name].id })) },
        status: t.status,
        startDate: daysFromNow(t.dueInDays - 7),
        dueDate: daysFromNow(t.dueInDays),
        createdById: ltavares.id,
      },
    });
    for (let i = 0; i < t.checklist.length; i++) {
      await prisma.checklistItem.create({
        data: { taskId: task.id, title: t.checklist[i], order: i, done: t.status === "DONE" },
      });
    }
    if (t.status !== "TODO") {
      await prisma.comment.create({
        data: { taskId: task.id, authorId: users[t.assignees[0]].id, body: "Iniciado — acompanhando andamento." },
      });
    }
  }

  // ---- Vencimentos ----
  const expirySeed: Array<{
    aircraft: string;
    name: string;
    category: "PORTE_OBRIGATORIO" | "EQUIPAMENTO";
    dueInDays: number;
  }> = [
    { aircraft: "PS-WRA", name: "CVA", category: "PORTE_OBRIGATORIO", dueInDays: 45 },
    { aircraft: "PS-WRA", name: "Seguro RETA", category: "PORTE_OBRIGATORIO", dueInDays: 20 },
    { aircraft: "PS-WRA", name: "Seguro Casco", category: "PORTE_OBRIGATORIO", dueInDays: -5 },
    { aircraft: "PS-WRA", name: "Laudo PBN", category: "PORTE_OBRIGATORIO", dueInDays: 90 },
    { aircraft: "PS-WRA", name: "Laudo RVSM", category: "PORTE_OBRIGATORIO", dueInDays: 150 },
    { aircraft: "PS-WRA", name: "Cadastro INFOSAR (ELT)", category: "PORTE_OBRIGATORIO", dueInDays: 200 },
    { aircraft: "PS-WRA", name: "Taxa FISTEL / Fomento", category: "PORTE_OBRIGATORIO", dueInDays: 60 },
    { aircraft: "PS-WRA", name: "Licença de Estação", category: "PORTE_OBRIGATORIO", dueInDays: 300 },
    { aircraft: "PS-WRA", name: "Bote Salva-vidas", category: "EQUIPAMENTO", dueInDays: 25 },
    { aircraft: "PS-WRA", name: "Peso e Balanceamento", category: "EQUIPAMENTO", dueInDays: 400 },
    { aircraft: "PS-WRA", name: "Kit de Primeiros Socorros", category: "EQUIPAMENTO", dueInDays: 15 },
    { aircraft: "PS-WRA", name: "Conjunto de Sobrevivência na Selva", category: "EQUIPAMENTO", dueInDays: -12 },
    { aircraft: "PP-JMJ", name: "CVA", category: "PORTE_OBRIGATORIO", dueInDays: 55 },
    { aircraft: "PP-JMJ", name: "Seguro RETA", category: "PORTE_OBRIGATORIO", dueInDays: 8 },
    { aircraft: "PP-JMJ", name: "Seguro Casco", category: "PORTE_OBRIGATORIO", dueInDays: 120 },
    { aircraft: "PP-JMJ", name: "Bote Salva-vidas", category: "EQUIPAMENTO", dueInDays: 50 },
    { aircraft: "PP-JMJ", name: "Kit de Primeiros Socorros", category: "EQUIPAMENTO", dueInDays: 210 },
    { aircraft: "PR-TBX", name: "CVA", category: "PORTE_OBRIGATORIO", dueInDays: 30 },
    { aircraft: "PR-TBX", name: "Laudo RVSM", category: "PORTE_OBRIGATORIO", dueInDays: -2 },
    { aircraft: "PR-TBX", name: "Conjunto de Sobrevivência na Selva", category: "EQUIPAMENTO", dueInDays: 18 },
    { aircraft: "PR-TBX", name: "Licença de Estação", category: "PORTE_OBRIGATORIO", dueInDays: 260 },
  ];

  for (const e of expirySeed) {
    await prisma.expiryItem.create({
      data: {
        aircraftId: aircraft[e.aircraft].id,
        name: e.name,
        category: e.category,
        dueDate: daysFromNow(e.dueInDays),
        notifyDaysBefore: 30,
      },
    });
  }

  // ---- Manutenção ----
  const psWraMaintenance = await prisma.maintenanceEvent.create({
    data: {
      aircraftId: aircraft["PS-WRA"].id,
      type: "PROGRAMADA",
      title: "Inspeção 12 meses",
      scopeDescription: "Inspeção estrutural, troca de fluidos e verificação de sistemas conforme manual do fabricante.",
      periodStart: daysFromNow(5),
      periodEnd: daysFromNow(20),
      status: "EM_ANDAMENTO",
    },
  });
  const psWraChecklist = [
    "Inspeção estrutural",
    "Troca de óleo e filtros",
    "Verificação de sistema hidráulico",
    "Verificação de aviônicos",
    "Teste de trem de pouso",
    "Inspeção de motores",
    "Verificação de sistema elétrico",
  ];
  for (let i = 0; i < psWraChecklist.length; i++) {
    await prisma.maintenanceChecklistItem.create({
      data: { maintenanceEventId: psWraMaintenance.id, title: psWraChecklist[i], order: i, done: i < 3 },
    });
  }

  await prisma.maintenanceEvent.create({
    data: {
      aircraftId: aircraft["PS-WRA"].id,
      type: "PROGRAMADA",
      title: "Revisão de 100 horas — concluída",
      scopeDescription: "Revisão de rotina conforme programa de manutenção.",
      periodStart: daysFromNow(-60),
      periodEnd: daysFromNow(-55),
      status: "CONCLUIDA",
      completedAt: daysFromNow(-55),
    },
  });

  const ppJmjMaintenance = await prisma.maintenanceEvent.create({
    data: {
      aircraftId: aircraft["PP-JMJ"].id,
      type: "NAO_PROGRAMADA",
      title: "Pane no sistema de pressurização",
      scopeDescription: "Investigação e reparo do sistema de pressurização de cabine.",
      discrepancy: "Tripulação reportou perda gradual de pressurização em voo acima de FL350.",
      status: "PLANEJADA",
    },
  });
  for (const [i, item] of ["Diagnóstico da discrepância", "Orçamento com oficina credenciada", "Reparo e teste em solo"].entries()) {
    await prisma.maintenanceChecklistItem.create({
      data: { maintenanceEventId: ppJmjMaintenance.id, title: item, order: i, done: false },
    });
  }

  await prisma.maintenanceEvent.create({
    data: {
      aircraftId: aircraft["PR-TBX"].id,
      type: "PROGRAMADA",
      title: "Inspeção anual",
      scopeDescription: "Inspeção anual completa conforme programa de manutenção do fabricante.",
      periodStart: daysFromNow(40),
      periodEnd: daysFromNow(55),
      status: "PLANEJADA",
    },
  });

  return {
    users: team.length + extraTeam.length + 2, // + ltavares + cliente
    aircraft: aircraftData.length,
    tasks: taskSeed.length,
    expiryItems: expirySeed.length,
  };
}
