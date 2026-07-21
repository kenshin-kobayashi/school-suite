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
 */
export type Lesson = {
  id?: string;

  academicYear: number;

  position?: ScheduleCellPosition;

  scheduleMode: LessonScheduleMode;

  weekday?: Weekday;

  date?: string;

  periodNumber: number;

  classroomId: string;

  classroomName: string;

  teacherId: string;

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
 */
export type LessonWriteData = {
  academicYear: number;

  position: ScheduleCellPosition;

  scheduleMode: LessonScheduleMode;

  weekday?: Weekday;

  date?: string;

  periodNumber: number;

  classroomId: string;

  classroomName: string;

  teacherId: string;

  teacherNumber: string;

  teacherName: string;

  students: LessonStudent[];

  status: LessonStatus;

  source: LessonSource;
};

export type LessonFormValues = {
  classroomId: string;

  classroomName: string;

  teacherId: string;

  teacherNumber: string;

  teacherName: string;

  students: LessonStudent[];
};

export type LessonFormInitialValues =
  Partial<LessonFormValues>;