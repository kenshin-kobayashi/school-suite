import { db } from "@/lib/firebase";
import { addActivity } from "./activities";

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

export type TeacherSubject = {
  id: string;
  subject: string;
  grades: string[];
  examMath?: boolean;
};

export type Teacher = {
  id?: string;
  teacherNumber: string;
  name: string;
  furigana: string;
  status: "在籍" | "休職" | "退職";
  subjects: TeacherSubject[];
};

const teacherCollection = collection(db, "teachers");

// 次の講師番号を取得（T0001形式）
export const generateTeacherNumber = async () => {
  const q = query(
    teacherCollection,
    orderBy("teacherNumber", "desc"),
    limit(1)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return "T0001";
  }

  const lastNumber = snapshot.docs[0].data().teacherNumber;
  const number = Number(lastNumber.replace("T", ""));

  return `T${String(number + 1).padStart(4, "0")}`;
};

// 講師追加
export const addTeacher = async (
  teacher: Omit<Teacher, "id" | "teacherNumber">
) => {
  const teacherNumber = await generateTeacherNumber();

  await addDoc(teacherCollection, {
    ...teacher,
    teacherNumber,
  });

  await addActivity({
    type: "teacher",
    action: "create",
    message: `講師「${teacher.name}」を登録しました`,
  });
};

// 講師一覧取得
export const getTeachers = async () => {
  const snapshot = await getDocs(teacherCollection);

  return snapshot.docs.map((teacherDoc) => ({
    id: teacherDoc.id,
    ...teacherDoc.data(),
  })) as Teacher[];
};

// 講師更新
export const updateTeacher = async (
  id: string,
  teacher: Partial<Omit<Teacher, "id">>
) => {
  await updateDoc(doc(db, "teachers", id), teacher);

  await addActivity({
    type: "teacher",
    action: "update",
    message: `講師「${teacher.name ?? "名称未設定"}」の情報を更新しました`,
  });
};

// 講師削除
export const deleteTeacher = async (
  id: string,
  teacherName: string
) => {
  await deleteDoc(doc(db, "teachers", id));

  await addActivity({
    type: "teacher",
    action: "delete",
    message: `講師「${teacherName}」を削除しました`,
  });
};