import LessonCard from "../cards/LessonCard";

import type { Lesson } from "@/types/lesson";
import {
  createScheduleCellKey,
  type ScheduleCellPosition,
} from "@/types/schedule-cell";

type ScheduleCellProps = {
  position: ScheduleCellPosition;
  lessons: Lesson[];
  onClick?: (
    position: ScheduleCellPosition,
  ) => void;
};

export default function ScheduleCell({
  position,
  lessons,
  onClick,
}: ScheduleCellProps) {
  const cellKey =
    createScheduleCellKey(position);

  return (
    <button
      type="button"
      onClick={() => onClick?.(position)}
      data-cell-key={cellKey}
      className="min-h-44 w-full border-b border-r border-zinc-200 bg-zinc-50/40 p-2.5 text-left transition-colors hover:bg-sky-50"
    >
      {lessons.length > 0 ? (
        <div className="space-y-2.5">
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-39 items-center justify-center">
          <span className="text-xs font-medium text-zinc-300">
            授業なし
          </span>
        </div>
      )}
    </button>
  );
}