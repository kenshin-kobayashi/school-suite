"use client";

import Card from "@/components/common/Card";
import PrimaryButton from "@/components/common/PrimaryButton";
import SecondaryButton from "@/components/common/SecondaryButton";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "OK",
  cancelText = "キャンセル",
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6">
        <h2 className="text-xl font-semibold text-zinc-900">
          {title}
        </h2>

        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-zinc-600">
          {message}
        </p>

        <div className="mt-8 flex justify-end gap-3">
          <SecondaryButton onClick={onCancel}>
            {cancelText}
          </SecondaryButton>

          <PrimaryButton
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            {confirmText}
          </PrimaryButton>
        </div>
      </Card>
    </div>
  );
}