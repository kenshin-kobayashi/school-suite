import { db } from "@/lib/firebase";

import type {
  Lesson,
  LessonScheduleMode,
  LessonSource,
  LessonStatus,
  LessonStudent,
  LessonWriteData,
} from "@/types/lesson";

import type { Weekday } from "@/types/schedule";

import {
  createScheduleCellKey,
  type ScheduleCellPosition,
} from "@/types/schedule-cell";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

const lessonCollection = collection(
  db,
  "lessons",
);

const weekdays: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function normalizeString(
  value: unknown,
): string {
  return typeof value === "string"
    ? value
    : "";
}

function normalizeNumber(
  value: unknown,
  fallback = 0,
): number {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : fallback;
}

function normalizeWeekday(
  value: unknown,
): Weekday | undefined {
  if (
    typeof value === "string" &&
    weekdays.includes(
      value as Weekday,
    )
  ) {
    return value as Weekday;
  }

  return undefined;
}

function normalizeScheduleMode(
  value: unknown,
): LessonScheduleMode {
  if (value === "course") {
    return "course";
  }

  return "regular";
}

function normalizeLessonStatus(
  value: unknown,
): LessonStatus {
  if (
    value === "completed" ||
    value === "cancelled"
  ) {
    return value;
  }

  return "scheduled";
}

function normalizeLessonSource(
  value: unknown,
): LessonSource {
  if (value === "ai") {
    return "ai";
  }

  return "manual";
}

function normalizePosition(
  value: unknown,
): ScheduleCellPosition | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const columnId =
    normalizeString(
      value.columnId,
    ).trim();

  const periodId =
    normalizeString(
      value.periodId,
    ).trim();

  if (!columnId || !periodId) {
    return undefined;
  }

  return {
    columnId,
    periodId,
  };
}

function normalizeLessonStudent(
  value: unknown,
): LessonStudent | null {
  if (!isRecord(value)) {
    return null;
  }

  const studentId =
    normalizeString(
      value.studentId,
    ).trim();

  const studentNumber =
    normalizeString(
      value.studentNumber,
    ).trim();

  const studentName =
    normalizeString(
      value.studentName,
    ).trim();

  const grade =
    normalizeString(
      value.grade,
    ).trim();

  const subject =
    normalizeString(
      value.subject,
    ).trim();

  if (
    !studentId ||
    !studentName ||
    !subject
  ) {
    return null;
  }

  return {
    studentId,
    studentNumber,
    studentName,
    grade,
    subject,
  };
}

function normalizeLessonStudents(
  value: unknown,
): LessonStudent[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeLessonStudent)
    .filter(
      (
        student,
      ): student is LessonStudent =>
        student !== null,
    );
}

function normalizeFirestoreDate(
  value: unknown,
): Date | undefined {
  if (value instanceof Date) {
    return value;
  }

  if (value instanceof Timestamp) {
    return value.toDate();
  }

  return undefined;
}

function createPositionFromLessonData(
  data: Record<string, unknown>,
): ScheduleCellPosition | undefined {
  const savedPosition =
    normalizePosition(
      data.position,
    );

  if (savedPosition) {
    return savedPosition;
  }

  const scheduleMode =
    normalizeScheduleMode(
      data.scheduleMode,
    );

  const periodNumber =
    normalizeNumber(
      data.periodNumber,
      1,
    );

  const periodId = `period-${Math.max(
    1,
    Math.floor(periodNumber),
  )}`;

  if (scheduleMode === "regular") {
    const weekday =
      normalizeWeekday(
        data.weekday,
      );

    if (!weekday) {
      return undefined;
    }

    return {
      columnId: weekday,
      periodId,
    };
  }

  const date =
    normalizeString(
      data.date,
    ).trim();

  if (!date) {
    return undefined;
  }

  return {
    columnId: date,
    periodId,
  };
}

function normalizeLesson(
  id: string,
  data: Record<string, unknown>,
): Lesson {
  const scheduleMode =
    normalizeScheduleMode(
      data.scheduleMode,
    );

  const position =
    createPositionFromLessonData(
      data,
    );

  const weekday =
    normalizeWeekday(
      data.weekday,
    ) ??
    (scheduleMode === "regular"
      ? normalizeWeekday(
          position?.columnId,
        )
      : undefined);

  const savedDate =
    normalizeString(
      data.date,
    ).trim();

  const date =
    scheduleMode === "course"
      ? savedDate ||
        position?.columnId
      : undefined;

  const classroomId =
    normalizeString(
      data.classroomId,
    ).trim();

  const classroomName =
    normalizeString(
      data.classroomName,
    ).trim();

  return {
    id,

    academicYear:
      normalizeNumber(
        data.academicYear,
      ),

    ...(position
      ? {
          position,
        }
      : {}),

    scheduleMode,

    ...(weekday
      ? {
          weekday,
        }
      : {}),

    ...(date
      ? {
          date,
        }
      : {}),

    periodNumber: Math.max(
      1,
      Math.floor(
        normalizeNumber(
          data.periodNumber,
          1,
        ),
      ),
    ),

    teacherId:
      normalizeString(
        data.teacherId,
      ).trim(),

    teacherNumber:
      normalizeString(
        data.teacherNumber,
      ).trim(),

    teacherName:
      normalizeString(
        data.teacherName,
      ).trim(),

    classroomId,

    classroomName,

    students:
      normalizeLessonStudents(
        data.students,
      ),

    status:
      normalizeLessonStatus(
        data.status,
      ),

    source:
      normalizeLessonSource(
        data.source,
      ),

    createdAt:
      normalizeFirestoreDate(
        data.createdAt,
      ),

    updatedAt:
      normalizeFirestoreDate(
        data.updatedAt,
      ),
  };
}

function createLessonDocumentData(
  lesson: LessonWriteData,
) {
  const classroomId =
    lesson.classroomId.trim();

  const classroomName =
    lesson.classroomName.trim();

  if (!classroomId) {
    throw new Error(
      "授業の教室IDが設定されていません。",
    );
  }

  if (!classroomName) {
    throw new Error(
      "授業の教室名が設定されていません。",
    );
  }

  const teacherId =
    lesson.teacherId.trim();

  const teacherName =
    lesson.teacherName.trim();

  if (!teacherId) {
    throw new Error(
      "授業の担当講師が設定されていません。",
    );
  }

  if (!teacherName) {
    throw new Error(
      "授業の担当講師名が設定されていません。",
    );
  }

  if (lesson.students.length === 0) {
    throw new Error(
      "授業の受講生が設定されていません。",
    );
  }

  const baseData = {
    academicYear:
      lesson.academicYear,

    position:
      lesson.position,

    scheduleMode:
      lesson.scheduleMode,

    periodNumber:
      lesson.periodNumber,

    teacherId,

    teacherNumber:
      lesson.teacherNumber.trim(),

    teacherName,

    classroomId,

    classroomName,

    students:
      lesson.students,

    status:
      lesson.status,

    source:
      lesson.source,
  };

  if (
    lesson.scheduleMode ===
    "regular"
  ) {
    const weekday =
      lesson.weekday ??
      normalizeWeekday(
        lesson.position.columnId,
      );

    if (!weekday) {
      throw new Error(
        "通常授業の曜日が設定されていません。",
      );
    }

    return {
      ...baseData,
      weekday,
    };
  }

  const date =
    lesson.date?.trim() ??
    lesson.position.columnId.trim();

  if (!date) {
    throw new Error(
      "講習授業の日付が設定されていません。",
    );
  }

  return {
    ...baseData,
    date,
  };
}

/**
 * 授業をFirestoreへ追加します。
 *
 * 追加したFirestoreドキュメントのIDを返します。
 */
export const addLesson = async (
  lesson: LessonWriteData,
): Promise<string> => {
  const lessonData =
    createLessonDocumentData(
      lesson,
    );

  const lessonDocument =
    await addDoc(
      lessonCollection,
      {
        ...lessonData,
        createdAt:
          serverTimestamp(),
        updatedAt:
          serverTimestamp(),
      },
    );

  return lessonDocument.id;
};

/**
 * 授業一覧を取得します。
 *
 * academicYearを指定した場合は、
 * 指定年度の授業だけを取得します。
 */
export const getLessons = async (
  academicYear?: number,
): Promise<Lesson[]> => {
  const lessonQuery =
    academicYear === undefined
      ? lessonCollection
      : query(
          lessonCollection,
          where(
            "academicYear",
            "==",
            academicYear,
          ),
        );

  const snapshot =
    await getDocs(
      lessonQuery,
    );

  return snapshot.docs
    .map((lessonDocument) =>
      normalizeLesson(
        lessonDocument.id,
        lessonDocument.data(),
      ),
    )
    .sort((lessonA, lessonB) => {
      const positionA =
        lessonA.position;

      const positionB =
        lessonB.position;

      if (
        positionA &&
        positionB
      ) {
        const columnComparison =
          positionA.columnId.localeCompare(
            positionB.columnId,
          );

        if (
          columnComparison !== 0
        ) {
          return columnComparison;
        }
      }

      return (
        lessonA.periodNumber -
        lessonB.periodNumber
      );
    });
};

/**
 * 授業を更新します。
 */
export const updateLesson = async (
  id: string,
  lesson: LessonWriteData,
): Promise<void> => {
  const lessonId = id.trim();

  if (!lessonId) {
    throw new Error(
      "更新する授業IDが指定されていません。",
    );
  }

  const lessonData =
    createLessonDocumentData(
      lesson,
    );

  await updateDoc(
    doc(
      db,
      "lessons",
      lessonId,
    ),
    {
      ...lessonData,
      updatedAt:
        serverTimestamp(),
    },
  );
};

/**
 * 授業を削除します。
 */
export const deleteLesson = async (
  id: string,
): Promise<void> => {
  const lessonId = id.trim();

  if (!lessonId) {
    throw new Error(
      "削除する授業IDが指定されていません。",
    );
  }

  await deleteDoc(
    doc(
      db,
      "lessons",
      lessonId,
    ),
  );
};

/**
 * Firestoreから取得した授業を、
 * ScheduleGridで使用するセル別データへ変換します。
 */
export const groupLessonsByCell = (
  lessons: Lesson[],
): Record<string, Lesson[]> => {
  return lessons.reduce<
    Record<string, Lesson[]>
  >(
    (
      lessonsByCell,
      lesson,
    ) => {
      const position =
        lesson.position;

      if (!position) {
        return lessonsByCell;
      }

      const cellKey =
        createScheduleCellKey(
          position,
        );

      if (
        !lessonsByCell[
          cellKey
        ]
      ) {
        lessonsByCell[
          cellKey
        ] = [];
      }

      lessonsByCell[
        cellKey
      ].push(lesson);

      return lessonsByCell;
    },
    {},
  );
};