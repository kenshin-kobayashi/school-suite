import type {
  LessonFormValues,
} from "@/components/schedule/dialog/LessonForm";

import type {
  Lesson,
  LessonWriteData,
} from "@/types/lesson";

import type {
  ScheduleMode,
  Weekday,
} from "@/types/schedule";

import type {
  ScheduleCellPosition,
} from "@/types/schedule-cell";

import {
  addTeacherSuffix,
  getPeriodNumber,
} from "@/lib/schedule/helpers";

export function createLessonWriteData({
  academicYear,
  mode,
  position,
  values,
  existingLesson,
}: {
  academicYear: number;
  mode: ScheduleMode;
  position: ScheduleCellPosition;
  values: LessonFormValues;
  existingLesson?: Lesson | null;
}): LessonWriteData {
  const periodNumber =
    getPeriodNumber(
      position.periodId,
    );

  const baseData = {
    academicYear,
    position,
    periodNumber,

    teacherId:
      values.teacherId,

    teacherNumber:
      values.teacherNumber,

    teacherName:
      addTeacherSuffix(
        values.teacherName,
      ),

    classroomId:
      values.classroomId,

    classroomName:
      values.classroomName,

    students:
      values.students,

    status:
      existingLesson?.status ??
      ("scheduled" as const),

    source:
      existingLesson?.source ??
      ("manual" as const),
  };

  if (mode === "regular") {
    return {
      ...baseData,

      scheduleMode:
        "regular",

      weekday:
        position.columnId as Weekday,
    };
  }

  return {
    ...baseData,

    scheduleMode:
      "course",

    date:
      position.columnId,
  };
}

export function findClassroomConflict({
  lessons,
  classroomId,
  editingLessonId,
}: {
  lessons: Lesson[];
  classroomId: string;
  editingLessonId?: string;
}): Lesson | undefined {
  const normalizedClassroomId =
    classroomId.trim();

  if (!normalizedClassroomId) {
    return undefined;
  }

  return lessons.find((lesson) => {
    if (
      editingLessonId &&
      lesson.id === editingLessonId
    ) {
      return false;
    }

    if (
      lesson.status === "cancelled"
    ) {
      return false;
    }

    return (
      lesson.classroomId?.trim() ===
      normalizedClassroomId
    );
  });
}