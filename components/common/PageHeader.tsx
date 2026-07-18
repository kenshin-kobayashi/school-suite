type Props = {
  title: string;
  description?: string;
};

export default function PageHeader({
  title,
  description,
}: Props) {
  return (
    <div className="mb-8 border-b border-zinc-200 pb-6">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
        {title}
      </h1>

      {description && (
        <p className="mt-2 text-[15px] text-zinc-700">
          {description}
        </p>
      )}
    </div>
  );
}