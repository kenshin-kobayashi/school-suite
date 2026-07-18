import ScheduleCell from "./ScheduleCell";

import type { Lesson } from "@/types/lesson";

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
};

export default function ScheduleGrid({
  columns,
  periods,
  lessonsByCell,
}: ScheduleGridProps) {
  const gridTemplateColumns = `88px repeat(${columns.length}, minmax(210px, 1fr))`;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <div className="min-w-max">
          <div
            className="grid"
            style={{ gridTemplateColumns }}
          >
            <div className="sticky left-0 z-20 border-b border-r border-zinc-200 bg-zinc-50" />

            {columns.map((column) => (
              <div
                key={column.id}
                className="border-b border-r border-zinc-200 bg-zinc-50 px-4 py-3 text-center"
              >
                <p className="text-sm font-semibold text-zinc-800">
                  {column.label}
                </p>

                {column.subLabel && (
                  <p className="mt-1 text-xs text-zinc-400">
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
                <div className="sticky left-0 z-10 flex min-h-40 flex-col items-center justify-center border-b border-r border-zinc-200 bg-white px-2 text-center">
                  <p className="text-sm font-semibold text-zinc-800">
                    {period.label}
                  </p>

                  <p className="mt-1 whitespace-nowrap text-[11px] text-zinc-400">
                    {period.time}
                  </p>
                </div>

                {columns.map((column) => {
                  const cellKey = `${column.id}-${period.id}`;

                  return (
                    <ScheduleCell
                      key={cellKey}
                      lessons={lessonsByCell[cellKey] ?? []}
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