export function ErrorState({ message = "Something went wrong. Please try again." }: { message?: string }) {
  return (
    <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-8 text-center text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
      {message}
    </div>
  );
}
