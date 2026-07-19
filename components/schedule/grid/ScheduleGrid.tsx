import ScheduleCell from "./ScheduleCell";

import type { Lesson } from "@/types/lesson";
import {
  createScheduleCellKey,
  type ScheduleCellPosition,
} from "@/types/schedule-cell";

export type ScheduleColumn = {
  id: string;
  label: string;
  subLabel?: string;
};

export type SchedulePeriod = {
  id: string;
  label: string;
  time: string;
};

type ScheduleGridProps = {
  columns: ScheduleColumn[];
  periods: SchedulePeriod[];
  lessonsByCell: Record<string, Lesson[]>;
  onCellClick?: (
    position: ScheduleCellPosition,
  ) => void;
};

export default function ScheduleGrid({
  columns,
  periods,
  lessonsByCell,
  onCellClick,
}: ScheduleGridProps) {
  const gridTemplateColumns = `96px repeat(${columns.length}, minmax(220px, 1fr))`;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="max-h-[calc(100vh-230px)] overflow-auto">
        <div className="min-w-max">
          <div
            className="grid"
            style={{ gridTemplateColumns }}
          >
            <div className="sticky left-0 top-0 z-40 flex min-h-16 items-center justify-center border-b border-r border-zinc-200 bg-zinc-50">
              <span className="text-xs font-semibold text-zinc-400">
                時間
              </span>
            </div>

            {columns.map((column) => (
              <div
                key={column.id}
                className="sticky top-0 z-30 flex min-h-16 flex-col items-center justify-center border-b border-r border-zinc-200 bg-zinc-50 px-4 py-3 text-center"
              >
                <p className="text-sm font-semibold text-zinc-800">
                  {column.label}
                </p>

                {column.subLabel && (
                  <p className="mt-1 text-xs font-medium text-zinc-400">
                    {column.subLabel}
                  </p>
                )}
              </div>
            ))}

            {periods.map((period) => (
              <div
                key={period.id}
                className="contents"
              >
                <div className="sticky left-0 z-20 flex min-h-44 flex-col items-center justify-center border-b border-r border-zinc-200 bg-white px-2 text-center">
                  <p className="text-sm font-semibold text-zinc-800">
                    {period.label}
                  </p>

                  <p className="mt-1.5 whitespace-nowrap text-[11px] font-medium text-zinc-400">
                    {period.time}
                  </p>
                </div>

                {columns.map((column) => {
                  const position: ScheduleCellPosition = {
                    columnId: column.id,
                    periodId: period.id,
                  };

                  const cellKey =
                    createScheduleCellKey(position);

                  return (
                    <ScheduleCell
                      key={cellKey}
                      position={position}
                      lessons={
                        lessonsByCell[cellKey] ?? []
                      }
                      onClick={onCellClick}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}