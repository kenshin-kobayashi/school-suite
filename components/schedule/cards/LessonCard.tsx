"use client";

import { MoreVertical } from "lucide-react";

import type { Lesson } from "@/types/lesson";

type LessonCardProps = {
  lesson: Lesson;
  onMenuClick?: (lesson: Lesson) => void;
};

export default function LessonCard({
  lesson,
  onMenuClick,
}: LessonCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <header className="flex min-h-10 items-center justify-between border-b border-zinc-100 px-3 py-2">
        <p className="truncate text-sm font-semibold text-zinc-900">
          {lesson.teacherName}
        </p>

        <button
          type="button"
          aria-label={`${lesson.teacherName}の授業メニューを開く`}
          onClick={() => onMenuClick?.(lesson)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
        >
          <MoreVertical size={17} />
        </button>
      </header>

      <div className="space-y-2 px-3 py-3">
        {lesson.students.map((student) => (
          <div
            key={student.studentId}
            className="flex min-w-0 items-center justify-between gap-2"
          >
            <span className="truncate text-sm text-zinc-700">
              {student.studentName}
            </span>

            <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
              {student.subject}
            </span>
          </div>
        ))}

        {lesson.students.length === 0 && (
          <p className="text-sm text-zinc-400">生徒未登録</p>
        )}
      </div>
    </article>
  );
}