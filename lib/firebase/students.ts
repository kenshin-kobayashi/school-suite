import { db } from "@/lib/firebase";
import { addActivity } from "@/lib/firebase/activities";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  limit,
  updateDoc,
} from "firebase/firestore";

export type Student = {
  id?: string;
  studentNumber: string;
  name: string;
  furigana: string;
  grade: string;
  school: string;
  status: "在籍" | "休塾" | "退塾";
};

const studentCollection = collection(db, "students");

// 次の生徒番号を取得（S0001形式）
export const generateStudentNumber = async () => {
  const studentQuery = query(
    studentCollection,
    orderBy("studentNumber", "desc"),
    limit(1)
  );

  const snapshot = await getDocs(studentQuery);

  if (snapshot.empty) {
    return "S0001";
  }

  const lastNumber =
    snapshot.docs[0].data().studentNumber;

  const number = Number(
    lastNumber.replace("S", "")
  );

  return `S${String(number + 1).padStart(
    4,
    "0"
  )}`;
};

// 生徒追加
export const addStudent = async (
  student: Omit<Student, "id" | "studentNumber">
) => {
  const studentNumber =
    await generateStudentNumber();

  await addDoc(studentCollection, {
    ...student,
    studentNumber,
  });

  await addActivity({
    message: `生徒「${student.name}」を登録しました`,
    type: "student",
    action: "create",
  });
};

// 生徒一覧取得
export const getStudents = async () => {
  const snapshot =
    await getDocs(studentCollection);

  return snapshot.docs.map((studentDoc) => ({
    id: studentDoc.id,
    ...studentDoc.data(),
  })) as Student[];
};

// 生徒更新
export const updateStudent = async (
  id: string,
  student: Partial<Omit<Student, "id">>
) => {
  await updateDoc(
    doc(db, "students", id),
    student
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
  studentName: string
) => {
  await deleteDoc(doc(db, "students", id));

  await addActivity({
    message: `生徒「${studentName}」を削除しました`,
    type: "student",
    action: "delete",
  });
};