"use client";

import type {
  AiScheduleWeights,
} from "@/types/schedule-settings";

type Props = {
  value: AiScheduleWeights;
  onChange: (
    value: AiScheduleWeights,
  ) => void;
};

type WeightKey =
  keyof AiScheduleWeights;

type WeightItem = {
  key: WeightKey;
  label: string;
  description: string;
};

const weightItems: WeightItem[] = [
  {
    key: "teacherGap",
    label: "講師空きコマ",
    description:
      "講師の授業間に空き時間が発生しにくい時間割を優先します。",
  },
  {
    key: "studentGap",
    label: "生徒空きコマ",
    description:
      "生徒の授業間に空き時間が発生しにくい時間割を優先します。",
  },
  {
    key: "teacherPreference",
    label: "担当・希望講師",
    description:
      "通常授業の担当講師や希望順位の高い講師を優先します。",
  },
];

function clampWeight(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(value),
    ),
  );
}

export default function AiScoreSettings({
  value,
  onChange,
}: Props) {
  const total =
    value.teacherGap +
    value.studentGap +
    value.teacherPreference;

  const isValid =
    total === 100;

  const handleChange = (
    key: WeightKey,
    nextValue: number,
  ) => {
    onChange({
      ...value,
      [key]:
        clampWeight(nextValue),
    });
  };

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-950">
              AI評価設定
            </h2>

            <p className="mt-1 text-sm leading-6 text-zinc-500">
              AIが講習時間割を作成するときの優先度を設定してください。
              3項目の合計を100点にしてください。
            </p>
          </div>

          <div
            className={`shrink-0 rounded-full border px-4 py-2 ${
              isValid
                ? "border-zinc-200 bg-zinc-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <span
              className={`text-xs font-medium ${
                isValid
                  ? "text-zinc-500"
                  : "text-red-600"
              }`}
            >
              合計
            </span>

            <span
              className={`ml-2 text-sm font-semibold ${
                isValid
                  ? "text-zinc-950"
                  : "text-red-700"
              }`}
            >
              {total} / 100
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {weightItems.map(
          ({
            key,
            label,
            description,
          }) => (
            <div
              key={key}
              className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <label
                    htmlFor={`ai-weight-${key}`}
                    className="text-sm font-semibold text-zinc-900"
                  >
                    {label}
                  </label>

                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {description}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <input
                    id={`ai-weight-number-${key}`}
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={value[key]}
                    onChange={(event) =>
                      handleChange(
                        key,
                        Number(
                          event.target.value,
                        ),
                      )
                    }
                    className="h-10 w-20 rounded-xl border border-zinc-300 bg-white px-3 text-right text-sm font-semibold text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                    aria-label={`${label}の点数`}
                  />

                  <span className="text-sm text-zinc-500">
                    点
                  </span>
                </div>
              </div>

              <input
                id={`ai-weight-${key}`}
                type="range"
                min={0}
                max={100}
                step={1}
                value={value[key]}
                onChange={(event) =>
                  handleChange(
                    key,
                    Number(
                      event.target.value,
                    ),
                  )
                }
                className="mt-5 h-2 w-full cursor-pointer accent-zinc-900"
                aria-label={`${label}の優先度`}
              />

              <div className="mt-2 flex justify-between text-xs text-zinc-400">
                <span>0</span>
                <span>100</span>
              </div>
            </div>
          ),
        )}
      </div>

      {!isValid && (
        <p className="mt-4 text-sm font-medium text-red-600">
          AI評価設定の合計を100点にしてください。
        </p>
      )}
    </section>
  );
}