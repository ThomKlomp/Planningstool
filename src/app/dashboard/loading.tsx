export default function Loading() {
  return (
    <div className="max-w-3xl animate-pulse">
      <div className="h-8 w-40 rounded bg-line/60" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="h-20 rounded-xl border border-line bg-white" />
        <div className="h-20 rounded-xl border border-line bg-white" />
      </div>
      <div className="mt-10 h-6 w-24 rounded bg-line/60" />
      <div className="mt-3 h-40 rounded-xl border border-line bg-white" />
    </div>
  );
}
