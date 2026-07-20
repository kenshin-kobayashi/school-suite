import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import type { Classroom } from "@/types/classroom";

const classroomsRef = collection(db, "classrooms");

/**
 * 教室一覧を取得
 */
export async function getClassrooms(): Promise<Classroom[]> {
  const snapshot = await getDocs(
    query(classroomsRef, orderBy("name")),
  );

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as Omit<Classroom, "id">),
  }));
}

/**
 * 教室を追加
 */
export async function createClassroom(
  classroom: Omit<Classroom, "id">,
): Promise<void> {
  await addDoc(classroomsRef, classroom);
}

/**
 * 教室を更新
 */
export async function updateClassroom(
  classroom: Classroom,
): Promise<void> {
  const { id, ...data } = classroom;

  await updateDoc(doc(db, "classrooms", id), data);
}

/**
 * 教室を削除
 */
export async function deleteClassroom(
  id: string,
): Promise<void> {
  await deleteDoc(doc(db, "classrooms", id));
}