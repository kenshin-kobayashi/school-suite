import type { SchedulePeriod } from "@/components/schedule";
import type { LessonPeriod } from "@/types/schedule-settings";

export function createSchedulePeriods(
  settings: LessonPeriod[],
): SchedulePeriod[] {
  return settings
    .filter((period) => period.isEnabled)
    .sort(
      (firstPeriod, secondPeriod) =>
        firstPeriod.periodNumber -
        secondPeriod.periodNumber,
    )
    .map((period) => ({
      /*
       * 通常授業と講習で同じセルキーを使用できるように、
       * 画面上のIDはperiodNumberから統一して生成します。
       */
      id: `period-${period.periodNumber}`,

      label: `${period.periodNumber}限`,

      time: `${period.startTime}〜${period.endTime}`,
    }));
}