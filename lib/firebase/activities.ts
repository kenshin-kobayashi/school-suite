import { db } from "@/lib/firebase";

import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

export type ActivityType =
  | "student"
  | "teacher"
  | "regularSchedule"
  | "courseSchedule"
  | "settings";

export type ActivityAction =
  | "create"
  | "update"
  | "delete";

export type Activity = {
  id?: string;
  message: string;
  type: ActivityType;
  action: ActivityAction;
  createdAt: Timestamp | null;
};

type AddActivityData = {
  message: string;
  type: ActivityType;
  action: ActivityAction;
};

const activityCollection = collection(db, "activities");

// 更新履歴を追加
export const addActivity = async ({
  message,
  type,
  action,
}: AddActivityData) => {
  try {
    await addDoc(activityCollection, {
      message,
      type,
      action,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(
      "更新履歴の保存に失敗しました。",
      error
    );
  }
};

// 最近の更新を取得
export const getRecentActivities = async (
  maxCount = 6
) => {
  const activityQuery = query(
    activityCollection,
    orderBy("createdAt", "desc"),
    limit(maxCount)
  );

  const snapshot = await getDocs(activityQuery);

  return snapshot.docs.map((activityDoc) => {
    const data = activityDoc.data();

    return {
      id: activityDoc.id,
      message: data.message,
      type: data.type,
      action: data.action,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt
          : null,
    };
  }) as Activity[];
};