/** Shown instantly while an admin page loads its data. */
export default function AdminLoading() {
  return (
    <div className="animate-pulse" aria-busy aria-label="Ачаалж байна">
      <div className="mb-8 h-9 w-48 rounded-xl bg-soft" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-soft" />
        ))}
      </div>
      <div className="mt-3 h-72 rounded-2xl bg-soft" />
    </div>
  );
}
