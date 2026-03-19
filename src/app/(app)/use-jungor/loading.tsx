export default function UseJungorLoading() {
  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden animate-pulse">
      <div className="border-b border-border px-4 sm:px-6 py-3 sm:py-4">
        <div className="h-6 w-40 rounded-lg bg-muted" />
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-4/5 rounded bg-muted" />
      </div>
    </div>
  );
}
