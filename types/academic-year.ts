export type AcademicYearUpdateOptions = {
  copyRegularSchedule: boolean;
};

export type AcademicYearUpdateSummary = {
  previousAcademicYear: number;
  newAcademicYear: number;
  updatedStudentCount: number;
  copiedRegularLessonCount: number;
};

export type AcademicYearUpdateLog = {
  id: string;
  previousAcademicYear: number;
  newAcademicYear: number;
  updatedStudentCount: number;
  copiedRegularLessonCount: number;
  copyRegularSchedule: boolean;
  executedAt: Date | null;
};

export type AcademicYearUpdateLogData = Omit<
  AcademicYearUpdateLog,
  "id" | "executedAt"
> & {
  executedAt: unknown;
};