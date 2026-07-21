"use client";

import type {
  KeyboardEvent,
  MouseEvent,
} from "react";

import type {
  Lesson,
  LessonStudent,
} from "@/types/lesson";

import {
  createScheduleCellKey,
  type ScheduleCellPosition,
} from "@/types/schedule-cell";

type ScheduleCellProps = {
  position: ScheduleCellPosition;
  lessons: Lesson[];

  isDisabled?: boolean;
  disabledLabel?: string;

  onCellClick?: (
    position: ScheduleCellPosition,
  ) => void;

  onLessonClick?: (
    position: ScheduleCellPosition,
    lesson: Lesson,
  ) => void;
};

function createLessonKey(
  lesson: Lesson,
  index: number,
): string {
  return (
    lesson.id ??
    `${lesson.teacherId}-${lesson.periodNumber}-${index}`
  );
}

function StudentSubjectDisplay({
  student,
}: {
  student?: LessonStudent;
}) {
  if (!student) {
    return null;
  }

  return (
    <div
      title={`${student.studentName}・${student.subject}`}
      className="flex min-w-0 items-center gap-1"
    >
      <span className="min-w-0 truncate whitespace-nowrap text-[10px] font-medium text-zinc-800">
        {student.studentName}
      </span>

      <span className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold text-zinc-700">
        {student.subject}
      </span>
    </div>
  );
}

export default function ScheduleCell({
  position,
  lessons,
  isDisabled = false,
  disabledLabel = "休塾日",
  onCellClick,
  onLessonClick,
}: ScheduleCellProps) {
  const cellKey =
    createScheduleCellKey(position);

  function handleCellClick() {
    if (isDisabled) {
      return;
    }

    onCellClick?.(position);
  }

  function handleCellKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
  ) {
    if (isDisabled) {
      return;
    }

    if (
      event.target !==
      event.currentTarget
    ) {
      return;
    }

    if (
      event.key !== "Enter" &&
      event.key !== " "
    ) {
      return;
    }

    event.preventDefault();

    onCellClick?.(position);
  }

  function handleLessonClick(
    event: MouseEvent<HTMLButtonElement>,
    lesson: Lesson,
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (isDisabled) {
      return;
    }

    onLessonClick?.(
      position,
      lesson,
    );
  }

  if (isDisabled) {
    return (
      <div
        data-cell-key={cellKey}
        aria-label={disabledLabel}
        aria-disabled="true"
        className="flex min-h-24 w-full cursor-not-allowed items-center justify-center self-stretch overflow-hidden border-b border-r border-zinc-200 bg-zinc-100 p-1 text-left align-top"
      >
        <div className="flex flex-col items-center justify-center">
          <span className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-3 py-1 text-[10px] font-semibold text-zinc-500">
            {disabledLabel}
          </span>

          <span className="mt-1 text-[8px] font-medium text-zinc-400">
            授業登録不可
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      data-cell-key={cellKey}
      aria-label="この時間に授業を登録"
      onClick={handleCellClick}
      onKeyDown={handleCellKeyDown}
      className="min-h-24 w-full self-stretch overflow-hidden border-b border-r border-zinc-200 bg-white p-1 text-left align-top transition-colors hover:bg-sky-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500"
    >
      {lessons.length > 0 ? (
        <div className="w-full space-y-1">
          {lessons.map(
            (lesson, index) => {
              const student1 =
                lesson.students[0];

              const student2 =
                lesson.students[1];

              const additionalStudentCount =
                Math.max(
                  0,
                  lesson.students.length -
                    2,
                );

              const isCancelled =
                lesson.status ===
                "cancelled";

              const classroomName =
                lesson.classroomName?.trim() ??
                "";

              return (
                <button
                  type="button"
                  key={createLessonKey(
                    lesson,
                    index,
                  )}
                  title="クリックして授業を編集"
                  onClick={(event) =>
                    handleLessonClick(
                      event,
                      lesson,
                    )
                  }
                  className={`grid min-h-10 w-full grid-cols-[82px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-1 rounded-md border px-1.5 py-1 text-left transition ${
                    isCancelled
                      ? "border-zinc-200 bg-zinc-100 opacity-60 hover:bg-zinc-200"
                      : "border-zinc-200 bg-white hover:border-sky-300 hover:bg-sky-50"
                  }`}
                >
                  <div className="min-w-0 border-r border-zinc-200 pr-1.5">
                    <span
                      title={
                        lesson.teacherName
                      }
                      className={`block truncate whitespace-nowrap text-[10px] font-bold ${
                        isCancelled
                          ? "text-zinc-500 line-through"
                          : "text-zinc-950"
                      }`}
                    >
                      {
                        lesson.teacherName
                      }
                    </span>

                    {classroomName ? (
                      <span
                        title={
                          classroomName
                        }
                        className={`mt-0.5 block truncate whitespace-nowrap text-[8px] font-semibold ${
                          isCancelled
                            ? "text-zinc-400"
                            : "text-sky-700"
                        }`}
                      >
                        {
                          classroomName
                        }
                      </span>
                    ) : null}
                  </div>

                  <div className="min-w-0">
                    <StudentSubjectDisplay
                      student={student1}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-1">
                      <StudentSubjectDisplay
                        student={student2}
                      />

                      {additionalStudentCount >
                      0 ? (
                        <span
                          title={`ほか${additionalStudentCount}名`}
                          className="shrink-0 whitespace-nowrap rounded bg-zinc-100 px-1 py-0.5 text-[8px] font-semibold text-zinc-500"
                        >
                          +
                          {
                            additionalStudentCount
                          }
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            },
          )}

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();

              onCellClick?.(
                position,
              );
            }}
            className="flex min-h-8 w-full items-center justify-center rounded-md border border-dashed border-transparent text-[9px] font-medium text-zinc-300 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600"
          >
            この時間に授業を追加
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();

            onCellClick?.(
              position,
            );
          }}
          className="flex min-h-[88px] w-full items-center justify-center rounded-md text-[9px] font-medium text-zinc-300 transition hover:bg-sky-50 hover:text-sky-600"
        >
          授業なし
        </button>
      )}
    </div>
  );
}