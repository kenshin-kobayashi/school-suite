"use client";

import {
  useEffect,
  useState,
} from "react";

import Card from "@/components/common/Card";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";

import type { LessonRule } from "@/types/schedule-settings";

type Props = {
  value: LessonRule;
  onChange: (value: LessonRule) => void;
};

const PRESET_CAPACITIES = [1, 2, 3, 4, 5] as const;

export default function RegularLessonRuleSettings({
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
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">
            授業ルール
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            通常授業の授業形式と授業時間を設定します。
          </p>
        </div>

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
              value={
                value.maxStudentsPerTeacher
              }
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
      </div>
    </Card>
  );
}