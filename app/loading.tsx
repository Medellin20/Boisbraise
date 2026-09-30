export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sand-100">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-ink-200 border-t-ink-700" />
        <p className="text-sm text-ink-400">Chargement...</p>
      </div>
    </div>
  );
}
