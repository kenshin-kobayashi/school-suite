import { db } from "@/lib/firebase";
import { addActivity } from "@/lib/firebase/activities";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

export type StudentStatus =
  | "在籍"
  | "休塾"
  | "退塾";

export type MaxStudentsPerLesson =
  | 1
  | 2
  | 3
  | 4;

export type Student = {
  id?: string;

  studentNumber: string;
  name: string;
  furigana: string;
  grade: string;
  school: string;
  status: StudentStatus;

  /**
   * この生徒を担当できない講師の
   * FirestoreドキュメントID一覧です。
   */
  unavailableTeacherIds: string[];

  /**
   * この生徒が参加できる授業の最大生徒数です。
   *
   * 1: 1対1
   * 2: 最大1対2
   * 3: 最大1対3
   * 4: 最大1対4
   */
  maxStudentsPerLesson: MaxStudentsPerLesson;

  /**
   * 希望講師のFirestoreドキュメントIDです。
   * 未設定の場合は空文字です。
   */
  firstPreferredTeacherId: string;
  secondPreferredTeacherId: string;
};

const studentCollection = collection(
  db,
  "students",
);

function normalizeStringArray(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value.filter(
        (item): item is string =>
          typeof item === "string" &&
          item.trim() !== "",
      ),
    ),
  );
}

function normalizeMaxStudentsPerLesson(
  value: unknown,
): MaxStudentsPerLesson {
  if (
    value === 1 ||
    value === 2 ||
    value === 3 ||
    value === 4
  ) {
    return value;
  }

  /*
   * 新項目追加前の既存生徒は、
   * 最大1対2として扱います。
   */
  return 2;
}

function normalizeStudentStatus(
  value: unknown,
): StudentStatus {
  if (
    value === "休塾" ||
    value === "退塾"
  ) {
    return value;
  }

  return "在籍";
}

function normalizeStudent(
  id: string,
  data: Record<string, unknown>,
): Student {
  const unavailableTeacherIds =
    normalizeStringArray(
      data.unavailableTeacherIds,
    );

  let firstPreferredTeacherId =
    typeof data.firstPreferredTeacherId ===
    "string"
      ? data.firstPreferredTeacherId
      : "";

  let secondPreferredTeacherId =
    typeof data.secondPreferredTeacherId ===
    "string"
      ? data.secondPreferredTeacherId
      : "";

  /*
   * 担当不可講師が希望講師にも保存されていた場合は、
   * 希望講師側を空欄へ補正します。
   */
  if (
    unavailableTeacherIds.includes(
      firstPreferredTeacherId,
    )
  ) {
    firstPreferredTeacherId = "";
  }

  if (
    unavailableTeacherIds.includes(
      secondPreferredTeacherId,
    )
  ) {
    secondPreferredTeacherId = "";
  }

  /*
   * 第1希望と第2希望が同じ場合は、
   * 第2希望を空欄へ補正します。
   */
  if (
    firstPreferredTeacherId &&
    firstPreferredTeacherId ===
      secondPreferredTeacherId
  ) {
    secondPreferredTeacherId = "";
  }

  return {
    id,

    studentNumber:
      typeof data.studentNumber === "string"
        ? data.studentNumber
        : "",

    name:
      typeof data.name === "string"
        ? data.name
        : "",

    furigana:
      typeof data.furigana === "string"
        ? data.furigana
        : "",

    grade:
      typeof data.grade === "string"
        ? data.grade
        : "",

    school:
      typeof data.school === "string"
        ? data.school
        : "",

    status: normalizeStudentStatus(
      data.status,
    ),

    unavailableTeacherIds,

    maxStudentsPerLesson:
      normalizeMaxStudentsPerLesson(
        data.maxStudentsPerLesson,
      ),

    firstPreferredTeacherId,
    secondPreferredTeacherId,
  };
}

// 次の生徒番号を取得（S0001形式）
export const generateStudentNumber =
  async (): Promise<string> => {
    const studentQuery = query(
      studentCollection,
      orderBy("studentNumber", "desc"),
      limit(1),
    );

    const snapshot = await getDocs(
      studentQuery,
    );

    if (snapshot.empty) {
      return "S0001";
    }

    const lastNumber = String(
      snapshot.docs[0].data()
        .studentNumber ?? "",
    );

    const number = Number(
      lastNumber.replace("S", ""),
    );

    const nextNumber =
      Number.isFinite(number)
        ? number + 1
        : 1;

    return `S${String(nextNumber).padStart(
      4,
      "0",
    )}`;
  };

// 生徒追加
export const addStudent = async (
  student: Omit<
    Student,
    "id" | "studentNumber"
  >,
): Promise<void> => {
  const studentNumber =
    await generateStudentNumber();

  const unavailableTeacherIds =
    normalizeStringArray(
      student.unavailableTeacherIds,
    );

  const firstPreferredTeacherId =
    unavailableTeacherIds.includes(
      student.firstPreferredTeacherId,
    )
      ? ""
      : student.firstPreferredTeacherId;

  const secondPreferredTeacherId =
    unavailableTeacherIds.includes(
      student.secondPreferredTeacherId,
    ) ||
    student.secondPreferredTeacherId ===
      firstPreferredTeacherId
      ? ""
      : student.secondPreferredTeacherId;

  await addDoc(studentCollection, {
    ...student,

    studentNumber,

    unavailableTeacherIds,

    maxStudentsPerLesson:
      normalizeMaxStudentsPerLesson(
        student.maxStudentsPerLesson,
      ),

    firstPreferredTeacherId,
    secondPreferredTeacherId,
  });

  await addActivity({
    message: `生徒「${student.name}」を登録しました`,
    type: "student",
    action: "create",
  });
};

// 生徒一覧取得
export const getStudents = async (): Promise<
  Student[]
> => {
  const snapshot = await getDocs(
    studentCollection,
  );

  return snapshot.docs.map(
    (studentDocument) =>
      normalizeStudent(
        studentDocument.id,
        studentDocument.data(),
      ),
  );
};

// 生徒更新
export const updateStudent = async (
  id: string,
  student: Partial<
    Omit<Student, "id">
  >,
): Promise<void> => {
  const unavailableTeacherIds =
    student.unavailableTeacherIds
      ? normalizeStringArray(
          student.unavailableTeacherIds,
        )
      : undefined;

  let firstPreferredTeacherId =
    student.firstPreferredTeacherId;

  let secondPreferredTeacherId =
    student.secondPreferredTeacherId;

  if (
    unavailableTeacherIds &&
    firstPreferredTeacherId &&
    unavailableTeacherIds.includes(
      firstPreferredTeacherId,
    )
  ) {
    firstPreferredTeacherId = "";
  }

  if (
    unavailableTeacherIds &&
    secondPreferredTeacherId &&
    unavailableTeacherIds.includes(
      secondPreferredTeacherId,
    )
  ) {
    secondPreferredTeacherId = "";
  }

  if (
    firstPreferredTeacherId &&
    secondPreferredTeacherId ===
      firstPreferredTeacherId
  ) {
    secondPreferredTeacherId = "";
  }

  await updateDoc(
    doc(db, "students", id),
    {
      ...student,

      ...(unavailableTeacherIds
        ? {
            unavailableTeacherIds,
          }
        : {}),

      ...(student.maxStudentsPerLesson !==
      undefined
        ? {
            maxStudentsPerLesson:
              normalizeMaxStudentsPerLesson(
                student.maxStudentsPerLesson,
              ),
          }
        : {}),

      ...(firstPreferredTeacherId !==
      undefined
        ? {
            firstPreferredTeacherId,
          }
        : {}),

      ...(secondPreferredTeacherId !==
      undefined
        ? {
            secondPreferredTeacherId,
          }
        : {}),
    },
  );

  await addActivity({
    message: `生徒「${
      student.name ?? "名称未設定"
    }」の情報を更新しました`,
    type: "student",
    action: "update",
  });
};

// 生徒削除
export const deleteStudent = async (
  id: string,
  studentName: string,
): Promise<void> => {
  await deleteDoc(
    doc(db, "students", id),
  );

  await addActivity({
    message: `生徒「${studentName}」を削除しました`,
    type: "student",
    action: "delete",
  });
};