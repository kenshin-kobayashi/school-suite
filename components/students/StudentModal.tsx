"use client";

import Modal from "@/components/common/Modal";

import type { Student } from "@/lib/firebase/students";

import StudentForm from "./StudentForm";

type Props = {
  open: boolean;
  onClose: () => void;
  student?: Student | null;
};

export default function StudentModal({
  open,
  onClose,
  student,
}: Props) {
  return (
    <Modal
      open={open}
      title={
        student
          ? "生徒情報を編集"
          : "生徒を登録"
      }
      onClose={onClose}
    >
      <StudentForm
        student={student}
        onClose={onClose}
      />
    </Modal>
  );
}