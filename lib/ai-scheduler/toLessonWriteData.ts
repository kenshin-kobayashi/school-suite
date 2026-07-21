import type {
  Lesson,
  LessonWriteData,
} from "@/types/lesson";

export function toLessonWriteData(
  lesson: Lesson,
): LessonWriteData {
  if (!lesson.position) {
    throw new Error(
      "授業の配置情報がありません。",
    );
  }

  if (!lesson.classroomId) {
    throw new Error(
      "教室IDがありません。",
    );
  }

  if (!lesson.classroomName) {
    throw new Error(
      "教室名がありません。",
    );
  }

  return {
    academicYear:
      lesson.academicYear,

    position:
      lesson.position,

    scheduleMode:
      lesson.scheduleMode,

    weekday:
      lesson.weekday,

    date:
      lesson.date,

    periodNumber:
      lesson.periodNumber,

    teacherId:
      lesson.teacherId,

    teacherNumber:
      lesson.teacherNumber ?? "",

    teacherName:
      lesson.teacherName,

    classroomId:
      lesson.classroomId,

    classroomName:
      lesson.classroomName,

    students:
      lesson.students,

    status:
      lesson.status,

    source:
      lesson.source,
  };
}