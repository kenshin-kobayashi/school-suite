"use client";

import {
  useEffect,
  useState,
} from "react";

import PrimaryButton from "@/components/common/PrimaryButton";
import SecondaryButton from "@/components/common/SecondaryButton";

import SettingSection from "./SettingSection";

import {
  formatAcademicYear,
  getAcademicYear,
  getNextAcademicYear,
} from "@/lib/firebase/academicYear";

import {
  runAnnualUpdate,
  type AnnualUpdateResult,
} from "@/lib/firebase/annualUpdate";

export default function AcademicYearSettings() {
  const [
    currentAcademicYear,
    setCurrentAcademicYear,
  ] = useState<number | null>(null);

  const [
    copyRegularLessons,
    setCopyRegularLessons,
  ] = useState(true);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isUpdating,
    setIsUpdating,
  ] = useState(false);

  const [
    isConfirmOpen,
    setIsConfirmOpen,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadAcademicYear() {
      try {
        const academicYear =
          await getAcademicYear();

        if (!isMounted) {
          return;
        }

        setCurrentAcademicYear(
          academicYear,
        );
      } catch (error) {
        console.error(error);

        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "年度を取得できませんでした。",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadAcademicYear();

    return () => {
      isMounted = false;
    };
  }, []);

  const nextAcademicYear =
    currentAcademicYear !== null
      ? getNextAcademicYear(
          currentAcademicYear,
        )
      : null;

  function openConfirmation() {
    setErrorMessage("");
    setSuccessMessage("");
    setIsConfirmOpen(true);
  }

  function closeConfirmation() {
    if (isUpdating) {
      return;
    }

    setIsConfirmOpen(false);
  }

  async function handleAnnualUpdate() {
    if (
      currentAcademicYear === null ||
      isUpdating
    ) {
      return;
    }

    setIsUpdating(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result =
        await runAnnualUpdate({
          copyRegularLessons,
        });

      setCurrentAcademicYear(
        result.currentAcademicYear,
      );

      setIsConfirmOpen(false);

      setSuccessMessage(
        createSuccessMessage(result),
      );
    } catch (error) {
      console.error(
        "年度更新に失敗しました。",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "年度更新に失敗しました。",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <>
      <SettingSection
        title="年度更新"
        description="生徒の学年と現在年度を次年度へ更新します。"
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <AcademicYearCard
              label="現在の年度"
              academicYear={
                currentAcademicYear
              }
              isLoading={isLoading}
            />

            <AcademicYearCard
              label="更新後の年度"
              academicYear={
                nextAcademicYear
              }
              isLoading={isLoading}
            />
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
  <div className="space-y-1">
    <p className="text-sm font-semibold text-neutral-900">
      生徒の学年更新
    </p>

    <p className="text-sm leading-6 text-neutral-600">
      年度更新を実行すると、生徒全員の学年が自動的に1段階上がります。
      高校3年の生徒は既卒になります。
    </p>
  </div>
</div>


          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-5 transition hover:bg-neutral-50">
            <input
              type="checkbox"
              checked={
                copyRegularLessons
              }
              onChange={(event) => {
                setCopyRegularLessons(
                  event.target.checked,
                );
              }}
              disabled={
                isLoading ||
                isUpdating
              }
              className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400"
            />

            <span className="min-w-0">
              <span className="block text-sm font-semibold text-neutral-900">
                通常授業を次年度へコピー
              </span>

              <span className="mt-1 block text-sm leading-6 text-neutral-600">
                現在年度の通常授業を、同じ曜日・時限・講師・生徒のまま次年度へコピーします。
                講習授業はコピーされません。
              </span>
            </span>
          </label>

          {errorMessage ? (
            <MessageBox
              type="error"
              message={errorMessage}
            />
          ) : null}

          {successMessage ? (
            <MessageBox
              type="success"
              message={successMessage}
            />
          ) : null}

          <div className="flex justify-end">
            <PrimaryButton
              onClick={openConfirmation}
              disabled={
                isLoading ||
                isUpdating ||
                currentAcademicYear ===
                  null
              }
            >
              年度更新を実行
            </PrimaryButton>
          </div>
        </div>
      </SettingSection>

      {isConfirmOpen &&
      currentAcademicYear !== null &&
      nextAcademicYear !== null ? (
        <AnnualUpdateConfirmDialog
          currentAcademicYear={
            currentAcademicYear
          }
          nextAcademicYear={
            nextAcademicYear
          }
          copyRegularLessons={
            copyRegularLessons
          }
          isUpdating={isUpdating}
          onCancel={closeConfirmation}
          onConfirm={() => {
            void handleAnnualUpdate();
          }}
        />
      ) : null}
    </>
  );
}

type AcademicYearCardProps = {
  label: string;
  academicYear: number | null;
  isLoading: boolean;
};

function AcademicYearCard({
  label,
  academicYear,
  isLoading,
}: AcademicYearCardProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="text-sm font-medium text-neutral-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
        {isLoading
          ? "読み込み中..."
          : academicYear !== null
            ? formatAcademicYear(
                academicYear,
              )
            : "取得できませんでした"}
      </p>
    </div>
  );
}

type MessageBoxProps = {
  type: "success" | "error";
  message: string;
};

function MessageBox({
  type,
  message,
}: MessageBoxProps) {
  const styles =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-red-200 bg-red-50 text-red-800";

  return (
    <div
      role={
        type === "error"
          ? "alert"
          : "status"
      }
      className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${styles}`}
    >
      {message}
    </div>
  );
}

type AnnualUpdateConfirmDialogProps = {
  currentAcademicYear: number;
  nextAcademicYear: number;
  copyRegularLessons: boolean;
  isUpdating: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function AnnualUpdateConfirmDialog({
  currentAcademicYear,
  nextAcademicYear,
  copyRegularLessons,
  isUpdating,
  onCancel,
  onConfirm,
}: AnnualUpdateConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="annual-update-title"
    >
      <button
        type="button"
        aria-label="確認画面を閉じる"
        onClick={onCancel}
        disabled={isUpdating}
        className="absolute inset-0 bg-black/35 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/70 bg-white p-6 shadow-2xl">
        <div>
          <p className="text-sm font-medium text-neutral-500">
            年度更新の確認
          </p>

          <h2
            id="annual-update-title"
            className="mt-1 text-xl font-semibold tracking-tight text-neutral-950"
          >
            {formatAcademicYear(
              currentAcademicYear,
            )}
            から
            {formatAcademicYear(
              nextAcademicYear,
            )}
            へ更新しますか？
          </h2>
        </div>

        <div className="mt-5 space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <ConfirmationItem>
            生徒全員の学年を1段階更新
          </ConfirmationItem>

          <ConfirmationItem>
            高校3年の生徒を既卒へ更新
          </ConfirmationItem>

          {copyRegularLessons ? (
            <ConfirmationItem>
              通常授業を
              {formatAcademicYear(
                nextAcademicYear,
              )}
              へコピー
            </ConfirmationItem>
          ) : (
            <ConfirmationItem>
              通常授業はコピーしない
            </ConfirmationItem>
          )}

          <ConfirmationItem>
            現在年度を
            {formatAcademicYear(
              nextAcademicYear,
            )}
            へ変更
          </ConfirmationItem>
        </div>

        <p className="mt-4 text-sm leading-6 text-red-700">
          年度更新後に、画面から一括で元へ戻すことはできません。内容を確認してから実行してください。
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <SecondaryButton
            onClick={onCancel}
            disabled={isUpdating}
          >
            キャンセル
          </SecondaryButton>

          <PrimaryButton
            onClick={onConfirm}
            disabled={isUpdating}
          >
            {isUpdating
              ? "更新しています..."
              : "年度更新を実行"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

type ConfirmationItemProps = {
  children: React.ReactNode;
};

function ConfirmationItem({
  children,
}: ConfirmationItemProps) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-bold text-white"
      >
        ✓
      </span>

      <p className="text-sm font-medium leading-6 text-neutral-800">
        {children}
      </p>
    </div>
  );
}

function createSuccessMessage(
  result: AnnualUpdateResult,
): string {
  const lessonMessage =
    result.copiedRegularLessonCount > 0
      ? `通常授業${result.copiedRegularLessonCount}件をコピーし、`
      : "";

  return `${lessonMessage}生徒${result.promotedStudentCount}名の学年を更新しました。現在年度は${formatAcademicYear(
    result.currentAcademicYear,
  )}です。`;
}