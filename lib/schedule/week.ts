import type { CourseWeek } from "@/types/course-week";
import type { Weekday } from "@/types/schedule";

const weekdayByDayNumber: Record<number, Weekday> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

function parseDate(dateString: string): Date {
  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(
    2,
    "0",
  );
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);

  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function getWeekday(date: Date): Weekday {
  return weekdayByDayNumber[date.getDay()];
}

function isValidDateString(dateString: string): boolean {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(dateString)) {
    return false;
  }

  const date = parseDate(dateString);

  return formatDate(date) === dateString;
}

export function createCourseWeeks(
  startDate: string,
  endDate: string,
  enabledWeekdays: Weekday[],
): CourseWeek[] {
  if (
    !isValidDateString(startDate) ||
    !isValidDateString(endDate)
  ) {
    return [];
  }

  const courseStart = parseDate(startDate);
  const courseEnd = parseDate(endDate);

  if (courseStart > courseEnd) {
    return [];
  }

  if (enabledWeekdays.length === 0) {
    return [];
  }

  const enabledWeekdaySet = new Set(enabledWeekdays);
  const weeks: CourseWeek[] = [];

  let cursor = new Date(courseStart);
  let weekNumber = 1;

  while (cursor <= courseEnd) {
    const calendarWeekDates: Date[] = [];

    /*
     * 月曜日を週の開始、日曜日を週の終了として扱います。
     *
     * 講習開始日が週の途中の場合は、
     * その日から最初の週を作成します。
     */
    while (cursor <= courseEnd) {
      calendarWeekDates.push(new Date(cursor));

      const isSunday = cursor.getDay() === 0;

      cursor = addDays(cursor, 1);

      if (isSunday) {
        break;
      }
    }

    const enabledDates = calendarWeekDates.filter((date) =>
      enabledWeekdaySet.has(getWeekday(date)),
    );

    /*
     * その週に開講日が1日もない場合は、
     * 週データを作成しません。
     */
    if (enabledDates.length === 0) {
      continue;
    }

    const dates = enabledDates.map(formatDate);

    weeks.push({
      id: `week-${weekNumber}`,
      weekNumber,
      label: `第${weekNumber}週`,
      startDate: dates[0],
      endDate: dates[dates.length - 1],
      dates,
    });

    weekNumber += 1;
  }

  return weeks;
}