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

function getTeacherPriority(
  request: AISchedulerStudentRequest,
  teacherId: string,
): number {
  if (teacherId === request.currentTeacherId) {
    return 0;
  }

  if (teacherId === request.firstChoiceTeacherId) {
    return 1;
  }

  if (teacherId === request.secondChoiceTeacherId) {
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
    teacherNumber: teacher.teacherNumber,
    teacherName: teacher.teacherName,
    classroomId,
    classroomName,
    students: [
      createCandidateStudent(request),
    ],
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

export function generateCandidatesForRequest(
  input: AISchedulerInput,
  request: AISchedulerStudentRequest,
  scheduledLessons: AISchedulerInput["existingCourseLessons"] = [],
): AISchedulerCandidateGenerationResult {
  const candidates: AISchedulerCandidate[] = [];
  const rejectedReasons =
    new Set<AISchedulerUnassignedReason>();

  const teachers = getTeacherCandidates(
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

  for (const courseDay of input.courseDays) {
    for (const period of courseDay.periods) {
      for (const teacher of teachers) {
        for (const classroom of input.classrooms) {
          const candidate = createCandidate(
            request,
            courseDay.date,
            courseDay.weekday,
            period.periodNumber,
            teacher,
            classroom.id,
            classroom.name,
          );

          const validationResult =
            validateCandidate(candidate, {
              input,
              scheduledLessons,
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