type Status =
  | "在籍"
  | "休塾"
  | "退塾"
  | "休職"
  | "退職";

type Props = {
  status: Status;
};

const statusStyles: Record<Status, string> = {
  在籍:
    "border border-emerald-200 bg-emerald-50 text-emerald-700",

  休塾:
    "border border-amber-200 bg-amber-50 text-amber-700",

  退塾:
    "border border-red-200 bg-red-50 text-red-700",

  休職:
    "border border-amber-200 bg-amber-50 text-amber-700",

  退職:
    "border border-slate-200 bg-slate-100 text-slate-600",
};

export default function StatusBadge({ status }: Props) {
  return (
    <span
      className={[
        "inline-flex items-center",
        "whitespace-nowrap rounded-full",
        "px-3 py-1",
        "text-xs font-semibold tracking-wide",
        statusStyles[status],
      ].join(" ")}
    >
      {status}
    </span>
  );
}