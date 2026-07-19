"use client";

import {
  useEffect,
  useState,
} from "react";

import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import SettingSection from "@/components/settings/SettingSection";

import type { LessonRule } from "@/types/schedule-settings";

type Props = {
  title?: string;
  description: string;
  value: LessonRule;
  onChange: (value: LessonRule) => void;
};

const PRESET_CAPACITIES = [1, 2, 3, 4, 5] as const;

export default function LessonRuleSettings({
  title = "授業ルール",
  description,
  value,
  onChange,
}: Props) {
  const [durationInput, setDurationInput] =
    useState<string>(
      String(value.lessonDurationMinutes),
    );

  const isCustom = !PRESET_CAPACITIES.includes(
    value.maxStudentsPerTeacher as (
      typeof PRESET_CAPACITIES
    )[number],
  );

  const selectValue = isCustom
    ? "custom"
    : String(value.maxStudentsPerTeacher);

  useEffect(() => {
    setDurationInput(
      String(value.lessonDurationMinutes),
    );
  }, [value.lessonDurationMinutes]);

  function handleDurationChange(
    inputValue: string,
  ) {
    if (
      inputValue !== "" &&
      !/^\d+$/.test(inputValue)
    ) {
      return;
    }

    setDurationInput(inputValue);

    if (inputValue === "") {
      return;
    }

    const nextDuration = Number(inputValue);

    if (
      Number.isInteger(nextDuration) &&
      nextDuration >= 1
    ) {
      onChange({
        ...value,
        lessonDurationMinutes: nextDuration,
      });
    }
  }

  function handleDurationBlur() {
    if (durationInput === "") {
      setDurationInput(
        String(value.lessonDurationMinutes),
      );

      return;
    }

    const nextDuration = Number(durationInput);

    if (
      !Number.isInteger(nextDuration) ||
      nextDuration < 1
    ) {
      setDurationInput(
        String(value.lessonDurationMinutes),
      );
    }
  }

  return (
    <SettingSection
      title={title}
      description={description}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Select
          label="授業形式"
          value={selectValue}
          onChange={(event) => {
            const nextValue = event.target.value;

            if (nextValue === "custom") {
              onChange({
                ...value,
                maxStudentsPerTeacher: Math.max(
                  6,
                  value.maxStudentsPerTeacher,
                ),
              });

              return;
            }

            onChange({
              ...value,
              maxStudentsPerTeacher:
                Number(nextValue),
            });
          }}
        >
          <option value="1">1対1</option>
          <option value="2">1対2</option>
          <option value="3">1対3</option>
          <option value="4">1対4</option>
          <option value="5">1対5</option>
          <option value="custom">
            カスタム
          </option>
        </Select>

        <Input
          label="授業時間（分）"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={durationInput}
          onChange={(event) =>
            handleDurationChange(
              event.target.value,
            )
          }
          onBlur={handleDurationBlur}
        />
      </div>

      {isCustom && (
        <div className="max-w-md">
          <Input
            label="講師1人あたりの生徒数"
            type="number"
            min={1}
            step={1}
            value={value.maxStudentsPerTeacher}
            onChange={(event) => {
              const nextValue = Number(
                event.target.value,
              );

              if (
                !Number.isInteger(nextValue) ||
                nextValue < 1
              ) {
                return;
              }

              onChange({
                ...value,
                maxStudentsPerTeacher:
                  nextValue,
              });
            }}
          />
        </div>
      )}
    </SettingSection>
  );
}