"use client";

import {
  useEffect,
  useState,
} from "react";

import Modal from "@/components/common/Modal";
import PrimaryButton from "@/components/common/PrimaryButton";
import SecondaryButton from "@/components/common/SecondaryButton";

import type { Student } from "@/lib/firebase/students";
import type { Teacher } from "@/lib/firebase/teachers";

import type { ScheduleCellPosition } from "@/types/schedule-cell";

import LessonForm, {
  type LessonFormInitialValues,
  type LessonFormValues,
} from "./LessonForm";

type LessonDialogProps = {
  open: boolean;
  position: ScheduleCellPosition | null;

  teachers: Teacher[];
  students: Student[];

  initialValues?: LessonFormInitialValues;

  mode?: "create" | "edit";

  onClose: () => void;

  onSubmit: (
    values: LessonFormValues,
  ) => void | Promise<void>;

  onDelete?: () => void | Promise<void>;
};

const LESSON_FORM_ID = "lesson-dialog-form";

export default function LessonDialog({
  open,
  position,
  teachers,
  students,
  initialValues,
  mode = "create",
  onClose,
  onSubmit,
  onDelete,
}: LessonDialogProps) {
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    if (!open) {
      setIsSubmitting(false);
      setIsDeleting(false);
      setErrorMessage("");
    }
  }, [open]);

  const isProcessing =
    isSubmitting || isDeleting;

  const handleClose = () => {
    if (isProcessing) {
      return;
    }

    onClose();
  };

  const handleSubmit = async (
    values: LessonFormValues,
  ) => {
    if (
      !position ||
      isProcessing
    ) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      await onSubmit(values);

      onClose();
    } catch (error) {
      console.error(
        "授業の保存に失敗しました。",
        error,
      );

      setErrorMessage(
        "授業の保存に失敗しました。時間をおいて、もう一度お試しください。",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !onDelete ||
      isProcessing
    ) {
      return;
    }

    const confirmed = window.confirm(
      "この授業を削除しますか？",
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      setErrorMessage("");

      await onDelete();

      onClose();
    } catch (error) {
      console.error(
        "授業の削除に失敗しました。",
        error,
      );

      setErrorMessage(
        "授業の削除に失敗しました。時間をおいて、もう一度お試しください。",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={
        mode === "edit"
          ? "授業を編集"
          : "授業を登録"
      }
      onClose={handleClose}
      footer={
        <div className="flex w-full items-center justify-between gap-4">
          <div>
            {mode === "edit" && onDelete ? (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleDelete}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting
                  ? "削除中..."
                  : "授業を削除"}
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <SecondaryButton
              type="button"
              disabled={isProcessing}
              onClick={handleClose}
            >
              キャンセル
            </SecondaryButton>

            <PrimaryButton
              type="submit"
              form={LESSON_FORM_ID}
              disabled={
                isProcessing || !position
              }
            >
              {isSubmitting
                ? "保存中..."
                : mode === "edit"
                  ? "変更を保存"
                  : "授業を登録"}
            </PrimaryButton>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {!position && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-800">
              時間割の位置を取得できませんでした。
            </p>
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"
          >
            <p className="text-sm font-semibold text-red-700">
              {errorMessage}
            </p>
          </div>
        )}

        {position && (
          <LessonForm
            key={[
              mode,
              position.columnId,
              position.periodId,
            ].join("-")}
            formId={LESSON_FORM_ID}
            position={position}
            teachers={teachers}
            students={students}
            initialValues={initialValues}
            disabled={isProcessing}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </Modal>
  );
}