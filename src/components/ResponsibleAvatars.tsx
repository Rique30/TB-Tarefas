export function ResponsibleAvatars({
  people,
  size = "sm",
}: {
  people: { id: string; name: string; color: string }[];
  size?: "sm" | "md";
}) {
  if (people.length === 0) return null;
  const dimension = size === "sm" ? "size-5 text-[9px]" : "size-6 text-[10px]";

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-1.5">
        {people.map((p) => (
          <span
            key={p.id}
            title={p.name}
            className={`flex ${dimension} items-center justify-center rounded-full font-semibold text-white shrink-0 ring-2 ring-surface`}
            style={{ backgroundColor: p.color }}
          >
            {p.name.slice(0, 2).toUpperCase()}
          </span>
        ))}
      </div>
      <span className="text-xs text-muted truncate">{people.map((p) => p.name).join(", ")}</span>
    </div>
  );
}
