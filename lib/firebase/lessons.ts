import { db } from "@/lib/firebase";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import type {
  Lesson,
  LessonSource,
  LessonStatus,
} from "@/types/lesson";
import type { Weekday } from "@/types/schedule";
import type { ScheduleCellPosition } from "@/types/schedule-cell";

const lessonCollection = collection(
  db,
  "lessons",
);

const weekdayOrder: Record<Weekday, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

const validWeekdays: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

/**
 * 値が正しい曜日か確認します。
 */
function isWeekday(
  value: unknown,
): value is Weekday {
  return (
    typeof value === "string" &&
    validWeekdays.includes(value as Weekday)
  );
}

/**
 * Firestoreの日時データをDateへ変換します。
 */
function normalizeDate(
  value: unknown,
): Date | undefined {
  if (value instanceof Date) {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (
      value as {
        toDate?: unknown;
      }
    ).toDate === "function"
  ) {
    return (
      value as {
        toDate: () => Date;
      }
    ).toDate();
  }

  return undefined;
}

/**
 * 授業状態を正しい値へ変換します。
 */
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

/**
 * 授業の作成元を正しい値へ変換します。
 *
 * 過去データでautoが保存されていた場合は、
 * 現在使用しているaiへ変換します。
 */
function normalizeLessonSource(
  value: unknown,
): LessonSource {
  if (
    value === "ai" ||
    value === "auto"
  ) {
    return "ai";
  }

  return "manual";
}

/**
 * セル位置情報を正しい形へ変換します。
 */
function normalizePosition(
  value: unknown,
): ScheduleCellPosition | undefined {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return undefined;
  }

  const position =
    value as Record<string, unknown>;

  if (
    typeof position.columnId !== "string" ||
    typeof position.periodId !== "string"
  ) {
    return undefined;
  }

  return {
    columnId: position.columnId,
    periodId: position.periodId,
  };
}

/**
 * Firestoreから取得したデータを
 * Lesson型へ変換します。
 */
function normalizeLesson(
  id: string,
  data: Record<string, unknown>,
): Lesson {
  const scheduleMode =
    data.scheduleMode === "course"
      ? "course"
      : "regular";

  const weekday = isWeekday(data.weekday)
    ? data.weekday
    : undefined;

  const date =
    typeof data.date === "string"
      ? data.date
      : undefined;

  const position = normalizePosition(
    data.position,
  );

  const createdAt = normalizeDate(
    data.createdAt,
  );

  const updatedAt = normalizeDate(
    data.updatedAt,
  );

  return {
    id,

    academicYear:
      typeof data.academicYear === "number" &&
      Number.isInteger(data.academicYear)
        ? data.academicYear
        : new Date().getFullYear(),

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

    periodNumber:
      typeof data.periodNumber === "number"
        ? data.periodNumber
        : 1,

    teacherId:
      typeof data.teacherId === "string"
        ? data.teacherId
        : "",

    ...(typeof data.teacherNumber ===
    "string"
      ? {
          teacherNumber:
            data.teacherNumber,
        }
      : {}),

    teacherName:
      typeof data.teacherName === "string"
        ? data.teacherName
        : "",

    students: Array.isArray(data.students)
      ? (data.students as Lesson["students"])
      : [],

    status: normalizeLessonStatus(
      data.status,
    ),

    source: normalizeLessonSource(
      data.source,
    ),

    ...(createdAt
      ? {
          createdAt,
        }
      : {}),

    ...(updatedAt
      ? {
          updatedAt,
        }
      : {}),
  };
}

/**
 * Firestoreへ保存できるデータに変換します。
 *
 * Firestoreではundefinedを保存できないため、
 * undefinedの項目を取り除きます。
 */
function createLessonData(
  lesson: Omit<Lesson, "id">,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(lesson).filter(
      ([, value]) => value !== undefined,
    ),
  );
}

/**
 * 通常授業の曜日順を取得します。
 */
function getWeekdaySortValue(
  lesson: Lesson,
): number {
  if (!lesson.weekday) {
    return 99;
  }

  return weekdayOrder[lesson.weekday];
}

/**
 * 授業一覧を並び替えます。
 *
 * 通常授業:
 * 曜日 → 時限 → 講師名
 *
 * 講習授業:
 * 日付 → 時限 → 講師名
 */
function sortLessons(
  lessons: Lesson[],
): Lesson[] {
  return [...lessons].sort(
    (lessonA, lessonB) => {
      if (
        lessonA.academicYear !==
        lessonB.academicYear
      ) {
        return (
          lessonA.academicYear -
          lessonB.academicYear
        );
      }

      if (
        lessonA.scheduleMode !==
        lessonB.scheduleMode
      ) {
        return lessonA.scheduleMode ===
          "regular"
          ? -1
          : 1;
      }

      if (
        lessonA.scheduleMode === "regular" &&
        lessonB.scheduleMode === "regular"
      ) {
        const weekdayComparison =
          getWeekdaySortValue(lessonA) -
          getWeekdaySortValue(lessonB);

        if (weekdayComparison !== 0) {
          return weekdayComparison;
        }
      }

      if (
        lessonA.scheduleMode === "course" &&
        lessonB.scheduleMode === "course"
      ) {
        const dateComparison = (
          lessonA.date ?? ""
        ).localeCompare(
          lessonB.date ?? "",
        );

        if (dateComparison !== 0) {
          return dateComparison;
        }
      }

      const periodComparison =
        lessonA.periodNumber -
        lessonB.periodNumber;

      if (periodComparison !== 0) {
        return periodComparison;
      }

      return lessonA.teacherName.localeCompare(
        lessonB.teacherName,
        "ja",
      );
    },
  );
}

/**
 * すべての授業を取得します。
 */
export async function getLessons(): Promise<
  Lesson[]
> {
  try {
    const snapshot = await getDocs(
      lessonCollection,
    );

    const lessons = snapshot.docs.map(
      (lessonDocument) =>
        normalizeLesson(
          lessonDocument.id,
          lessonDocument.data(),
        ),
    );

    return sortLessons(lessons);
  } catch (error) {
    console.error(
      "授業一覧の取得に失敗しました。",
      error,
    );

    throw new Error(
      "授業一覧を取得できませんでした。",
    );
  }
}

/**
 * 指定した年度の授業を取得します。
 */
export async function getLessonsByAcademicYear(
  academicYear: number,
): Promise<Lesson[]> {
  const lessons = await getLessons();

  return lessons.filter(
    (lesson) =>
      lesson.academicYear === academicYear,
  );
}

/**
 * 指定した日付の授業を取得します。
 */
export async function getLessonsByDate(
  date: string,
): Promise<Lesson[]> {
  const lessons = await getLessons();

  return lessons.filter(
    (lesson) => lesson.date === date,
  );
}

/**
 * 指定した年度・日付の授業を取得します。
 */
export async function getLessonsByAcademicYearAndDate(
  academicYear: number,
  date: string,
): Promise<Lesson[]> {
  const lessons =
    await getLessonsByAcademicYear(
      academicYear,
    );

  return lessons.filter(
    (lesson) => lesson.date === date,
  );
}

/**
 * 指定した年度の通常授業を取得します。
 */
export async function getRegularLessonsByAcademicYear(
  academicYear: number,
): Promise<Lesson[]> {
  const lessons =
    await getLessonsByAcademicYear(
      academicYear,
    );

  return lessons.filter(
    (lesson) =>
      lesson.scheduleMode === "regular",
  );
}

/**
 * 指定した年度の講習授業を取得します。
 */
export async function getCourseLessonsByAcademicYear(
  academicYear: number,
): Promise<Lesson[]> {
  const lessons =
    await getLessonsByAcademicYear(
      academicYear,
    );

  return lessons.filter(
    (lesson) =>
      lesson.scheduleMode === "course",
  );
}

/**
 * 指定したIDの授業を取得します。
 */
export async function getLessonById(
  lessonId: string,
): Promise<Lesson | null> {
  if (!lessonId.trim()) {
    return null;
  }

  try {
    const lessonDocument = await getDoc(
      doc(db, "lessons", lessonId),
    );

    if (!lessonDocument.exists()) {
      return null;
    }

    return normalizeLesson(
      lessonDocument.id,
      lessonDocument.data(),
    );
  } catch (error) {
    console.error(
      "授業の取得に失敗しました。",
      error,
    );

    throw new Error(
      "授業を取得できませんでした。",
    );
  }
}

/**
 * 新しい授業を登録します。
 */
export async function createLesson(
  lesson: Omit<Lesson, "id">,
): Promise<Lesson> {
  try {
    const lessonData =
      createLessonData(lesson);

    const createdDocument =
      await addDoc(
        lessonCollection,
        lessonData,
      );

    return {
      id: createdDocument.id,
      ...lesson,
    };
  } catch (error) {
    console.error(
      "授業の登録に失敗しました。",
      error,
    );

    throw new Error(
      "授業を登録できませんでした。",
    );
  }
}

/**
 * 授業情報をすべて保存します。
 */
export async function saveLesson(
  lesson: Lesson,
): Promise<void> {
  const lessonId = lesson.id;

  if (!lessonId?.trim()) {
    throw new Error(
      "授業IDが設定されていません。",
    );
  }

  try {
    const {
      id: _id,
      ...lessonWithoutId
    } = lesson;

    await setDoc(
      doc(db, "lessons", lessonId),
      createLessonData(
        lessonWithoutId,
      ),
    );
  } catch (error) {
    console.error(
      "授業の保存に失敗しました。",
      error,
    );

    throw new Error(
      "授業を保存できませんでした。",
    );
  }
}

/**
 * 授業情報の一部を更新します。
 */
export async function updateLesson(
  lessonId: string,
  updates: Partial<
    Omit<Lesson, "id">
  >,
): Promise<void> {
  if (!lessonId.trim()) {
    throw new Error(
      "授業IDが設定されていません。",
    );
  }

  try {
    const updateData =
      Object.fromEntries(
        Object.entries(updates).filter(
          ([, value]) =>
            value !== undefined,
        ),
      );

    if (
      Object.keys(updateData).length === 0
    ) {
      return;
    }

    await updateDoc(
      doc(db, "lessons", lessonId),
      updateData,
    );
  } catch (error) {
    console.error(
      "授業の更新に失敗しました。",
      error,
    );

    throw new Error(
      "授業を更新できませんでした。",
    );
  }
}

/**
 * 授業を削除します。
 */
export async function deleteLesson(
  lessonId: string,
): Promise<void> {
  if (!lessonId.trim()) {
    throw new Error(
      "授業IDが設定されていません。",
    );
  }

  try {
    await deleteDoc(
      doc(db, "lessons", lessonId),
    );
  } catch (error) {
    console.error(
      "授業の削除に失敗しました。",
      error,
    );

    throw new Error(
      "授業を削除できませんでした。",
    );
  }
}

/**
 * 複数の授業をまとめて保存します。
 *
 * Firestoreのバッチ上限を考慮して、
 * 400件ずつに分けて保存します。
 */
export async function saveLessons(
  lessons: Lesson[],
): Promise<void> {
  if (lessons.length === 0) {
    return;
  }

  try {
    const batchSize = 400;

    for (
      let startIndex = 0;
      startIndex < lessons.length;
      startIndex += batchSize
    ) {
      const currentLessons =
        lessons.slice(
          startIndex,
          startIndex + batchSize,
        );

      const batch = writeBatch(db);

      currentLessons.forEach(
        (lesson) => {
          const lessonId = lesson.id;

          if (!lessonId?.trim()) {
            throw new Error(
              "IDが設定されていない授業が含まれています。",
            );
          }

          const {
            id: _id,
            ...lessonWithoutId
          } = lesson;

          batch.set(
            doc(
              db,
              "lessons",
              lessonId,
            ),
            createLessonData(
              lessonWithoutId,
            ),
          );
        },
      );

      await batch.commit();
    }
  } catch (error) {
    console.error(
      "授業の一括保存に失敗しました。",
      error,
    );

    throw new Error(
      "授業を一括保存できませんでした。",
    );
  }
}

/**
 * 指定した年度の授業をすべて削除します。
 */
export async function deleteLessonsByAcademicYear(
  academicYear: number,
): Promise<void> {
  try {
    const lessons =
      await getLessonsByAcademicYear(
        academicYear,
      );

    if (lessons.length === 0) {
      return;
    }

    const batchSize = 400;

    for (
      let startIndex = 0;
      startIndex < lessons.length;
      startIndex += batchSize
    ) {
      const currentLessons =
        lessons.slice(
          startIndex,
          startIndex + batchSize,
        );

      const batch = writeBatch(db);

      currentLessons.forEach(
        (lesson) => {
          const lessonId = lesson.id;

          if (!lessonId?.trim()) {
            return;
          }

          batch.delete(
            doc(
              db,
              "lessons",
              lessonId,
            ),
          );
        },
      );

      await batch.commit();
    }
  } catch (error) {
    console.error(
      "年度別授業の削除に失敗しました。",
      error,
    );

    throw new Error(
      "指定した年度の授業を削除できませんでした。",
    );
  }
}