"use client";

type ScheduleMode =
  | "regular"
  | "course";

type Props = {
  scheduleMode: ScheduleMode;

  isGenerating?: boolean;

  onAddLesson?: () => void;

  onCreateOrRebuildWithAI?: () =>
    void | Promise<void>;

  onOpenStudentSchedule?: () => void;

  onOpenTeacherSchedule?: () => void;
};

export default function ScheduleToolbar({
  scheduleMode,
  isGenerating = false,
  onAddLesson,
  onCreateOrRebuildWithAI,
  onOpenStudentSchedule,
  onOpenTeacherSchedule,
}: Props) {
  const isCourseMode =
    scheduleMode === "course";

  const commonDisabledClassName =
    "disabled:cursor-not-allowed disabled:opacity-50";

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
          disabled={
            isGenerating ||
            !onAddLesson
          }
          onClick={
            onAddLesson
          }
          className={[
            "inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-700",
            commonDisabledClassName,
          ].join(" ")}
        >
          ＋ 授業追加
        </button>

        {isCourseMode ? (
          <>
            <button
              type="button"
              disabled={
                isGenerating ||
                !onOpenStudentSchedule
              }
              onClick={
                onOpenStudentSchedule
              }
              className={[
                "inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50",
                commonDisabledClassName,
              ].join(" ")}
            >
              生徒日程
            </button>

            <button
              type="button"
              disabled={
                isGenerating ||
                !onOpenTeacherSchedule
              }
              onClick={
                onOpenTeacherSchedule
              }
              className={[
                "inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50",
                commonDisabledClassName,
              ].join(" ")}
            >
              講師日程
            </button>

            <button
              type="button"
              disabled={
                isGenerating ||
                !onCreateOrRebuildWithAI
              }
              onClick={() => {
                void onCreateOrRebuildWithAI?.();
              }}
              className={[
                "inline-flex h-10 min-w-[170px] items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100",
                commonDisabledClassName,
              ].join(" ")}
            >
              {isGenerating ? (
                <>
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-700"
                  />

                  <span>
                    AI時間割を作成中...
                  </span>
                </>
              ) : (
                "AIで作成・組み直し"
              )}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}