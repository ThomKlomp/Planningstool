export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl border border-line bg-white" />
        ))}
      </div>
      <div className="mt-10 h-6 w-48 rounded bg-line/60" />
      <div className="mt-3 h-64 rounded-xl border border-line bg-white" />
    </div>
  );
}
