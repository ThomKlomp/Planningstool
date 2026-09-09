export default function Loading() {
  return (
    <div className="max-w-3xl animate-pulse">
      <div className="h-8 w-24 rounded bg-line/60" />
      <div className="mt-2 h-4 w-64 rounded bg-line/40" />
      <div className="mt-6 h-16 rounded-xl border border-line bg-white" />
      <div className="mt-8 h-56 rounded-xl border border-line bg-white" />
    </div>
  );
}
