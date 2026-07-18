export default function WelcomeCard() {
  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-medium text-zinc-500">
        {today}
      </p>

      <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
        おはようございます。
      </h2>

      <p className="mt-4 text-sm leading-7 text-zinc-600">
        今日も生徒一人ひとりに寄り添い、
        学習をサポートしていきましょう。
      </p>
    </div>
  );
}