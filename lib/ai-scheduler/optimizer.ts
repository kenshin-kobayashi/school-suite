import type { Lesson } from "@/types/lesson";

import {
  generateCandidatesForRequest,
  type AISchedulerCandidateGenerationResult,
} from "./candidates";
import { validateCandidate } from "./constraints";
import { scoreCandidates } from "./scoring";

import type {
  AISchedulerCandidate,
  AISchedulerInput,
  AISchedulerResult,
  AISchedulerStudentRequest,
  AISchedulerUnassignedLesson,
  AISchedulerUnassignedReason,
} from "./types";

type RequestTask = {
  request: AISchedulerStudentRequest;
  remainingLessonCount: number;
};

type RequestCandidateSet = {
  task: RequestTask;
  generationResult: AISchedulerCandidateGenerationResult;
  candidates: AISchedulerCandidate[];
};

type BeamState = {
  tasks: RequestTask[];
  scheduledLessons: Lesson[];
  selectedCandidates: AISchedulerCandidate[];
  unassignedLessons: AISchedulerUnassignedLesson[];
  totalCandidateScore: number;
};

const BEAM_WIDTH = 24;
const CANDIDATES_PER_BRANCH = 8;

const reasonPriority: AISchedulerUnassignedReason[] = [
  "closed-day",
  "invalid-period",
  "student-unavailable",
  "teacher-unavailable",
  "teacher-not-qualified",
  "teacher-excluded",
  "student-conflict",
  "teacher-conflict",
  "classroom-conflict",
  "classroom-unavailable",
  "classroom-capacity",
  "maximum-students",
  "existing-lesson-conflict",
  "no-candidate",
];

function getExistingLessonCount(
  input: AISchedulerInput,
  request: AISchedulerStudentRequest,
): number {
  if (
    !input.options.preserveExistingLessons
  ) {
    return 0;
  }

  return input.existingCourseLessons.filter(
    (lesson) =>
      lesson.scheduleMode === "course" &&
      lesson.status !== "cancelled" &&
      lesson.students.some(
        (student) =>
          student.studentId ===
            request.studentId &&
          student.subject ===
            request.subject,
      ),
  ).length;
}

function createRequestTasks(
  input: AISchedulerInput,
): RequestTask[] {
  return input.studentRequests
    .map((request) => {
      const existingLessonCount =
        getExistingLessonCount(
          input,
          request,
        );

      return {
        request,
        remainingLessonCount: Math.max(
          request.lessonCount -
            existingLessonCount,
          0,
        ),
      };
    })
    .filter(
      (task) =>
        task.remainingLessonCount > 0,
    );
}

function cloneTasks(
  tasks: RequestTask[],
): RequestTask[] {
  return tasks.map((task) => ({
    request: task.request,
    remainingLessonCount:
      task.remainingLessonCount,
  }));
}

function candidateToLesson(
  candidate: AISchedulerCandidate,
  input: AISchedulerInput,
): Lesson {
  return {
    academicYear: input.academicYear,
    position: {
      columnId: candidate.date,
      periodId: `period-${candidate.periodNumber}`,
    },
    scheduleMode: "course",
    weekday: candidate.weekday,
    date: candidate.date,
    periodNumber:
      candidate.periodNumber,
    teacherId: candidate.teacherId,
    teacherNumber:
      candidate.teacherNumber,
    teacherName:
      candidate.teacherName,
    classroomId:
      candidate.classroomId,
    classroomName:
      candidate.classroomName,
    students: candidate.students.map(
      (student) => ({
        studentId:
          student.studentId,
        studentNumber:
          student.studentNumber,
        studentName:
          student.studentName,
        grade: student.grade,
        subject: student.subject,
      }),
    ),
    status: "scheduled",
    source: "ai",
  };
}

function isSameScheduledLesson(
  lesson: Lesson,
  candidate: AISchedulerCandidate,
): boolean {
  return (
    lesson.scheduleMode === "course" &&
    lesson.status !== "cancelled" &&
    lesson.date === candidate.date &&
    lesson.periodNumber ===
      candidate.periodNumber &&
    lesson.teacherId ===
      candidate.teacherId &&
    lesson.classroomId ===
      candidate.classroomId
  );
}

function applyCandidateToLessons(
  scheduledLessons: Lesson[],
  candidate: AISchedulerCandidate,
  input: AISchedulerInput,
): Lesson[] {
  const nextLesson =
    candidateToLesson(
      candidate,
      input,
    );

  const existingLessonIndex =
    scheduledLessons.findIndex(
      (lesson) =>
        isSameScheduledLesson(
          lesson,
          candidate,
        ),
    );

  if (existingLessonIndex === -1) {
    return [
      ...scheduledLessons,
      nextLesson,
    ];
  }

  return scheduledLessons.map(
    (lesson, index) =>
      index === existingLessonIndex
        ? nextLesson
        : lesson,
  );
}

function getUnassignedReason(
  reasons: AISchedulerUnassignedReason[],
): AISchedulerUnassignedReason {
  for (const reason of reasonPriority) {
    if (reasons.includes(reason)) {
      return reason;
    }
  }

  return "no-candidate";
}

function createUnassignedLesson(
  task: RequestTask,
  reasons: AISchedulerUnassignedReason[],
): AISchedulerUnassignedLesson {
  return {
    requestId: task.request.id,
    studentId:
      task.request.studentId,
    studentName:
      task.request.studentName,
    grade: task.request.grade,
    subject: task.request.subject,
    remainingLessonCount:
      task.remainingLessonCount,
    reason:
      getUnassignedReason(reasons),
  };
}

function createCandidateSet(
  input: AISchedulerInput,
  task: RequestTask,
  scheduledLessons: Lesson[],
): RequestCandidateSet {
  const generationResult =
    generateCandidatesForRequest(
      input,
      task.request,
      scheduledLessons,
    );

  const validCandidates =
    generationResult.candidates.filter(
      (candidate) => {
        const mergeTarget =
          scheduledLessons.find(
            (lesson) =>
              isSameScheduledLesson(
                lesson,
                candidate,
              ),
          );

        const lessonsForValidation =
          mergeTarget
            ? scheduledLessons.filter(
                (lesson) =>
                  lesson !== mergeTarget,
              )
            : scheduledLessons;

        return validateCandidate(
          candidate,
          {
            input,
            scheduledLessons:
              lessonsForValidation,
          },
        ).valid;
      },
    );

  return {
    task,
    generationResult,
    candidates: scoreCandidates(
      validCandidates,
      input,
      scheduledLessons,
    ),
  };
}

function compareCandidateSets(
  setA: RequestCandidateSet,
  setB: RequestCandidateSet,
): number {
  if (
    setA.candidates.length !==
    setB.candidates.length
  ) {
    return (
      setA.candidates.length -
      setB.candidates.length
    );
  }

  const highestScoreA =
    setA.candidates[0]?.score
      .totalScore ?? 0;

  const highestScoreB =
    setB.candidates[0]?.score
      .totalScore ?? 0;

  if (
    highestScoreA !== highestScoreB
  ) {
    return (
      highestScoreB -
      highestScoreA
    );
  }

  if (
    setA.task.remainingLessonCount !==
    setB.task.remainingLessonCount
  ) {
    return (
      setB.task.remainingLessonCount -
      setA.task.remainingLessonCount
    );
  }

  return setA.task.request.studentName.localeCompare(
    setB.task.request.studentName,
    "ja",
  );
}

function selectNextCandidateSet(
  input: AISchedulerInput,
  state: BeamState,
): RequestCandidateSet | null {
  if (state.tasks.length === 0) {
    return null;
  }

  const candidateSets =
    state.tasks.map((task) =>
      createCandidateSet(
        input,
        task,
        state.scheduledLessons,
      ),
    );

  candidateSets.sort(
    compareCandidateSets,
  );

  return candidateSets[0] ?? null;
}

function removeTask(
  tasks: RequestTask[],
  requestId: string,
): RequestTask[] {
  return tasks.filter(
    (task) =>
      task.request.id !== requestId,
  );
}

function decrementTask(
  tasks: RequestTask[],
  requestId: string,
): RequestTask[] {
  return tasks.flatMap((task) => {
    if (
      task.request.id !== requestId
    ) {
      return [
        {
          request: task.request,
          remainingLessonCount:
            task.remainingLessonCount,
        },
      ];
    }

    const nextRemainingLessonCount =
      task.remainingLessonCount - 1;

    if (
      nextRemainingLessonCount <= 0
    ) {
      return [];
    }

    return [
      {
        request: task.request,
        remainingLessonCount:
          nextRemainingLessonCount,
      },
    ];
  });
}

function expandState(
  input: AISchedulerInput,
  state: BeamState,
): BeamState[] {
  const selectedSet =
    selectNextCandidateSet(
      input,
      state,
    );

  if (!selectedSet) {
    return [state];
  }

  if (
    selectedSet.candidates.length === 0
  ) {
    return [
      {
        tasks: removeTask(
          state.tasks,
          selectedSet.task.request.id,
        ),
        scheduledLessons: [
          ...state.scheduledLessons,
        ],
        selectedCandidates: [
          ...state.selectedCandidates,
        ],
        unassignedLessons: [
          ...state.unassignedLessons,
          createUnassignedLesson(
            selectedSet.task,
            selectedSet.generationResult
              .rejectedReasons,
          ),
        ],
        totalCandidateScore:
          state.totalCandidateScore,
      },
    ];
  }

  return selectedSet.candidates
    .slice(
      0,
      CANDIDATES_PER_BRANCH,
    )
    .map((candidate) => ({
      tasks: decrementTask(
        state.tasks,
        selectedSet.task.request.id,
      ),
      scheduledLessons:
        applyCandidateToLessons(
          state.scheduledLessons,
          candidate,
          input,
        ),
      selectedCandidates: [
        ...state.selectedCandidates,
        candidate,
      ],
      unassignedLessons: [
        ...state.unassignedLessons,
      ],
      totalCandidateScore:
        state.totalCandidateScore +
        candidate.score.totalScore,
    }));
}

function getRemainingLessonCount(
  state: BeamState,
): number {
  return state.tasks.reduce(
    (total, task) =>
      total +
      task.remainingLessonCount,
    0,
  );
}

function getUnassignedLessonCount(
  state: BeamState,
): number {
  return state.unassignedLessons.reduce(
    (total, lesson) =>
      total +
      lesson.remainingLessonCount,
    0,
  );
}

function getAverageCandidateScore(
  state: BeamState,
): number {
  if (
    state.selectedCandidates.length === 0
  ) {
    return 0;
  }

  return (
    state.totalCandidateScore /
    state.selectedCandidates.length
  );
}

function compareBeamStates(
  stateA: BeamState,
  stateB: BeamState,
): number {
  const assignedDifference =
    stateB.selectedCandidates.length -
    stateA.selectedCandidates.length;

  if (assignedDifference !== 0) {
    return assignedDifference;
  }

  const unresolvedDifference =
    getRemainingLessonCount(stateA) -
    getRemainingLessonCount(stateB);

  if (unresolvedDifference !== 0) {
    return unresolvedDifference;
  }

  const unassignedDifference =
    getUnassignedLessonCount(stateA) -
    getUnassignedLessonCount(stateB);

  if (unassignedDifference !== 0) {
    return unassignedDifference;
  }

  const averageScoreDifference =
    getAverageCandidateScore(stateB) -
    getAverageCandidateScore(stateA);

  if (averageScoreDifference !== 0) {
    return averageScoreDifference;
  }

  return (
    stateB.totalCandidateScore -
    stateA.totalCandidateScore
  );
}

function createStateSignature(
  state: BeamState,
): string {
  const tasksSignature =
    [...state.tasks]
      .sort((taskA, taskB) =>
        taskA.request.id.localeCompare(
          taskB.request.id,
        ),
      )
      .map(
        (task) =>
          `${task.request.id}:${task.remainingLessonCount}`,
      )
      .join("|");

  const lessonsSignature =
    state.scheduledLessons
      .map((lesson) => {
        const studentSignature =
          lesson.students
            .map(
              (student) =>
                `${student.studentId}:${student.subject}`,
            )
            .sort()
            .join(",");

        return [
          lesson.date ?? "",
          lesson.periodNumber,
          lesson.teacherId,
          lesson.classroomId ?? "",
          studentSignature,
        ].join(":");
      })
      .sort()
      .join("|");

  const unassignedSignature =
    state.unassignedLessons
      .map(
        (lesson) =>
          `${lesson.requestId}:${lesson.remainingLessonCount}:${lesson.reason}`,
      )
      .sort()
      .join("|");

  return [
    tasksSignature,
    lessonsSignature,
    unassignedSignature,
  ].join("||");
}

function pruneBeam(
  states: BeamState[],
): BeamState[] {
  const uniqueStates =
    new Map<string, BeamState>();

  for (const state of states) {
    const signature =
      createStateSignature(state);

    const currentState =
      uniqueStates.get(signature);

    if (
      !currentState ||
      compareBeamStates(
        state,
        currentState,
      ) < 0
    ) {
      uniqueStates.set(
        signature,
        state,
      );
    }
  }

  return Array.from(
    uniqueStates.values(),
  )
    .sort(compareBeamStates)
    .slice(0, BEAM_WIDTH);
}

function completeState(
  state: BeamState,
): BeamState {
  if (state.tasks.length === 0) {
    return state;
  }

  return {
    tasks: [],
    scheduledLessons: [
      ...state.scheduledLessons,
    ],
    selectedCandidates: [
      ...state.selectedCandidates,
    ],
    unassignedLessons: [
      ...state.unassignedLessons,
      ...state.tasks.map((task) =>
        createUnassignedLesson(
          task,
          ["no-candidate"],
        ),
      ),
    ],
    totalCandidateScore:
      state.totalCandidateScore,
  };
}

function calculateMaximumIterations(
  tasks: RequestTask[],
): number {
  const requestedCount =
    tasks.reduce(
      (total, task) =>
        total +
        task.remainingLessonCount,
      0,
    );

  return (
    requestedCount +
    tasks.length +
    1
  );
}

function runBeamSearch(
  input: AISchedulerInput,
  tasks: RequestTask[],
): BeamState {
  let beam: BeamState[] = [
    {
      tasks: cloneTasks(tasks),
      scheduledLessons: [],
      selectedCandidates: [],
      unassignedLessons: [],
      totalCandidateScore: 0,
    },
  ];

  const maximumIterations =
    calculateMaximumIterations(
      tasks,
    );

  for (
    let iteration = 0;
    iteration < maximumIterations;
    iteration += 1
  ) {
    if (
      beam.every(
        (state) =>
          state.tasks.length === 0,
      )
    ) {
      break;
    }

    const expandedStates =
      beam.flatMap((state) => {
        if (
          state.tasks.length === 0
        ) {
          return [state];
        }

        return expandState(
          input,
          state,
        );
      });

    beam = pruneBeam(
      expandedStates,
    );
  }

  const completedStates =
    beam
      .map(completeState)
      .sort(compareBeamStates);

  return (
    completedStates[0] ?? {
      tasks: [],
      scheduledLessons: [],
      selectedCandidates: [],
      unassignedLessons: [],
      totalCandidateScore: 0,
    }
  );
}

function calculateResultScore(
  selectedCandidates: AISchedulerCandidate[],
): AISchedulerResult["score"] {
  if (
    selectedCandidates.length === 0
  ) {
    return {
      totalScore: 0,
      maxScore: 100,
      breakdown: {
        teacherIdleScore: 0,
        studentIdleScore: 0,
        teacherPreferenceScore: 0,
      },
    };
  }

  const totals =
    selectedCandidates.reduce(
      (result, candidate) => ({
        totalScore:
          result.totalScore +
          candidate.score.totalScore,
        teacherIdleScore:
          result.teacherIdleScore +
          candidate.score.breakdown
            .teacherIdleScore,
        studentIdleScore:
          result.studentIdleScore +
          candidate.score.breakdown
            .studentIdleScore,
        teacherPreferenceScore:
          result.teacherPreferenceScore +
          candidate.score.breakdown
            .teacherPreferenceScore,
      }),
      {
        totalScore: 0,
        teacherIdleScore: 0,
        studentIdleScore: 0,
        teacherPreferenceScore: 0,
      },
    );

  const candidateCount =
    selectedCandidates.length;

  return {
    totalScore: Math.round(
      totals.totalScore /
        candidateCount,
    ),
    maxScore: 100,
    breakdown: {
      teacherIdleScore:
        Math.round(
          totals.teacherIdleScore /
            candidateCount,
        ),
      studentIdleScore:
        Math.round(
          totals.studentIdleScore /
            candidateCount,
        ),
      teacherPreferenceScore:
        Math.round(
          totals.teacherPreferenceScore /
            candidateCount,
        ),
    },
  };
}

function calculateRequestedLessonCount(
  input: AISchedulerInput,
): number {
  return input.studentRequests.reduce(
    (total, request) =>
      total +
      request.lessonCount,
    0,
  );
}

function calculatePreservedLessonCount(
  input: AISchedulerInput,
): number {
  if (
    !input.options
      .preserveExistingLessons
  ) {
    return 0;
  }

  return input.studentRequests.reduce(
    (total, request) =>
      total +
      Math.min(
        getExistingLessonCount(
          input,
          request,
        ),
        request.lessonCount,
      ),
    0,
  );
}

export function optimizeSchedule(
  input: AISchedulerInput,
): AISchedulerResult {
  const tasks =
    createRequestTasks(input);

  const bestState =
    runBeamSearch(
      input,
      tasks,
    );

  const requestedLessonCount =
    calculateRequestedLessonCount(
      input,
    );

  const preservedLessonCount =
    calculatePreservedLessonCount(
      input,
    );

  /*
   * scheduledLessons.length ではなく、
   * 配置した生徒コマ数を数えます。
   *
   * 1対2の場合、授業データは1件でも
   * 配置済みコマ数は2件になります。
   */
  const assignedLessonCount =
    Math.min(
      requestedLessonCount,
      preservedLessonCount +
        bestState.selectedCandidates.length,
    );

  const placementRate =
    requestedLessonCount === 0
      ? 100
      : Math.round(
          (assignedLessonCount /
            requestedLessonCount) *
            10000,
        ) / 100;

  return {
    lessons:
      bestState.scheduledLessons,
    unassignedLessons:
      bestState.unassignedLessons,
    score: calculateResultScore(
      bestState.selectedCandidates,
    ),
    requestedLessonCount,
    assignedLessonCount,
    placementRate,
  };
}