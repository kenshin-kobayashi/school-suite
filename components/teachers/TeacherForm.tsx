"use client";

import { useEffect, useState } from "react";

import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import ToggleButton from "@/components/common/ToggleButton";
import PrimaryButton from "@/components/common/PrimaryButton";
import SecondaryButton from "@/components/common/SecondaryButton";

import {
  addTeacher,
  updateTeacher,
  Teacher,
  TeacherSubject,
} from "@/lib/firebase/teachers";

export type SubjectOption = {
  id: string;
  name: string;
};

type Props = {
  teacher?: Teacher | null;
  availableSubjects: SubjectOption[];
  onClose: () => void;
};

const statuses = ["在籍", "休職", "退職"] as const;

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

export default function TeacherForm({
  teacher,
  availableSubjects,
  onClose,
}: Props) {
  const [name, setName] = useState("");
  const [furigana, setFurigana] = useState("");

  const [status, setStatus] =
    useState<(typeof statuses)[number]>("在籍");

  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!teacher) {
      setName("");
      setFurigana("");
      setStatus("在籍");
      setSubjects([]);
      return;
    }

    setName(teacher.name);
    setFurigana(teacher.furigana);
    setStatus(teacher.status);
    setSubjects(teacher.subjects ?? []);
  }, [teacher]);

  const isSubjectSelected = (subjectId: string) => {
    return subjects.some((subject) => subject.id === subjectId);
  };

  const handleSubjectToggle = (
    subjectOption: SubjectOption
  ) => {
    const selected = isSubjectSelected(subjectOption.id);

    if (selected) {
      setSubjects((currentSubjects) =>
        currentSubjects.filter(
          (subject) => subject.id !== subjectOption.id
        )
      );

      return;
    }

    setSubjects((currentSubjects) => [
      ...currentSubjects,
      subjectOption.id === "mathematics"
        ? {
            id: subjectOption.id,
            subject: subjectOption.name,
            grades: [],
            examMath: false,
          }
        : {
            id: subjectOption.id,
            subject: subjectOption.name,
            grades: [],
          },
    ]);
  };

  const handleGradeToggle = (
    subjectId: string,
    grade: string
  ) => {
    setSubjects((currentSubjects) =>
      currentSubjects.map((subject) => {
        if (subject.id !== subjectId) {
          return subject;
        }

        const selected = subject.grades.includes(grade);

        return {
          ...subject,
          grades: selected
            ? subject.grades.filter(
                (currentGrade) => currentGrade !== grade
              )
            : [...subject.grades, grade],
        };
      })
    );
  };

  const handleExamMathToggle = () => {
    setSubjects((currentSubjects) =>
      currentSubjects.map((subject) => {
        if (subject.id !== "mathematics") {
          return subject;
        }

        return {
          ...subject,
          examMath: !subject.examMath,
        };
      })
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("氏名を入力してください。");
      return;
    }

    if (!furigana.trim()) {
      alert("ふりがなを入力してください。");
      return;
    }

    try {
      setLoading(true);

      const cleanedSubjects: TeacherSubject[] = subjects.map(
        (subject) => {
          if (subject.id === "mathematics") {
            return {
              id: subject.id,
              subject: subject.subject,
              grades: subject.grades,
              examMath: Boolean(subject.examMath),
            };
          }

          return {
            id: subject.id,
            subject: subject.subject,
            grades: subject.grades,
          };
        }
      );

      if (teacher?.id) {
        await updateTeacher(teacher.id, {
          name: name.trim(),
          furigana: furigana.trim(),
          status,
          subjects: cleanedSubjects,
        });

        alert("講師情報を更新しました。");
      } else {
        await addTeacher({
          name: name.trim(),
          furigana: furigana.trim(),
          status,
          subjects: cleanedSubjects,
        });

        alert("講師を登録しました。");
      }

      onClose();
    } catch (error) {
      console.error(
        "講師情報の保存に失敗しました。",
        error
      );

      alert(
        error instanceof Error
          ? `保存に失敗しました。\n${error.message}`
          : "保存に失敗しました。"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-zinc-900">
        {teacher ? "講師を編集" : "講師を追加"}
      </h2>

      <Input
        label="番号"
        value={
          teacher
            ? teacher.teacherNumber
            : "自動採番"
        }
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
        label="状態"
        value={status}
        onChange={(e) =>
          setStatus(
            e.target.value as (typeof statuses)[number]
          )
        }
      >
        {statuses.map((statusOption) => (
          <option
            key={statusOption}
            value={statusOption}
          >
            {statusOption}
          </option>
        ))}
      </Select>

      <div className="space-y-4">
        <p className="text-sm font-semibold text-zinc-800">
          担当教科
        </p>

        <div className="flex flex-wrap gap-3">
          {availableSubjects.map((subjectOption) => (
            <ToggleButton
              key={subjectOption.id}
              type="button"
              selected={isSubjectSelected(
                subjectOption.id
              )}
              onClick={() =>
                handleSubjectToggle(subjectOption)
              }
            >
              {subjectOption.name}
            </ToggleButton>
          ))}
        </div>
      </div>

      {subjects.map((subject) => (
        <div
          key={subject.id}
          className="space-y-4 border-t border-zinc-200 pt-6"
        >
          <p className="font-semibold text-zinc-900">
            {subject.subject}の担当学年
          </p>

          <div className="flex flex-wrap gap-3">
            {grades.map((grade) => (
              <ToggleButton
                key={`${subject.id}-${grade}`}
                type="button"
                selected={subject.grades.includes(grade)}
                onClick={() =>
                  handleGradeToggle(subject.id, grade)
                }
              >
                {grade}
              </ToggleButton>
            ))}
          </div>

          {subject.id === "mathematics" && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-zinc-800">
                受験算数
              </p>

              <ToggleButton
                type="button"
                selected={Boolean(subject.examMath)}
                onClick={handleExamMathToggle}
              >
                対応可能
              </ToggleButton>
            </div>
          )}
        </div>
      ))}

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
            ? teacher
              ? "更新中..."
              : "保存中..."
            : teacher
              ? "更新"
              : "保存"}
        </PrimaryButton>
      </div>
    </div>
  );
}