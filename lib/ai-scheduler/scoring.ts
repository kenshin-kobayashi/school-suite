import type { Lesson } from "@/types/lesson";

import {
  defaultAISchedulerScoreSettings,
  normalizeAISchedulerScoreSettings,
} from "./defaultScoreSettings";

import type {
  AISchedulerCandidate,
  AISchedulerInput,
  AISchedulerScoreResult,
  AISchedulerScoreSettings,
  AISchedulerStudentRequest,
} from "./types";

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(
    Math.max(value, minimum),
    maximum,
  );
}

function roundScore(
  value: number,
): number {
  return (
    Math.round(value * 100) / 100
  );
}

function getUniquePeriodNumbers(
  periodNumbers: number[],
): number[] {
  return Array.from(
    new Set(periodNumbers),
  ).sort(
    (periodA, periodB) =>
      periodA - periodB,
  );
}

function calculateIdlePeriodCount(
  periodNumbers: number[],
): number {
  const uniquePeriods =
    getUniquePeriodNumbers(
      periodNumbers,
    );

  if (uniquePeriods.length <= 1) {
    return 0;
  }

  const firstPeriod =
    uniquePeriods[0];

  const lastPeriod =
    uniquePeriods[
      uniquePeriods.length - 1
    ];

  return (
    lastPeriod -
    firstPeriod +
    1 -
    uniquePeriods.length
  );
}

/**
 * 候補を追加したときに、
 * 授業がどれだけ連続するかを
 * 0〜1で評価します。
 */
function calculateCompactnessRatio(
  existingPeriodNumbers: number[],
  candidatePeriodNumber: number,
): number {
  const beforePeriods =
    getUniquePeriodNumbers(
      existingPeriodNumbers,
    );

  const afterPeriods =
    getUniquePeriodNumbers([
      ...beforePeriods,
      candidatePeriodNumber,
    ]);

  /*
   * 同じ日に授業がまだない場合は、
   * 連続性を判断できないため中間評価。
   */
  if (beforePeriods.length === 0) {
    return 0.5;
  }

  /*
   * 既存授業へ生徒を追加する場合です。
   * 新しい空きコマを作らないため最高評価。
   */
  if (
    beforePeriods.includes(
      candidatePeriodNumber,
    )
  ) {
    return 1;
  }

  const beforeIdleCount =
    calculateIdlePeriodCount(
      beforePeriods,
    );

  const afterIdleCount =
    calculateIdlePeriodCount(
      afterPeriods,
    );

  const isAdjacent =
    beforePeriods.some(
      (periodNumber) =>
        Math.abs(
          periodNumber -
            candidatePeriodNumber,
        ) === 1,
    );

  /*
   * 既存の空きコマを埋める場合。
   */
  if (
    afterIdleCount <
    beforeIdleCount
  ) {
    return 1;
  }

  /*
   * 空きコマを増やさない場合。
   *
   * 連続コマなら最高評価、
   * 離れていても空きコマ数が
   * 増えなければ少し高めに評価します。
   */
  if (
    afterIdleCount ===
    beforeIdleCount
  ) {
    return isAdjacent
      ? 1
      : 0.75;
  }

  const addedIdleCount =
    afterIdleCount -
    beforeIdleCount;

  return clamp(
    1 -
      addedIdleCount * 0.25,
    0,
    1,
  );
}

function getLessonsForScoring(
  input: AISchedulerInput,
  scheduledLessons: Lesson[],
): Lesson[] {
  const preservedLessons =
    input.options
      .preserveExistingLessons
      ? input.existingCourseLessons
      : [];

  return [
    ...input.regularLessons,
    ...preservedLessons,
    ...scheduledLessons,
  ].filter(
    (lesson) =>
      lesson.status !== "cancelled",
  );
}

/**
 * 候補日と同じ日に実施される授業かを判定します。
 *
 * 通常授業：
 * 曜日が一致するか確認
 *
 * 講習授業：
 * 日付が一致するか確認
 */
function isLessonOnCandidateDay(
  lesson: Lesson,
  candidate: AISchedulerCandidate,
): boolean {
  if (
    lesson.scheduleMode === "regular"
  ) {
    return (
      lesson.weekday ===
      candidate.weekday
    );
  }

  return (
    lesson.date === candidate.date
  );
}

function getTeacherPeriodNumbers(
  lessons: Lesson[],
  teacherId: string,
  candidate: AISchedulerCandidate,
): number[] {
  return lessons
    .filter(
      (lesson) =>
        lesson.teacherId ===
          teacherId &&
        isLessonOnCandidateDay(
          lesson,
          candidate,
        ),
    )
    .map(
      (lesson) =>
        lesson.periodNumber,
    );
}

function getStudentPeriodNumbers(
  lessons: Lesson[],
  studentId: string,
  candidate: AISchedulerCandidate,
): number[] {
  return lessons
    .filter(
      (lesson) =>
        isLessonOnCandidateDay(
          lesson,
          candidate,
        ) &&
        lesson.students.some(
          (student) =>
            student.studentId ===
            studentId,
        ),
    )
    .map(
      (lesson) =>
        lesson.periodNumber,
    );
}

function getRequest(
  input: AISchedulerInput,
  requestId: string,
): AISchedulerStudentRequest | undefined {
  return input.studentRequests.find(
    (request) =>
      request.id === requestId,
  );
}

/**
 * 講師について、
 * 通常授業・既存講習・新規講習が
 * 連続コマになるほど高く評価します。
 */
function calculateTeacherIdleRatio(
  candidate: AISchedulerCandidate,
  lessons: Lesson[],
): number {
  const periodNumbers =
    getTeacherPeriodNumbers(
      lessons,
      candidate.teacherId,
      candidate,
    );

  return calculateCompactnessRatio(
    periodNumbers,
    candidate.periodNumber,
  );
}

/**
 * 生徒について、
 * 通常授業・既存講習・新規講習が
 * 連続コマになるほど高く評価します。
 */
function calculateStudentIdleRatio(
  candidate: AISchedulerCandidate,
  lessons: Lesson[],
): number {
  if (
    candidate.students.length === 0
  ) {
    return 0;
  }

  const totalRatio =
    candidate.students.reduce(
      (total, student) => {
        const periodNumbers =
          getStudentPeriodNumbers(
            lessons,
            student.studentId,
            candidate,
          );

        return (
          total +
          calculateCompactnessRatio(
            periodNumbers,
            candidate.periodNumber,
          )
        );
      },
      0,
    );

  return (
    totalRatio /
    candidate.students.length
  );
}

function calculateTeacherPreferenceRatio(
  candidate: AISchedulerCandidate,
  input: AISchedulerInput,
): number {
  if (
    candidate.students.length === 0
  ) {
    return 0;
  }

  const totalRatio =
    candidate.students.reduce(
      (total, student) => {
        const request = getRequest(
          input,
          student.requestId,
        );

        if (!request) {
          return total;
        }

        if (
          candidate.teacherId ===
          request.currentTeacherId
        ) {
          return total + 1;
        }

        if (
          candidate.teacherId ===
          request.firstChoiceTeacherId
        ) {
          return total + 0.8;
        }

        if (
          candidate.teacherId ===
          request.secondChoiceTeacherId
        ) {
          return total + 0.6;
        }

        return total + 0.3;
      },
      0,
    );

  return (
    totalRatio /
    candidate.students.length
  );
}

function calculateWeightedScore(
  ratio: number,
  weight: number,
): number {
  return roundScore(
    clamp(
      ratio,
      0,
      1,
    ) * weight,
  );
}

export function calculateCandidateScore(
  candidate: AISchedulerCandidate,
  input: AISchedulerInput,
  scheduledLessons: Lesson[] = [],
  settings?: AISchedulerScoreSettings,
): AISchedulerScoreResult {
  const normalizedSettings =
    normalizeAISchedulerScoreSettings(
      settings ??
        input.options
          .scoreSettings ??
        defaultAISchedulerScoreSettings,
    );

  const lessons =
    getLessonsForScoring(
      input,
      scheduledLessons,
    );

  const teacherIdleScore =
    calculateWeightedScore(
      calculateTeacherIdleRatio(
        candidate,
        lessons,
      ),
      normalizedSettings
        .teacherIdleWeight,
    );

  const studentIdleScore =
    calculateWeightedScore(
      calculateStudentIdleRatio(
        candidate,
        lessons,
      ),
      normalizedSettings
        .studentIdleWeight,
    );

  const teacherPreferenceScore =
    calculateWeightedScore(
      calculateTeacherPreferenceRatio(
        candidate,
        input,
      ),
      normalizedSettings
        .teacherPreferenceWeight,
    );

  const totalScore =
    roundScore(
      teacherIdleScore +
        studentIdleScore +
        teacherPreferenceScore,
    );

  return {
    totalScore,
    maxScore: 100,
    breakdown: {
      teacherIdleScore,
      studentIdleScore,
      teacherPreferenceScore,
    },
  };
}

export function scoreCandidate(
  candidate: AISchedulerCandidate,
  input: AISchedulerInput,
  scheduledLessons: Lesson[] = [],
): AISchedulerCandidate {
  return {
    ...candidate,
    score:
      calculateCandidateScore(
        candidate,
        input,
        scheduledLessons,
      ),
  };
}

export function scoreCandidates(
  candidates: AISchedulerCandidate[],
  input: AISchedulerInput,
  scheduledLessons: Lesson[] = [],
): AISchedulerCandidate[] {
  return candidates
    .map((candidate) =>
      scoreCandidate(
        candidate,
        input,
        scheduledLessons,
      ),
    )
    .sort(
      (
        candidateA,
        candidateB,
      ) =>
        candidateB.score
          .totalScore -
        candidateA.score
          .totalScore,
    );
}