"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import SettingSection from "@/components/settings/SettingSection";

import type { LessonPeriod } from "@/types/schedule-settings";

type Props = {
  title?: string;
  description: string;
  periods: LessonPeriod[];
  lessonDurationMinutes: number;
  onChange: (periods: LessonPeriod[]) => void;
};

function createPeriodId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `period-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function timeToMinutes(
  time: string,
): number | null {
  if (!isValidTime(time)) {
    return null;
  }

  const [hours, minutes] = time
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(
  totalMinutes: number,
): string {
  const minutesInDay = 24 * 60;

  const normalizedMinutes =
    ((totalMinutes % minutesInDay) +
      minutesInDay) %
    minutesInDay;

  const hours = Math.floor(
    normalizedMinutes / 60,
  );

  const minutes = normalizedMinutes % 60;

  return `${String(hours).padStart(
    2,
    "0",
  )}:${String(minutes).padStart(2, "0")}`;
}

function calculateEndTime(
  startTime: string,
  lessonDurationMinutes: number,
): string {
  const startMinutes =
    timeToMinutes(startTime);

  if (startMinutes === null) {
    return "";
  }

  return minutesToTime(
    startMinutes + lessonDurationMinutes,
  );
}

function calculateNextStartTime(
  periods: LessonPeriod[],
  lessonDurationMinutes: number,
): string {
  const lastPeriod =
    periods[periods.length - 1];

  if (!lastPeriod) {
    return "13:00";
  }

  if (isValidTime(lastPeriod.endTime)) {
    return lastPeriod.endTime;
  }

  return calculateEndTime(
    lastPeriod.startTime,
    lessonDurationMinutes,
  );
}

function normalizePeriods(
  periods: LessonPeriod[],
): LessonPeriod[] {
  return periods.map((period, index) => ({
    ...period,
    periodNumber: index + 1,
  }));
}

export default function PeriodSettings({
  title = "時限設定",
  description,
  periods,
  lessonDurationMinutes,
  onChange,
}: Props) {
  const [
    manuallyEditedPeriodIds,
    setManuallyEditedPeriodIds,
  ] = useState<Set<string>>(new Set());

  const previousDurationRef = useRef(
    lessonDurationMinutes,
  );

  useEffect(() => {
    if (
      previousDurationRef.current ===
      lessonDurationMinutes
    ) {
      return;
    }

    previousDurationRef.current =
      lessonDurationMinutes;

    const nextPeriods = periods.map(
      (period) => {
        if (
          manuallyEditedPeriodIds.has(
            period.id,
          )
        ) {
          return period;
        }

        return {
          ...period,
          endTime: calculateEndTime(
            period.startTime,
            lessonDurationMinutes,
          ),
        };
      },
    );

    onChange(nextPeriods);
  }, [lessonDurationMinutes]);

  function updatePeriod(
    periodId: string,
    updates: Partial<LessonPeriod>,
  ) {
    onChange(
      periods.map((period) =>
        period.id === periodId
          ? {
              ...period,
              ...updates,
            }
          : period,
      ),
    );
  }

  function handleStartTimeChange(
    period: LessonPeriod,
    startTime: string,
  ) {
    const isManual =
      manuallyEditedPeriodIds.has(period.id);

    updatePeriod(period.id, {
      startTime,
      endTime: isManual
        ? period.endTime
        : calculateEndTime(
            startTime,
            lessonDurationMinutes,
          ),
    });
  }

  function handleEndTimeChange(
    periodId: string,
    endTime: string,
  ) {
    setManuallyEditedPeriodIds(
      (current) => {
        const next = new Set(current);
        next.add(periodId);

        return next;
      },
    );

    updatePeriod(periodId, {
      endTime,
    });
  }

  function resetToAutomatic(
    period: LessonPeriod,
  ) {
    setManuallyEditedPeriodIds(
      (current) => {
        const next = new Set(current);
        next.delete(period.id);

        return next;
      },
    );

    updatePeriod(period.id, {
      endTime: calculateEndTime(
        period.startTime,
        lessonDurationMinutes,
      ),
    });
  }

  function addPeriod() {
    const startTime =
      calculateNextStartTime(
        periods,
        lessonDurationMinutes,
      );

    const newPeriod: LessonPeriod = {
      id: createPeriodId(),
      periodNumber: periods.length + 1,
      startTime,
      endTime: calculateEndTime(
        startTime,
        lessonDurationMinutes,
      ),
      isEnabled: true,
    };

    onChange([...periods, newPeriod]);
  }

  function removePeriod(periodId: string) {
    setManuallyEditedPeriodIds(
      (current) => {
        const next = new Set(current);
        next.delete(periodId);

        return next;
      },
    );

    onChange(
      normalizePeriods(
        periods.filter(
          (period) =>
            period.id !== periodId,
        ),
      ),
    );
  }

  return (
    <SettingSection
      title={title}
      description={description}
    >
      <div className="flex justify-end">
        <button
          type="button"
          onClick={addPeriod}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-700"
        >
          ＋ 時限を追加
        </button>
      </div>

      {periods.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-zinc-700">
            時限が登録されていません
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            「時限を追加」から登録してください。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {periods.map((period) => {
            const isManual =
              manuallyEditedPeriodIds.has(
                period.id,
              );

            return (
              <div
                key={period.id}
                className={[
                  "rounded-2xl border p-4 transition",
                  period.isEnabled
                    ? "border-zinc-200 bg-white"
                    : "border-zinc-200 bg-zinc-50 opacity-60",
                ].join(" ")}
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                  <div className="flex shrink-0 items-center justify-between gap-4 xl:w-28">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={period.isEnabled}
                        onChange={(event) =>
                          updatePeriod(period.id, {
                            isEnabled:
                              event.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
                      />

                      <span className="font-bold text-zinc-900">
                        {period.periodNumber}限
                      </span>
                    </label>
                  </div>

                  <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-3">
                    <label className="min-w-0">
                      <span className="mb-1.5 block text-xs font-semibold text-zinc-600">
                        開始
                      </span>

                      <input
                        type="time"
                        value={period.startTime}
                        disabled={!period.isEnabled}
                        onChange={(event) =>
                          handleStartTimeChange(
                            period,
                            event.target.value,
                          )
                        }
                        className="h-10 w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed"
                      />
                    </label>

                    <span className="pb-2.5 text-sm font-bold text-zinc-400">
                      →
                    </span>

                    <label className="min-w-0">
                      <span className="mb-1.5 flex items-center justify-between gap-2 text-xs font-semibold text-zinc-600">
                        <span>終了</span>

                        <span className="font-normal text-zinc-400">
                          {isManual
                            ? "手動"
                            : "自動"}
                        </span>
                      </span>

                      <input
                        type="time"
                        value={period.endTime}
                        disabled={!period.isEnabled}
                        onChange={(event) =>
                          handleEndTimeChange(
                            period.id,
                            event.target.value,
                          )
                        }
                        className="h-10 w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed"
                      />
                    </label>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    {isManual && (
                      <button
                        type="button"
                        onClick={() =>
                          resetToAutomatic(period)
                        }
                        disabled={!period.isEnabled}
                        className="h-9 rounded-xl border border-zinc-200 px-3 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        自動に戻す
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        removePeriod(period.id)
                      }
                      className="h-9 rounded-xl border border-red-200 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SettingSection>
  );
}