import LessonCard from "../cards/LessonCard";

import type { Lesson } from "@/types/lesson";

type ScheduleCellProps = {
  lessons: Lesson[];
};

export default function ScheduleCell({
  lessons,
}: ScheduleCellProps) {
  return (
    <div className="min-h-40 border-b border-r border-zinc-200 bg-zinc-50/40 p-2">
      {lessons.length > 0 ? (
        <div className="space-y-2">
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-36 items-center justify-center">
          <span className="text-xs text-zinc-300">
            授業なし
          </span>
        </div>
      )}
    </div>
  );
}