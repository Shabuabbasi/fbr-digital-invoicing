export function Pagination({
  page,
  limit,
  total,
  onPageChange,
}: {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between text-theme-sm text-gray-600 dark:text-gray-400">
      <p>
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-white/3 dark:text-gray-300 dark:hover:bg-white/6"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-white/3 dark:text-gray-300 dark:hover:bg-white/6"
        >
          Next
        </button>
      </div>
    </div>
  );
}
