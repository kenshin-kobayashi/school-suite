"use client";

import { Student } from "@/lib/firebase/students";
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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl">
        <StudentForm
          student={student}
          onClose={onClose}
        />
      </div>
    </div>
  );
}