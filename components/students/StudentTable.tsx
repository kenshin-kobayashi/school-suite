import { Users } from "lucide-react";

import Card from "@/components/common/Card";
import EmptyState from "@/components/common/EmptyState";
import Loading from "@/components/common/Loading";
import StatusBadge from "@/components/common/StatusBadge";

import { Student } from "@/lib/firebase/students";

type Props = {
  students: Student[];
  loading: boolean;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
};

export default function StudentTable({
  students,
  loading,
  onEdit,
  onDelete,
}: Props) {
  if (loading) {
    return <Loading />;
  }

  if (students.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-10 w-10" />}
        title="生徒が登録されていません"
        description="「生徒を追加」から最初の生徒を登録しましょう。"
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
              学年
            </th>

            <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-700">
              学校
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
          {students.map((student) => (
            <tr
              key={student.id}
              className="border-b border-zinc-100 transition-colors duration-200 hover:bg-zinc-50"
            >
              <td className="px-6 py-5 text-sm font-medium text-zinc-700">
                {student.studentNumber}
              </td>

              <td className="px-6 py-5 text-sm font-semibold text-zinc-900">
                {student.name}
              </td>

              <td className="px-6 py-5 text-sm text-zinc-800">
                {student.grade}
              </td>

              <td className="px-6 py-5 text-sm text-zinc-800">
                {student.school}
              </td>

              <td className="px-6 py-5">
                <StatusBadge status={student.status} />
              </td>

              <td className="px-6 py-5">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(student)}
                    className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-100"
                  >
                    編集
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(student)}
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