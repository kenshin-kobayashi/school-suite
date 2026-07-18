"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Clock3,
  History,
} from "lucide-react";

import {
  Activity,
  getRecentActivities,
} from "@/lib/firebase/activities";

const formatActivityTime = (
  activity: Activity
) => {
  if (!activity.createdAt) {
    return "たった今";
  }

  const createdAt =
    activity.createdAt.toDate();

  const now = new Date();

  const difference =
    now.getTime() - createdAt.getTime();

  const minutes = Math.floor(
    difference / (1000 * 60)
  );

  const hours = Math.floor(
    difference / (1000 * 60 * 60)
  );

  const days = Math.floor(
    difference / (1000 * 60 * 60 * 24)
  );

  if (minutes < 1) {
    return "たった今";
  }

  if (minutes < 60) {
    return `${minutes}分前`;
  }

  if (hours < 24) {
    return `${hours}時間前`;
  }

  if (days === 1) {
    return "昨日";
  }

  if (days < 7) {
    return `${days}日前`;
  }

  return createdAt.toLocaleDateString(
    "ja-JP",
    {
      month: "numeric",
      day: "numeric",
    }
  );
};

export default function RecentActivity() {
  const [activities, setActivities] =
    useState<Activity[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getRecentActivities(6);

        setActivities(data);
      } catch (error) {
        console.error(
          "最近の更新の取得に失敗しました。",
          error
        );

        setError(
          "最近の更新を取得できませんでした。"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100">
          <History
            className="h-5 w-5 text-zinc-600"
            strokeWidth={1.8}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
            最近の更新
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            システム内の最新の操作履歴です。
          </p>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="py-8 text-center text-sm text-zinc-500">
            読み込み中...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : activities.length === 0 ? (
          <div className="py-8 text-center text-sm text-zinc-500">
            まだ更新履歴はありません。
          </div>
        ) : (
          <div>
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start justify-between gap-4 border-b border-zinc-100 py-4 first:pt-0 last:border-none last:pb-0"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />

                  <p className="text-sm leading-6 text-zinc-700">
                    {activity.message}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1 text-xs text-zinc-400">
                  <Clock3
                    className="h-3.5 w-3.5"
                    strokeWidth={1.8}
                  />

                  <span>
                    {formatActivityTime(
                      activity
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}