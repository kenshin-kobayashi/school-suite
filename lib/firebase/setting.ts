import { db } from "@/lib/firebase";

import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import { defaultScheduleSettings } from "@/lib/schedule/defaultScheduleSettings";

import type {
  CourseScheduleSettingsMap,
  RegularScheduleSettings,
  ScheduleSettings,
  SchoolHoliday,
} from "@/types/schedule-settings";

const scheduleSettingsDocument = doc(
  db,
  "settings",
  "schedule",
);

/**
 * Firestoreに残っている可能性がある
 * 以前のスケジュール設定形式です。
 */
type LegacyScheduleSettings =
  Partial<ScheduleSettings> & {
    /**
     * 以前使用していた休塾日の形式
     */
    closedDates?: unknown;
  };

/**
 * 通常授業設定を安全に複製します。
 */
function cloneRegularSettings(
  regular: RegularScheduleSettings,
): RegularScheduleSettings {
  return {
    ...regular,

    enabledWeekdays: [
      ...regular.enabledWeekdays,
    ],

    lessonRule: {
      ...regular.lessonRule,
    },

    periods: regular.periods.map(
      (period) => ({
        ...period,
      }),
    ),
  };
}

/**
 * 講習設定を安全に複製します。
 */
function cloneCourseSettings(
  courses: CourseScheduleSettingsMap,
): CourseScheduleSettingsMap {
  return {
    spring: {
      ...courses.spring,

      enabledWeekdays: [
        ...courses.spring.enabledWeekdays,
      ],

      lessonRule: {
        ...courses.spring.lessonRule,
      },

      periods: courses.spring.periods.map(
        (period) => ({
          ...period,
        }),
      ),
    },

    summer: {
      ...courses.summer,

      enabledWeekdays: [
        ...courses.summer.enabledWeekdays,
      ],

      lessonRule: {
        ...courses.summer.lessonRule,
      },

      periods: courses.summer.periods.map(
        (period) => ({
          ...period,
        }),
      ),
    },

    winter: {
      ...courses.winter,

      enabledWeekdays: [
        ...courses.winter.enabledWeekdays,
      ],

      lessonRule: {
        ...courses.winter.lessonRule,
      },

      periods: courses.winter.periods.map(
        (period) => ({
          ...period,
        }),
      ),
    },

    other: {
      ...courses.other,

      enabledWeekdays: [
        ...courses.other.enabledWeekdays,
      ],

      lessonRule: {
        ...courses.other.lessonRule,
      },

      periods: courses.other.periods.map(
        (period) => ({
          ...period,
        }),
      ),
    },
  };
}

/**
 * 休塾日設定を安全に複製します。
 *
 * 古いデータにnameが残っている場合でも、
 * idとdateだけを取り出します。
 */
function cloneSchoolHolidays(
  schoolHolidays: SchoolHoliday[],
): SchoolHoliday[] {
  return schoolHolidays.map(
    (holiday) => ({
      id: holiday.id,
      date: holiday.date,
    }),
  );
}

/**
 * スケジュール設定全体を安全に複製します。
 */
function cloneScheduleSettings(
  settings: ScheduleSettings,
): ScheduleSettings {
  return {
    ...settings,

    regular: cloneRegularSettings(
      settings.regular,
    ),

    courses: cloneCourseSettings(
      settings.courses,
    ),

    schoolHolidays:
      cloneSchoolHolidays(
        settings.schoolHolidays,
      ),
  };
}

/**
 * Firestoreから取得した通常授業設定と、
 * デフォルト設定を結合します。
 */
function mergeRegularSettings(
  value:
    | Partial<RegularScheduleSettings>
    | null,
): RegularScheduleSettings {
  const defaultRegular =
    defaultScheduleSettings.regular;

  if (!value) {
    return cloneRegularSettings(
      defaultRegular,
    );
  }

  return {
    ...defaultRegular,
    ...value,

    enabledWeekdays: Array.isArray(
      value.enabledWeekdays,
    )
      ? [...value.enabledWeekdays]
      : [
          ...defaultRegular.enabledWeekdays,
        ],

    lessonRule: {
      ...defaultRegular.lessonRule,
      ...(value.lessonRule ?? {}),
    },

    periods: Array.isArray(
      value.periods,
    )
      ? value.periods.map(
          (period) => ({
            ...period,
          }),
        )
      : defaultRegular.periods.map(
          (period) => ({
            ...period,
          }),
        ),
  };
}

/**
 * 1つの講習設定を
 * デフォルト設定と結合します。
 */
function mergeSingleCourseSettings(
  defaultCourse:
    CourseScheduleSettingsMap[
      keyof CourseScheduleSettingsMap
    ],
  value:
    | Partial<
        CourseScheduleSettingsMap[
          keyof CourseScheduleSettingsMap
        ]
      >
    | null
    | undefined,
): CourseScheduleSettingsMap[
  keyof CourseScheduleSettingsMap
] {
  return {
    ...defaultCourse,
    ...(value ?? {}),

    enabledWeekdays: Array.isArray(
      value?.enabledWeekdays,
    )
      ? [...value.enabledWeekdays]
      : [
          ...defaultCourse.enabledWeekdays,
        ],

    lessonRule: {
      ...defaultCourse.lessonRule,
      ...(value?.lessonRule ?? {}),
    },

    periods: Array.isArray(
      value?.periods,
    )
      ? value.periods.map(
          (period) => ({
            ...period,
          }),
        )
      : defaultCourse.periods.map(
          (period) => ({
            ...period,
          }),
        ),
  };
}

/**
 * Firestoreから取得した講習設定と、
 * デフォルト設定を結合します。
 */
function mergeCourseSettings(
  value:
    | Partial<CourseScheduleSettingsMap>
    | null,
): CourseScheduleSettingsMap {
  const defaultCourses =
    defaultScheduleSettings.courses;

  return {
    spring: mergeSingleCourseSettings(
      defaultCourses.spring,
      value?.spring,
    ),

    summer: mergeSingleCourseSettings(
      defaultCourses.summer,
      value?.summer,
    ),

    winter: mergeSingleCourseSettings(
      defaultCourses.winter,
      value?.winter,
    ),

    other: mergeSingleCourseSettings(
      defaultCourses.other,
      value?.other,
    ),
  };
}

/**
 * YYYY-MM-DD形式の日付か確認します。
 */
function isDateString(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  );
}

/**
 * 正しい休塾日データか確認します。
 */
function isSchoolHoliday(
  value: unknown,
): value is SchoolHoliday {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const holiday =
    value as Partial<SchoolHoliday>;

  return (
    typeof holiday.id === "string" &&
    holiday.id.trim() !== "" &&
    isDateString(holiday.date)
  );
}

/**
 * 休塾日設定を正規化します。
 *
 * 新しいschoolHolidays形式を優先し、
 * 存在しない場合は古いclosedDates形式から
 * 自動変換します。
 *
 * 同じ日付が複数ある場合は
 * 1件にまとめます。
 */
function normalizeSchoolHolidays(
  value: LegacyScheduleSettings | null,
): SchoolHoliday[] {
  if (
    Array.isArray(value?.schoolHolidays)
  ) {
    const holidaysByDate =
      new Map<string, SchoolHoliday>();

    value.schoolHolidays
      .filter(isSchoolHoliday)
      .forEach((holiday) => {
        holidaysByDate.set(
          holiday.date,
          {
            id: holiday.id,
            date: holiday.date,
          },
        );
      });

    return Array.from(
      holidaysByDate.values(),
    ).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }

  if (Array.isArray(value?.closedDates)) {
    const uniqueDates = Array.from(
      new Set(
        value.closedDates.filter(
          isDateString,
        ),
      ),
    );

    return uniqueDates
      .map((date) => ({
        id: date,
        date,
      }))
      .sort((a, b) =>
        a.date.localeCompare(b.date),
      );
  }

  return cloneSchoolHolidays(
    defaultScheduleSettings.schoolHolidays,
  );
}

/**
 * Firestoreの保存値と
 * デフォルト設定を結合します。
 *
 * 古い形式のデータで項目が不足していても、
 * デフォルト値で補完します。
 */
function normalizeScheduleSettings(
  value: LegacyScheduleSettings | null,
): ScheduleSettings {
  return {
    ...defaultScheduleSettings,
    ...(value ?? {}),

    regular: mergeRegularSettings(
      value?.regular ?? null,
    ),

    courses: mergeCourseSettings(
      value?.courses ?? null,
    ),

    schoolHolidays:
      normalizeSchoolHolidays(value),
  };
}

/**
 * スケジュール設定全体を取得します。
 *
 * Firestoreに設定が存在しない場合は、
 * デフォルト設定を返します。
 */
export async function getScheduleSettings(): Promise<ScheduleSettings> {
  try {
    const snapshot = await getDoc(
      scheduleSettingsDocument,
    );

    if (!snapshot.exists()) {
      return cloneScheduleSettings(
        defaultScheduleSettings,
      );
    }

    const data =
      snapshot.data() as LegacyScheduleSettings;

    return normalizeScheduleSettings(data);
  } catch (error) {
    console.error(
      "スケジュール設定の取得に失敗しました。",
      error,
    );

    throw new Error(
      "スケジュール設定を取得できませんでした。",
    );
  }
}

/**
 * スケジュール設定全体を保存します。
 */
export async function saveScheduleSettings(
  settings: ScheduleSettings,
): Promise<void> {
  try {
    const normalizedSettings =
      normalizeScheduleSettings(settings);

    await setDoc(
      scheduleSettingsDocument,
      cloneScheduleSettings(
        normalizedSettings,
      ),
    );
  } catch (error) {
    console.error(
      "スケジュール設定の保存に失敗しました。",
      error,
    );

    throw new Error(
      "スケジュール設定を保存できませんでした。",
    );
  }
}

/**
 * スケジュール設定の一部を更新します。
 *
 * 保存済みの設定を取得してから結合するため、
 * 未変更の設定は維持されます。
 */
export async function updateScheduleSettings(
  updates: Partial<ScheduleSettings>,
): Promise<ScheduleSettings> {
  try {
    const currentSettings =
      await getScheduleSettings();

    const updatedSettings =
      normalizeScheduleSettings({
        ...currentSettings,
        ...updates,

        regular: updates.regular
          ? {
              ...currentSettings.regular,
              ...updates.regular,
            }
          : currentSettings.regular,

        courses: updates.courses
          ? {
              ...currentSettings.courses,
              ...updates.courses,
            }
          : currentSettings.courses,

        schoolHolidays:
          updates.schoolHolidays
            ? cloneSchoolHolidays(
                updates.schoolHolidays,
              )
            : cloneSchoolHolidays(
                currentSettings.schoolHolidays,
              ),
      });

    await saveScheduleSettings(
      updatedSettings,
    );

    return updatedSettings;
  } catch (error) {
    console.error(
      "スケジュール設定の更新に失敗しました。",
      error,
    );

    throw new Error(
      "スケジュール設定を更新できませんでした。",
    );
  }
}

/**
 * Firestoreに設定が存在しない場合のみ、
 * デフォルト設定を保存します。
 */
export async function initializeScheduleSettings(): Promise<ScheduleSettings> {
  try {
    const snapshot = await getDoc(
      scheduleSettingsDocument,
    );

    if (snapshot.exists()) {
      return normalizeScheduleSettings(
        snapshot.data() as LegacyScheduleSettings,
      );
    }

    const initialSettings =
      cloneScheduleSettings(
        defaultScheduleSettings,
      );

    await setDoc(
      scheduleSettingsDocument,
      initialSettings,
    );

    return initialSettings;
  } catch (error) {
    console.error(
      "スケジュール設定の初期化に失敗しました。",
      error,
    );

    throw new Error(
      "スケジュール設定を初期化できませんでした。",
    );
  }
}

/**
 * スケジュール設定を
 * デフォルト状態へ戻します。
 */
export async function resetScheduleSettings(): Promise<ScheduleSettings> {
  try {
    const defaultSettings =
      cloneScheduleSettings(
        defaultScheduleSettings,
      );

    await setDoc(
      scheduleSettingsDocument,
      defaultSettings,
    );

    return defaultSettings;
  } catch (error) {
    console.error(
      "スケジュール設定のリセットに失敗しました。",
      error,
    );

    throw new Error(
      "スケジュール設定をリセットできませんでした。",
    );
  }
}

/**
 * 通常授業設定だけを取得します。
 *
 * RegularSettings.tsxとの
 * 互換性を保つための関数です。
 */
export async function getRegularScheduleSettings(): Promise<RegularScheduleSettings> {
  const settings =
    await getScheduleSettings();

  return cloneRegularSettings(
    settings.regular,
  );
}

/**
 * 通常授業設定だけを保存します。
 *
 * 講習設定・休塾日設定は変更されません。
 */
export async function saveRegularScheduleSettings(
  regular: RegularScheduleSettings,
): Promise<void> {
  const currentSettings =
    await getScheduleSettings();

  await saveScheduleSettings({
    ...currentSettings,

    regular:
      cloneRegularSettings(regular),
  });
}

/**
 * 講習設定だけを取得します。
 *
 * CourseSettings.tsxとの
 * 互換性を保つための関数です。
 */
export async function getCourseScheduleSettings(): Promise<CourseScheduleSettingsMap> {
  const settings =
    await getScheduleSettings();

  return cloneCourseSettings(
    settings.courses,
  );
}

/**
 * 講習設定だけを保存します。
 *
 * 通常授業設定・休塾日設定は
 * 変更されません。
 */
export async function saveCourseScheduleSettings(
  courses: CourseScheduleSettingsMap,
): Promise<void> {
  const currentSettings =
    await getScheduleSettings();

  await saveScheduleSettings({
    ...currentSettings,

    courses:
      cloneCourseSettings(courses),
  });
}

/**
 * 休塾日設定だけを取得します。
 */
export async function getSchoolHolidays(): Promise<SchoolHoliday[]> {
  const settings =
    await getScheduleSettings();

  return cloneSchoolHolidays(
    settings.schoolHolidays,
  );
}

/**
 * 休塾日設定だけを保存します。
 *
 * 通常授業設定・講習設定は
 * 変更されません。
 */
export async function saveSchoolHolidays(
  schoolHolidays: SchoolHoliday[],
): Promise<void> {
  const currentSettings =
    await getScheduleSettings();

  await saveScheduleSettings({
    ...currentSettings,

    schoolHolidays:
      cloneSchoolHolidays(
        schoolHolidays,
      ),
  });
}