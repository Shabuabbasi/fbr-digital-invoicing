import { forwardRef, type InputHTMLAttributes } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, id, ...rest },
  ref,
) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
          {label}
          {rest.required && <span className="text-error-500">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={clsx(
          "h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500 dark:focus:border-brand-800",
          error ? "border-error-300 dark:border-error-500" : "border-gray-300",
          className,
        )}
        {...rest}
      />
      {error && <span className="mt-1 block text-xs text-error-600 dark:text-error-400">{error}</span>}
    </div>
  );
});
