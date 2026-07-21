import type { Lesson } from "@/types/lesson";

import type {
  AISchedulerCandidate,
  AISchedulerClassroom,
  AISchedulerCourseDay,
  AISchedulerInput,
  AISchedulerStudentRequest,
  AISchedulerTeacher,
  AISchedulerUnassignedReason,
} from "./types";

export type AISchedulerConstraintContext = {
  input: AISchedulerInput;
  scheduledLessons: Lesson[];
};

export type AISchedulerConstraintResult =
  | {
      valid: true;
    }
  | {
      valid: false;
      reason: AISchedulerUnassignedReason;
    };

function isSameSlot(
  lesson: Lesson,
  date: string,
  periodNumber: number,
): boolean {
  return (
    lesson.date === date &&
    lesson.periodNumber === periodNumber
  );
}

function getCourseDay(
  input: AISchedulerInput,
  date: string,
): AISchedulerCourseDay | undefined {
  return input.courseDays.find(
    (courseDay) => courseDay.date === date,
  );
}

function getTeacher(
  input: AISchedulerInput,
  teacherId: string,
): AISchedulerTeacher | undefined {
  return input.teachers.find(
    (teacher) => teacher.id === teacherId,
  );
}

function getClassroom(
  input: AISchedulerInput,
  classroomId: string,
): AISchedulerClassroom | undefined {
  return input.classrooms.find(
    (classroom) => classroom.id === classroomId,
  );
}

function getRequest(
  input: AISchedulerInput,
  requestId: string,
): AISchedulerStudentRequest | undefined {
  return input.studentRequests.find(
    (request) => request.id === requestId,
  );
}

function getAllFixedLessons(
  context: AISchedulerConstraintContext,
): Lesson[] {
  const { input, scheduledLessons } = context;

  const existingCourseLessons =
    input.options.preserveExistingLessons
      ? input.existingCourseLessons
      : [];

  return [
    ...input.regularLessons,
    ...existingCourseLessons,
    ...scheduledLessons,
  ];
}

export function isValidCourseSlot(
  input: AISchedulerInput,
  date: string,
  periodNumber: number,
): AISchedulerConstraintResult {
  const courseDay = getCourseDay(input, date);

  if (!courseDay) {
    return {
      valid: false,
      reason: "invalid-period",
    };
  }

  if (courseDay.closed) {
    return {
      valid: false,
      reason: "closed-day",
    };
  }

  const periodExists = courseDay.periods.some(
    (period) =>
      period.periodNumber === periodNumber,
  );

  if (!periodExists) {
    return {
      valid: false,
      reason: "invalid-period",
    };
  }

  return {
    valid: true,
  };
}

export function isStudentAvailable(
  input: AISchedulerInput,
  studentId: string,
  date: string,
  periodNumber: number,
): boolean {
  const availability =
    input.studentAvailabilities.find(
      (item) =>
        item.studentId === studentId &&
        item.date === date,
    );

  if (!availability) {
    return false;
  }

  return availability.availablePeriodNumbers.includes(
    periodNumber,
  );
}

export function isTeacherAvailable(
  input: AISchedulerInput,
  teacherId: string,
  date: string,
  periodNumber: number,
): boolean {
  const availability =
    input.teacherAvailabilities.find(
      (item) =>
        item.teacherId === teacherId &&
        item.date === date,
    );

  if (!availability) {
    return false;
  }

  return availability.availablePeriodNumbers.includes(
    periodNumber,
  );
}

export function canTeacherTeachStudent(
  teacher: AISchedulerTeacher,
  request: AISchedulerStudentRequest,
): boolean {
  return teacher.subjects.some(
    (subjectSetting) =>
      subjectSetting.subject === request.subject &&
      subjectSetting.grades.includes(request.grade),
  );
}

export function isTeacherExcluded(
  request: AISchedulerStudentRequest,
  teacherId: string,
): boolean {
  return request.excludedTeacherIds.includes(
    teacherId,
  );
}

export function hasStudentConflict(
  lessons: Lesson[],
  studentId: string,
  date: string,
  periodNumber: number,
): boolean {
  return lessons.some(
    (lesson) =>
      isSameSlot(
        lesson,
        date,
        periodNumber,
      ) &&
      lesson.students.some(
        (student) =>
          student.studentId === studentId,
      ),
  );
}

export function hasTeacherConflict(
  lessons: Lesson[],
  teacherId: string,
  date: string,
  periodNumber: number,
): boolean {
  return lessons.some(
    (lesson) =>
      isSameSlot(
        lesson,
        date,
        periodNumber,
      ) &&
      lesson.teacherId === teacherId,
  );
}

export function hasClassroomConflict(
  lessons: Lesson[],
  classroomId: string,
  date: string,
  periodNumber: number,
): boolean {
  return lessons.some(
    (lesson) =>
      isSameSlot(
        lesson,
        date,
        periodNumber,
      ) &&
      lesson.classroomId === classroomId,
  );
}

export function isWithinMaximumStudents(
  input: AISchedulerInput,
  candidate: AISchedulerCandidate,
): boolean {
  const studentCount = candidate.students.length;

  if (
    studentCount >
    input.schoolMaximumStudents
  ) {
    return false;
  }

  return candidate.students.every(
    (student) =>
      studentCount <=
      student.preferredMaximumStudents,
  );
}

export function isWithinClassroomCapacity(
  input: AISchedulerInput,
  candidate: AISchedulerCandidate,
): boolean {
  const classroom = getClassroom(
    input,
    candidate.classroomId,
  );

  if (!classroom) {
    return false;
  }

  return (
    candidate.students.length <=
    classroom.capacity
  );
}

export function validateCandidate(
  candidate: AISchedulerCandidate,
  context: AISchedulerConstraintContext,
): AISchedulerConstraintResult {
  const slotResult = isValidCourseSlot(
    context.input,
    candidate.date,
    candidate.periodNumber,
  );

  if (!slotResult.valid) {
    return slotResult;
  }

  const teacher = getTeacher(
    context.input,
    candidate.teacherId,
  );

  if (!teacher) {
    return {
      valid: false,
      reason: "teacher-not-qualified",
    };
  }

  const classroom = getClassroom(
    context.input,
    candidate.classroomId,
  );

  if (!classroom) {
    return {
      valid: false,
      reason: "classroom-unavailable",
    };
  }

  const fixedLessons =
    getAllFixedLessons(context);

  if (
    !isTeacherAvailable(
      context.input,
      candidate.teacherId,
      candidate.date,
      candidate.periodNumber,
    )
  ) {
    return {
      valid: false,
      reason: "teacher-unavailable",
    };
  }

  if (
    hasTeacherConflict(
      fixedLessons,
      candidate.teacherId,
      candidate.date,
      candidate.periodNumber,
    )
  ) {
    return {
      valid: false,
      reason: "teacher-conflict",
    };
  }

  if (
    hasClassroomConflict(
      fixedLessons,
      candidate.classroomId,
      candidate.date,
      candidate.periodNumber,
    )
  ) {
    return {
      valid: false,
      reason: "classroom-conflict",
    };
  }

  if (
    !isWithinClassroomCapacity(
      context.input,
      candidate,
    )
  ) {
    return {
      valid: false,
      reason: "classroom-capacity",
    };
  }

  if (
    !isWithinMaximumStudents(
      context.input,
      candidate,
    )
  ) {
    return {
      valid: false,
      reason: "maximum-students",
    };
  }

  for (const student of candidate.students) {
    const request = getRequest(
      context.input,
      student.requestId,
    );

    if (!request) {
      return {
        valid: false,
        reason: "no-candidate",
      };
    }

    if (
      !isStudentAvailable(
        context.input,
        student.studentId,
        candidate.date,
        candidate.periodNumber,
      )
    ) {
      return {
        valid: false,
        reason: "student-unavailable",
      };
    }

    if (
      isTeacherExcluded(
        request,
        candidate.teacherId,
      )
    ) {
      return {
        valid: false,
        reason: "teacher-excluded",
      };
    }

    if (
      !canTeacherTeachStudent(
        teacher,
        request,
      )
    ) {
      return {
        valid: false,
        reason: "teacher-not-qualified",
      };
    }

    if (
      hasStudentConflict(
        fixedLessons,
        student.studentId,
        candidate.date,
        candidate.periodNumber,
      )
    ) {
      return {
        valid: false,
        reason: "student-conflict",
      };
    }
  }

  return {
    valid: true,
  };
}