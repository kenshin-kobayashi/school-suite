"use client";

import {
  useMemo,
} from "react";

import type {
  ScheduleMode,
} from "@/components/schedule";

import type {
  Lesson,
} from "@/types/lesson";

import type {
  Weekday,
} from "@/types/schedule";

import {
  createScheduleCellKey,
} from "@/types/schedule-cell";

import type {
  CourseType,
  ScheduleSettings,
} from "@/types/schedule-settings";

const REGULAR_LESSON_PREVIEW_PREFIX =
  "regular-lesson-preview:";

type UseCourseLessonsParameters = {
  mode: ScheduleMode;

  selectedCourseType: CourseType;

  scheduleSettings: ScheduleSettings;

  courseDates: string[];

  lessonsByCell: Record<
    string,
    Lesson[]
  >;
};

const weekdays: Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/**
 * YYYY-MM-DD形式の日付から曜日を取得します。
 */
function getWeekdayFromDate(
  dateString: string,
): Weekday | null {
  const date = new Date(
    `${dateString}T00:00:00`,
  );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return weekdays[
    date.getDay()
  ];
}

/**
 * 時限番号から、ScheduleGridで使用する
 * 時限IDを作成します。
 */
function createPeriodId(
  periodNumber: number,
): string {
  return `period-${periodNumber}`;
}

/**
 * 通常授業から生成した
 * 表示専用の講習授業か判定します。
 */
export function isRegularLessonPreview(
  lesson: Lesson,
): boolean {
  return (
    typeof lesson.id ===
      "string" &&
    lesson.id.startsWith(
      REGULAR_LESSON_PREVIEW_PREFIX,
    )
  );
}

/**
 * 通常授業を講習期間の日付へ変換し、
 * 保存済みの講習授業と合成します。
 *
 * Firestoreへの保存や複製は行いません。
 */
export function useCourseLessons({
  mode,
  selectedCourseType,
  scheduleSettings,
  courseDates,
  lessonsByCell,
}: UseCourseLessonsParameters) {
  const displayLessonsByCell =
    useMemo(() => {
      /*
       * 通常授業画面では、
       * 保存済みの授業データをそのまま返します。
       */
      if (mode !== "course") {
        return lessonsByCell;
      }

      const selectedCourseSettings =
        scheduleSettings.courses[
          selectedCourseType
        ];

      /*
       * コピー設定がオフの場合は、
       * 保存済み授業だけを表示します。
       */
      if (
        !selectedCourseSettings
          .showRegularLessons
      ) {
        return lessonsByCell;
      }

      /*
       * 元のstateを直接変更しないように、
       * セルごとの配列も含めてコピーします。
       */
      const displayData: Record<
        string,
        Lesson[]
      > = Object.fromEntries(
        Object.entries(
          lessonsByCell,
        ).map(
          ([
            cellKey,
            lessons,
          ]) => [
            cellKey,
            [...lessons],
          ],
        ),
      );

      const allLessons =
        Object.values(
          lessonsByCell,
        ).flat();

      const regularLessons =
        allLessons.filter(
          (lesson) =>
            lesson.scheduleMode ===
            "regular",
        );

      const enabledCourseWeekdays =
        new Set<Weekday>(
          selectedCourseSettings
            .enabledWeekdays,
        );

      const holidayDateSet =
        new Set(
          scheduleSettings
            .schoolHolidays.map(
              (holiday) =>
                holiday.date,
            ),
        );

      const enabledRegularPeriods =
        scheduleSettings.regular
          .periods.filter(
            (period) =>
              period.isEnabled,
          );

      const enabledCoursePeriods =
        selectedCourseSettings
          .periods.filter(
            (period) =>
              period.isEnabled,
          );

      for (
        const dateString
        of courseDates
      ) {
        /*
         * 休塾日には通常授業を表示しません。
         */
        if (
          holidayDateSet.has(
            dateString,
          )
        ) {
          continue;
        }

        const weekday =
          getWeekdayFromDate(
            dateString,
          );

        if (!weekday) {
          continue;
        }

        /*
         * 講習で無効になっている曜日には
         * 通常授業を表示しません。
         */
        if (
          !enabledCourseWeekdays.has(
            weekday,
          )
        ) {
          continue;
        }

        const regularLessonsForDate =
          regularLessons.filter(
            (lesson) =>
              lesson.weekday ===
                weekday ||
              lesson.position
                ?.columnId ===
                weekday,
          );

        for (
          const regularLesson
          of regularLessonsForDate
        ) {
          /*
           * 通常授業が使用している
           * 時限設定を取得します。
           */
          const regularPeriod =
            enabledRegularPeriods.find(
              (period) =>
                period.periodNumber ===
                  regularLesson
                    .periodNumber ||
                createPeriodId(
                  period.periodNumber,
                ) ===
                  regularLesson
                    .position
                    ?.periodId,
            );

          if (!regularPeriod) {
            continue;
          }

          /*
           * 通常授業と開始・終了時刻が
           * 同じ講習時限を探します。
           */
          const coursePeriod =
            enabledCoursePeriods.find(
              (period) =>
                period.startTime ===
                  regularPeriod.startTime &&
                period.endTime ===
                  regularPeriod.endTime,
            );

          if (!coursePeriod) {
            continue;
          }

          /*
           * ScheduleGridの時限IDは、
           * createSchedulePeriods()と同じ
           * period-数字形式にします。
           */
          const coursePeriodId =
            createPeriodId(
              coursePeriod.periodNumber,
            );

          const coursePosition = {
            columnId: dateString,
            periodId:
              coursePeriodId,
          };

          const cellKey =
            createScheduleCellKey(
              coursePosition,
            );

        

          /*
           * FirestoreのIDが未設定の場合にも
           * 一意になる代替IDを作ります。
           */
          const regularLessonId =
            regularLesson.id ??
            [
              weekday,
              regularLesson
                .periodNumber,
              regularLesson
                .teacherId,
              regularLesson.students
                .map(
                  (student) =>
                    student.studentId,
                )
                .join("-"),
            ].join("-");

          const previewLesson:
            Lesson = {
              ...regularLesson,

              id: [
                REGULAR_LESSON_PREVIEW_PREFIX,
                regularLessonId,
                ":",
                dateString,
                ":",
                coursePeriodId,
              ].join(""),

              scheduleMode:
                "course",

              position:
                coursePosition,

              date:
                dateString,

              periodNumber:
                coursePeriod
                  .periodNumber,
            };

          if (
            !displayData[
              cellKey
            ]
          ) {
            displayData[
              cellKey
            ] = [];
          }

          displayData[
            cellKey
          ].push(
            previewLesson,
          );
        }
      }

      return displayData;
    }, [
      courseDates,
      lessonsByCell,
      mode,
      scheduleSettings,
      selectedCourseType,
    ]);

  return {
    displayLessonsByCell,
  };
}