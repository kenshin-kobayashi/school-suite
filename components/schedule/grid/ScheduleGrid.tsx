import ScheduleCell from "./ScheduleCell";

import type { Lesson } from "@/types/lesson";

import type {
  ScheduleColumn,
  SchedulePeriod,
} from "@/types/schedule";

import {
  createScheduleCellKey,
  type ScheduleCellPosition,
} from "@/types/schedule-cell";

type ScheduleGridProps = {
  columns: ScheduleColumn[];
  periods: SchedulePeriod[];

  lessonsByCell: Record<
    string,
    Lesson[]
  >;

  onCellClick?: (
    position: ScheduleCellPosition,
  ) => void;

  onLessonClick?: (
    position: ScheduleCellPosition,
    lesson: Lesson,
  ) => void;
};

export default function ScheduleGrid({
  columns,
  periods,
  lessonsByCell,
  onCellClick,
  onLessonClick,
}: ScheduleGridProps) {
  const gridTemplateColumns =
    `72px repeat(${columns.length}, 320px)`;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="max-h-[calc(100vh-210px)] overflow-auto">
        <div className="min-w-max">
          <div
            className="grid"
            style={{
              gridTemplateColumns,
            }}
          >
            <div className="sticky left-0 top-0 z-40 flex min-h-12 items-center justify-center border-b border-r border-zinc-200 bg-zinc-50">
              <span className="text-[10px] font-semibold text-zinc-500">
                時間
              </span>
            </div>

            {columns.map(
              (column) => (
                <div
                  key={column.id}
                  className={`sticky top-0 z-30 flex min-h-12 flex-col items-center justify-center border-b border-r border-zinc-200 px-2 py-1.5 text-center ${
                    column.isHoliday
                      ? "bg-zinc-100"
                      : "bg-zinc-50"
                  }`}
                >
                  <p
                    className={`whitespace-nowrap text-xs font-semibold ${
                      column.isHoliday
                        ? "text-zinc-500"
                        : "text-zinc-900"
                    }`}
                  >
                    {column.label}
                  </p>

                  {column.subLabel ? (
                    <p className="mt-0.5 whitespace-nowrap text-[10px] font-medium text-zinc-500">
                      {
                        column.subLabel
                      }
                    </p>
                  ) : null}

                  {column.isHoliday ? (
                    <span className="mt-1 inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[8px] font-semibold text-zinc-500">
                      休塾日
                    </span>
                  ) : null}
                </div>
              ),
            )}

            {periods.map(
              (period) => (
                <div
                  key={period.id}
                  className="contents"
                >
                  <div className="sticky left-0 z-20 flex min-h-24 flex-col items-center justify-center self-stretch border-b border-r border-zinc-200 bg-white px-1 text-center">
                    <p className="whitespace-nowrap text-[11px] font-semibold text-zinc-900">
                      {period.label}
                    </p>

                    <p className="mt-0.5 whitespace-nowrap text-[8px] font-medium text-zinc-500">
                      {period.time}
                    </p>
                  </div>

                  {columns.map(
                    (column) => {
                      const position: ScheduleCellPosition =
                        {
                          columnId:
                            column.id,

                          periodId:
                            period.id,
                        };

                      const cellKey =
                        createScheduleCellKey(
                          position,
                        );

                      return (
                        <ScheduleCell
                          key={cellKey}
                          position={
                            position
                          }
                          lessons={
                            lessonsByCell[
                              cellKey
                            ] ?? []
                          }
                          isDisabled={
                            column.isHoliday ??
                            false
                          }
                          disabledLabel="休塾日"
                          onCellClick={
                            onCellClick
                          }
                          onLessonClick={
                            onLessonClick
                          }
                        />
                      );
                    },
                  )}
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}