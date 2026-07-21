"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  ScheduleColumn,
  ScheduleMode,
} from "@/components/schedule";

import {
  createDateLabel,
  createDateSubLabel,
  createHolidayDateSet,
  createRegularColumns,
} from "@/lib/schedule/helpers";

import {
  createSchedulePeriods,
} from "@/lib/schedule/periods";

import {
  createCourseWeeks,
} from "@/lib/schedule/week";

import type {
  CourseType,
  ScheduleSettings,
} from "@/types/schedule-settings";

type UseCourseScheduleParameters = {
  mode: ScheduleMode;

  selectedCourseType: CourseType;

  scheduleSettings: ScheduleSettings;
};

export function useCourseSchedule({
  mode,
  selectedCourseType,
  scheduleSettings,
}: UseCourseScheduleParameters) {
  const [
    selectedWeekId,
    setSelectedWeekId,
  ] = useState("");

  const selectedCourseSettings =
    useMemo(
      () =>
        scheduleSettings.courses[
          selectedCourseType
        ],
      [
        scheduleSettings,
        selectedCourseType,
      ],
    );

  const holidayDateSet = useMemo(
    () =>
      createHolidayDateSet(
        scheduleSettings,
      ),
    [scheduleSettings],
  );

  const regularColumns = useMemo(
    () =>
      createRegularColumns(
        scheduleSettings.regular
          .enabledWeekdays,
      ),
    [
      scheduleSettings.regular
        .enabledWeekdays,
    ],
  );

  const courseWeeks = useMemo(() => {
    const {
      startDate,
      endDate,
      enabledWeekdays,
    } = selectedCourseSettings;

    if (!startDate || !endDate) {
      return [];
    }

    return createCourseWeeks(
      startDate,
      endDate,
      enabledWeekdays,
    );
  }, [selectedCourseSettings]);

  const courseDates = useMemo(
    () =>
      Array.from(
        new Set(
          courseWeeks.flatMap(
            (week) => week.dates,
          ),
        ),
      )
        .filter(
          (date) =>
            !holidayDateSet.has(
              date,
            ),
        )
        .sort(
          (dateA, dateB) =>
            dateA.localeCompare(
              dateB,
            ),
        ),
    [
      courseWeeks,
      holidayDateSet,
    ],
  );

  const coursePeriods = useMemo(
    () =>
      createSchedulePeriods(
        selectedCourseSettings.periods,
      ),
    [selectedCourseSettings],
  );

  useEffect(() => {
    setSelectedWeekId(
      courseWeeks[0]?.id ?? "",
    );
  }, [courseWeeks]);

  const selectedWeek = useMemo(
    () =>
      courseWeeks.find(
        (week) =>
          week.id ===
          selectedWeekId,
      ) ??
      courseWeeks[0] ??
      null,
    [
      courseWeeks,
      selectedWeekId,
    ],
  );

  const courseColumns =
    useMemo<ScheduleColumn[]>(
      () => {
        if (!selectedWeek) {
          return [];
        }

        return selectedWeek.dates.map(
          (dateString) => ({
            id: dateString,

            label:
              createDateLabel(
                dateString,
              ),

            subLabel:
              createDateSubLabel(
                dateString,
              ),

            isHoliday:
              holidayDateSet.has(
                dateString,
              ),
          }),
        );
      },
      [
        selectedWeek,
        holidayDateSet,
      ],
    );

  const columns = useMemo(
    () =>
      mode === "regular"
        ? regularColumns
        : courseColumns,
    [
      courseColumns,
      mode,
      regularColumns,
    ],
  );

  const periods = useMemo(() => {
    if (mode === "course") {
      return coursePeriods;
    }

    return createSchedulePeriods(
      scheduleSettings.regular
        .periods,
    );
  }, [
    coursePeriods,
    mode,
    scheduleSettings.regular
      .periods,
  ]);

  return {
    selectedCourseSettings,

    holidayDateSet,

    regularColumns,

    courseWeeks,

    courseDates,

    coursePeriods,

    selectedWeek,

    courseColumns,

    columns,

    periods,

    selectedWeekId,

    setSelectedWeekId,
  };
}