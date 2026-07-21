import { optimizeSchedule } from "./optimizer";

import type {
  AISchedulerInput,
  AISchedulerResult,
} from "./types";

function validateInput(
  input: AISchedulerInput,
): void {
  if (!Number.isInteger(input.academicYear)) {
    throw new Error(
      "年度が正しく設定されていません。",
    );
  }

  if (input.courseDays.length === 0) {
    throw new Error(
      "講習期間が設定されていません。",
    );
  }

  if (input.studentRequests.length === 0) {
    throw new Error(
      "授業希望が登録されていません。",
    );
  }

  if (input.teachers.length === 0) {
    throw new Error(
      "講師が登録されていません。",
    );
  }

  if (input.classrooms.length === 0) {
    throw new Error(
      "教室が登録されていません。",
    );
  }

  if (
    !Number.isInteger(
      input.schoolMaximumStudents,
    ) ||
    input.schoolMaximumStudents <= 0
  ) {
    throw new Error(
      "授業の最大生徒数が正しく設定されていません。",
    );
  }

  for (const request of input.studentRequests) {
    if (!request.id) {
      throw new Error(
        "授業希望IDが設定されていません。",
      );
    }

    if (!request.studentId) {
      throw new Error(
        "生徒IDが設定されていません。",
      );
    }

    if (!request.subject) {
      throw new Error(
        `${request.studentName}の科目が設定されていません。`,
      );
    }

    if (
      !Number.isInteger(
        request.lessonCount,
      ) ||
      request.lessonCount <= 0
    ) {
      throw new Error(
        `${request.studentName}の授業回数が正しくありません。`,
      );
    }

    if (
      !Number.isInteger(
        request.preferredMaximumStudents,
      ) ||
      request.preferredMaximumStudents <= 0
    ) {
      throw new Error(
        `${request.studentName}の希望最大人数が正しくありません。`,
      );
    }
  }
}

export function createCourseSchedule(
  input: AISchedulerInput,
): AISchedulerResult {
  validateInput(input);

  return optimizeSchedule(input);
}