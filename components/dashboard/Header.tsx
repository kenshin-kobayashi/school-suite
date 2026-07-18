"use client";

import { useEffect, useState } from "react";

export default function Header() {
  const [today, setToday] = useState("");

  useEffect(() => {
    const formattedDate = new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    }).format(new Date());

    setToday(formattedDate);
  }, []);

  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          ダッシュボード
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          教室全体の状況を確認できます。
        </p>
      </div>

      <div className="text-left md:text-right">
        <p className="min-h-5 text-sm text-zinc-500">
          {today}
        </p>

        {/* Firebase Authentication実装後に表示 */}
        {/*
        <p className="mt-1 text-sm font-semibold text-zinc-800">
          小林 健心
        </p>
        */}
      </div>
    </header>
  );
}