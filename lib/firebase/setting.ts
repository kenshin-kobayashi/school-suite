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
} from "@/types/schedule-settings";

const scheduleSettingsDocument = doc(
  db,
  "settings",
  "schedule",
);

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
  };
}

/**
 * Firestoreから取得した通常授業設定と、
 * デフォルト設定を結合します。
 */
function mergeRegularSettings(
  value: Partial<RegularScheduleSettings> | null,
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
      : [...defaultRegular.enabledWeekdays],

    lessonRule: {
      ...defaultRegular.lessonRule,
      ...(value.lessonRule ?? {}),
    },

    periods: Array.isArray(value.periods)
      ? value.periods.map((period) => ({
          ...period,
        }))
      : defaultRegular.periods.map(
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
  value: Partial<CourseScheduleSettingsMap> | null,
): CourseScheduleSettingsMap {
  const defaultCourses =
    defaultScheduleSettings.courses;

  return {
    spring: {
      ...defaultCourses.spring,
      ...(value?.spring ?? {}),

      enabledWeekdays: Array.isArray(
        value?.spring?.enabledWeekdays,
      )
        ? [
            ...value.spring.enabledWeekdays,
          ]
        : [
            ...defaultCourses.spring
              .enabledWeekdays,
          ],

      lessonRule: {
        ...defaultCourses.spring.lessonRule,
        ...(value?.spring?.lessonRule ?? {}),
      },

      periods: Array.isArray(
        value?.spring?.periods,
      )
        ? value.spring.periods.map(
            (period) => ({
              ...period,
            }),
          )
        : defaultCourses.spring.periods.map(
            (period) => ({
              ...period,
            }),
          ),
    },

    summer: {
      ...defaultCourses.summer,
      ...(value?.summer ?? {}),

      enabledWeekdays: Array.isArray(
        value?.summer?.enabledWeekdays,
      )
        ? [
            ...value.summer.enabledWeekdays,
          ]
        : [
            ...defaultCourses.summer
              .enabledWeekdays,
          ],

      lessonRule: {
        ...defaultCourses.summer.lessonRule,
        ...(value?.summer?.lessonRule ?? {}),
      },

      periods: Array.isArray(
        value?.summer?.periods,
      )
        ? value.summer.periods.map(
            (period) => ({
              ...period,
            }),
          )
        : defaultCourses.summer.periods.map(
            (period) => ({
              ...period,
            }),
          ),
    },

    winter: {
      ...defaultCourses.winter,
      ...(value?.winter ?? {}),

      enabledWeekdays: Array.isArray(
        value?.winter?.enabledWeekdays,
      )
        ? [
            ...value.winter.enabledWeekdays,
          ]
        : [
            ...defaultCourses.winter
              .enabledWeekdays,
          ],

      lessonRule: {
        ...defaultCourses.winter.lessonRule,
        ...(value?.winter?.lessonRule ?? {}),
      },

      periods: Array.isArray(
        value?.winter?.periods,
      )
        ? value.winter.periods.map(
            (period) => ({
              ...period,
            }),
          )
        : defaultCourses.winter.periods.map(
            (period) => ({
              ...period,
            }),
          ),
    },

    other: {
      ...defaultCourses.other,
      ...(value?.other ?? {}),

      enabledWeekdays: Array.isArray(
        value?.other?.enabledWeekdays,
      )
        ? [
            ...value.other.enabledWeekdays,
          ]
        : [
            ...defaultCourses.other
              .enabledWeekdays,
          ],

      lessonRule: {
        ...defaultCourses.other.lessonRule,
        ...(value?.other?.lessonRule ?? {}),
      },

      periods: Array.isArray(
        value?.other?.periods,
      )
        ? value.other.periods.map(
            (period) => ({
              ...period,
            }),
          )
        : defaultCourses.other.periods.map(
            (period) => ({
              ...period,
            }),
          ),
    },
  };
}

/**
 * Firestoreの保存値とデフォルト設定を結合します。
 *
 * 古い形式のデータで項目が不足していても、
 * デフォルト値で補完します。
 */
function normalizeScheduleSettings(
  value: Partial<ScheduleSettings> | null,
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
      snapshot.data() as Partial<ScheduleSettings>;

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
        snapshot.data() as Partial<ScheduleSettings>,
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
 * スケジュール設定をデフォルト状態へ戻します。
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
 * RegularSettings.tsxとの互換性を保つための関数です。
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
 * 講習設定は変更されません。
 */
export async function saveRegularScheduleSettings(
  regular: RegularScheduleSettings,
): Promise<void> {
  const currentSettings =
    await getScheduleSettings();

  await saveScheduleSettings({
    ...currentSettings,
    regular: cloneRegularSettings(regular),
  });
}

/**
 * 講習設定だけを取得します。
 *
 * 古いCourseSettings.tsxとの互換性を保つための関数です。
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
 * 通常授業設定は変更されません。
 */
export async function saveCourseScheduleSettings(
  courses: CourseScheduleSettingsMap,
): Promise<void> {
  const currentSettings =
    await getScheduleSettings();

  await saveScheduleSettings({
    ...currentSettings,
    courses: cloneCourseSettings(courses),
  });
}