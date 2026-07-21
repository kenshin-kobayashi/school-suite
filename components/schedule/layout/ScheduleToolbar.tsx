"use client";

type ScheduleMode =
  | "regular"
  | "course";

type Props = {
  scheduleMode: ScheduleMode;

  onAddLesson?: () => void;

  onCreateOrRebuildWithAI?: () => void;

  onOpenStudentSchedule?: () => void;

  onOpenTeacherSchedule?: () => void;
};

export default function ScheduleToolbar({
  scheduleMode,
  onAddLesson,
  onCreateOrRebuildWithAI,
  onOpenStudentSchedule,
  onOpenTeacherSchedule,
}: Props) {
  const isCourseMode =
    scheduleMode === "course";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
      <div>
        <p className="text-sm font-semibold text-zinc-900">
          スケジュール操作
        </p>

        <p className="mt-1 text-xs text-zinc-500">
          {isCourseMode
            ? "授業の追加、生徒・講師の日程登録、AI時間割作成を行います。"
            : "毎週繰り返す通常授業の追加・管理を行います。"}
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

        {isCourseMode ? (
          <>
            <button
              type="button"
              onClick={
                onOpenStudentSchedule
              }
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              生徒日程
            </button>

            <button
              type="button"
              onClick={
                onOpenTeacherSchedule
              }
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              講師日程
            </button>

            <button
              type="button"
              onClick={
                onCreateOrRebuildWithAI
              }
              className="inline-flex h-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              AIで作成・組み直し
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}