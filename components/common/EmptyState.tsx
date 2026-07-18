import { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  icon?: ReactNode;
};

export default function EmptyState({
  title,
  description,
  icon,
}: Props) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-sm">
      {icon && (
        <div className="mb-4 flex justify-center text-zinc-400">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-semibold text-zinc-900">
        {title}
      </h3>

      {description && (
        <p className="mt-2 text-sm text-zinc-600">
          {description}
        </p>
      )}
    </div>
  );
}