type StatCardProps = {
  title: string;
  value: string | number;
};

export default function StatCard({
  title,
  value,
}: StatCardProps) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      <p className="text-sm font-medium text-zinc-500">
        {title}
      </p>

      <h2 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900">
        {value}
      </h2>
    </div>
  );
}