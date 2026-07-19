"use client";

import LessonRuleSettings from "@/components/settings/LessonRuleSettings";
import PeriodSettings from "@/components/settings/PeriodSettings";
import WeekdaySettings from "@/components/settings/WeekdaySettings";

import {
  COURSE_TYPE_LABELS,
  type CourseScheduleSettings,
  type CourseType,
} from "@/types/schedule-settings";

type Props = {
  courseType: CourseType;
  value: CourseScheduleSettings;
  onChange: (
    value: CourseScheduleSettings,
  ) => void;
};

export default function CourseLessonSettings({
  courseType,
  value,
  onChange,
}: Props) {
  return (
    <>
      <WeekdaySettings
        description={`${COURSE_TYPE_LABELS[courseType]}を実施する曜日を選択してください。`}
        value={value.enabledWeekdays}
        onChange={(enabledWeekdays) =>
          onChange({
            ...value,
            enabledWeekdays,
          })
        }
      />

      <LessonRuleSettings
        description={`${COURSE_TYPE_LABELS[courseType]}の授業形式と授業時間を設定してください。`}
        value={value.lessonRule}
        onChange={(lessonRule) =>
          onChange({
            ...value,
            lessonRule,
          })
        }
      />

      <PeriodSettings
        description={`${COURSE_TYPE_LABELS[courseType]}の時限を設定してください。`}
        periods={value.periods}
        lessonDurationMinutes={
          value.lessonRule.lessonDurationMinutes
        }
        onChange={(periods) =>
          onChange({
            ...value,
            periods,
          })
        }
      />
    </>
  );
}