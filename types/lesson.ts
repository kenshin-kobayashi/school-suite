import type { Weekday } from "@/types/schedule";
import type { ScheduleCellPosition } from "@/types/schedule-cell";

export type LessonScheduleMode =
  | "regular"
  | "course";

export type LessonStatus =
  | "scheduled"
  | "completed"
  | "cancelled";

export type LessonSource =
  | "manual"
  | "ai";

export type LessonStudent = {
  studentId: string;
  studentNumber: string;
  studentName: string;
  grade: string;
  subject: string;
};

/**
 * 時間割に表示する授業データです。
 *
 * 過去に作成したサンプルデータとの互換性を保つため、
 * positionとteacherNumberは任意項目にしています。
 *
 * Firestoreへ新しく保存するときは、
 * LessonWriteDataを使用します。
 */
export type Lesson = {
  id?: string;

  /**
   * この授業が属する年度です。
   *
   * 例：2026年度の場合は2026です。
   */
  academicYear: number;

  /**
   * セルの位置情報です。
   *
   * 通常授業の例：
   * {
   *   columnId: "monday",
   *   periodId: "period-1"
   * }
   *
   * 講習授業の例：
   * {
   *   columnId: "2026-07-21",
   *   periodId: "period-1"
   * }
   */
  position?: ScheduleCellPosition;

  /**
   * 通常授業または講習授業です。
   */
  scheduleMode: LessonScheduleMode;

  /**
   * 通常授業の場合に使用します。
   */
  weekday?: Weekday;

  /**
   * 講習授業の場合に使用します。
   *
   * 例：2026-07-21
   */
  date?: string;

  /**
   * 1限なら1、2限なら2です。
   */
  periodNumber: number;

  teacherId: string;

  /**
   * 既存のサンプルデータに入っていないため、
   * 一覧表示用のLessonでは任意にしています。
   */
  teacherNumber?: string;

  teacherName: string;

  students: LessonStudent[];

  status: LessonStatus;
  source: LessonSource;

  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Firestoreへ授業を新規保存するときのデータです。
 *
 * 新しく登録する授業では、
 * academicYear、position、teacherNumberを
 * 必須にしています。
 */
export type LessonWriteData = {
  /**
   * この授業が属する年度です。
   *
   * 例：2026年度の場合は2026です。
   */
  academicYear: number;

  position: ScheduleCellPosition;

  scheduleMode: LessonScheduleMode;

  weekday?: Weekday;
  date?: string;
  periodNumber: number;

  teacherId: string;
  teacherNumber: string;
  teacherName: string;

  students: LessonStudent[];

  status: LessonStatus;
  source: LessonSource;
};

export type LessonFormValues = {
  teacherId: string;
  teacherNumber: string;
  teacherName: string;
  students: LessonStudent[];
};

export type LessonFormInitialValues =
  Partial<LessonFormValues>;