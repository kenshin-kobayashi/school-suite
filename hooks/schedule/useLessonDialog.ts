"use client";

import {
  useMemo,
  useState,
} from "react";

import type {
  Dispatch,
  SetStateAction,
} from "react";

import type {
  LessonFormInitialValues,
  LessonFormValues,
} from "@/components/schedule/dialog/LessonForm";

import type {
  ScheduleMode,
} from "@/components/schedule";

import {
  addLesson,
  deleteLesson,
  updateLesson,
} from "@/lib/firebase/lessons";

import {
  createLessonWriteData,
  findClassroomConflict,
} from "@/lib/schedule/lesson";

import type {
  Lesson,
} from "@/types/lesson";

import {
  createScheduleCellKey,
  type ScheduleCellPosition,
} from "@/types/schedule-cell";

type ScheduleColumnLike = {
  id: string;
  isHoliday?: boolean;
};

type SchedulePeriodLike = {
  id: string;
};

type UseLessonDialogParameters = {
  academicYear: number;

  mode: ScheduleMode;

  columns: ScheduleColumnLike[];

  periods: SchedulePeriodLike[];

  holidayDateSet: Set<string>;

  lessonsByCell: Record<
    string,
    Lesson[]
  >;

  setLessonsByCell: Dispatch<
    SetStateAction<
      Record<string, Lesson[]>
    >
  >;

  setScheduleError: Dispatch<
    SetStateAction<string>
  >;

  onBeforeOpen?: () => void;
};

type UseLessonDialogResult = {
  lessonDialogOpen: boolean;

  selectedCell:
    ScheduleCellPosition | null;

  selectedLesson: Lesson | null;

  lessonInitialValues:
    | LessonFormInitialValues
    | undefined;

  handleAddLesson: () => void;

  handleCellClick: (
    position: ScheduleCellPosition,
  ) => void;

  handleLessonClick: (
    position: ScheduleCellPosition,
    lesson: Lesson,
  ) => void;

  handleCloseLessonDialog: () => void;

  handleSubmitLesson: (
    values: LessonFormValues,
  ) => Promise<void>;

  handleDeleteLesson: () => Promise<void>;
};

export function useLessonDialog({
  academicYear,
  mode,
  columns,
  periods,
  holidayDateSet,
  lessonsByCell,
  setLessonsByCell,
  setScheduleError,
  onBeforeOpen,
}: UseLessonDialogParameters): UseLessonDialogResult {
  const [
    selectedCell,
    setSelectedCell,
  ] =
    useState<ScheduleCellPosition | null>(
      null,
    );

  const [
    selectedLesson,
    setSelectedLesson,
  ] = useState<Lesson | null>(
    null,
  );

  const [
    lessonDialogOpen,
    setLessonDialogOpen,
  ] = useState(false);

  const lessonInitialValues =
    useMemo<
      LessonFormInitialValues | undefined
    >(() => {
      if (!selectedLesson) {
        return undefined;
      }

      return {
        teacherId:
          selectedLesson.teacherId,

        teacherNumber:
          selectedLesson.teacherNumber ??
          "",

        teacherName:
          selectedLesson.teacherName,

        classroomId:
          selectedLesson.classroomId,

        classroomName:
          selectedLesson.classroomName,

        students:
          selectedLesson.students,
      };
    }, [selectedLesson]);

  function isHolidayPosition(
    position: ScheduleCellPosition,
  ): boolean {
    return (
      mode === "course" &&
      holidayDateSet.has(
        position.columnId,
      )
    );
  }

  function handleCloseLessonDialog() {
    setLessonDialogOpen(false);
    setSelectedCell(null);
    setSelectedLesson(null);
  }

  function openCreateLessonDialog(
    position: ScheduleCellPosition,
  ) {
    if (
      isHolidayPosition(position)
    ) {
      setScheduleError(
        "休塾日には授業を登録できません。",
      );

      return;
    }

    setScheduleError("");

    onBeforeOpen?.();

    setSelectedCell(position);
    setSelectedLesson(null);
    setLessonDialogOpen(true);
  }

  function handleCellClick(
    position: ScheduleCellPosition,
  ) {
    if (
      isHolidayPosition(position)
    ) {
      return;
    }

    openCreateLessonDialog(
      position,
    );
  }

  function handleLessonClick(
    position: ScheduleCellPosition,
    lesson: Lesson,
  ) {
    if (
      isHolidayPosition(position)
    ) {
      return;
    }

    setScheduleError("");

    onBeforeOpen?.();

    setSelectedCell(position);
    setSelectedLesson(lesson);
    setLessonDialogOpen(true);
  }

  function handleAddLesson() {
    const firstAvailableColumn =
      columns.find(
        (column) =>
          !column.isHoliday,
      );

    const firstPeriod =
      periods[0];

    if (
      !firstAvailableColumn ||
      !firstPeriod
    ) {
      setScheduleError(
        "授業を追加できる曜日・日付またはコマが設定されていません。",
      );

      return;
    }

    openCreateLessonDialog({
      columnId:
        firstAvailableColumn.id,

      periodId:
        firstPeriod.id,
    });
  }

  async function handleSubmitLesson(
    values: LessonFormValues,
  ) {
    if (!selectedCell) {
      return;
    }

    if (
      isHolidayPosition(
        selectedCell,
      )
    ) {
      setScheduleError(
        "休塾日には授業を登録できません。",
      );

      handleCloseLessonDialog();

      return;
    }

    const cellKey =
      createScheduleCellKey(
        selectedCell,
      );

    const currentCellLessons =
      lessonsByCell[cellKey] ?? [];

    const classroomConflict =
      findClassroomConflict({
        lessons:
          currentCellLessons,

        classroomId:
          values.classroomId,

        editingLessonId:
          selectedLesson?.id,
      });

    if (classroomConflict) {
      const classroomName =
        values.classroomName.trim() ||
        classroomConflict.classroomName?.trim() ||
        "選択した教室";

      const conflictTeacherName =
        classroomConflict.teacherName.trim();

      setScheduleError(
        `${classroomName}は、この時間に${conflictTeacherName}の授業で使用されています。別の教室を選択してください。`,
      );

      return;
    }

    const lessonWriteData =
      createLessonWriteData({
        academicYear,
        mode,
        position:
          selectedCell,
        values,
        existingLesson:
          selectedLesson,
      });

    try {
      setScheduleError("");

      if (selectedLesson) {
        if (!selectedLesson.id) {
          throw new Error(
            "更新する授業のIDがありません。",
          );
        }

        const lessonId =
          selectedLesson.id;

        await updateLesson(
          lessonId,
          lessonWriteData,
        );

        const updatedLesson: Lesson = {
          ...selectedLesson,
          ...lessonWriteData,
          id: lessonId,
          updatedAt:
            new Date(),
        };

        setLessonsByCell(
          (currentLessons) => ({
            ...currentLessons,

            [cellKey]: (
              currentLessons[
                cellKey
              ] ?? []
            ).map((lesson) =>
              lesson.id === lessonId
                ? updatedLesson
                : lesson,
            ),
          }),
        );

        handleCloseLessonDialog();

        return;
      }

      const lessonId =
        await addLesson(
          lessonWriteData,
        );

      const newLesson: Lesson = {
        ...lessonWriteData,
        id: lessonId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setLessonsByCell(
        (currentLessons) => ({
          ...currentLessons,

          [cellKey]: [
            ...(
              currentLessons[
                cellKey
              ] ?? []
            ),
            newLesson,
          ],
        }),
      );

      handleCloseLessonDialog();
    } catch (error) {
      console.error(
        "授業の保存に失敗しました。",
        error,
      );

      setScheduleError(
        error instanceof Error
          ? error.message
          : "授業の保存に失敗しました。時間をおいて、もう一度お試しください。",
      );
    }
  }

  async function handleDeleteLesson() {
    if (
      !selectedCell ||
      !selectedLesson
    ) {
      return;
    }

    if (!selectedLesson.id) {
      setScheduleError(
        "削除する授業のIDがありません。",
      );

      return;
    }

    const lessonId =
      selectedLesson.id;

    const cellKey =
      createScheduleCellKey(
        selectedCell,
      );

    try {
      setScheduleError("");

      await deleteLesson(
        lessonId,
      );

      setLessonsByCell(
        (currentLessons) => {
          const nextCellLessons = (
            currentLessons[
              cellKey
            ] ?? []
          ).filter(
            (lesson) =>
              lesson.id !==
              lessonId,
          );

          if (
            nextCellLessons.length ===
            0
          ) {
            const nextLessons = {
              ...currentLessons,
            };

            delete nextLessons[
              cellKey
            ];

            return nextLessons;
          }

          return {
            ...currentLessons,

            [cellKey]:
              nextCellLessons,
          };
        },
      );

      handleCloseLessonDialog();
    } catch (error) {
      console.error(
        "授業の削除に失敗しました。",
        error,
      );

      setScheduleError(
        error instanceof Error
          ? error.message
          : "授業の削除に失敗しました。時間をおいて、もう一度お試しください。",
      );
    }
  }

  return {
    lessonDialogOpen,

    selectedCell,

    selectedLesson,

    lessonInitialValues,

    handleAddLesson,

    handleCellClick,

    handleLessonClick,

    handleCloseLessonDialog,

    handleSubmitLesson,

    handleDeleteLesson,
  };
}