import { redirect } from "next/navigation";

export default async function AircraftIndexPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/aircraft/${id}/tarefas`);
}
