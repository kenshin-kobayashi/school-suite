import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { defaultScheduleSettings } from "@/lib/schedule/defaultScheduleSettings";

import type {
  CourseScheduleSettingsMap,
  RegularScheduleSettings,
  ScheduleSettings,
} from "@/types/schedule-settings";

const SETTINGS_COLLECTION = "settings";

const REGULAR_SETTINGS_DOCUMENT = "regular";
const COURSE_SETTINGS_DOCUMENT = "courses";
const SYSTEM_SETTINGS_DOCUMENT = "system";

type SystemSettingsDocument = {
  closedDates: string[];
  updatedAt?: unknown;
};

function cloneDefaultSettings(): ScheduleSettings {
  return {
    ...defaultScheduleSettings,

    regular: {
      ...defaultScheduleSettings.regular,

      enabledWeekdays: [
        ...defaultScheduleSettings.regular.enabledWeekdays,
      ],

      lessonRule: {
        ...defaultScheduleSettings.regular.lessonRule,
      },

      periods:
        defaultScheduleSettings.regular.periods.map(
          (period) => ({
            ...period,
          }),
        ),
    },

    courses: {
      spring: {
        ...defaultScheduleSettings.courses.spring,

        enabledWeekdays: [
          ...defaultScheduleSettings.courses.spring
            .enabledWeekdays,
        ],

        lessonRule: {
          ...defaultScheduleSettings.courses.spring.lessonRule,
        },

        periods:
          defaultScheduleSettings.courses.spring.periods.map(
            (period) => ({
              ...period,
            }),
          ),
      },

      summer: {
        ...defaultScheduleSettings.courses.summer,

        enabledWeekdays: [
          ...defaultScheduleSettings.courses.summer
            .enabledWeekdays,
        ],

        lessonRule: {
          ...defaultScheduleSettings.courses.summer.lessonRule,
        },

        periods:
          defaultScheduleSettings.courses.summer.periods.map(
            (period) => ({
              ...period,
            }),
          ),
      },

      winter: {
        ...defaultScheduleSettings.courses.winter,

        enabledWeekdays: [
          ...defaultScheduleSettings.courses.winter
            .enabledWeekdays,
        ],

        lessonRule: {
          ...defaultScheduleSettings.courses.winter.lessonRule,
        },

        periods:
          defaultScheduleSettings.courses.winter.periods.map(
            (period) => ({
              ...period,
            }),
          ),
      },

      other: {
        ...defaultScheduleSettings.courses.other,

        enabledWeekdays: [
          ...defaultScheduleSettings.courses.other
            .enabledWeekdays,
        ],

        lessonRule: {
          ...defaultScheduleSettings.courses.other.lessonRule,
        },

        periods:
          defaultScheduleSettings.courses.other.periods.map(
            (period) => ({
              ...period,
            }),
          ),
      },
    },

    closedDates: [
      ...defaultScheduleSettings.closedDates,
    ],
  };
}
/**
 * 通常授業設定を取得します。
 *
 * Firestoreに設定がない場合は、
 * 初期設定を返します。
 */
export async function getRegularScheduleSettings(): Promise<RegularScheduleSettings> {
  const reference = doc(
    db,
    SETTINGS_COLLECTION,
    REGULAR_SETTINGS_DOCUMENT,
  );

  const snapshot = await getDoc(reference);

  if (!snapshot.exists()) {
    return cloneDefaultSettings().regular;
  }

  const data =
    snapshot.data() as Partial<RegularScheduleSettings>;

  const defaults = cloneDefaultSettings().regular;

  return {
    ...defaults,
    ...data,

    enabledWeekdays:
      data.enabledWeekdays ??
      defaults.enabledWeekdays,

    lessonRule: {
      ...defaults.lessonRule,
      ...data.lessonRule,
    },

    periods:
      data.periods ??
      defaults.periods,
  };
}

/**
 * 通常授業設定を保存します。
 */
export async function saveRegularScheduleSettings(
  settings: RegularScheduleSettings,
): Promise<void> {
  const reference = doc(
    db,
    SETTINGS_COLLECTION,
    REGULAR_SETTINGS_DOCUMENT,
  );

  await setDoc(
    reference,
    {
      ...settings,
      updatedAt: serverTimestamp(),
    },
    {
      merge: true,
    },
  );
}

/**
 * 春期・夏期・冬期・その他の
 * 講習設定をまとめて取得します。
 *
 * Firestoreに設定がない場合は、
 * 初期設定を返します。
 */
export async function getCourseScheduleSettings(): Promise<CourseScheduleSettingsMap> {
  const reference = doc(
    db,
    SETTINGS_COLLECTION,
    COURSE_SETTINGS_DOCUMENT,
  );

  const snapshot = await getDoc(reference);

  if (!snapshot.exists()) {
    return cloneDefaultSettings().courses;
  }

  const data =
    snapshot.data() as Partial<CourseScheduleSettingsMap>;

  const defaults = cloneDefaultSettings().courses;

  return {
    spring: {
      ...defaults.spring,
      ...data.spring,

      enabledWeekdays:
        data.spring?.enabledWeekdays ??
        defaults.spring.enabledWeekdays,

      lessonRule: {
        ...defaults.spring.lessonRule,
        ...data.spring?.lessonRule,
      },

      periods:
        data.spring?.periods ??
        defaults.spring.periods,
    },

    summer: {
      ...defaults.summer,
      ...data.summer,

      enabledWeekdays:
        data.summer?.enabledWeekdays ??
        defaults.summer.enabledWeekdays,

      lessonRule: {
        ...defaults.summer.lessonRule,
        ...data.summer?.lessonRule,
      },

      periods:
        data.summer?.periods ??
        defaults.summer.periods,
    },

    winter: {
      ...defaults.winter,
      ...data.winter,

      enabledWeekdays:
        data.winter?.enabledWeekdays ??
        defaults.winter.enabledWeekdays,

      lessonRule: {
        ...defaults.winter.lessonRule,
        ...data.winter?.lessonRule,
      },

      periods:
        data.winter?.periods ??
        defaults.winter.periods,
    },

    other: {
      ...defaults.other,
      ...data.other,

      enabledWeekdays:
        data.other?.enabledWeekdays ??
        defaults.other.enabledWeekdays,

      lessonRule: {
        ...defaults.other.lessonRule,
        ...data.other?.lessonRule,
      },

      periods:
        data.other?.periods ??
        defaults.other.periods,
    },
  };
}

/**
 * 講習設定をまとめて保存します。
 */
export async function saveCourseScheduleSettings(
  settings: CourseScheduleSettingsMap,
): Promise<void> {
  const reference = doc(
    db,
    SETTINGS_COLLECTION,
    COURSE_SETTINGS_DOCUMENT,
  );

  await setDoc(
    reference,
    {
      ...settings,
      updatedAt: serverTimestamp(),
    },
    {
      merge: true,
    },
  );
}
/**
 * 休塾日を取得します。
 *
 * 休塾日の編集画面は、後ほど
 * スケジュール画面内に作成します。
 */
export async function getClosedDates(): Promise<string[]> {
  const reference = doc(
    db,
    SETTINGS_COLLECTION,
    SYSTEM_SETTINGS_DOCUMENT,
  );

  const snapshot = await getDoc(reference);

  if (!snapshot.exists()) {
    return cloneDefaultSettings().closedDates;
  }

  const data =
    snapshot.data() as Partial<SystemSettingsDocument>;

  return Array.isArray(data.closedDates)
    ? data.closedDates
    : [];
}

/**
 * 休塾日を保存します。
 */
export async function saveClosedDates(
  closedDates: string[],
): Promise<void> {
  const reference = doc(
    db,
    SETTINGS_COLLECTION,
    SYSTEM_SETTINGS_DOCUMENT,
  );

  const uniqueClosedDates = [
    ...new Set(closedDates),
  ].sort();

  await setDoc(
    reference,
    {
      closedDates: uniqueClosedDates,
      updatedAt: serverTimestamp(),
    },
    {
      merge: true,
    },
  );
}

/**
 * スケジュール設定をまとめて取得します。
 */
export async function getScheduleSettings(): Promise<ScheduleSettings> {
  const [
    regular,
    courses,
    closedDates,
  ] = await Promise.all([
    getRegularScheduleSettings(),
    getCourseScheduleSettings(),
    getClosedDates(),
  ]);

  return {
    id: "system",
    regular,
    courses,
    closedDates,
  };
}