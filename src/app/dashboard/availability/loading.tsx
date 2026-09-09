export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-56 rounded bg-line/60" />
      <div className="mt-2 h-4 w-72 rounded bg-line/40" />
      <div className="mt-4 h-8 w-48 rounded-full bg-line/40" />
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl border border-line bg-white" />
        ))}
      </div>
    </div>
  );
}
