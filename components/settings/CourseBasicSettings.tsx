"use client";

import SettingSection from "@/components/settings/SettingSection";

import {
  COURSE_TYPE_LABELS,
  type CourseScheduleSettings,
  type CourseType,
} from "@/types/schedule-settings";

const COURSE_TYPES: CourseType[] = [
  "spring",
  "summer",
  "winter",
  "other",
];

type Props = {
  selectedCourseType: CourseType;

  value: CourseScheduleSettings;

  onCourseTypeChange: (
    courseType: CourseType,
  ) => void;

  onChange: (
    value: CourseScheduleSettings,
  ) => void;
};

export default function CourseBasicSettings({
  selectedCourseType,
  value,
  onCourseTypeChange,
  onChange,
}: Props) {
  const hasInvalidDateRange =
    value.startDate !== "" &&
    value.endDate !== "" &&
    value.startDate > value.endDate;

  function handleStartDateChange(
    startDate: string,
  ) {
    onChange({
      ...value,
      startDate,
    });
  }

  function handleEndDateChange(
    endDate: string,
  ) {
    onChange({
      ...value,
      endDate,
    });
  }

  function handleShowRegularLessonsChange() {
    onChange({
      ...value,
      showRegularLessons:
        !value.showRegularLessons,
    });
  }

  return (
    <>
      <SettingSection
        title="講習設定"
        description="設定する講習を選択してください。"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {COURSE_TYPES.map((courseType) => {
            const isSelected =
              selectedCourseType === courseType;

            return (
              <button
                key={courseType}
                type="button"
                onClick={() =>
                  onCourseTypeChange(courseType)
                }
                className={[
                  "rounded-xl border px-4 py-3 text-left transition",
                  isSelected
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
                ].join(" ")}
              >
                <span className="block text-sm font-semibold">
                  {
                    COURSE_TYPE_LABELS[
                      courseType
                    ]
                  }
                </span>

                <span
                  className={[
                    "mt-1 block text-xs",
                    isSelected
                      ? "text-zinc-300"
                      : "text-zinc-500",
                  ].join(" ")}
                >
                  {isSelected
                    ? "選択中"
                    : "クリックして設定"}
                </span>
              </button>
            );
          })}
        </div>
      </SettingSection>

      <SettingSection
        title={`${COURSE_TYPE_LABELS[selectedCourseType]}の期間`}
        description="講習を実施する開始日と終了日を設定してください。"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label>
            <span className="mb-2 block text-sm font-semibold text-zinc-700">
              開始日
            </span>

            <input
              type="date"
              value={value.startDate}
              onChange={(event) =>
                handleStartDateChange(
                  event.target.value,
                )
              }
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-semibold text-zinc-700">
              終了日
            </span>

            <input
              type="date"
              value={value.endDate}
              min={
                value.startDate || undefined
              }
              onChange={(event) =>
                handleEndDateChange(
                  event.target.value,
                )
              }
              className={[
                "h-11 w-full rounded-xl border bg-white px-3 text-sm text-zinc-900 outline-none transition focus:ring-2",
                hasInvalidDateRange
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-zinc-200 focus:border-zinc-400 focus:ring-zinc-200",
              ].join(" ")}
            />
          </label>
        </div>

        {hasInvalidDateRange && (
          <p className="text-sm font-medium text-red-600">
            終了日は開始日以降の日付を設定してください。
          </p>
        )}

        {!hasInvalidDateRange &&
          value.startDate !== "" &&
          value.endDate !== "" && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-xs font-semibold text-zinc-500">
                設定中の講習期間
              </p>

              <p className="mt-1 text-sm font-bold text-zinc-900">
                {value.startDate}

                <span className="mx-2 text-zinc-400">
                  〜
                </span>

                {value.endDate}
              </p>
            </div>
          )}
      </SettingSection>

      <SettingSection
        title="通常授業のコピー"
        description={`${COURSE_TYPE_LABELS[selectedCourseType]}の時間割に、通常授業を反映するか設定します。`}
      >
        <div className="flex items-center justify-between gap-5 rounded-2xl border border-zinc-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900">
              通常授業をコピーする
            </p>

            <p className="mt-1 text-sm leading-6 text-zinc-500">
              オンにすると、講習期間中の通常授業を
              講習スケジュールへ反映します。
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={
              value.showRegularLessons
            }
            aria-label="通常授業をコピーする"
            onClick={
              handleShowRegularLessonsChange
            }
            className={[
              "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2",
              value.showRegularLessons
                ? "bg-zinc-900"
                : "bg-zinc-300",
            ].join(" ")}
          >
            <span
              className={[
                "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                value.showRegularLessons
                  ? "translate-x-6"
                  : "translate-x-1",
              ].join(" ")}
            />
          </button>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <p className="text-xs font-semibold text-zinc-500">
            現在の設定
          </p>

          <p className="mt-1 text-sm font-bold text-zinc-900">
            {value.showRegularLessons
              ? "通常授業をコピーする"
              : "通常授業をコピーしない"}
          </p>
        </div>
      </SettingSection>
    </>
  );
}