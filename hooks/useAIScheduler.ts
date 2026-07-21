"use client";

import {
  useCallback,
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

export function useAIScheduler(): UseAISchedulerReturn {
  const [result, setResult] =
    useState<AISchedulerResult | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [isGenerating, setIsGenerating] =
    useState(false);

  const generateSchedule = useCallback(
    async (
      input: AISchedulerInput,
    ): Promise<AISchedulerResult | null> => {
      setIsGenerating(true);
      setError(null);

      try {
        await Promise.resolve();

        const generatedResult =
          createCourseSchedule(input);

        setResult(generatedResult);

        return generatedResult;
      } catch (caughtError) {
        const message =
          getErrorMessage(caughtError);

        setError(message);
        setResult(null);

        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsGenerating(false);
  }, []);

  return {
    result,
    error,
    isGenerating,
    generateSchedule,
    reset,
  };
}