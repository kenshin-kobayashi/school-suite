type Props = {
  text?: string;
};

export default function Loading({
  text = "読み込み中...",
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white py-16 shadow-sm">
      <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-800" />

      <p className="text-sm font-medium text-zinc-600">
        {text}
      </p>
    </div>
  );
}