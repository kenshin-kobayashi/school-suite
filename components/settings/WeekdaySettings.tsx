"use client";

import SettingSection from "@/components/settings/SettingSection";

import type { Weekday } from "@/types/schedule";

type Props = {
  title?: string;
  description: string;
  value: Weekday[];
  onChange: (value: Weekday[]) => void;
};

const WEEKDAYS: {
  value: Weekday;
  label: string;
}[] = [
  {
    value: "monday",
    label: "月",
  },
  {
    value: "tuesday",
    label: "火",
  },
  {
    value: "wednesday",
    label: "水",
  },
  {
    value: "thursday",
    label: "木",
  },
  {
    value: "friday",
    label: "金",
  },
  {
    value: "saturday",
    label: "土",
  },
  {
    value: "sunday",
    label: "日",
  },
];

export default function WeekdaySettings({
  title = "稼働曜日",
  description,
  value,
  onChange,
}: Props) {
  function handleToggle(weekday: Weekday) {
    if (value.includes(weekday)) {
      onChange(
        value.filter(
          (current) => current !== weekday,
        ),
      );

      return;
    }

    onChange([...value, weekday]);
  }

  return (
    <SettingSection
      title={title}
      description={description}
    >
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {WEEKDAYS.map((weekday) => {
          const isSelected = value.includes(
            weekday.value,
          );

          return (
            <button
              key={weekday.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() =>
                handleToggle(weekday.value)
              }
              className={[
                "flex h-11 min-w-0 items-center justify-center rounded-xl border text-sm font-semibold transition",
                "focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2",
                isSelected
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
              ].join(" ")}
            >
              {weekday.label}
            </button>
          );
        })}
      </div>
    </SettingSection>
  );
}