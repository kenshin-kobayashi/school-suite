"use client";

import {
  useCallback,
  useRef,
  useState,
} from "react";

import { createCourseSchedule } from "@/lib/ai-scheduler/createCourseSchedule";

import type {
  AISchedulerInput,
  AISchedulerResult,
} from "@/lib/ai-scheduler/types";

type UseAISchedulerReturn = {
  result: AISchedulerResult | null;
  error: string | null;

  isGenerating: boolean;

  progress: number;
  progressMessage: string;

  generateSchedule: (
    input: AISchedulerInput,
  ) => Promise<AISchedulerResult | null>;

  reset: () => void;
};

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "AI時間割の作成中にエラーが発生しました。";
}

/**
 * Reactの描画更新を挟むための待機処理です。
 */
function wait(
  milliseconds: number,
): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(
      resolve,
      milliseconds,
    );
  });
}

export function useAIScheduler(): UseAISchedulerReturn {
  const [result, setResult] =
    useState<AISchedulerResult | null>(
      null,
    );

  const [error, setError] =
    useState<string | null>(null);

  const [
    isGenerating,
    setIsGenerating,
  ] = useState(false);

  const [progress, setProgress] =
    useState(0);

  const [
    progressMessage,
    setProgressMessage,
  ] = useState("");

  /*
   * 同時に複数回実行されることを防ぎます。
   */
  const isRunningRef =
    useRef(false);

  /*
   * reset後に古い処理結果が反映されることを
   * 防ぐための実行番号です。
   */
  const generationIdRef =
    useRef(0);

  const generateSchedule =
    useCallback(
      async (
        input: AISchedulerInput,
      ): Promise<AISchedulerResult | null> => {
        if (isRunningRef.current) {
          return null;
        }

        isRunningRef.current = true;

        const generationId =
          generationIdRef.current + 1;

        generationIdRef.current =
          generationId;

        setIsGenerating(true);
        setError(null);
        setResult(null);

        setProgress(5);
        setProgressMessage(
          "時間割データを確認しています。",
        );

        try {
          /*
           * 画面へ進捗表示を反映してから
           * 次の処理へ進みます。
           */
          await wait(100);

          if (
            generationId !==
            generationIdRef.current
          ) {
            return null;
          }

          setProgress(20);
          setProgressMessage(
            "生徒と講師の予定を整理しています。",
          );

          await wait(100);

          if (
            generationId !==
            generationIdRef.current
          ) {
            return null;
          }

          setProgress(35);
          setProgressMessage(
            "授業候補を作成しています。",
          );

          await wait(100);

          if (
            generationId !==
            generationIdRef.current
          ) {
            return null;
          }

          setProgress(50);
          setProgressMessage(
            "最適な組み合わせを計算しています。",
          );

          /*
           * 現在のcreateCourseScheduleは同期処理です。
           * この処理中は50%の表示になります。
           */
          const generatedResult =
            createCourseSchedule(
              input,
            );

          if (
            generationId !==
            generationIdRef.current
          ) {
            return null;
          }

          setProgress(90);
          setProgressMessage(
            "作成結果を整理しています。",
          );

          await wait(150);

          if (
            generationId !==
            generationIdRef.current
          ) {
            return null;
          }

          setResult(
            generatedResult,
          );

          setProgress(100);
          setProgressMessage(
            "AI時間割を作成しました。",
          );

          await wait(300);

          return generatedResult;
        } catch (caughtError) {
          if (
            generationId !==
            generationIdRef.current
          ) {
            return null;
          }

          const message =
            getErrorMessage(
              caughtError,
            );

          setError(message);
          setResult(null);

          setProgress(0);
          setProgressMessage("");

          return null;
        } finally {
          if (
            generationId ===
            generationIdRef.current
          ) {
            isRunningRef.current =
              false;

            setIsGenerating(false);
          }
        }
      },
      [],
    );

  const reset = useCallback(() => {
    /*
     * 実行番号を更新して、
     * 進行中の古い結果を無効にします。
     */
    generationIdRef.current += 1;
    isRunningRef.current = false;

    setResult(null);
    setError(null);

    setIsGenerating(false);

    setProgress(0);
    setProgressMessage("");
  }, []);

  return {
    result,
    error,

    isGenerating,

    progress,
    progressMessage,

    generateSchedule,
    reset,
  };
}