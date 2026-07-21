import type { Lesson } from "@/types/lesson";

import type {
  AISchedulerCandidate,
  AISchedulerCandidateStudent,
  AISchedulerInput,
  AISchedulerScoreResult,
  AISchedulerStudentRequest,
  AISchedulerTeacher,
  AISchedulerUnassignedReason,
} from "./types";

import {
  canTeacherTeachStudent,
  isTeacherExcluded,
  validateCandidate,
} from "./constraints";

export type AISchedulerCandidateGenerationResult = {
  candidates: AISchedulerCandidate[];
  rejectedReasons: AISchedulerUnassignedReason[];
};

const emptyScore: AISchedulerScoreResult = {
  totalScore: 0,
  maxScore: 100,
  breakdown: {
    teacherIdleScore: 0,
    studentIdleScore: 0,
    teacherPreferenceScore: 0,
  },
};

function createCandidateStudent(
  request: AISchedulerStudentRequest,
): AISchedulerCandidateStudent {
  return {
    requestId: request.id,
    studentId: request.studentId,
    studentNumber: request.studentNumber,
    studentName: request.studentName,
    grade: request.grade,
    subject: request.subject,
    preferredMaximumStudents:
      request.preferredMaximumStudents,
  };
}

function findRequestForLessonStudent(
  input: AISchedulerInput,
  student: Lesson["students"][number],
): AISchedulerStudentRequest | undefined {
  return input.studentRequests.find(
    (request) =>
      request.studentId ===
        student.studentId &&
      request.subject === student.subject,
  );
}

function convertLessonStudents(
  input: AISchedulerInput,
  lesson: Lesson,
): AISchedulerCandidateStudent[] | null {
  const students: AISchedulerCandidateStudent[] =
    [];

  for (const student of lesson.students) {
    const request =
      findRequestForLessonStudent(
        input,
        student,
      );

    if (!request) {
      return null;
    }

    students.push(
      createCandidateStudent(request),
    );
  }

  return students;
}

function getTeacherPriority(
  request: AISchedulerStudentRequest,
  teacherId: string,
): number {
  if (
    teacherId ===
    request.currentTeacherId
  ) {
    return 0;
  }

  if (
    teacherId ===
    request.firstChoiceTeacherId
  ) {
    return 1;
  }

  if (
    teacherId ===
    request.secondChoiceTeacherId
  ) {
    return 2;
  }

  return 3;
}

function getTeacherCandidates(
  input: AISchedulerInput,
  request: AISchedulerStudentRequest,
): AISchedulerTeacher[] {
  return input.teachers
    .filter(
      (teacher) =>
        !isTeacherExcluded(
          request,
          teacher.id,
        ) &&
        canTeacherTeachStudent(
          teacher,
          request,
        ),
    )
    .sort((teacherA, teacherB) => {
      const priorityDifference =
        getTeacherPriority(
          request,
          teacherA.id,
        ) -
        getTeacherPriority(
          request,
          teacherB.id,
        );

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return teacherA.teacherName.localeCompare(
        teacherB.teacherName,
        "ja",
      );
    });
}

function createCandidateId(
  requestId: string,
  date: string,
  periodNumber: number,
  teacherId: string,
  classroomId: string,
): string {
  return [
    requestId,
    date,
    periodNumber,
    teacherId,
    classroomId,
  ].join("__");
}

function createCandidate(
  request: AISchedulerStudentRequest,
  date: string,
  weekday: AISchedulerCandidate["weekday"],
  periodNumber: number,
  teacher: AISchedulerTeacher,
  classroomId: string,
  classroomName: string,
  students: AISchedulerCandidateStudent[],
): AISchedulerCandidate {
  return {
    id: createCandidateId(
      request.id,
      date,
      periodNumber,
      teacher.id,
      classroomId,
    ),
    date,
    weekday,
    periodNumber,
    teacherId: teacher.id,
    teacherNumber:
      teacher.teacherNumber,
    teacherName:
      teacher.teacherName,
    classroomId,
    classroomName,
    students,
    score: {
      ...emptyScore,
      breakdown: {
        ...emptyScore.breakdown,
      },
    },
  };
}

function addRejectedReason(
  reasons: Set<AISchedulerUnassignedReason>,
  reason: AISchedulerUnassignedReason,
): void {
  reasons.add(reason);
}

function isSameMergeSlot(
  lesson: Lesson,
  date: string,
  periodNumber: number,
  teacherId: string,
  classroomId: string,
): boolean {
  return (
    lesson.status !== "cancelled" &&
    lesson.scheduleMode === "course" &&
    lesson.date === date &&
    lesson.periodNumber ===
      periodNumber &&
    lesson.teacherId === teacherId &&
    lesson.classroomId === classroomId
  );
}

function findMergeTargetLesson(
  scheduledLessons: Lesson[],
  date: string,
  periodNumber: number,
  teacherId: string,
  classroomId: string,
): Lesson | undefined {
  return scheduledLessons.find(
    (lesson) =>
      isSameMergeSlot(
        lesson,
        date,
        periodNumber,
        teacherId,
        classroomId,
      ),
  );
}

function removeMergeTargetLesson(
  scheduledLessons: Lesson[],
  targetLesson: Lesson,
): Lesson[] {
  return scheduledLessons.filter(
    (lesson) => lesson !== targetLesson,
  );
}

export function generateCandidatesForRequest(
  input: AISchedulerInput,
  request: AISchedulerStudentRequest,
  scheduledLessons: AISchedulerInput["existingCourseLessons"] = [],
): AISchedulerCandidateGenerationResult {
  const candidates: AISchedulerCandidate[] =
    [];

  const rejectedReasons =
    new Set<AISchedulerUnassignedReason>();

  const teachers =
    getTeacherCandidates(
      input,
      request,
    );

  if (teachers.length === 0) {
    addRejectedReason(
      rejectedReasons,
      "teacher-not-qualified",
    );

    return {
      candidates,
      rejectedReasons: Array.from(
        rejectedReasons,
      ),
    };
  }

  if (input.classrooms.length === 0) {
    addRejectedReason(
      rejectedReasons,
      "classroom-unavailable",
    );

    return {
      candidates,
      rejectedReasons: Array.from(
        rejectedReasons,
      ),
    };
  }

  const newStudent =
    createCandidateStudent(request);

  for (const courseDay of input.courseDays) {
    for (const period of courseDay.periods) {
      for (const teacher of teachers) {
        for (const classroom of input.classrooms) {
          const mergeTarget =
            findMergeTargetLesson(
              scheduledLessons,
              courseDay.date,
              period.periodNumber,
              teacher.id,
              classroom.id,
            );

          let candidateStudents: AISchedulerCandidateStudent[] =
            [newStudent];

          let lessonsForValidation =
            scheduledLessons;

          if (mergeTarget) {
            const studentAlreadyExists =
              mergeTarget.students.some(
                (student) =>
                  student.studentId ===
                  request.studentId,
              );

            if (studentAlreadyExists) {
              addRejectedReason(
                rejectedReasons,
                "student-conflict",
              );

              continue;
            }

            const existingStudents =
              convertLessonStudents(
                input,
                mergeTarget,
              );

            if (!existingStudents) {
              addRejectedReason(
                rejectedReasons,
                "no-candidate",
              );

              continue;
            }

            candidateStudents = [
              ...existingStudents,
              newStudent,
            ];

            /*
             * 結合対象の授業を一時的に除外します。
             *
             * これにより、同じ講師・同じ教室の
             * 授業への生徒追加を競合扱いしません。
             */
            lessonsForValidation =
              removeMergeTargetLesson(
                scheduledLessons,
                mergeTarget,
              );
          }

          const candidate =
            createCandidate(
              request,
              courseDay.date,
              courseDay.weekday,
              period.periodNumber,
              teacher,
              classroom.id,
              classroom.name,
              candidateStudents,
            );

          const validationResult =
            validateCandidate(candidate, {
              input,
              scheduledLessons:
                lessonsForValidation,
            });

          if (validationResult.valid) {
            candidates.push(candidate);
            continue;
          }

          addRejectedReason(
            rejectedReasons,
            validationResult.reason,
          );
        }
      }
    }
  }

  if (
    candidates.length === 0 &&
    rejectedReasons.size === 0
  ) {
    addRejectedReason(
      rejectedReasons,
      "no-candidate",
    );
  }

  return {
    candidates,
    rejectedReasons: Array.from(
      rejectedReasons,
    ),
  };
}

export function generateAllCandidates(
  input: AISchedulerInput,
  scheduledLessons: AISchedulerInput["existingCourseLessons"] = [],
): Map<
  string,
  AISchedulerCandidateGenerationResult
> {
  const result = new Map<
    string,
    AISchedulerCandidateGenerationResult
  >();

  for (const request of input.studentRequests) {
    result.set(
      request.id,
      generateCandidatesForRequest(
        input,
        request,
        scheduledLessons,
      ),
    );
  }

  return result;
}