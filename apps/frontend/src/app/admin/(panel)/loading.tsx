/** Shown while an admin screen loads (Suspense boundary for every page under the panel). */
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse">
      <div className="mb-7 h-9 w-72 max-w-full rounded-xl bg-ink-700"></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="admin-card h-[132px]"></div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-12">
        <div className="admin-card h-[420px] xl:col-span-8"></div>
        <div className="admin-card h-[420px] xl:col-span-4"></div>
      </div>
    </div>
  );
}
