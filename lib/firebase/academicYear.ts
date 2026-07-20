import { db } from "@/lib/firebase";

import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

const academicYearDocument = doc(
  db,
  "settings",
  "academicYear",
);

const MIN_ACADEMIC_YEAR = 2000;
const MAX_ACADEMIC_YEAR = 2100;

/**
 * 指定した日付が属する年度を取得します。
 *
 * 4月1日から翌年3月31日までを、
 * 同じ年度として扱います。
 *
 * 例:
 * 2026年3月31日 → 2025年度
 * 2026年4月1日  → 2026年度
 */
export function calculateAcademicYear(
  date: Date = new Date(),
): number {
  const year = date.getFullYear();
  const month = date.getMonth();

  /*
   * JavaScriptの月は0始まりです。
   *
   * 0: 1月
   * 1: 2月
   * 2: 3月
   * 3: 4月
   */
  return month >= 3 ? year : year - 1;
}

/**
 * 値が正しい年度かどうかを確認します。
 */
export function isValidAcademicYear(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_ACADEMIC_YEAR &&
    value <= MAX_ACADEMIC_YEAR
  );
}

/**
 * Firestoreから現在設定されている年度を取得します。
 *
 * 年度がまだ保存されていない場合や、
 * 保存値が不正な場合は、
 * 現在の日付から計算した年度を返します。
 */
export async function getAcademicYear(): Promise<number> {
  try {
    const snapshot = await getDoc(
      academicYearDocument,
    );

    if (!snapshot.exists()) {
      return calculateAcademicYear();
    }

    const data = snapshot.data();

    const academicYear =
      data.academicYear;

    if (!isValidAcademicYear(academicYear)) {
      console.warn(
        "Firestoreに保存されている年度が不正です。",
        academicYear,
      );

      return calculateAcademicYear();
    }

    return academicYear;
  } catch (error) {
    console.error(
      "年度の取得に失敗しました。",
      error,
    );

    throw new Error(
      "年度を取得できませんでした。",
    );
  }
}

/**
 * 指定した年度をFirestoreへ保存します。
 */
export async function saveAcademicYear(
  academicYear: number,
): Promise<void> {
  if (!isValidAcademicYear(academicYear)) {
    throw new Error(
      `${MIN_ACADEMIC_YEAR}年度から${MAX_ACADEMIC_YEAR}年度までの整数を指定してください。`,
    );
  }

  try {
    await setDoc(
      academicYearDocument,
      {
        academicYear,
      },
      {
        merge: true,
      },
    );
  } catch (error) {
    console.error(
      "年度の保存に失敗しました。",
      error,
    );

    throw new Error(
      "年度を保存できませんでした。",
    );
  }
}

/**
 * Firestoreに年度設定がない場合のみ、
 * 現在の日付から計算した年度を保存します。
 *
 * すでに正しい年度が保存されている場合は、
 * 保存されている年度をそのまま返します。
 */
export async function initializeAcademicYear(): Promise<number> {
  try {
    const snapshot = await getDoc(
      academicYearDocument,
    );

    if (snapshot.exists()) {
      const data = snapshot.data();

      if (
        isValidAcademicYear(
          data.academicYear,
        )
      ) {
        return data.academicYear;
      }
    }

    const initialAcademicYear =
      calculateAcademicYear();

    await setDoc(
      academicYearDocument,
      {
        academicYear: initialAcademicYear,
      },
      {
        merge: true,
      },
    );

    return initialAcademicYear;
  } catch (error) {
    console.error(
      "年度の初期化に失敗しました。",
      error,
    );

    throw new Error(
      "年度を初期化できませんでした。",
    );
  }
}

/**
 * 現在の日付を基準に年度を再設定します。
 */
export async function resetAcademicYear(): Promise<number> {
  const academicYear =
    calculateAcademicYear();

  await saveAcademicYear(academicYear);

  return academicYear;
}

/**
 * 指定した年度の前年度を返します。
 */
export function getPreviousAcademicYear(
  academicYear: number,
): number {
  if (!isValidAcademicYear(academicYear)) {
    throw new Error(
      "正しい年度を指定してください。",
    );
  }

  const previousAcademicYear =
    academicYear - 1;

  if (
    !isValidAcademicYear(
      previousAcademicYear,
    )
  ) {
    throw new Error(
      `${MIN_ACADEMIC_YEAR}年度より前には変更できません。`,
    );
  }

  return previousAcademicYear;
}

/**
 * 指定した年度の次年度を返します。
 */
export function getNextAcademicYear(
  academicYear: number,
): number {
  if (!isValidAcademicYear(academicYear)) {
    throw new Error(
      "正しい年度を指定してください。",
    );
  }

  const nextAcademicYear =
    academicYear + 1;

  if (
    !isValidAcademicYear(nextAcademicYear)
  ) {
    throw new Error(
      `${MAX_ACADEMIC_YEAR}年度より後には変更できません。`,
    );
  }

  return nextAcademicYear;
}

/**
 * 画面表示用の年度名を返します。
 *
 * 例:
 * 2026 → 2026年度
 */
export function formatAcademicYear(
  academicYear: number,
): string {
  if (!isValidAcademicYear(academicYear)) {
    return "";
  }

  return `${academicYear}年度`;
}

/**
 * 指定した年度の開始日を返します。
 *
 * 例:
 * 2026年度 → 2026-04-01
 */
export function getAcademicYearStartDate(
  academicYear: number,
): string {
  if (!isValidAcademicYear(academicYear)) {
    throw new Error(
      "正しい年度を指定してください。",
    );
  }

  return `${academicYear}-04-01`;
}

/**
 * 指定した年度の終了日を返します。
 *
 * 例:
 * 2026年度 → 2027-03-31
 */
export function getAcademicYearEndDate(
  academicYear: number,
): string {
  if (!isValidAcademicYear(academicYear)) {
    throw new Error(
      "正しい年度を指定してください。",
    );
  }

  return `${academicYear + 1}-03-31`;
}