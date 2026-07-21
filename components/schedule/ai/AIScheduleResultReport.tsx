"use client";

import {
  useMemo,
} from "react";

import type {
  AISchedulerResult,
  AISchedulerUnassignedReason,
} from "@/lib/ai-scheduler/types";

import type {
  AiScheduleWeights,
} from "@/types/schedule-settings";

type AIScheduleResultReportProps = {
  result: AISchedulerResult | null;
  aiWeights: AiScheduleWeights;
};

type EvaluationRank =
  | "S"
  | "A"
  | "B"
  | "C"
  | "D";

const UNASSIGNED_REASON_LABELS: Record<
  AISchedulerUnassignedReason,
  string
> = {
  "student-unavailable":
    "生徒の受講可能日時が不足しています",

  "teacher-unavailable":
    "講師の出勤可能日時が不足しています",

  "teacher-not-qualified":
    "指導可能な講師がいません",

  "teacher-excluded":
    "希望条件に合う講師がいません",

  "student-conflict":
    "生徒の授業が重複しています",

  "teacher-conflict":
    "講師の授業が重複しています",

  "classroom-conflict":
    "教室の使用時間が重複しています",

  "classroom-unavailable":
    "使用可能な教室がありません",

  "classroom-capacity":
    "教室の収容人数を超えています",

  "maximum-students":
    "授業の最大人数を超えています",

  "closed-day":
    "休校日に該当しています",

  "invalid-period":
    "利用できないコマが指定されています",

  "existing-lesson-conflict":
    "既存授業と重複しています",

  "no-candidate":
    "配置可能な候補が見つかりません",
};

function normalizePercentage(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const percentage =
    value <= 1
      ? value * 100
      : value;

  return Math.max(
    0,
    Math.min(
      100,
      percentage,
    ),
  );
}

function formatPercentage(
  value: number,
): string {
  return normalizePercentage(
    value,
  ).toFixed(1);
}

function formatScore(
  value: number,
): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return value.toLocaleString(
    "ja-JP",
    {
      maximumFractionDigits: 1,
    },
  );
}

function getScorePercentage(
  totalScore: number,
  maxScore: number,
): number {
  if (
    !Number.isFinite(totalScore) ||
    !Number.isFinite(maxScore) ||
    maxScore <= 0
  ) {
    return 0;
  }

  return normalizePercentage(
    totalScore / maxScore,
  );
}

function getEvaluationRank(
  scorePercentage: number,
): EvaluationRank {
  if (scorePercentage >= 95) {
    return "S";
  }

  if (scorePercentage >= 85) {
    return "A";
  }

  if (scorePercentage >= 70) {
    return "B";
  }

  if (scorePercentage >= 50) {
    return "C";
  }

  return "D";
}

function getEvaluationLabel(
  rank: EvaluationRank,
): string {
  switch (rank) {
    case "S":
      return "非常に優れた時間割です";

    case "A":
      return "優れた時間割です";

    case "B":
      return "良好な時間割です";

    case "C":
      return "改善の余地があります";

    case "D":
      return "条件の見直しが必要です";
  }
}

function getStarDisplay(
  scorePercentage: number,
): string {
  if (scorePercentage >= 95) {
    return "★★★★★";
  }

  if (scorePercentage >= 85) {
    return "★★★★☆";
  }

  if (scorePercentage >= 70) {
    return "★★★☆☆";
  }

  if (scorePercentage >= 50) {
    return "★★☆☆☆";
  }

  return "★☆☆☆☆";
}

export default function AIScheduleResultReport({
  result,
  aiWeights,
}: AIScheduleResultReportProps) {
  const unassignedLessonCount =
    useMemo(
      () =>
        result?.unassignedLessons.reduce(
          (
            total,
            unassignedLesson,
          ) =>
            total +
            unassignedLesson
              .remainingLessonCount,
          0,
        ) ?? 0,
      [result],
    );

  const scorePercentage =
    useMemo(() => {
      if (!result) {
        return 0;
      }

      return getScorePercentage(
        result.score.totalScore,
        result.score.maxScore,
      );
    }, [result]);

  const evaluationRank =
    useMemo(
      () =>
        getEvaluationRank(
          scorePercentage,
        ),
      [scorePercentage],
    );

  if (!result) {
    return null;
  }

  return (
    <section
      className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
      aria-labelledby="ai-result-title"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
          AI Schedule Result
        </p>

        <h2
          id="ai-result-title"
          className="mt-2 text-xl font-semibold tracking-tight text-zinc-950"
        >
          AI時間割 作成結果
        </h2>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          AI時間割の配置結果と評価内容です。
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ResultItem
          label="配置率"
          value={
            formatPercentage(
              result.placementRate,
            )
          }
          unit="%"
        />

        <ResultItem
          label="配置済み"
          value={String(
            result.assignedLessonCount,
          )}
          unit="コマ"
        />

        <ResultItem
          label="必要授業数"
          value={String(
            result.requestedLessonCount,
          )}
          unit="コマ"
        />

        <div
          className={[
            "rounded-2xl border p-4",

            unassignedLessonCount > 0
              ? "border-amber-200 bg-amber-50"
              : "border-emerald-200 bg-emerald-50",
          ].join(" ")}
        >
          <p
            className={[
              "text-xs font-medium",

              unassignedLessonCount > 0
                ? "text-amber-700"
                : "text-emerald-700",
            ].join(" ")}
          >
            未配置
          </p>

          <p
            className={[
              "mt-2 text-2xl font-bold tracking-tight",

              unassignedLessonCount > 0
                ? "text-amber-900"
                : "text-emerald-900",
            ].join(" ")}
          >
            {unassignedLessonCount}

            <span
              className={[
                "ml-1 text-sm font-semibold",

                unassignedLessonCount > 0
                  ? "text-amber-700"
                  : "text-emerald-700",
              ].join(" ")}
            >
              コマ
            </span>
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 p-4 sm:p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
              Total Evaluation
            </p>

            <h3 className="mt-2 text-sm font-semibold text-zinc-900">
              総合評価
            </h3>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              空きコマと担当・希望講師の条件をもとに評価しています。
            </p>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right">
              <p
                className="text-lg tracking-[0.12em] text-zinc-800"
                aria-label={`${evaluationRank}ランク`}
              >
                {getStarDisplay(
                  scorePercentage,
                )}
              </p>

              <p className="mt-1 text-sm font-semibold text-zinc-700">
                {getEvaluationLabel(
                  evaluationRank,
                )}
              </p>
            </div>

            <div className="min-w-24 rounded-2xl bg-zinc-950 px-5 py-4 text-center text-white">
              <p className="text-3xl font-bold tracking-tight">
                {evaluationRank}
              </p>

              <p className="mt-1 text-xs font-semibold text-zinc-300">
                ランク
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-sm font-semibold text-zinc-700">
            評価スコア
          </p>

          <p className="text-xl font-bold tracking-tight text-zinc-950">
            {formatScore(
              result.score.totalScore,
            )}

            <span className="mx-1 text-sm font-medium text-zinc-400">
              /
            </span>

            <span className="text-sm font-semibold text-zinc-500">
              {formatScore(
                result.score.maxScore,
              )}
              点
            </span>
          </p>
        </div>

        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100"
          role="progressbar"
          aria-label="AI時間割評価スコア"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={
            scorePercentage
          }
        >
          <div
            className="h-full rounded-full bg-zinc-900 transition-[width] duration-500"
            style={{
              width: `${scorePercentage}%`,
            }}
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <ScoreItem
            label="講師空きコマ評価"
            value={
              result.score.breakdown
                .teacherIdleScore
            }
            maxValue={
              aiWeights.teacherGap
            }
          />

          <ScoreItem
            label="生徒空きコマ評価"
            value={
              result.score.breakdown
                .studentIdleScore
            }
            maxValue={
              aiWeights.studentGap
            }
          />

          <ScoreItem
            label="担当・希望講師評価"
            value={
              result.score.breakdown
                .teacherPreferenceScore
            }
            maxValue={
              aiWeights.teacherPreference
            }
          />
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              未配置授業
            </h3>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              配置できなかった授業と主な理由です。
            </p>
          </div>

          <span
            className={[
              "inline-flex rounded-full px-3 py-1 text-xs font-semibold",

              unassignedLessonCount > 0
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-800",
            ].join(" ")}
          >
            {unassignedLessonCount}
            コマ
          </span>
        </div>

        {result.unassignedLessons
          .length === 0 ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-5">
            <p className="text-sm font-semibold text-emerald-800">
              すべての授業を配置できました。
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                      生徒
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                      学年
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                      教科
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-zinc-500">
                      未配置
                    </th>

                    <th className="min-w-[260px] px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                      理由
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100 bg-white">
                  {result.unassignedLessons.map(
                    (
                      unassignedLesson,
                      index,
                    ) => (
                      <tr
                        key={[
                          unassignedLesson
                            .requestId,
                          unassignedLesson
                            .reason,
                          index,
                        ].join("-")}
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-zinc-900">
                          {
                            unassignedLesson
                              .studentName
                          }
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                          {
                            unassignedLesson
                              .grade
                          }
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                          {
                            unassignedLesson
                              .subject
                          }
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-amber-700">
                          {
                            unassignedLesson
                              .remainingLessonCount
                          }
                          コマ
                        </td>

                        <td className="px-4 py-3 text-sm leading-6 text-zinc-600">
                          {
                            UNASSIGNED_REASON_LABELS[
                              unassignedLesson
                                .reason
                            ]
                          }
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

type ResultItemProps = {
  label: string;
  value: string;
  unit: string;
};

function ResultItem({
  label,
  value,
  unit,
}: ResultItemProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-xs font-medium text-zinc-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-950">
        {value}

        <span className="ml-1 text-sm font-semibold text-zinc-500">
          {unit}
        </span>
      </p>
    </div>
  );
}

type ScoreItemProps = {
  label: string;
  value: number;
  maxValue: number;
};

function ScoreItem({
  label,
  value,
  maxValue,
}: ScoreItemProps) {
  return (
    <div className="rounded-xl bg-zinc-50 px-4 py-3">
      <p className="text-xs font-medium text-zinc-500">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold tracking-tight text-zinc-950">
        {formatScore(value)}

        <span className="mx-1 text-xs font-semibold text-zinc-400">
          /
        </span>

        <span className="text-xs font-semibold text-zinc-500">
          {formatScore(maxValue)}
          点
        </span>
      </p>
    </div>
  );
}