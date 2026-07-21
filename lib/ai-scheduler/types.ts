import type { Weekday } from "@/types/schedule";
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
  maxScore: number;
  breakdown: AISchedulerScoreBreakdown;
};

export type AISchedulerOptions = {
  preserveExistingLessons: boolean;
  scoreSettings: AISchedulerScoreSettings;
};

export type AISchedulerPeriod = {
  periodNumber: number;
  startTime: string;
  endTime: string;
};

export type AISchedulerCourseDay = {
  date: string;
  weekday: Weekday;
  closed: boolean;
  periods: AISchedulerPeriod[];
};

export type AISchedulerStudentAvailability = {
  studentId: string;
  date: string;
  availablePeriodNumbers: number[];
};

export type AISchedulerTeacherAvailability = {
  teacherId: string;
  date: string;
  availablePeriodNumbers: number[];
};

export type AISchedulerStudentRequest = {
  id: string;
  studentId: string;
  studentNumber: string;
  studentName: string;
  grade: string;
  subject: string;
  lessonCount: number;
  preferredMaximumStudents: number;
  currentTeacherId?: string;
  firstChoiceTeacherId?: string;
  secondChoiceTeacherId?: string;
  excludedTeacherIds: string[];
};

export type AISchedulerTeacherSubject = {
  subject: string;
  grades: string[];
};

export type AISchedulerTeacher = {
  id: string;
  teacherNumber?: string;
  teacherName: string;
  subjects: AISchedulerTeacherSubject[];
};

export type AISchedulerClassroom = {
  id: string;
  name: string;
  capacity: number;
};

export type AISchedulerCandidateStudent = {
  requestId: string;
  studentId: string;
  studentNumber: string;
  studentName: string;
  grade: string;
  subject: string;
  preferredMaximumStudents: number;
};

export type AISchedulerCandidate = {
  id: string;
  date: string;
  weekday: Weekday;
  periodNumber: number;
  teacherId: string;
  teacherNumber?: string;
  teacherName: string;
  classroomId: string;
  classroomName: string;
  students: AISchedulerCandidateStudent[];
  score: AISchedulerScoreResult;
};

export type AISchedulerUnassignedReason =
  | "student-unavailable"
  | "teacher-unavailable"
  | "teacher-not-qualified"
  | "teacher-excluded"
  | "student-conflict"
  | "teacher-conflict"
  | "classroom-conflict"
  | "classroom-unavailable"
  | "classroom-capacity"
  | "maximum-students"
  | "closed-day"
  | "invalid-period"
  | "existing-lesson-conflict"
  | "no-candidate";

export type AISchedulerUnassignedLesson = {
  requestId: string;
  studentId: string;
  studentName: string;
  grade: string;
  subject: string;
  remainingLessonCount: number;
  reason: AISchedulerUnassignedReason;
};

export type AISchedulerInput = {
  academicYear: number;
  courseDays: AISchedulerCourseDay[];
  studentRequests: AISchedulerStudentRequest[];
  teachers: AISchedulerTeacher[];
  classrooms: AISchedulerClassroom[];
  studentAvailabilities: AISchedulerStudentAvailability[];
  teacherAvailabilities: AISchedulerTeacherAvailability[];
  regularLessons: Lesson[];
  existingCourseLessons: Lesson[];
  schoolMaximumStudents: number;
  options: AISchedulerOptions;
};

export type AISchedulerResult = {
  lessons: Lesson[];
  unassignedLessons: AISchedulerUnassignedLesson[];
  score: AISchedulerScoreResult;
  requestedLessonCount: number;
  assignedLessonCount: number;
  placementRate: number;
};