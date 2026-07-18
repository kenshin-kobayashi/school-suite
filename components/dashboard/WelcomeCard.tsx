"use client";

import { useEffect, useState } from "react";

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 5) {
    return "お疲れさまです。";
  }

  if (hour < 11) {
    return "おはようございます。";
  }

  if (hour < 18) {
    return "こんにちは。";
  }

  return "こんばんは。";
};

export default function WelcomeCard() {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-medium text-zinc-500">
        Welcome to School Suite
      </p>

      <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
        {greeting || "こんにちは。"}
      </h2>

      <p className="mt-4 text-sm leading-7 text-zinc-600">
        今日も生徒一人ひとりに寄り添い、
        学習をサポートしていきましょう。
      </p>
    </div>
  );
}