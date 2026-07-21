"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import {
  useAIScheduler,
} from "@/hooks/useAIScheduler";

import {
  buildAISchedulerInput,
} from "@/lib/ai-scheduler/buildInput";

import {
  toLessonWriteData,
} from "@/lib/ai-scheduler/toLessonWriteData";

import {
  getLessons,
  groupLessonsByCell,
  replaceCourseLessons,
} from "@/lib/firebase/lessons";

import type {
  AISchedulerResult,
} from "@/lib/ai-scheduler/types";

import type {
  Lesson,
} from "@/types/lesson";

import type {
  CourseType,
} from "@/types/schedule-settings";

type AISchedulerInput =
  Parameters<
    typeof buildAISchedulerInput
  >[0];

type LessonsByCell =
  ReturnType<
    typeof groupLessonsByCell
  >;

type UseAIScheduleCreationProps = {
  academicYear: number;

  courseType: CourseType;

  courseDates: string[];

  scheduleSettings:
    AISchedulerInput["scheduleSettings"];

  students:
    AISchedulerInput["students"];

  teachers:
    AISchedulerInput["teachers"];

  classrooms:
    AISchedulerInput["classrooms"];

  activeStudents:
    AISchedulerInput["students"];

  activeTeachers:
    AISchedulerInput["teachers"];

  studentSchedules:
    AISchedulerInput["studentSchedules"];

  teacherSchedules:
    AISchedulerInput["teacherSchedules"];

  lessons: Lesson[];

  setLessonsByCell: Dispatch<
    SetStateAction<LessonsByCell>
  >;

  setScheduleError: (
    message: string,
  ) => void;

  closeScheduleDialogs: () => void;
};

const AI_RESULT_STORAGE_PREFIX =
  "school-suite-ai-schedule-result";

function createAIResultStorageKey(
  academicYear: number,
  courseType: CourseType,
): string {
  return [
    AI_RESULT_STORAGE_PREFIX,
    academicYear,
    courseType,
  ].join(":");
}

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "AI時間割の保存中にエラーが発生しました。";
}

function calculateUnassignedCount(
  unassignedLessons: Array<{
    remainingLessonCount: number;
  }>,
): number {
  return unassignedLessons.reduce(
    (
      total,
      unassignedLesson,
    ) =>
      total +
      unassignedLesson
        .remainingLessonCount,
    0,
  );
}

function isAISchedulerResult(
  value: unknown,
): value is AISchedulerResult {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const result =
    value as Partial<AISchedulerResult>;

  return (
    Array.isArray(result.lessons) &&
    Array.isArray(
      result.unassignedLessons,
    ) &&
    typeof result.assignedLessonCount ===
      "number" &&
    typeof result.requestedLessonCount ===
      "number" &&
    typeof result.placementRate ===
      "number" &&
    typeof result.score === "object" &&
    result.score !== null
  );
}

function loadStoredAIScheduleResult(
  storageKey: string,
): AISchedulerResult | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue =
      window.localStorage.getItem(
        storageKey,
      );

    if (!storedValue) {
      return null;
    }

    const parsedValue: unknown =
      JSON.parse(storedValue);

    if (
      !isAISchedulerResult(
        parsedValue,
      )
    ) {
      window.localStorage.removeItem(
        storageKey,
      );

      return null;
    }

    return parsedValue;
  } catch (error) {
    console.error(
      "保存済みのAI時間割結果を読み込めませんでした。",
      error,
    );

    return null;
  }
}

function saveAIScheduleResult(
  storageKey: string,
  result: AISchedulerResult,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify(result),
    );
  } catch (error) {
    console.error(
      "AI時間割結果をブラウザへ保存できませんでした。",
      error,
    );
  }
}

function removeStoredAIScheduleResult(
  storageKey: string,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(
      storageKey,
    );
  } catch (error) {
    console.error(
      "保存済みのAI時間割結果を削除できませんでした。",
      error,
    );
  }
}

export function useAIScheduleCreation({
  academicYear,
  courseType,
  courseDates,
  scheduleSettings,
  students,
  teachers,
  classrooms,
  activeStudents,
  activeTeachers,
  studentSchedules,
  teacherSchedules,
  lessons,
  setLessonsByCell,
  setScheduleError,
  closeScheduleDialogs,
}: UseAIScheduleCreationProps) {
  const {
    error: aiSchedulerError,
    isGenerating,
    progress,
    progressMessage,
    generateSchedule,
    reset: resetAIScheduler,
  } = useAIScheduler();

  const aiResultStorageKey =
    useMemo(
      () =>
        createAIResultStorageKey(
          academicYear,
          courseType,
        ),
      [
        academicYear,
        courseType,
      ],
    );

  const [
    aiScheduleMessage,
    setAIScheduleMessage,
  ] = useState("");

  const [
    aiScheduleResult,
    setAIScheduleResult,
  ] =
    useState<AISchedulerResult | null>(
      null,
    );

  const [
    isSavingGeneratedSchedule,
    setIsSavingGeneratedSchedule,
  ] = useState(false);

  const isAIProcessing =
    isGenerating ||
    isSavingGeneratedSchedule;

  /*
   * 年度または講習種別が変わったときに、
   * 保存済みのAI時間割結果を復元します。
   */
  useEffect(() => {
    const storedResult =
      loadStoredAIScheduleResult(
        aiResultStorageKey,
      );

    setAIScheduleResult(
      storedResult,
    );

    setAIScheduleMessage("");
  }, [aiResultStorageKey]);

  /*
   * AI計算部分は最大90%まで表示し、
   * Firestore保存中は95%として表示します。
   */
  const displayedAIProgress =
    isSavingGeneratedSchedule
      ? 95
      : Math.min(progress, 90);

  const displayedAIProgressMessage =
    isSavingGeneratedSchedule
      ? "作成した時間割を保存しています。"
      : progressMessage ||
        "AI時間割を作成しています。";

  useEffect(() => {
    if (!aiSchedulerError) {
      return;
    }

    setScheduleError(
      aiSchedulerError,
    );
  }, [
    aiSchedulerError,
    setScheduleError,
  ]);

  /*
   * AIの進行状態だけを初期化します。
   *
   * 保存済みのAI作成結果は削除しないため、
   * 通常授業画面などへ移動して戻った後も
   * 結果が残ります。
   */
  const clearAIState =
    useCallback(() => {
      resetAIScheduler();

      setAIScheduleMessage("");

      setIsSavingGeneratedSchedule(
        false,
      );
    }, [resetAIScheduler]);

  const clearAIScheduleMessage =
    useCallback(() => {
      setAIScheduleMessage("");
    }, []);

  /*
   * 画面表示とブラウザ保存の両方から
   * AI時間割結果を削除します。
   */
  const clearAIScheduleResult =
    useCallback(() => {
      setAIScheduleResult(null);

      removeStoredAIScheduleResult(
        aiResultStorageKey,
      );
    }, [aiResultStorageKey]);

  const createOrRebuildWithAI =
    useCallback(async () => {
      if (isAIProcessing) {
        return;
      }

      try {
        setScheduleError("");
        setAIScheduleMessage("");

        /*
         * 次回のAI時間割作成を開始したため、
         * 前回の評価結果を削除します。
         */
        setAIScheduleResult(null);

        removeStoredAIScheduleResult(
          aiResultStorageKey,
        );

        setIsSavingGeneratedSchedule(
          false,
        );

        closeScheduleDialogs();
        resetAIScheduler();

        if (
          courseDates.length === 0
        ) {
          throw new Error(
            "講習期間が設定されていません。",
          );
        }

        if (
          activeStudents.length === 0
        ) {
          throw new Error(
            "AI時間割の対象となる在籍生徒がいません。",
          );
        }

        if (
          activeTeachers.length === 0
        ) {
          throw new Error(
            "AI時間割の対象となる在籍講師がいません。",
          );
        }

        if (
          classrooms.length === 0
        ) {
          throw new Error(
            "使用できる教室が設定されていません。",
          );
        }

        const input =
          buildAISchedulerInput({
            academicYear,

            courseType,

            scheduleSettings,

            students,

            teachers,

            classrooms,

            studentSchedules,

            teacherSchedules,

            lessons,

            preserveExistingLessons:
              false,
          });

        if (
          input.studentRequests
            .length === 0
        ) {
          throw new Error(
            "必要授業数が登録されている生徒がいません。生徒日程から必要授業数を設定してください。",
          );
        }

        if (
          input
            .studentAvailabilities
            .length === 0
        ) {
          throw new Error(
            "生徒の受講可能日程が登録されていません。",
          );
        }

        if (
          input
            .teacherAvailabilities
            .length === 0
        ) {
          throw new Error(
            "講師の出勤可能日程が登録されていません。",
          );
        }

        const generatedResult =
          await generateSchedule(
            input,
          );

        if (!generatedResult) {
          throw new Error(
            "AI時間割を作成できませんでした。入力内容を確認して、もう一度お試しください。",
          );
        }

        if (
          generatedResult
            .requestedLessonCount >
            0 &&
          generatedResult.lessons
            .length === 0
        ) {
          throw new Error(
            "配置可能な授業が見つかりませんでした。生徒日程、講師日程、教室設定を確認してください。",
          );
        }

        setIsSavingGeneratedSchedule(
          true,
        );

        const lessonWriteData =
          generatedResult.lessons.map(
            toLessonWriteData,
          );

        await replaceCourseLessons(
          academicYear,
          courseDates,
          lessonWriteData,
        );

        const savedLessons =
          await getLessons(
            academicYear,
          );

        setLessonsByCell(
          groupLessonsByCell(
            savedLessons,
          ),
        );

        const unassignedCount =
          calculateUnassignedCount(
            generatedResult
              .unassignedLessons,
          );

        const baseMessage =
          `AI時間割を作成しました。` +
          ` ${generatedResult.assignedLessonCount} / ` +
          `${generatedResult.requestedLessonCount}コマを配置しました。`;

        setAIScheduleMessage(
          unassignedCount > 0
            ? `${baseMessage} 未配置は${unassignedCount}コマです。`
            : `${baseMessage} すべての授業を配置できました。`,
        );

        /*
         * 授業のFirestore保存が成功した後に、
         * AI評価結果をブラウザへ保存します。
         */
        saveAIScheduleResult(
          aiResultStorageKey,
          generatedResult,
        );

        setAIScheduleResult(
          generatedResult,
        );
      } catch (error) {
        console.error(
          "AI時間割の作成・保存に失敗しました。",
          error,
        );

        setAIScheduleResult(null);

        setScheduleError(
          getErrorMessage(
            error,
          ),
        );
      } finally {
        setIsSavingGeneratedSchedule(
          false,
        );
      }
    }, [
      academicYear,
      activeStudents.length,
      activeTeachers.length,
      aiResultStorageKey,
      classrooms,
      closeScheduleDialogs,
      courseDates,
      courseType,
      generateSchedule,
      isAIProcessing,
      lessons,
      resetAIScheduler,
      scheduleSettings,
      setLessonsByCell,
      setScheduleError,
      studentSchedules,
      students,
      teacherSchedules,
      teachers,
    ]);

  return {
    aiScheduleMessage,

    aiScheduleResult,

    isAIProcessing,

    displayedAIProgress,

    displayedAIProgressMessage,

    clearAIState,

    clearAIScheduleMessage,

    clearAIScheduleResult,

    createOrRebuildWithAI,
  };
}