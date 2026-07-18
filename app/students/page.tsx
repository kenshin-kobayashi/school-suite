"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import PageHeader from "@/components/common/PageHeader";
import SearchBar from "@/components/students/SearchBar";
import StudentModal from "@/components/students/StudentModal";
import StudentTable from "@/components/students/StudentTable";

import {
  deleteStudent,
  getStudents,
  Student,
} from "@/lib/firebase/students";

export default function StudentsPage() {
  const [isOpen, setIsOpen] = useState(false);

  const [students, setStudents] = useState<
    Student[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [
    editingStudent,
    setEditingStudent,
  ] = useState<Student | null>(null);

  const [
    deletingStudent,
    setDeletingStudent,
  ] = useState<Student | null>(null);

  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] =
    useState("すべて");
  const [statusFilter, setStatusFilter] =
    useState("在籍");

  const fetchStudents = async () => {
    try {
      setLoading(true);

      const data = await getStudents();

      data.sort((a, b) =>
        a.studentNumber.localeCompare(
          b.studentNumber,
          undefined,
          {
            numeric: true,
          }
        )
      );

      setStudents(data);
    } catch (error) {
      console.error(
        "生徒情報の取得に失敗しました。",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    return students.filter((student) => {
      const matchSearch =
        keyword === "" ||
        student.studentNumber
          .toLowerCase()
          .includes(keyword) ||
        student.name
          .toLowerCase()
          .includes(keyword) ||
        student.school
          .toLowerCase()
          .includes(keyword);

      const matchGrade =
        gradeFilter === "すべて"
          ? true
          : student.grade === gradeFilter;

      const matchStatus =
        statusFilter === "すべて"
          ? true
          : student.status === statusFilter;

      return (
        matchSearch &&
        matchGrade &&
        matchStatus
      );
    });
  }, [
    students,
    search,
    gradeFilter,
    statusFilter,
  ]);

  const handleDelete = async () => {
    if (
      !deletingStudent?.id ||
      !deletingStudent.name
    ) {
      return;
    }

    try {
      await deleteStudent(
        deletingStudent.id,
        deletingStudent.name
      );

      setDeletingStudent(null);

      await fetchStudents();
    } catch (error) {
      console.error(
        "生徒情報の削除に失敗しました。",
        error
      );
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="生徒管理"
        description="生徒情報の登録・検索・編集・削除を行います。"
      />

      <SearchBar
        search={search}
        onSearchChange={setSearch}
        grade={gradeFilter}
        onGradeChange={setGradeFilter}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        onAddStudent={() => {
          setEditingStudent(null);
          setIsOpen(true);
        }}
      />

      <StudentTable
        students={filteredStudents}
        loading={loading}
        onEdit={(student) => {
          setEditingStudent(student);
          setIsOpen(true);
        }}
        onDelete={(student) => {
          setDeletingStudent(student);
        }}
      />

      <StudentModal
        open={isOpen}
        student={editingStudent}
        onClose={() => {
          setIsOpen(false);
          setEditingStudent(null);
          fetchStudents();
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingStudent)}
        title="生徒を削除"
        message={
          deletingStudent
            ? `「${deletingStudent.name}」を削除しますか？\nこの操作は元に戻せません。`
            : ""
        }
        confirmText="削除"
        cancelText="キャンセル"
        onConfirm={handleDelete}
        onCancel={() =>
          setDeletingStudent(null)
        }
      />
    </div>
  );
}