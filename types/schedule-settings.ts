import type {
  ScheduleMode,
  Weekday,
} from "@/types/schedule";

export type LessonCapacity = number;

export type CourseType =
  | "spring"
  | "summer"
  | "winter"
  | "other";

export const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  spring: "春期講習",
  summer: "夏期講習",
  winter: "冬期講習",
  other: "その他",
};

export type LessonRule = {
  /**
   * 授業時間（分）
   */
  lessonDurationMinutes: number;

  /**
   * 講師1人が同時に担当できる最大生徒数
   */
  maxStudentsPerTeacher: LessonCapacity;
};

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

  /**
   * HH:mm形式
   */
  endTime: string;

  isEnabled: boolean;
};

export type RegularScheduleSettings = {
  mode: "regular";

  /**
   * 通常授業を実施する曜日
   */
  enabledWeekdays: Weekday[];

  /**
   * 授業ルール
   */
  lessonRule: LessonRule;

  /**
   * 通常授業の時限
   */
  periods: LessonPeriod[];
};

export type CourseScheduleSettings = {
  mode: "course";

  /**
   * 講習の種類
   */
  courseType: CourseType;

  /**
   * YYYY-MM-DD形式
   */
  startDate: string;

  /**
   * YYYY-MM-DD形式
   */
  endDate: string;

  /**
   * 講習を実施する曜日
   */
  enabledWeekdays: Weekday[];

  /**
   * 授業ルール
   */
  lessonRule: LessonRule;

  /**
   * 講習の時限
   */
  periods: LessonPeriod[];

  /**
   * 通常授業を反映する際の初期設定
   *
   * 実際の反映処理はスケジュール画面の
   * 「通常授業を反映」ボタンから実行する
   */
  shouldImportRegularLessons: boolean;
};

export type CourseScheduleSettingsMap = Record<
  CourseType,
  CourseScheduleSettings
>;

export type ScheduleSettings = {
  id: string;

  regular: RegularScheduleSettings;

  /**
   * 春期・夏期・冬期・その他ごとの講習設定
   */
  courses: CourseScheduleSettingsMap;

  /**
   * YYYY-MM-DD形式の休塾日
   *
   * 設定操作はスケジュール画面から行う
   */
  closedDates: string[];

  updatedAt?: unknown;
};

export type ScheduleSettingsByMode = {
  regular: RegularScheduleSettings;
  course: CourseScheduleSettings;
};