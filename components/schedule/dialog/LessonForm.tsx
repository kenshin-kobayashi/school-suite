"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import SecondaryButton from "@/components/common/SecondaryButton";

import StudentLessonCard, {
  type LessonStudentRow,
} from "@/components/lesson/StudentLessonCard";
import TeacherSelector from "@/components/lesson/TeacherSelector";

import type { Student } from "@/lib/firebase/students";
import type { Teacher } from "@/lib/firebase/teachers";

import type { Classroom } from "@/types/classroom";
import type { ScheduleCellPosition } from "@/types/schedule-cell";

import LessonBasicInfo from "./LessonBasicInfo";

export type LessonStudentValue = {
  studentId: string;
  studentNumber: string;
  studentName: string;
  grade: string;
  subject: string;
};

export type LessonFormValues = {
  teacherId: string;
  teacherNumber: string;
  teacherName: string;

  classroomId: string;
  classroomName: string;

  students: LessonStudentValue[];
};

export type LessonFormInitialValues = {
  teacherId?: string;
  teacherNumber?: string;
  teacherName?: string;

  classroomId?: string;
  classroomName?: string;

  students?: LessonStudentValue[];
};

type LessonFormProps = {
  formId: string;
  position: ScheduleCellPosition;

  teachers: Teacher[];
  students: Student[];
  classrooms: Classroom[];

  initialValues?: LessonFormInitialValues;
  disabled?: boolean;

  onSubmit: (
    values: LessonFormValues,
  ) => void | Promise<void>;
};

type FormErrors = {
  teacher?: string;
  classroom?: string;
  students?: string;
};

function createRowId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `lesson-row-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function createEmptyRow(): LessonStudentRow {
  return {
    rowId: createRowId(),
    studentId: "",
    subject: "",
  };
}

function createInitialRows(
  initialValues?: LessonFormInitialValues,
): LessonStudentRow[] {
  const initialStudents =
    initialValues?.students ?? [];

  if (initialStudents.length === 0) {
    return [createEmptyRow()];
  }

  return initialStudents.map((student) => ({
    rowId: createRowId(),
    studentId: student.studentId,
    subject: student.subject,
  }));
}

export default function LessonForm({
  formId,
  position,
  teachers,
  students,
  classrooms,
  initialValues,
  disabled = false,
  onSubmit,
}: LessonFormProps) {
  const [teacherId, setTeacherId] = useState(
    initialValues?.teacherId ?? "",
  );

  const [classroomId, setClassroomId] =
    useState(
      initialValues?.classroomId ?? "",
    );

  const [studentRows, setStudentRows] = useState<
    LessonStudentRow[]
  >(() => createInitialRows(initialValues));

  const [errors, setErrors] =
    useState<FormErrors>({});

  useEffect(() => {
    setTeacherId(
      initialValues?.teacherId ?? "",
    );

    setClassroomId(
      initialValues?.classroomId ?? "",
    );

    setStudentRows(
      createInitialRows(initialValues),
    );

    setErrors({});
  }, [initialValues, position]);

  const activeTeachers = useMemo(() => {
    return teachers.filter(
      (teacher) => teacher.status === "在籍",
    );
  }, [teachers]);

  const activeStudents = useMemo(() => {
    return students.filter(
      (student) => student.status === "在籍",
    );
  }, [students]);

  const availableClassrooms = useMemo(() => {
    return [...classrooms]
      .filter(
        (
          classroom,
        ): classroom is Classroom & {
          id: string;
        } => Boolean(classroom.id),
      )
      .sort((firstClassroom, secondClassroom) =>
        firstClassroom.name.localeCompare(
          secondClassroom.name,
          "ja",
        ),
      );
  }, [classrooms]);

  const selectedTeacher = useMemo(() => {
    return (
      activeTeachers.find(
        (teacher) => teacher.id === teacherId,
      ) ?? null
    );
  }, [activeTeachers, teacherId]);

  const selectedClassroom = useMemo(() => {
    return (
      availableClassrooms.find(
        (classroom) =>
          classroom.id === classroomId,
      ) ?? null
    );
  }, [availableClassrooms, classroomId]);

  const teacherSubjects = useMemo(() => {
    if (!selectedTeacher) {
      return [];
    }

    return Array.from(
      new Set(
        selectedTeacher.subjects
          .map(
            (teacherSubject) =>
              teacherSubject.subject,
          )
          .filter(Boolean),
      ),
    );
  }, [selectedTeacher]);

  const subjects = useMemo(() => {
    const registeredSubjects = teachers.flatMap(
      (teacher) =>
        teacher.subjects.map(
          (teacherSubject) =>
            teacherSubject.subject,
        ),
    );

    const selectedSubjects = studentRows.map(
      (row) => row.subject,
    );

    return Array.from(
      new Set([
        ...registeredSubjects,
        ...selectedSubjects,
      ]),
    )
      .filter(Boolean)
      .sort((firstSubject, secondSubject) =>
        firstSubject.localeCompare(
          secondSubject,
          "ja",
        ),
      );
  }, [studentRows, teachers]);

  const selectedStudentIds = useMemo(() => {
    return studentRows
      .map((row) => row.studentId)
      .filter(Boolean);
  }, [studentRows]);

  const handleTeacherChange = (
    nextTeacherId: string,
  ) => {
    setTeacherId(nextTeacherId);

    setErrors((currentErrors) => ({
      ...currentErrors,
      teacher: undefined,
    }));
  };

  const handleClassroomChange = (
    nextClassroomId: string,
  ) => {
    setClassroomId(nextClassroomId);

    setErrors((currentErrors) => ({
      ...currentErrors,
      classroom: undefined,
    }));
  };

  const handleAddStudentRow = () => {
    setStudentRows((currentRows) => [
      ...currentRows,
      createEmptyRow(),
    ]);

    setErrors((currentErrors) => ({
      ...currentErrors,
      students: undefined,
    }));
  };

  const handleStudentChange = (
    rowId: string,
    nextStudentId: string,
  ) => {
    setStudentRows((currentRows) =>
      currentRows.map((row) =>
        row.rowId === rowId
          ? {
              ...row,
              studentId: nextStudentId,
            }
          : row,
      ),
    );

    setErrors((currentErrors) => ({
      ...currentErrors,
      students: undefined,
    }));
  };

  const handleSubjectChange = (
    rowId: string,
    nextSubject: string,
  ) => {
    setStudentRows((currentRows) =>
      currentRows.map((row) =>
        row.rowId === rowId
          ? {
              ...row,
              subject: nextSubject,
            }
          : row,
      ),
    );

    setErrors((currentErrors) => ({
      ...currentErrors,
      students: undefined,
    }));
  };

  const handleRemoveStudentRow = (
    rowId: string,
  ) => {
    setStudentRows((currentRows) => {
      const nextRows = currentRows.filter(
        (row) => row.rowId !== rowId,
      );

      if (nextRows.length === 0) {
        return [createEmptyRow()];
      }

      return nextRows;
    });

    setErrors((currentErrors) => ({
      ...currentErrors,
      students: undefined,
    }));
  };

  const validateForm = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!selectedTeacher?.id) {
      nextErrors.teacher =
        "担当講師を選択してください。";
    }

    if (!selectedClassroom?.id) {
      nextErrors.classroom =
        "教室を選択してください。";
    }

    const completedRows = studentRows.filter(
      (row) => row.studentId || row.subject,
    );

    if (completedRows.length === 0) {
      nextErrors.students =
        "受講生を1名以上選択してください。";

      return nextErrors;
    }

    const incompleteRow = completedRows.find(
      (row) =>
        !row.studentId || !row.subject,
    );

    if (incompleteRow) {
      nextErrors.students =
        "すべての受講生について、生徒と教科を選択してください。";

      return nextErrors;
    }

    const studentIds = completedRows.map(
      (row) => row.studentId,
    );

    const uniqueStudentIds = new Set(
      studentIds,
    );

    if (
      uniqueStudentIds.size !==
      studentIds.length
    ) {
      nextErrors.students =
        "同じ生徒を複数回選択することはできません。";
    }

    return nextErrors;
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (disabled) {
      return;
    }

    const nextErrors = validateForm();

    if (
      nextErrors.teacher ||
      nextErrors.classroom ||
      nextErrors.students
    ) {
      setErrors(nextErrors);
      return;
    }

    if (
      !selectedTeacher?.id ||
      !selectedClassroom?.id
    ) {
      return;
    }

    const lessonStudents =
      studentRows.flatMap<LessonStudentValue>(
        (row) => {
          if (
            !row.studentId ||
            !row.subject
          ) {
            return [];
          }

          const selectedStudent =
            activeStudents.find(
              (student) =>
                student.id === row.studentId,
            );

          if (!selectedStudent?.id) {
            return [];
          }

          return [
            {
              studentId:
                selectedStudent.id,
              studentNumber:
                selectedStudent.studentNumber,
              studentName:
                selectedStudent.name,
              grade: selectedStudent.grade,
              subject: row.subject,
            },
          ];
        },
      );

    const completedRowCount =
      studentRows.filter(
        (row) =>
          row.studentId && row.subject,
      ).length;

    if (
      lessonStudents.length !==
      completedRowCount
    ) {
      setErrors({
        students:
          "選択された生徒の情報を取得できませんでした。生徒を選び直してください。",
      });

      return;
    }

    setErrors({});

    await onSubmit({
      teacherId: selectedTeacher.id,
      teacherNumber:
        selectedTeacher.teacherNumber,
      teacherName: selectedTeacher.name,

      classroomId: selectedClassroom.id,
      classroomName: selectedClassroom.name,

      students: lessonStudents,
    });
  };

  return (
    <form
      id={formId}
      className="space-y-6"
      onSubmit={handleSubmit}
    >
      <fieldset
        disabled={disabled}
        className="space-y-6 disabled:opacity-70"
      >
        <LessonBasicInfo
          position={position}
        />

        <section className="space-y-3">
          <TeacherSelector
            value={teacherId}
            teachers={activeTeachers}
            onChange={handleTeacherChange}
          />

          {errors.teacher && (
            <p className="text-xs font-medium text-red-600">
              {errors.teacher}
            </p>
          )}
        </section>

        <section className="space-y-3">
          <div>
            <label
              htmlFor={`${formId}-classroom`}
              className="text-sm font-bold text-zinc-800"
            >
              教室
            </label>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              この授業で使用する教室を選択してください。
            </p>
          </div>

          <select
            id={`${formId}-classroom`}
            value={classroomId}
            onChange={(event) =>
              handleClassroomChange(
                event.target.value,
              )
            }
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:bg-zinc-100"
          >
            <option value="">
              教室を選択してください
            </option>

            {availableClassrooms.map(
              (classroom) => (
                <option
                  key={classroom.id}
                  value={classroom.id}
                >
                  {classroom.name}
                </option>
              ),
            )}
          </select>

          {availableClassrooms.length === 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-700">
                使用できる教室が登録されていません。設定画面から教室を登録してください。
              </p>
            </div>
          )}

          {errors.classroom && (
            <p className="text-xs font-medium text-red-600">
              {errors.classroom}
            </p>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-800">
                受講生
              </h3>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                生徒と受講教科を選択してください。
              </p>
            </div>

            <SecondaryButton
              type="button"
              onClick={handleAddStudentRow}
            >
              生徒を追加
            </SecondaryButton>
          </div>

          <div className="space-y-4">
            {studentRows.map(
              (row, index) => (
                <StudentLessonCard
                  key={row.rowId}
                  index={index}
                  row={row}
                  students={activeStudents}
                  subjects={subjects}
                  selectedStudentIds={
                    selectedStudentIds
                  }
                  teacherName={
                    selectedTeacher?.name
                  }
                  teacherSubjects={
                    teacherSubjects
                  }
                  onStudentChange={
                    handleStudentChange
                  }
                  onSubjectChange={
                    handleSubjectChange
                  }
                  onRemove={
                    handleRemoveStudentRow
                  }
                />
              ),
            )}
          </div>

          {errors.students && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-semibold text-red-700">
                {errors.students}
              </p>
            </div>
          )}
        </section>
      </fieldset>
    </form>
  );
}