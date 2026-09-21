import type { ReactNode } from "react";
import { FolderIcon } from "../icons";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-white/3">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500">
        <span className="[&>svg]:h-6 [&>svg]:w-6">{icon ?? <FolderIcon />}</span>
      </div>
      <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{title}</p>
      {description && <p className="mt-1 max-w-xs text-theme-sm text-gray-500 dark:text-gray-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
