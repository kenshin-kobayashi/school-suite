import { db } from "@/lib/firebase";

import type {
  StudentScheduleValue,
  StudentScheduleValues,
} from "@/components/schedule/student-schedule/StudentScheduleDialog";

import type { CourseType } from "@/types/schedule-settings";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

type StudentScheduleDocument = {
  academicYear: number;
  courseType: CourseType;
  schedules: StudentScheduleValues;
};

const subjects = [
  "国語",
  "数学",
  "英語",
  "理科",
  "社会",
] as const;

function createStudentScheduleDocumentId(
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

function normalizeLessonCount(
  value: unknown,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      99,
      Math.floor(value),
    ),
  );
}

function normalizeRequiredLessonCounts(
  value: unknown,
): Record<string, number> {
  const normalizedCounts: Record<
    string,
    number
  > = {
    国語: 0,
    数学: 0,
    英語: 0,
    理科: 0,
    社会: 0,
  };

  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return normalizedCounts;
  }

  const rawCounts =
    value as Record<
      string,
      unknown
    >;

  subjects.forEach(
    (subject) => {
      normalizedCounts[subject] =
        normalizeLessonCount(
          rawCounts[subject],
        );
    },
  );

  return normalizedCounts;
}

function normalizeStudentScheduleValue(
  value: unknown,
): StudentScheduleValue {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {
      requiredLessonCounts:
        normalizeRequiredLessonCounts(
          undefined,
        ),

      availableSlotIds: [],
    };
  }

  const rawValue =
    value as {
      requiredLessonCounts?: unknown;
      availableSlotIds?: unknown;
    };

  return {
    requiredLessonCounts:
      normalizeRequiredLessonCounts(
        rawValue.requiredLessonCounts,
      ),

    availableSlotIds:
      normalizeSlotIds(
        rawValue.availableSlotIds,
      ),
  };
}

function normalizeStudentSchedules(
  value: unknown,
): StudentScheduleValues {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  const schedules: StudentScheduleValues =
    {};

  for (const [
    studentKey,
    scheduleValue,
  ] of Object.entries(value)) {
    if (
      !studentKey.trim()
    ) {
      continue;
    }

    schedules[studentKey] =
      normalizeStudentScheduleValue(
        scheduleValue,
      );
  }

  return schedules;
}

/**
 * 指定年度・講習の生徒日程を取得します。
 */
export async function getStudentSchedules(
  academicYear: number,
  courseType: CourseType,
): Promise<StudentScheduleValues> {
  const documentId =
    createStudentScheduleDocumentId(
      academicYear,
      courseType,
    );

  const documentReference = doc(
    db,
    "studentSchedules",
    documentId,
  );

  const snapshot = await getDoc(
    documentReference,
  );

  if (!snapshot.exists()) {
    return {};
  }

  const data =
    snapshot.data() as Partial<StudentScheduleDocument>;

  return normalizeStudentSchedules(
    data.schedules,
  );
}

/**
 * 指定年度・講習の生徒日程を保存します。
 */
export async function saveStudentSchedules(
  academicYear: number,
  courseType: CourseType,
  schedules: StudentScheduleValues,
): Promise<void> {
  const documentId =
    createStudentScheduleDocumentId(
      academicYear,
      courseType,
    );

  const documentReference = doc(
    db,
    "studentSchedules",
    documentId,
  );

  const normalizedSchedules =
    normalizeStudentSchedules(
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