import { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

export default function Select({
  label,
  error,
  className = "",
  children,
  ...props
}: Props) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-zinc-700">
          {label}
        </label>
      )}

      <select
        {...props}
        className={`h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-800 shadow-sm outline-none transition-all focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 ${className}`}
      >
        {children}
      </select>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}