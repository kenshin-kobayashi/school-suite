import { GraduationCap } from "lucide-react";

import Card from "@/components/common/Card";
import EmptyState from "@/components/common/EmptyState";
import Loading from "@/components/common/Loading";
import StatusBadge from "@/components/common/StatusBadge";

import { Teacher } from "@/lib/firebase/teachers";

type Props = {
  teachers: Teacher[];
  loading: boolean;
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
};

export default function TeacherTable({
  teachers,
  loading,
  onEdit,
  onDelete,
}: Props) {
  if (loading) {
    return <Loading />;
  }

  if (teachers.length === 0) {
    return (
      <EmptyState
        icon={<GraduationCap className="h-10 w-10" />}
        title="講師が登録されていません"
        description="「講師を追加」から最初の講師を登録しましょう。"
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <table className="min-w-full">
        <thead className="border-b border-zinc-200 bg-zinc-50">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-700">
              番号
            </th>

            <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-700">
              氏名
            </th>

            <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-700">
              状態
            </th>

            <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-700">
              操作
            </th>
          </tr>
        </thead>

        <tbody>
          {teachers.map((teacher) => (
            <tr
              key={teacher.id}
              className="border-b border-zinc-100 transition-colors duration-200 hover:bg-zinc-50"
            >
              <td className="px-6 py-5 text-sm font-medium text-zinc-700">
                {teacher.teacherNumber}
              </td>

              <td className="px-6 py-5 text-sm font-semibold text-zinc-900">
                {teacher.name}
              </td>

              <td className="px-6 py-5">
                <StatusBadge status={teacher.status} />
              </td>

              <td className="px-6 py-5">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(teacher)}
                    className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-100"
                  >
                    編集
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(teacher)}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                  >
                    削除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}