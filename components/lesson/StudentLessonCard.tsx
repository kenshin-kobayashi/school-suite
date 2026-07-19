"use client";

import { useMemo } from "react";

import SearchSelect, {
  type SearchSelectOption,
} from "@/components/common/SearchSelect";
import Select from "@/components/common/Select";

import type { Student } from "@/lib/firebase/students";

export type LessonStudentRow = {
  rowId: string;
  studentId: string;
  subject: string;
};

type StudentLessonCardProps = {
  index: number;
  row: LessonStudentRow;
  students: Student[];
  subjects: string[];
  selectedStudentIds: string[];
  teacherName?: string;
  teacherSubjects: string[];
  onStudentChange: (
    rowId: string,
    studentId: string,
  ) => void;
  onSubjectChange: (
    rowId: string,
    subject: string,
  ) => void;
  onRemove: (rowId: string) => void;
};

export default function StudentLessonCard({
  index,
  row,
  students,
  subjects,
  selectedStudentIds,
  teacherName,
  teacherSubjects,
  onStudentChange,
  onSubjectChange,
  onRemove,
}: StudentLessonCardProps) {
  const selectedStudent = useMemo(
    () =>
      students.find(
        (student) =>
          student.id === row.studentId,
      ) ?? null,
    [row.studentId, students],
  );

  const studentOptions =
    useMemo<SearchSelectOption[]>(() => {
      return students.flatMap((student) => {
        if (!student.id) {
          return [];
        }

        const selectedInAnotherRow =
          selectedStudentIds.includes(
            student.id,
          ) &&
          student.id !== row.studentId;

        return [
          {
            value: student.id,
            label: student.name,
            description: [
              student.studentNumber,
              student.grade,
              student.school,
            ]
              .filter(Boolean)
              .join("・"),
            searchText: [
              student.name,
              student.furigana,
              student.studentNumber,
              student.grade,
              student.school,
            ]
              .filter(Boolean)
              .join(" "),
            disabled: selectedInAnotherRow,
          },
        ];
      });
    }, [
      row.studentId,
      selectedStudentIds,
      students,
    ]);

  const unsupportedSubject =
    Boolean(teacherName) &&
    Boolean(row.subject) &&
    !teacherSubjects.includes(row.subject);

  return (
    <article className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-zinc-800">
            受講生 {index + 1}
          </p>

          {selectedStudent && (
            <p className="mt-1 truncate text-xs text-zinc-500">
              {[
                selectedStudent.studentNumber,
                selectedStudent.grade,
                selectedStudent.school,
              ]
                .filter(Boolean)
                .join("・")}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onRemove(row.rowId)}
          className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-500 transition hover:bg-white hover:text-red-600"
        >
          削除
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SearchSelect
          label="生徒"
          placeholder="生徒を検索"
          value={row.studentId}
          options={studentOptions}
          onChange={(studentId) =>
            onStudentChange(
              row.rowId,
              studentId,
            )
          }
          emptyMessage="該当する生徒が見つかりません。"
        />

        <Select
          label="教科"
          value={row.subject}
          onChange={(event) =>
            onSubjectChange(
              row.rowId,
              event.target.value,
            )
          }
          className="h-12 rounded-xl"
        >
          <option value="">
            教科を選択してください
          </option>

          {subjects.map((subject) => (
            <option
              key={subject}
              value={subject}
            >
              {subject}
            </option>
          ))}
        </Select>
      </div>

      {unsupportedSubject && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-800">
            担当外教科です
          </p>

          <p className="mt-1 text-xs leading-5 text-amber-700">
            {teacherName}先生の担当教科に
            {row.subject}は登録されていません。
            このまま保存することもできます。
          </p>
        </div>
      )}
    </article>
  );
}