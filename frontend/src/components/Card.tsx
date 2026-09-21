import clsx from "clsx";
import type { ReactNode } from "react";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/3 md:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

type StatCardTone = "brand" | "success" | "warning" | "error";

const iconToneClasses: Record<StatCardTone, string> = {
  brand: "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400",
  success: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
  warning: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500",
  error: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: StatCardTone;
}) {
  return (
    <Card className="transition-shadow hover:shadow-theme-sm">
      {icon && (
        <div className={clsx("mb-3 flex h-11 w-11 items-center justify-center rounded-xl", iconToneClasses[tone])}>
          <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
        </div>
      )}
      <p className="truncate text-theme-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 truncate text-title-sm font-semibold text-gray-800 dark:text-white/90">{value}</p>
      {hint && <p className="mt-1 truncate text-theme-xs text-gray-400 dark:text-gray-500">{hint}</p>}
    </Card>
  );
}
