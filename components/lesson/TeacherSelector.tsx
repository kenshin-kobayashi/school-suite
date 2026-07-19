"use client";

import { useMemo } from "react";

import SearchSelect, {
  type SearchSelectOption,
} from "@/components/common/SearchSelect";

import type { Teacher } from "@/lib/firebase/teachers";

type Props = {
  value: string;
  teachers: Teacher[];
  onChange: (teacherId: string) => void;
};

export default function TeacherSelector({
  value,
  teachers,
  onChange,
}: Props) {
  const options = useMemo<SearchSelectOption[]>(() => {
    return teachers.flatMap((teacher) => {
      if (!teacher.id) {
        return [];
      }

      const subjectNames = teacher.subjects.map(
        (subject) => subject.subject,
      );

      return [
        {
          value: teacher.id,
          label: teacher.name,
          description:
            subjectNames.length > 0
              ? `担当教科：${subjectNames.join("・")}`
              : "担当教科未登録",
          searchText: [
            teacher.name,
            teacher.furigana,
            teacher.teacherNumber,
            ...subjectNames,
          ]
            .filter(Boolean)
            .join(" "),
        },
      ];
    });
  }, [teachers]);

  return (
    <SearchSelect
      label="担当講師"
      placeholder="講師を検索"
      value={value}
      options={options}
      onChange={onChange}
      emptyMessage="該当する講師が見つかりません。"
    />
  );
}