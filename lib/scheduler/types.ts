import type { Lesson } from "@/types/lesson";

export type AISchedulerScoreSettings = {
  teacherIdleWeight: number;
  studentIdleWeight: number;
  teacherPreferenceWeight: number;
};

export type AISchedulerScoreBreakdown = {
  teacherIdleScore: number;
  studentIdleScore: number;
  teacherPreferenceScore: number;
};

export type AISchedulerScoreResult = {
  totalScore: number;
  settings: AISchedulerScoreSettings;
  breakdown: AISchedulerScoreBreakdown;
};

export type AISchedulerOptions = {
  preserveExistingLessons: boolean;
  scoreSettings: AISchedulerScoreSettings;
};

export type AISchedulerUnassignedReasonCode =
  | "student-unavailable"
  | "teacher-unavailable"
  | "student-conflict"
  | "teacher-conflict"
  | "classroom-conflict"
  | "classroom-capacity"
  | "classroom-shortage"
  | "teacher-subject-unsupported"
  | "teacher-grade-unsupported"
  | "excluded-teacher"
  | "outside-course-period"
  | "closed-day"
  | "regular-lesson-conflict"
  | "existing-lesson-conflict"
  | "no-candidate"
  | "unknown";

export type AISchedulerUnassignedReason = {
  code: AISchedulerUnassignedReasonCode;
  message: string;
};

export type AISchedulerUnassignedLesson = {
  requestId: string;
  studentId: string;
  studentName: string;
  subject: string;
  grade: string;
  reasons: AISchedulerUnassignedReason[];
};

export type AISchedulerResult = {
  lessons: Lesson[];
  unassignedLessons: AISchedulerUnassignedLesson[];
  requestedLessonCount: number;
  assignedLessonCount: number;
  assignmentRate: number;
  score: AISchedulerScoreResult;
};