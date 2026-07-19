"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Input from "@/components/common/Input";
import PrimaryButton from "@/components/common/PrimaryButton";
import SearchSelect, {
  type SearchSelectOption,
} from "@/components/common/SearchSelect";
import SecondaryButton from "@/components/common/SecondaryButton";
import Select from "@/components/common/Select";

import {
  addStudent,
  updateStudent,
  type MaxStudentsPerLesson,
  type Student,
  type StudentStatus,
} from "@/lib/firebase/students";

import {
  getTeachers,
  type Teacher,
} from "@/lib/firebase/teachers";

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

const statuses: StudentStatus[] = [
  "在籍",
  "休塾",
  "退塾",
];

const maxStudentsOptions: {
  value: MaxStudentsPerLesson;
  label: string;
}[] = [
  {
    value: 1,
    label: "1対1",
  },
  {
    value: 2,
    label: "最大1対2",
  },
  {
    value: 3,
    label: "最大1対3",
  },
  {
    value: 4,
    label: "最大1対4",
  },
];

function normalizeIds(
  ids: string[],
): string[] {
  return Array.from(
    new Set(ids.filter(Boolean)),
  );
}

export default function StudentForm({
  student,
  onClose,
}: Props) {
  const [name, setName] = useState("");
  const [furigana, setFurigana] =
    useState("");
  const [grade, setGrade] = useState(
    grades[0],
  );
  const [school, setSchool] = useState("");

  const [status, setStatus] =
    useState<StudentStatus>("在籍");

  const [
    maxStudentsPerLesson,
    setMaxStudentsPerLesson,
  ] =
    useState<MaxStudentsPerLesson>(2);

  const [
    unavailableTeacherIds,
    setUnavailableTeacherIds,
  ] = useState<string[]>([]);

  const [
    firstPreferredTeacherId,
    setFirstPreferredTeacherId,
  ] = useState("");

  const [
    secondPreferredTeacherId,
    setSecondPreferredTeacherId,
  ] = useState("");

  const [
    teacherToAddId,
    setTeacherToAddId,
  ] = useState("");

  const [teachers, setTeachers] = useState<
    Teacher[]
  >([]);

  const [teachersLoading, setTeachersLoading] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    let active = true;

    const fetchTeachers = async () => {
      try {
        setTeachersLoading(true);

        const teacherData =
          await getTeachers();

        if (!active) {
          return;
        }

        teacherData.sort(
          (firstTeacher, secondTeacher) =>
            firstTeacher.teacherNumber.localeCompare(
              secondTeacher.teacherNumber,
              undefined,
              {
                numeric: true,
              },
            ),
        );

        setTeachers(teacherData);
      } catch (error) {
        console.error(
          "講師情報の取得に失敗しました。",
          error,
        );

        if (active) {
          setErrorMessage(
            "講師情報の取得に失敗しました。",
          );
        }
      } finally {
        if (active) {
          setTeachersLoading(false);
        }
      }
    };

    void fetchTeachers();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setTeacherToAddId("");
    setErrorMessage("");

    if (!student) {
      setName("");
      setFurigana("");
      setGrade(grades[0]);
      setSchool("");
      setStatus("在籍");
      setMaxStudentsPerLesson(2);
      setUnavailableTeacherIds([]);
      setFirstPreferredTeacherId("");
      setSecondPreferredTeacherId("");

      return;
    }

    setName(student.name);
    setFurigana(student.furigana);
    setGrade(student.grade);
    setSchool(student.school);
    setStatus(student.status);

    setMaxStudentsPerLesson(
      student.maxStudentsPerLesson ?? 2,
    );

    setUnavailableTeacherIds(
      normalizeIds(
        student.unavailableTeacherIds ??
          [],
      ),
    );

    setFirstPreferredTeacherId(
      student.firstPreferredTeacherId ??
        "",
    );

    setSecondPreferredTeacherId(
      student.secondPreferredTeacherId ??
        "",
    );
  }, [student]);

  const activeTeachers = useMemo(() => {
    return teachers.filter(
      (teacher) =>
        teacher.status === "在籍" &&
        Boolean(teacher.id),
    );
  }, [teachers]);

  const unavailableTeacherIdSet =
    useMemo(
      () =>
        new Set(
          unavailableTeacherIds,
        ),
      [unavailableTeacherIds],
    );

  const unavailableTeachers = useMemo(
    () =>
      activeTeachers.filter(
        (teacher) =>
          teacher.id &&
          unavailableTeacherIdSet.has(
            teacher.id,
          ),
      ),
    [
      activeTeachers,
      unavailableTeacherIdSet,
    ],
  );

  const createTeacherOption = (
    teacher: Teacher,
  ): SearchSelectOption | null => {
    if (!teacher.id) {
      return null;
    }

    const subjectNames =
      teacher.subjects.map(
        (subject) => subject.subject,
      );

    return {
      value: teacher.id,
      label: teacher.name,
      description: [
        teacher.teacherNumber,
        subjectNames.length > 0
          ? `担当：${subjectNames.join("・")}`
          : "担当教科未登録",
      ]
        .filter(Boolean)
        .join("・"),

      searchText: [
        teacher.teacherNumber,
        teacher.name,
        teacher.furigana,
        ...subjectNames,
      ]
        .filter(Boolean)
        .join(" "),
    };
  };

  const unavailableTeacherOptions =
    useMemo<SearchSelectOption[]>(() => {
      return activeTeachers.flatMap(
        (teacher) => {
          if (
            !teacher.id ||
            unavailableTeacherIdSet.has(
              teacher.id,
            )
          ) {
            return [];
          }

          const option =
            createTeacherOption(teacher);

          return option ? [option] : [];
        },
      );
    }, [
      activeTeachers,
      unavailableTeacherIdSet,
    ]);

  const firstPreferredTeacherOptions =
    useMemo<SearchSelectOption[]>(() => {
      return activeTeachers.flatMap(
        (teacher) => {
          if (
            !teacher.id ||
            unavailableTeacherIdSet.has(
              teacher.id,
            ) ||
            teacher.id ===
              secondPreferredTeacherId
          ) {
            return [];
          }

          const option =
            createTeacherOption(teacher);

          return option ? [option] : [];
        },
      );
    }, [
      activeTeachers,
      secondPreferredTeacherId,
      unavailableTeacherIdSet,
    ]);

  const secondPreferredTeacherOptions =
    useMemo<SearchSelectOption[]>(() => {
      return activeTeachers.flatMap(
        (teacher) => {
          if (
            !teacher.id ||
            unavailableTeacherIdSet.has(
              teacher.id,
            ) ||
            teacher.id ===
              firstPreferredTeacherId
          ) {
            return [];
          }

          const option =
            createTeacherOption(teacher);

          return option ? [option] : [];
        },
      );
    }, [
      activeTeachers,
      firstPreferredTeacherId,
      unavailableTeacherIdSet,
    ]);

  const handleAddUnavailableTeacher = () => {
    if (!teacherToAddId) {
      return;
    }

    setUnavailableTeacherIds(
      (currentIds) =>
        normalizeIds([
          ...currentIds,
          teacherToAddId,
        ]),
    );

    if (
      firstPreferredTeacherId ===
      teacherToAddId
    ) {
      setFirstPreferredTeacherId("");
    }

    if (
      secondPreferredTeacherId ===
      teacherToAddId
    ) {
      setSecondPreferredTeacherId("");
    }

    setTeacherToAddId("");
    setErrorMessage("");
  };

  const handleRemoveUnavailableTeacher = (
    teacherId: string,
  ) => {
    setUnavailableTeacherIds(
      (currentIds) =>
        currentIds.filter(
          (currentId) =>
            currentId !== teacherId,
        ),
    );
  };

  const validate = (): string | null => {
    if (!name.trim()) {
      return "氏名を入力してください。";
    }

    if (!furigana.trim()) {
      return "ふりがなを入力してください。";
    }

    if (!school.trim()) {
      return "学校名を入力してください。";
    }

    if (
      firstPreferredTeacherId &&
      unavailableTeacherIdSet.has(
        firstPreferredTeacherId,
      )
    ) {
      return "第1希望講師が担当不可講師に設定されています。";
    }

    if (
      secondPreferredTeacherId &&
      unavailableTeacherIdSet.has(
        secondPreferredTeacherId,
      )
    ) {
      return "第2希望講師が担当不可講師に設定されています。";
    }

    if (
      firstPreferredTeacherId &&
      firstPreferredTeacherId ===
        secondPreferredTeacherId
    ) {
      return "第1希望講師と第2希望講師には、別の講師を選択してください。";
    }

    return null;
  };

  const handleSubmit = async () => {
    if (loading) {
      return;
    }

    const validationError = validate();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const studentData = {
        name: name.trim(),
        furigana: furigana.trim(),
        grade,
        school: school.trim(),
        status,

        unavailableTeacherIds:
          normalizeIds(
            unavailableTeacherIds,
          ),

        maxStudentsPerLesson,

        firstPreferredTeacherId,
        secondPreferredTeacherId,
      };

      if (student?.id) {
        await updateStudent(
          student.id,
          studentData,
        );
      } else {
        await addStudent(studentData);
      }

      onClose();
    } catch (error) {
      console.error(
        "生徒情報の保存に失敗しました。",
        error,
      );

      setErrorMessage(
        "保存に失敗しました。時間をおいて、もう一度お試しください。",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Input
        label="番号"
        value={
          student
            ? student.studentNumber
            : "自動採番"
        }
        disabled
        className="bg-zinc-100 text-zinc-500"
      />

      <Input
        label="氏名"
        value={name}
        disabled={loading}
        onChange={(event) => {
          setName(event.target.value);
          setErrorMessage("");
        }}
        placeholder="山田 太郎"
      />

      <Input
        label="ふりがな"
        value={furigana}
        disabled={loading}
        onChange={(event) => {
          setFurigana(
            event.target.value,
          );
          setErrorMessage("");
        }}
        placeholder="やまだ たろう"
      />

      <Select
        label="学年"
        value={grade}
        disabled={loading}
        onChange={(event) =>
          setGrade(event.target.value)
        }
      >
        {grades.map((gradeOption) => (
          <option
            key={gradeOption}
            value={gradeOption}
          >
            {gradeOption}
          </option>
        ))}
      </Select>

      <Input
        label="学校"
        value={school}
        disabled={loading}
        onChange={(event) => {
          setSchool(event.target.value);
          setErrorMessage("");
        }}
        placeholder="○○中学校"
      />

      <Select
        label="状態"
        value={status}
        disabled={loading}
        onChange={(event) =>
          setStatus(
            event.target
              .value as StudentStatus,
          )
        }
      >
        {statuses.map(
          (statusOption) => (
            <option
              key={statusOption}
              value={statusOption}
            >
              {statusOption}
            </option>
          ),
        )}
      </Select>

      <Select
        label="授業の最大人数"
        value={String(
          maxStudentsPerLesson,
        )}
        disabled={loading}
        onChange={(event) =>
          setMaxStudentsPerLesson(
            Number(
              event.target.value,
            ) as MaxStudentsPerLesson,
          )
        }
      >
        {maxStudentsOptions.map(
          (option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ),
        )}
      </Select>

      <p className="-mt-4 text-xs leading-5 text-zinc-500">
        例えば「最大1対2」の場合、この生徒は生徒3名以上の授業には配置されません。
      </p>

      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-800">
            希望講師
          </h3>

          <p className="mt-1 text-xs leading-5 text-zinc-500">
            AI時間割作成では第1希望、第2希望の順に優先します。
            希望講師を設定しなくても保存できます。
          </p>
        </div>

        <SearchSelect
          label="第1希望講師"
          placeholder={
            teachersLoading
              ? "講師を読み込み中"
              : "第1希望講師を検索"
          }
          value={firstPreferredTeacherId}
          options={
            firstPreferredTeacherOptions
          }
          onChange={(teacherId) => {
            setFirstPreferredTeacherId(
              teacherId,
            );
            setErrorMessage("");
          }}
          disabled={
            loading || teachersLoading
          }
          emptyMessage="選択できる講師が見つかりません。"
        />

        {firstPreferredTeacherId && (
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              setFirstPreferredTeacherId(
                "",
              )
            }
            className="-mt-2 text-xs font-semibold text-zinc-500 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            第1希望講師を解除
          </button>
        )}

        <SearchSelect
          label="第2希望講師"
          placeholder={
            teachersLoading
              ? "講師を読み込み中"
              : "第2希望講師を検索"
          }
          value={secondPreferredTeacherId}
          options={
            secondPreferredTeacherOptions
          }
          onChange={(teacherId) => {
            setSecondPreferredTeacherId(
              teacherId,
            );
            setErrorMessage("");
          }}
          disabled={
            loading || teachersLoading
          }
          emptyMessage="選択できる講師が見つかりません。"
        />

        {secondPreferredTeacherId && (
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              setSecondPreferredTeacherId(
                "",
              )
            }
            className="-mt-2 text-xs font-semibold text-zinc-500 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            第2希望講師を解除
          </button>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-800">
            担当不可講師
          </h3>

          <p className="mt-1 text-xs leading-5 text-zinc-500">
            ここに設定した講師は、手動登録とAI時間割作成の両方で候補から除外されます。
          </p>
        </div>

        {unavailableTeachers.length >
        0 ? (
          <div className="flex flex-wrap gap-2">
            {unavailableTeachers.map(
              (teacher) => (
                <div
                  key={teacher.id}
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white py-1.5 pl-3 pr-1.5"
                >
                  <span className="text-sm font-semibold text-zinc-700">
                    {teacher.name}
                  </span>

                  <button
                    type="button"
                    disabled={loading}
                    aria-label={`${teacher.name}先生を担当不可講師から外す`}
                    onClick={() => {
                      if (teacher.id) {
                        handleRemoveUnavailableTeacher(
                          teacher.id,
                        );
                      }
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      fill="none"
                      className="h-4 w-4"
                    >
                      <path
                        d="m6 6 8 8m0-8-8 8"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              ),
            )}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-zinc-200 bg-white px-4 py-4 text-center text-sm text-zinc-400">
            担当不可講師は設定されていません。
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <SearchSelect
              label="講師を追加"
              placeholder={
                teachersLoading
                  ? "講師を読み込み中"
                  : "講師を検索"
              }
              value={teacherToAddId}
              options={
                unavailableTeacherOptions
              }
              onChange={
                setTeacherToAddId
              }
              disabled={
                loading ||
                teachersLoading
              }
              emptyMessage="追加できる講師が見つかりません。"
            />
          </div>

          <SecondaryButton
            type="button"
            disabled={
              loading ||
              teachersLoading ||
              !teacherToAddId
            }
            onClick={
              handleAddUnavailableTeacher
            }
          >
            追加
          </SecondaryButton>
        </div>
      </section>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <p className="text-sm font-semibold text-red-700">
            {errorMessage}
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-zinc-200 pt-5">
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