import { db } from "@/lib/firebase";

import {
  collection,
  doc,
  getDocs,
  writeBatch,
} from "firebase/firestore";

import {
  getAcademicYear,
  getNextAcademicYear,
  saveAcademicYear,
} from "@/lib/firebase/academicYear";

const BATCH_SIZE = 400;

const nextGradeMap: Record<
  string,
  string
> = {
  "小学1年": "小学2年",
  "小学2年": "小学3年",
  "小学3年": "小学4年",
  "小学4年": "小学5年",
  "小学5年": "小学6年",
  "小学6年": "中学1年",

  "中学1年": "中学2年",
  "中学2年": "中学3年",
  "中学3年": "高校1年",

  "高校1年": "高校2年",
  "高校2年": "高校3年",
  "高校3年": "既卒",

  "既卒": "既卒",
};

export type AnnualUpdateOptions = {
  copyRegularLessons: boolean;
};

export type AnnualUpdateResult = {
  previousAcademicYear: number;
  currentAcademicYear: number;
  promotedStudentCount: number;
  copiedRegularLessonCount: number;
};

/**
 * 配列を指定件数ずつに分割します。
 */
function splitIntoChunks<T>(
  items: T[],
  chunkSize: number,
): T[][] {
  const chunks: T[][] = [];

  for (
    let startIndex = 0;
    startIndex < items.length;
    startIndex += chunkSize
  ) {
    chunks.push(
      items.slice(
        startIndex,
        startIndex + chunkSize,
      ),
    );
  }

  return chunks;
}

/**
 * 年度更新前に生徒の学年データを確認します。
 *
 * 対応していない学年が保存されている場合は、
 * 更新を開始せずにエラーを返します。
 */
async function validateStudentGrades(
  currentAcademicYear: number,
): Promise<void> {
  const snapshot = await getDocs(
    collection(db, "students"),
  );

  const invalidStudents =
    snapshot.docs.flatMap(
      (studentDocument) => {
        const data =
          studentDocument.data();

        /*
         * 同じ年度からの更新がすでに完了している生徒は、
         * 再実行時の確認対象から外します。
         */
        if (
          data.lastAnnualUpdateFromYear ===
          currentAcademicYear
        ) {
          return [];
        }

        const grade =
          typeof data.grade === "string"
            ? data.grade
            : "";

        if (grade in nextGradeMap) {
          return [];
        }

        const name =
          typeof data.name === "string" &&
          data.name.trim() !== ""
            ? data.name
            : "氏名未設定";

        return [
          `${name}（${
            grade || "学年未設定"
          }）`,
        ];
      },
    );

  if (invalidStudents.length === 0) {
    return;
  }

  const displayedStudents =
    invalidStudents
      .slice(0, 5)
      .join("、");

  const remainingCount =
    invalidStudents.length - 5;

  const remainingText =
    remainingCount > 0
      ? `ほか${remainingCount}名`
      : "";

  throw new Error(
    `年度更新に対応していない学年の生徒がいます。${displayedStudents}${remainingText}`,
  );
}

/**
 * 次年度に手動で作成された通常授業がないか確認します。
 *
 * 年度更新によって途中までコピーされた授業は、
 * 再実行できるように許可します。
 */
async function validateNextYearLessons(
  nextAcademicYear: number,
): Promise<void> {
  const snapshot = await getDocs(
    collection(db, "lessons"),
  );

  const copiedLessonIdPrefix =
    `annual-${nextAcademicYear}-`;

  const manuallyCreatedLessonExists =
    snapshot.docs.some(
      (lessonDocument) => {
        const data =
          lessonDocument.data();

        const isNextYearRegularLesson =
          data.academicYear ===
            nextAcademicYear &&
          data.scheduleMode === "regular";

        if (!isNextYearRegularLesson) {
          return false;
        }

        return !lessonDocument.id.startsWith(
          copiedLessonIdPrefix,
        );
      },
    );

  if (manuallyCreatedLessonExists) {
    throw new Error(
      `${nextAcademicYear}年度には、すでに通常授業が登録されています。重複を防ぐため、通常授業をコピーできません。`,
    );
  }
}

/**
 * 現在年度の通常授業を次年度へコピーします。
 *
 * コピー先のIDを固定することで、
 * 更新処理を再実行しても授業が重複しません。
 */
async function copyRegularLessons(
  currentAcademicYear: number,
  nextAcademicYear: number,
): Promise<number> {
  const snapshot = await getDocs(
    collection(db, "lessons"),
  );

  const regularLessonDocuments =
    snapshot.docs.filter(
      (lessonDocument) => {
        const data =
          lessonDocument.data();

        return (
          data.academicYear ===
            currentAcademicYear &&
          data.scheduleMode === "regular"
        );
      },
    );

  if (
    regularLessonDocuments.length === 0
  ) {
    return 0;
  }

  const chunks = splitIntoChunks(
    regularLessonDocuments,
    BATCH_SIZE,
  );

  for (const chunk of chunks) {
    const batch = writeBatch(db);
    const now = new Date();

    chunk.forEach(
      (lessonDocument) => {
        const sourceData =
          lessonDocument.data();

        /*
         * 元授業のIDからコピー先IDを固定します。
         *
         * 同じ年度更新を再実行しても、
         * 同じドキュメントが上書きされるため
         * 重複登録されません。
         */
        const copiedLessonId =
          `annual-${nextAcademicYear}-${lessonDocument.id}`;

        const copiedLessonReference =
          doc(
            db,
            "lessons",
            copiedLessonId,
          );

        batch.set(
          copiedLessonReference,
          {
            ...sourceData,

            academicYear:
              nextAcademicYear,

            /*
             * 新しい授業としてコピーするため、
             * 作成日時と更新日時を更新します。
             */
            createdAt: now,
            updatedAt: now,
          },
        );
      },
    );

    await batch.commit();
  }

  return regularLessonDocuments.length;
}

/**
 * 生徒全員の学年を1段階進めます。
 *
 * lastAnnualUpdateFromYearを保存することで、
 * 同じ年度更新を再実行しても
 * 学年が二重に進まないようにします。
 */
async function promoteStudentGrades(
  currentAcademicYear: number,
): Promise<number> {
  const snapshot = await getDocs(
    collection(db, "students"),
  );

  const studentDocuments =
    snapshot.docs.filter(
      (studentDocument) => {
        const data =
          studentDocument.data();

        return (
          data.lastAnnualUpdateFromYear !==
          currentAcademicYear
        );
      },
    );

  if (studentDocuments.length === 0) {
    return 0;
  }

  const chunks = splitIntoChunks(
    studentDocuments,
    BATCH_SIZE,
  );

  let promotedStudentCount = 0;

  for (const chunk of chunks) {
    const batch = writeBatch(db);

    chunk.forEach(
      (studentDocument) => {
        const data =
          studentDocument.data();

        const currentGrade =
          typeof data.grade === "string"
            ? data.grade
            : "";

        const nextGrade =
          nextGradeMap[currentGrade];

        if (!nextGrade) {
          return;
        }

        batch.update(
          studentDocument.ref,
          {
            grade: nextGrade,

            /*
             * 再実行時の二重進級を防ぐための記録です。
             *
             * Student型に追加しなくても、
             * Firestore上では保存できます。
             */
            lastAnnualUpdateFromYear:
              currentAcademicYear,
          },
        );

        promotedStudentCount += 1;
      },
    );

    await batch.commit();
  }

  return promotedStudentCount;
}

/**
 * 年度更新を実行します。
 *
 * 実行順:
 * 1. 通常授業を次年度へコピー
 * 2. 生徒全員の学年を更新
 * 3. 現在年度を次年度へ変更
 */
export async function runAnnualUpdate(
  options: AnnualUpdateOptions,
): Promise<AnnualUpdateResult> {
  const currentAcademicYear =
    await getAcademicYear();

  const nextAcademicYear =
    getNextAcademicYear(
      currentAcademicYear,
    );

  /*
   * 書き込み開始前に、
   * 問題のあるデータがないか確認します。
   */
  await validateStudentGrades(
    currentAcademicYear,
  );

  if (options.copyRegularLessons) {
    await validateNextYearLessons(
      nextAcademicYear,
    );
  }

  let copiedRegularLessonCount = 0;

  if (options.copyRegularLessons) {
    copiedRegularLessonCount =
      await copyRegularLessons(
        currentAcademicYear,
        nextAcademicYear,
      );
  }

  const promotedStudentCount =
    await promoteStudentGrades(
      currentAcademicYear,
    );

  await saveAcademicYear(
    nextAcademicYear,
  );

  return {
    previousAcademicYear:
      currentAcademicYear,

    currentAcademicYear:
      nextAcademicYear,

    promotedStudentCount,

    copiedRegularLessonCount,
  };
}