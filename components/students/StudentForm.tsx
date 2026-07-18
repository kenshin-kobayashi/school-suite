"use client";

import { useEffect, useState } from "react";

import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import PrimaryButton from "@/components/common/PrimaryButton";
import SecondaryButton from "@/components/common/SecondaryButton";

import {
  addStudent,
  updateStudent,
  Student,
} from "@/lib/firebase/students";

type Props = {
  student?: Student | null;
  onClose: () => void;
};

const grades = [
  "小学1年",
  "小学2年",
  "小学3年",
  "小学4年",
  "小学5年",
  "小学6年",
  "中学1年",
  "中学2年",
  "中学3年",
  "高校1年",
  "高校2年",
  "高校3年",
  "既卒",
];

const statuses = ["在籍", "休塾", "退塾"] as const;

export default function StudentForm({
  student,
  onClose,
}: Props) {
  const [name, setName] = useState("");
  const [furigana, setFurigana] = useState("");
  const [grade, setGrade] = useState(grades[0]);
  const [school, setSchool] = useState("");
  const [status, setStatus] =
    useState<(typeof statuses)[number]>("在籍");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!student) return;

    setName(student.name);
    setFurigana(student.furigana);
    setGrade(student.grade);
    setSchool(student.school);
    setStatus(student.status);
  }, [student]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("氏名を入力してください。");
      return;
    }

    if (!school.trim()) {
      alert("学校名を入力してください。");
      return;
    }

    try {
      setLoading(true);

      if (student?.id) {
        await updateStudent(student.id, {
          name,
          furigana,
          grade,
          school,
          status,
        });

        alert("生徒情報を更新しました。");
      } else {
        await addStudent({
          name,
          furigana,
          grade,
          school,
          status,
        });

        alert("生徒を登録しました。");
      }

      onClose();
    } catch (error) {
      console.error(error);
      alert("保存に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-zinc-900">
        {student ? "生徒を編集" : "生徒を追加"}
      </h2>

      <Input
        label="番号"
        value={student ? student.studentNumber : "自動採番"}
        disabled
        className="bg-zinc-100 text-zinc-500"
      />

      <Input
        label="氏名"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="山田 太郎"
      />

      <Input
        label="ふりがな"
        value={furigana}
        onChange={(e) => setFurigana(e.target.value)}
        placeholder="やまだ たろう"
      />

      <Select
        label="学年"
        value={grade}
        onChange={(e) => setGrade(e.target.value)}
      >
        {grades.map((grade) => (
          <option key={grade} value={grade}>
            {grade}
          </option>
        ))}
      </Select>

      <Input
        label="学校"
        value={school}
        onChange={(e) => setSchool(e.target.value)}
        placeholder="○○中学校"
      />

      <Select
        label="状態"
        value={status}
        onChange={(e) =>
          setStatus(
            e.target.value as (typeof statuses)[number]
          )
        }
      >
        {statuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </Select>

      <div className="mt-8 flex justify-end gap-3">
        <SecondaryButton
          type="button"
          onClick={onClose}
          disabled={loading}
        >
          キャンセル
        </SecondaryButton>

        <PrimaryButton
          type="button"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading
            ? student
              ? "更新中..."
              : "保存中..."
            : student
            ? "更新"
            : "保存"}
        </PrimaryButton>
      </div>
    </div>
  );
}