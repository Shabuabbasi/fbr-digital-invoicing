import clsx from "clsx";

type BadgeTone = "gray" | "green" | "yellow" | "red" | "blue";

const toneClasses: Record<BadgeTone, string> = {
  gray: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-400",
  green: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500",
  yellow: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-500",
  red: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500",
  blue: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400",
};

export function Badge({ tone = "gray", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-theme-xs font-medium",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
