"use client";

import {
  useCallback,
  useEffect,
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

  const clearAIState =
    useCallback(() => {
      resetAIScheduler();

      setAIScheduleMessage("");
      setAIScheduleResult(null);

      setIsSavingGeneratedSchedule(
        false,
      );
    }, [resetAIScheduler]);

  const clearAIScheduleMessage =
    useCallback(() => {
      setAIScheduleMessage("");
    }, []);

  const clearAIScheduleResult =
    useCallback(() => {
      setAIScheduleResult(null);
    }, []);

  const createOrRebuildWithAI =
    useCallback(async () => {
      if (isAIProcessing) {
        return;
      }

      try {
        setScheduleError("");
        setAIScheduleMessage("");
        setAIScheduleResult(null);

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
         * Firestoreへの保存まで成功した結果だけを
         * 画面へ表示します。
         */
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