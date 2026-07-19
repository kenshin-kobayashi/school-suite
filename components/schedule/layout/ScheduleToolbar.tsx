"use client";

type Props = {
  onAddLesson?: () => void;
  onCreateOrRebuildWithAI?: () => void;
  onOpenSettings?: () => void;
};

export default function ScheduleToolbar({
  onAddLesson,
  onCreateOrRebuildWithAI,
  onOpenSettings,
}: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
      <div>
        <p className="text-sm font-semibold text-zinc-900">
          スケジュール操作
        </p>

        <p className="mt-1 text-xs text-zinc-500">
          授業の追加、時間割の自動作成、スケジュール設定を行います。
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onAddLesson}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-700"
        >
          ＋ 授業追加
        </button>

        <button
          type="button"
          onClick={onCreateOrRebuildWithAI}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          AIで作成・組み直し
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
        >
          設定
        </button>
      </div>
    </div>
  );
}