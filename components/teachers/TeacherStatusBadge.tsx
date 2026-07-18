type Props = {
  status: "在籍" | "休職" | "退職";
};

export default function TeacherStatusBadge({
  status,
}: Props) {
  const styles = {
    在籍:
      "bg-emerald-50 text-emerald-700 border border-emerald-200",

    休職:
      "bg-amber-50 text-amber-700 border border-amber-200",

    退職:
      "bg-red-50 text-red-700 border border-red-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${styles[status]}`}
    >
      {status}
    </span>
  );
}