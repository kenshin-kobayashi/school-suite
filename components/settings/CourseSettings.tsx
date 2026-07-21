"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import PrimaryButton from "@/components/common/PrimaryButton";

import CourseBasicSettings from "@/components/settings/CourseBasicSettings";
import CourseLessonSettings from "@/components/settings/CourseLessonSettings";

import {
  getScheduleSettings,
  saveScheduleSettings,
} from "@/lib/firebase/setting";

import { defaultScheduleSettings } from "@/lib/schedule/defaultScheduleSettings";

import {
  COURSE_TYPE_LABELS,
  type CourseScheduleSettings,
  type CourseScheduleSettingsMap,
  type CourseType,
} from "@/types/schedule-settings";

const COURSE_TYPES: CourseType[] = [
  "spring",
  "summer",
  "winter",
  "other",
];

/**
 * 講習設定を1件だけ安全に複製します。
 */
function cloneSingleCourse(
  course: CourseScheduleSettings,
): CourseScheduleSettings {
  return {
    ...course,

    enabledWeekdays: [
      ...course.enabledWeekdays,
    ],

    lessonRule: {
      ...course.lessonRule,
    },

    aiWeights: {
      ...course.aiWeights,
    },

    periods: course.periods.map(
      (period) => ({
        ...period,
      }),
    ),
  };
}

/**
 * デフォルトの講習設定を安全に複製します。
 */
function cloneDefaultCourses(): CourseScheduleSettingsMap {
  return {
    spring:
      cloneSingleCourse(
        defaultScheduleSettings
          .courses.spring,
      ),

    summer:
      cloneSingleCourse(
        defaultScheduleSettings
          .courses.summer,
      ),

    winter:
      cloneSingleCourse(
        defaultScheduleSettings
          .courses.winter,
      ),

    other:
      cloneSingleCourse(
        defaultScheduleSettings
          .courses.other,
      ),
  };
}

/**
 * 講習設定全体を安全に複製します。
 */
function cloneCourses(
  courses: CourseScheduleSettingsMap,
): CourseScheduleSettingsMap {
  return {
    spring:
      cloneSingleCourse(
        courses.spring,
      ),

    summer:
      cloneSingleCourse(
        courses.summer,
      ),

    winter:
      cloneSingleCourse(
        courses.winter,
      ),

    other:
      cloneSingleCourse(
        courses.other,
      ),
  };
}

type ValidationResult =
  | {
      isValid: true;
    }
  | {
      isValid: false;
      courseType: CourseType;
      message: string;
    };

/**
 * AI評価設定の各項目が
 * 0〜100の整数か確認します。
 */
function isValidAiWeight(
  value: number,
): boolean {
  return (
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 100
  );
}

/**
 * AI評価設定の合計を取得します。
 */
function getAiWeightTotal(
  course: CourseScheduleSettings,
): number {
  return (
    course.aiWeights.teacherGap +
    course.aiWeights.studentGap +
    course.aiWeights
      .teacherPreference
  );
}

/**
 * 全講習のAI評価設定が
 * 保存可能な状態か確認します。
 */
function areAllAiWeightsValid(
  courses: CourseScheduleSettingsMap,
): boolean {
  return COURSE_TYPES.every(
    (courseType) => {
      const course =
        courses[courseType];

      const {
        teacherGap,
        studentGap,
        teacherPreference,
      } = course.aiWeights;

      return (
        isValidAiWeight(
          teacherGap,
        ) &&
        isValidAiWeight(
          studentGap,
        ) &&
        isValidAiWeight(
          teacherPreference,
        ) &&
        getAiWeightTotal(course) ===
          100
      );
    },
  );
}

function validateCourseSettings(
  courses: CourseScheduleSettingsMap,
): ValidationResult {
  for (const courseType of COURSE_TYPES) {
    const course =
      courses[courseType];

    const courseLabel =
      COURSE_TYPE_LABELS[
        courseType
      ];

    const hasStartDate =
      course.startDate.trim() !== "";

    const hasEndDate =
      course.endDate.trim() !== "";

    if (
      hasStartDate !== hasEndDate
    ) {
      return {
        isValid: false,
        courseType,
        message: `${courseLabel}の開始日と終了日を両方設定してください。`,
      };
    }

    if (
      hasStartDate &&
      hasEndDate &&
      course.startDate >
        course.endDate
    ) {
      return {
        isValid: false,
        courseType,
        message: `${courseLabel}の終了日は、開始日以降の日付を設定してください。`,
      };
    }

    if (
      course.enabledWeekdays
        .length === 0
    ) {
      return {
        isValid: false,
        courseType,
        message: `${courseLabel}を実施する曜日を1つ以上選択してください。`,
      };
    }

    if (
      course.lessonRule
        .lessonDurationMinutes < 1
    ) {
      return {
        isValid: false,
        courseType,
        message: `${courseLabel}の授業時間は1分以上で設定してください。`,
      };
    }

    if (
      course.lessonRule
        .maxStudentsPerTeacher < 1
    ) {
      return {
        isValid: false,
        courseType,
        message: `${courseLabel}の講師1人あたりの生徒数は、1人以上で設定してください。`,
      };
    }

    const {
      teacherGap,
      studentGap,
      teacherPreference,
    } = course.aiWeights;

    if (
      !isValidAiWeight(
        teacherGap,
      ) ||
      !isValidAiWeight(
        studentGap,
      ) ||
      !isValidAiWeight(
        teacherPreference,
      )
    ) {
      return {
        isValid: false,
        courseType,
        message: `${courseLabel}のAI評価設定は、それぞれ0点から100点の整数で設定してください。`,
      };
    }

    const aiWeightTotal =
      getAiWeightTotal(course);

    if (aiWeightTotal !== 100) {
      return {
        isValid: false,
        courseType,
        message: `${courseLabel}のAI評価設定の合計を100点にしてください。現在は${aiWeightTotal}点です。`,
      };
    }

    if (
      course.periods.length === 0
    ) {
      return {
        isValid: false,
        courseType,
        message: `${courseLabel}の時限を1つ以上登録してください。`,
      };
    }

    const enabledPeriods =
      course.periods.filter(
        (period) =>
          period.isEnabled,
      );

    if (
      enabledPeriods.length === 0
    ) {
      return {
        isValid: false,
        courseType,
        message: `${courseLabel}の有効な時限を1つ以上設定してください。`,
      };
    }

    const hasInvalidPeriod =
      course.periods.some(
        (period) =>
          !period.startTime.trim() ||
          !period.endTime.trim(),
      );

    if (hasInvalidPeriod) {
      return {
        isValid: false,
        courseType,
        message: `${courseLabel}のすべての時限に、開始時刻と終了時刻を設定してください。`,
      };
    }

    const hasInvalidTimeOrder =
      course.periods.some(
        (period) =>
          period.startTime.trim() !==
            "" &&
          period.endTime.trim() !==
            "" &&
          period.startTime >=
            period.endTime,
      );

    if (
      hasInvalidTimeOrder
    ) {
      return {
        isValid: false,
        courseType,
        message: `${courseLabel}の終了時刻は、開始時刻より後に設定してください。`,
      };
    }
  }

  return {
    isValid: true,
  };
}

export default function CourseSettings() {
  const [
    selectedCourseType,
    setSelectedCourseType,
  ] =
    useState<CourseType>(
      "summer",
    );

  const [courses, setCourses] =
    useState<CourseScheduleSettingsMap>(
      cloneDefaultCourses,
    );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    hasChanges,
    setHasChanges,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null,
    );

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState<string | null>(
      null,
    );

  const currentCourse =
    courses[selectedCourseType];

  const allAiWeightsValid =
    areAllAiWeightsValid(
      courses,
    );

  const loadSettings =
    useCallback(async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      try {
        const settings =
          await getScheduleSettings();

        setCourses(
          cloneCourses(
            settings.courses,
          ),
        );

        setHasChanges(false);
      } catch (error) {
        console.error(
          "講習設定の取得に失敗しました。",
          error,
        );

        setErrorMessage(
          "講習設定を読み込めませんでした。",
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  function updateCurrentCourse(
    updatedCourse: CourseScheduleSettings,
  ) {
    setCourses(
      (currentCourses) => ({
        ...currentCourses,

        [selectedCourseType]:
          cloneSingleCourse(
            updatedCourse,
          ),
      }),
    );

    setHasChanges(true);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function handleCourseTypeChange(
    courseType: CourseType,
  ) {
    setSelectedCourseType(
      courseType,
    );

    setErrorMessage(null);
    setSuccessMessage(null);
  }

  async function handleSave() {
    const validationResult =
      validateCourseSettings(
        courses,
      );

    if (
      !validationResult.isValid
    ) {
      setSelectedCourseType(
        validationResult
          .courseType,
      );

      setErrorMessage(
        validationResult.message,
      );

      setSuccessMessage(null);

      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const currentSettings =
        await getScheduleSettings();

      await saveScheduleSettings({
        ...currentSettings,

        courses:
          cloneCourses(courses),
      });

      setHasChanges(false);

      setSuccessMessage(
        "講習設定を保存しました。",
      );
    } catch (error) {
      console.error(
        "講習設定の保存に失敗しました。",
        error,
      );

      setErrorMessage(
        "講習設定を保存できませんでした。",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />

          <p className="mt-4 text-sm text-zinc-500">
            講習設定を読み込んでいます。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
          講習設定
        </h1>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          春期・夏期・冬期・その他の講習について、
          実施期間や授業ルール、時限を設定します。
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700"
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700"
        >
          {successMessage}
        </div>
      )}

      <CourseBasicSettings
        selectedCourseType={
          selectedCourseType
        }
        value={currentCourse}
        onCourseTypeChange={
          handleCourseTypeChange
        }
        onChange={
          updateCurrentCourse
        }
      />

      <CourseLessonSettings
        courseType={
          selectedCourseType
        }
        value={currentCourse}
        onChange={
          updateCurrentCourse
        }
      />

      <div className="flex justify-end border-t border-zinc-200 pt-6">
        <PrimaryButton
          type="button"
          onClick={() =>
            void handleSave()
          }
          disabled={
            isSaving ||
            !hasChanges ||
            !allAiWeightsValid
          }
        >
          {isSaving
            ? "保存中..."
            : "変更を保存"}
        </PrimaryButton>
      </div>
    </div>
  );
}