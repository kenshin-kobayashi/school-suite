import type { Lesson } from "@/types/lesson";

/* =========================
   基本
========================= */

export type ScheduleMode = "regular" | "course";

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

/* =========================
   曜日
========================= */

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type WeekdayOption = {
  value: Weekday;
  label: string;
  shortLabel: string;
};

export const WEEKDAY_OPTIONS: WeekdayOption[] = [
  {
    value: "monday",
    label: "月曜日",
    shortLabel: "月",
  },
  {
    value: "tuesday",
    label: "火曜日",
    shortLabel: "火",
  },
  {
    value: "wednesday",
    label: "水曜日",
    shortLabel: "水",
  },
  {
    value: "thursday",
    label: "木曜日",
    shortLabel: "木",
  },
  {
    value: "friday",
    label: "金曜日",
    shortLabel: "金",
  },
  {
    value: "saturday",
    label: "土曜日",
    shortLabel: "土",
  },
  {
    value: "sunday",
    label: "日曜日",
    shortLabel: "日",
  },
];

/* =========================
   休塾日
========================= */

export type ClosedDayAppliesTo =
  | "regular"
  | "course"
  | "both";

export type SchoolClosedDay = {
  id: string;

  date: string;

  title: string;

  appliesTo: ClosedDayAppliesTo;

  note?: string;

  createdAt?: unknown;
  updatedAt?: unknown;
};

/* =========================
   AI組み直し
========================= */

export type RebuildMode =
  | "preserve-current"
  | "optimize-all";

export type ScheduleRebuildRequest = {
  mode: ScheduleMode;
  rebuildMode: RebuildMode;

  startDate?: string;
  endDate?: string;
};

export type ScheduleChangeType =
  | "unchanged"
  | "teacher-changed"
  | "datetime-changed"
  | "students-changed"
  | "subject-changed"
  | "created"
  | "deleted"
  | "unassigned";

export type ScheduleChange = {
  id: string;
  type: ScheduleChangeType;

  beforeLesson?: Lesson;
  afterLesson?: Lesson;

  reason?: string;
};

export type ScheduleRebuildResult = {
  rebuildMode: RebuildMode;

  changes: ScheduleChange[];

  summary: {
    unchangedCount: number;
    changedCount: number;
    createdCount: number;
    deletedCount: number;
    unassignedCount: number;
  };
};