"use client";

import { Teacher } from "@/lib/firebase/teachers";
import TeacherForm, {
  SubjectOption,
} from "./TeacherForm";

type Props = {
  open: boolean;
  onClose: () => void;
  teacher?: Teacher | null;
  availableSubjects: SubjectOption[];
};

export default function TeacherModal({
  open,
  onClose,
  teacher,
  availableSubjects,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-8 shadow-xl">
        <TeacherForm
          teacher={teacher}
          availableSubjects={availableSubjects}
          onClose={onClose}
        />
      </div>
    </div>
  );
}