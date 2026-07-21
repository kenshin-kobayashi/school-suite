import { db } from "@/lib/firebase";

import type {
  TeacherScheduleValue,
  TeacherScheduleValues,
} from "@/components/schedule/teacher-schedule/TeacherScheduleDialog";

import type { CourseType } from "@/types/schedule-settings";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

type TeacherScheduleDocument = {
  academicYear: number;
  courseType: CourseType;
  schedules: TeacherScheduleValues;
};

function createTeacherScheduleDocumentId(
  academicYear: number,
  courseType: CourseType,
): string {
  return `${academicYear}-${courseType}`;
}

function normalizeSlotIds(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value.filter(
        (
          slotId,
        ): slotId is string =>
          typeof slotId ===
            "string" &&
          slotId.trim().length > 0,
      ),
    ),
  );
}

function normalizeTeacherScheduleValue(
  value: unknown,
): TeacherScheduleValue {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {
      availableSlotIds: [],
    };
  }

  const rawValue =
    value as {
      availableSlotIds?: unknown;
    };

  return {
    availableSlotIds:
      normalizeSlotIds(
        rawValue.availableSlotIds,
      ),
  };
}

function normalizeTeacherSchedules(
  value: unknown,
): TeacherScheduleValues {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  const schedules: TeacherScheduleValues =
    {};

  for (const [
    teacherKey,
    scheduleValue,
  ] of Object.entries(value)) {
    if (!teacherKey.trim()) {
      continue;
    }

    schedules[teacherKey] =
      normalizeTeacherScheduleValue(
        scheduleValue,
      );
  }

  return schedules;
}

/**
 * 指定年度・講習の講師日程を取得します。
 */
export async function getTeacherSchedules(
  academicYear: number,
  courseType: CourseType,
): Promise<TeacherScheduleValues> {
  const documentId =
    createTeacherScheduleDocumentId(
      academicYear,
      courseType,
    );

  const documentReference = doc(
    db,
    "teacherSchedules",
    documentId,
  );

  const snapshot = await getDoc(
    documentReference,
  );

  if (!snapshot.exists()) {
    return {};
  }

  const data =
    snapshot.data() as Partial<TeacherScheduleDocument>;

  return normalizeTeacherSchedules(
    data.schedules,
  );
}

/**
 * 指定年度・講習の講師日程を保存します。
 */
export async function saveTeacherSchedules(
  academicYear: number,
  courseType: CourseType,
  schedules: TeacherScheduleValues,
): Promise<void> {
  const documentId =
    createTeacherScheduleDocumentId(
      academicYear,
      courseType,
    );

  const documentReference = doc(
    db,
    "teacherSchedules",
    documentId,
  );

  const normalizedSchedules =
    normalizeTeacherSchedules(
      schedules,
    );

  await setDoc(
    documentReference,
    {
      academicYear,
      courseType,
      schedules:
        normalizedSchedules,
      updatedAt:
        serverTimestamp(),
    },
    {
      merge: true,
    },
  );
}