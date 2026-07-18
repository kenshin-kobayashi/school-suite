"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import PageHeader from "@/components/common/PageHeader";
import PrimaryButton from "@/components/common/PrimaryButton";
import SearchFilterBar from "@/components/common/SearchFilterBar";

import TeacherModal from "@/components/teachers/TeacherModal";
import TeacherTable from "@/components/teachers/TeacherTable";

import {
  deleteTeacher,
  getTeachers,
  Teacher,
} from "@/lib/firebase/teachers";

const availableSubjects = [
  {
    id: "japanese",
    name: "国語",
  },
  {
    id: "mathematics",
    name: "数学",
  },
  {
    id: "english",
    name: "英語",
  },
  {
    id: "science",
    name: "理科",
  },
  {
    id: "social-studies",
    name: "社会",
  },
];

const teacherStatuses = [
  "在籍",
  "休職",
  "退職",
  "すべて",
] as const;

export default function TeachersPage() {
  const [isOpen, setIsOpen] = useState(false);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // 編集中の講師
  const [editingTeacher, setEditingTeacher] =
    useState<Teacher | null>(null);

  // 削除対象の講師
  const [deletingTeacher, setDeletingTeacher] =
    useState<Teacher | null>(null);

  // 検索
  const [search, setSearch] = useState("");

  // 状態（初期表示は在籍）
  const [statusFilter, setStatusFilter] =
    useState("在籍");

  const fetchTeachers = async () => {
    try {
      setLoading(true);

      const data = await getTeachers();

      data.sort((a, b) =>
        a.teacherNumber.localeCompare(
          b.teacherNumber,
          undefined,
          {
            numeric: true,
          }
        )
      );

      setTeachers(data);
    } catch (error) {
      console.error(
        "講師情報の取得に失敗しました。",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const filteredTeachers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return teachers.filter((teacher) => {
      const matchSearch =
        keyword === "" ||
        teacher.teacherNumber
          .toLowerCase()
          .includes(keyword) ||
        teacher.name
          .toLowerCase()
          .includes(keyword) ||
        teacher.furigana
          .toLowerCase()
          .includes(keyword);

      const matchStatus =
        statusFilter === "すべて"
          ? true
          : teacher.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [teachers, search, statusFilter]);

  const handleDelete = async () => {
    if (!deletingTeacher?.id) return;

    try {
      // ← ここだけ変更
      await deleteTeacher(
        deletingTeacher.id,
        deletingTeacher.name
      );

      setDeletingTeacher(null);

      await fetchTeachers();
    } catch (error) {
      console.error(
        "講師情報の削除に失敗しました。",
        error
      );
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="講師管理"
        description="講師情報の登録・検索・編集・削除を行います。"
      />

      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={teacherStatuses}
        showGradeFilter={false}
        searchPlaceholder="講師番号・氏名で検索..."
        button={
          <PrimaryButton
            type="button"
            onClick={() => {
              setEditingTeacher(null);
              setIsOpen(true);
            }}
          >
            <Plus className="h-5 w-5" />
            講師を追加
          </PrimaryButton>
        }
      />

      <TeacherTable
        teachers={filteredTeachers}
        loading={loading}
        onEdit={(teacher) => {
          setEditingTeacher(teacher);
          setIsOpen(true);
        }}
        onDelete={(teacher) => {
          setDeletingTeacher(teacher);
        }}
      />

      <TeacherModal
        open={isOpen}
        teacher={editingTeacher}
        availableSubjects={availableSubjects}
        onClose={() => {
          setIsOpen(false);
          setEditingTeacher(null);
          fetchTeachers();
        }}
      />

      <ConfirmDialog
        open={!!deletingTeacher}
        title="講師を削除"
        message={
          deletingTeacher
            ? `「${deletingTeacher.name}」を削除しますか？\nこの操作は元に戻せません。`
            : ""
        }
        confirmText="削除"
        cancelText="キャンセル"
        onConfirm={handleDelete}
        onCancel={() => setDeletingTeacher(null)}
      />
    </div>
  );
}