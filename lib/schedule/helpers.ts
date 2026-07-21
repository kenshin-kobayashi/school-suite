import type {
  ScheduleColumn,
  Weekday,
} from "@/types/schedule";

import type {
  ScheduleSettings,
} from "@/types/schedule-settings";

const weekdayLabels: Record<
  Weekday,
  string
> = {
  monday: "月曜日",
  tuesday: "火曜日",
  wednesday: "水曜日",
  thursday: "木曜日",
  friday: "金曜日",
  saturday: "土曜日",
  sunday: "日曜日",
};

const weekdayByDayNumber: Record<
  number,
  Weekday
> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

/**
 * 設定された休塾日を、検索しやすいSet形式に変換します。
 */
export function createHolidayDateSet(
  scheduleSettings: ScheduleSettings,
): Set<string> {
  return new Set(
    scheduleSettings.schoolHolidays.map(
      (holiday) => holiday.date,
    ),
  );
}

/**
 * YYYY-MM-DD形式の日付文字列をDateに変換します。
 */
export function parseDate(
  dateString: string,
): Date {
  const dateParts = dateString
    .split("-")
    .map(Number);

  const year =
    dateParts[0] ?? 1970;

  const month =
    dateParts[1] ?? 1;

  const day =
    dateParts[2] ?? 1;

  return new Date(
    year,
    month - 1,
    day,
  );
}

/**
 * YYYY-MM-DD形式の日付を「7月21日」形式にします。
 */
export function createDateLabel(
  dateString: string,
): string {
  const date = parseDate(
    dateString,
  );

  return `${
    date.getMonth() + 1
  }月${date.getDate()}日`;
}

/**
 * YYYY-MM-DD形式の日付から曜日ラベルを作成します。
 */
export function createDateSubLabel(
  dateString: string,
): string {
  const date = parseDate(
    dateString,
  );

  const weekday =
    weekdayByDayNumber[
      date.getDay()
    ] ?? "sunday";

  return weekdayLabels[
    weekday
  ];
}

/**
 * 通常授業用の曜日列を作成します。
 */
export function createRegularColumns(
  enabledWeekdays: Weekday[],
): ScheduleColumn[] {
  return enabledWeekdays.map(
    (weekday) => ({
      id: weekday,
      label:
        weekdayLabels[
          weekday
        ],
      isHoliday: false,
    }),
  );
}

/**
 * period-1などのコマIDからコマ番号を取得します。
 */
export function getPeriodNumber(
  periodId: string,
): number {
  const matchedNumber =
    periodId.match(
      /\d+/,
    )?.[0];

  const periodNumber =
    Number(
      matchedNumber,
    );

  if (
    !Number.isInteger(
      periodNumber,
    ) ||
    periodNumber < 1
  ) {
    return 1;
  }

  return periodNumber;
}

/**
 * 講師名の末尾に「先生」を追加します。
 */
export function addTeacherSuffix(
  teacherName: string,
): string {
  const trimmedName =
    teacherName.trim();

  if (
    trimmedName.endsWith(
      "先生",
    )
  ) {
    return trimmedName;
  }

  return `${trimmedName}先生`;
}