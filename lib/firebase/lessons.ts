import { db } from "@/lib/firebase";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";

import type {
  Lesson,
  LessonFormValues,
  LessonScheduleMode,
  LessonSource,
  LessonStatus,
} from "@/types/lesson";

import type { Weekday } from "@/types/schedule";
import type { ScheduleCellPosition } from "@/types/schedule-cell";

const lessonCollection = collection(db, "lessons");

const weekdays: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function isWeekday(value: string): value is Weekday {
  return weekdays.includes(value as Weekday);
}

function isDateColumn(columnId: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(columnId);
}

function getScheduleMode(
  position: ScheduleCellPosition,
): LessonScheduleMode {
  return isDateColumn(position.columnId)
    ? "course"
    : "regular";
}

function getPeriodNumber(periodId: string): number {
  const parsedNumber = Number(
    periodId.replace("period-", ""),
  );

  return Number.isFinite(parsedNumber)
    ? parsedNumber
    : 0;
}

function createScheduleFields(
  position: ScheduleCellPosition,
) {
  const scheduleMode =
    getScheduleMode(position);

  const periodNumber = getPeriodNumber(
    position.periodId,
  );

  if (scheduleMode === "course") {
    return {
      scheduleMode,
      date: position.columnId,
      weekday: undefined,
      periodNumber,
    };
  }

  return {
    scheduleMode,
    weekday: isWeekday(position.columnId)
      ? position.columnId
      : undefined,
    date: undefined,
    periodNumber,
  };
}

function toDate(value: unknown): Date | undefined {
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate();
  }

  return undefined;
}

function convertLessonDocument(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): Lesson {
  const data = snapshot.data();

  const position =
    data.position as ScheduleCellPosition;

  const scheduleFields =
    createScheduleFields(position);

  return {
    id: snapshot.id,

    position,

    scheduleMode:
      (data.scheduleMode as LessonScheduleMode | undefined) ??
      scheduleFields.scheduleMode,

    weekday:
      (data.weekday as Weekday | undefined) ??
      scheduleFields.weekday,

    date:
      (data.date as string | undefined) ??
      scheduleFields.date,

    periodNumber:
      typeof data.periodNumber === "number"
        ? data.periodNumber
        : scheduleFields.periodNumber,

    teacherId:
      typeof data.teacherId === "string"
        ? data.teacherId
        : "",

    teacherNumber:
      typeof data.teacherNumber === "string"
        ? data.teacherNumber
        : "",

    teacherName:
      typeof data.teacherName === "string"
        ? data.teacherName
        : "",

    students: Array.isArray(data.students)
      ? data.students.map((student) => ({
          studentId:
            typeof student.studentId === "string"
              ? student.studentId
              : "",

          studentNumber:
            typeof student.studentNumber ===
            "string"
              ? student.studentNumber
              : "",

          studentName:
            typeof student.studentName === "string"
              ? student.studentName
              : "",

          grade:
            typeof student.grade === "string"
              ? student.grade
              : "",

          subject:
            typeof student.subject === "string"
              ? student.subject
              : "",
        }))
      : [],

    status:
      (data.status as LessonStatus | undefined) ??
      "scheduled",

    source:
      (data.source as LessonSource | undefined) ??
      "manual",

    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function addLesson(
  position: ScheduleCellPosition,
  values: LessonFormValues,
): Promise<string> {
  const scheduleFields =
    createScheduleFields(position);

  const documentReference = await addDoc(
    lessonCollection,
    {
      position,

      scheduleMode:
        scheduleFields.scheduleMode,

      weekday:
        scheduleFields.weekday ?? null,

      date:
        scheduleFields.date ?? null,

      periodNumber:
        scheduleFields.periodNumber,

      teacherId: values.teacherId,
      teacherNumber: values.teacherNumber,
      teacherName: values.teacherName,

      students: values.students,

      status: "scheduled",
      source: "manual",

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  );

  return documentReference.id;
}

export async function updateLesson(
  lessonId: string,
  position: ScheduleCellPosition,
  values: LessonFormValues,
): Promise<void> {
  const scheduleFields =
    createScheduleFields(position);

  await updateDoc(
    doc(db, "lessons", lessonId),
    {
      position,

      scheduleMode:
        scheduleFields.scheduleMode,

      weekday:
        scheduleFields.weekday ?? null,

      date:
        scheduleFields.date ?? null,

      periodNumber:
        scheduleFields.periodNumber,

      teacherId: values.teacherId,
      teacherNumber: values.teacherNumber,
      teacherName: values.teacherName,

      students: values.students,

      updatedAt: serverTimestamp(),
    },
  );
}

export async function deleteLesson(
  lessonId: string,
): Promise<void> {
  await deleteDoc(
    doc(db, "lessons", lessonId),
  );
}

export async function getLessons(): Promise<
  Lesson[]
> {
  const snapshot =
    await getDocs(lessonCollection);

  return snapshot.docs.map(
    convertLessonDocument,
  );
}

export function subscribeLessons(
  onChange: (lessons: Lesson[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    lessonCollection,
    (snapshot) => {
      const lessons = snapshot.docs.map(
        convertLessonDocument,
      );

      onChange(lessons);
    },
    (error) => {
      console.error(
        "授業情報の取得に失敗しました。",
        error,
      );

      onError?.(error);
    },
  );
}