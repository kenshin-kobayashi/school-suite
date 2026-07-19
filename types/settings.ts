import type {
  ScheduleMode,
  Weekday,
} from "@/types/schedule";

export type LessonCapacity = 1 | 2 | 3 | 4;

export type LessonPeriod = {
  id: string;

  /**
   * 何限目か
   */
  periodNumber: number;

  /**
   * HH:mm形式
   */
  startTime: string;
  endTime: string;

  isEnabled: boolean;
};

export type RegularScheduleSettings = {
  mode: "regular";

  enabledWeekdays: Weekday[];

  periods: LessonPeriod[];

  maxStudentsPerTeacher: LessonCapacity;
};

export type CourseScheduleSettings = {
  mode: "course";

  /**
   * YYYY-MM-DD形式
   */
  startDate: string;

  /**
   * YYYY-MM-DD形式
   */
  endDate: string;

  enabledWeekdays: Weekday[];

  periods: LessonPeriod[];

  maxStudentsPerTeacher: LessonCapacity;
};

export type ScheduleSettings = {
  id: string;

  regular: RegularScheduleSettings;
  course: CourseScheduleSettings;

  updatedAt?: unknown;
};

export type ScheduleSettingsByMode = {
  [K in ScheduleMode]:
    K extends "regular"
      ? RegularScheduleSettings
      : CourseScheduleSettings;
};