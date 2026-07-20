"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import PrimaryButton from "@/components/common/PrimaryButton";

import {
  createClassroom,
  deleteClassroom,
  getClassrooms,
  updateClassroom,
} from "@/lib/firebase/classroom";

import type { Classroom } from "@/types/classroom";

type ClassroomFormValues = {
  name: string;
  capacity: string;
};

const initialFormValues: ClassroomFormValues = {
  name: "",
  capacity: "1",
};

function validateClassroom(
  values: ClassroomFormValues,
  classrooms: Classroom[],
  editingClassroomId?: string,
): string | null {
  const trimmedName = values.name.trim();
  const capacity = Number(values.capacity);

  if (!trimmedName) {
    return "教室名を入力してください。";
  }

  if (!Number.isInteger(capacity) || capacity < 1) {
    return "定員は1人以上の整数で入力してください。";
  }

  const hasSameName = classrooms.some(
    (classroom) =>
      classroom.id !== editingClassroomId &&
      classroom.name.trim().toLowerCase() ===
        trimmedName.toLowerCase(),
  );

  if (hasSameName) {
    return "同じ名前の教室がすでに登録されています。";
  }

  return null;
}

export default function ClassroomSettings() {
  const [classrooms, setClassrooms] = useState<
    Classroom[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isAdding, setIsAdding] =
    useState(false);

  const [isCreating, setIsCreating] =
    useState(false);

  const [updatingClassroomId, setUpdatingClassroomId] =
    useState<string | null>(null);

  const [deletingClassroomId, setDeletingClassroomId] =
    useState<string | null>(null);

  const [editingClassroomId, setEditingClassroomId] =
    useState<string | null>(null);

  const [addFormValues, setAddFormValues] =
    useState<ClassroomFormValues>(
      initialFormValues,
    );

  const [editFormValues, setEditFormValues] =
    useState<ClassroomFormValues>(
      initialFormValues,
    );

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const loadClassrooms = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const loadedClassrooms =
        await getClassrooms();

      setClassrooms(loadedClassrooms);
    } catch (error) {
      console.error(
        "教室一覧の取得に失敗しました。",
        error,
      );

      setErrorMessage(
        "教室一覧を読み込めませんでした。",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClassrooms();
  }, [loadClassrooms]);

  function clearMessages() {
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function handleOpenAddForm() {
    clearMessages();
    setEditingClassroomId(null);
    setAddFormValues(initialFormValues);
    setIsAdding(true);
  }

  function handleCancelAdd() {
    setIsAdding(false);
    setAddFormValues(initialFormValues);
    setErrorMessage(null);
  }

  async function handleCreate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const validationMessage =
      validateClassroom(
        addFormValues,
        classrooms,
      );

    if (validationMessage) {
      setErrorMessage(validationMessage);
      setSuccessMessage(null);
      return;
    }

    setIsCreating(true);
    clearMessages();

    try {
      await createClassroom({
        name: addFormValues.name.trim(),
        capacity: Number(
          addFormValues.capacity,
        ),
      });

      await loadClassrooms();

      setIsAdding(false);
      setAddFormValues(initialFormValues);

      setSuccessMessage(
        "教室を追加しました。",
      );
    } catch (error) {
      console.error(
        "教室の追加に失敗しました。",
        error,
      );

      setErrorMessage(
        "教室を追加できませんでした。",
      );
    } finally {
      setIsCreating(false);
    }
  }

  function handleStartEdit(
    classroom: Classroom,
  ) {
    clearMessages();
    setIsAdding(false);
    setEditingClassroomId(classroom.id);

    setEditFormValues({
      name: classroom.name,
      capacity: String(classroom.capacity),
    });
  }

  function handleCancelEdit() {
    setEditingClassroomId(null);
    setEditFormValues(initialFormValues);
    setErrorMessage(null);
  }

  async function handleUpdate(
    event: FormEvent<HTMLFormElement>,
    classroom: Classroom,
  ) {
    event.preventDefault();

    const validationMessage =
      validateClassroom(
        editFormValues,
        classrooms,
        classroom.id,
      );

    if (validationMessage) {
      setErrorMessage(validationMessage);
      setSuccessMessage(null);
      return;
    }

    setUpdatingClassroomId(classroom.id);
    clearMessages();

    try {
      const updatedClassroom: Classroom = {
        id: classroom.id,
        name: editFormValues.name.trim(),
        capacity: Number(
          editFormValues.capacity,
        ),
      };

      await updateClassroom(
        updatedClassroom,
      );

      setClassrooms((currentClassrooms) =>
        currentClassrooms
          .map((currentClassroom) =>
            currentClassroom.id ===
            updatedClassroom.id
              ? updatedClassroom
              : currentClassroom,
          )
          .sort((a, b) =>
            a.name.localeCompare(
              b.name,
              "ja",
            ),
          ),
      );

      setEditingClassroomId(null);
      setEditFormValues(initialFormValues);

      setSuccessMessage(
        "教室情報を更新しました。",
      );
    } catch (error) {
      console.error(
        "教室の更新に失敗しました。",
        error,
      );

      setErrorMessage(
        "教室情報を更新できませんでした。",
      );
    } finally {
      setUpdatingClassroomId(null);
    }
  }

  async function handleDelete(
    classroom: Classroom,
  ) {
    const shouldDelete = window.confirm(
      `「${classroom.name}」を削除しますか？\nこの操作は取り消せません。`,
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingClassroomId(classroom.id);
    clearMessages();

    try {
      await deleteClassroom(classroom.id);

      setClassrooms((currentClassrooms) =>
        currentClassrooms.filter(
          (currentClassroom) =>
            currentClassroom.id !==
            classroom.id,
        ),
      );

      if (
        editingClassroomId === classroom.id
      ) {
        setEditingClassroomId(null);
        setEditFormValues(
          initialFormValues,
        );
      }

      setSuccessMessage(
        "教室を削除しました。",
      );
    } catch (error) {
      console.error(
        "教室の削除に失敗しました。",
        error,
      );

      setErrorMessage(
        "教室を削除できませんでした。",
      );
    } finally {
      setDeletingClassroomId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />

          <p className="mt-4 text-sm text-zinc-500">
            教室情報を読み込んでいます。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
          教室設定
        </h1>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          授業で使用する教室と定員を管理します。
          追加・編集・削除した内容は、すぐに保存されます。
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700"
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700"
        >
          {successMessage}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-zinc-950">
              登録済みの教室
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              {classrooms.length}件登録されています。
            </p>
          </div>

          {!isAdding && (
            <PrimaryButton
              type="button"
              onClick={handleOpenAddForm}
            >
              教室を追加
            </PrimaryButton>
          )}
        </div>

        {isAdding && (
          <form
            onSubmit={handleCreate}
            className="border-b border-zinc-200 bg-zinc-50 p-5"
          >
            <h3 className="text-sm font-semibold text-zinc-950">
              新しい教室を追加
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-700">
                  教室名
                </span>

                <input
                  type="text"
                  value={addFormValues.name}
                  onChange={(event) =>
                    setAddFormValues(
                      (currentValues) => ({
                        ...currentValues,
                        name: event.target.value,
                      }),
                    )
                  }
                  placeholder="例：101教室"
                  autoFocus
                  disabled={isCreating}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-700">
                  定員
                </span>

                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={
                      addFormValues.capacity
                    }
                    onChange={(event) =>
                      setAddFormValues(
                        (currentValues) => ({
                          ...currentValues,
                          capacity:
                            event.target.value,
                        }),
                      )
                    }
                    disabled={isCreating}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 pr-10 text-sm text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-100"
                  />

                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-zinc-500">
                    人
                  </span>
                </div>
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelAdd}
                disabled={isCreating}
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                キャンセル
              </button>

              <PrimaryButton
                type="submit"
                disabled={isCreating}
              >
                {isCreating
                  ? "追加中..."
                  : "追加する"}
              </PrimaryButton>
            </div>
          </form>
        )}

        {classrooms.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-sm font-medium text-zinc-700">
              教室がまだ登録されていません。
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              「教室を追加」から最初の教室を登録してください。
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200">
            {classrooms.map((classroom) => {
              const isEditing =
                editingClassroomId ===
                classroom.id;

              const isUpdating =
                updatingClassroomId ===
                classroom.id;

              const isDeleting =
                deletingClassroomId ===
                classroom.id;

              if (isEditing) {
                return (
                  <form
                    key={classroom.id}
                    onSubmit={(event) =>
                      void handleUpdate(
                        event,
                        classroom,
                      )
                    }
                    className="bg-zinc-50 p-5"
                  >
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-zinc-700">
                          教室名
                        </span>

                        <input
                          type="text"
                          value={
                            editFormValues.name
                          }
                          onChange={(event) =>
                            setEditFormValues(
                              (
                                currentValues,
                              ) => ({
                                ...currentValues,
                                name: event.target
                                  .value,
                              }),
                            )
                          }
                          autoFocus
                          disabled={isUpdating}
                          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-100"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-zinc-700">
                          定員
                        </span>

                        <div className="relative">
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={
                              editFormValues.capacity
                            }
                            onChange={(
                              event,
                            ) =>
                              setEditFormValues(
                                (
                                  currentValues,
                                ) => ({
                                  ...currentValues,
                                  capacity:
                                    event.target
                                      .value,
                                }),
                              )
                            }
                            disabled={
                              isUpdating
                            }
                            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 pr-10 text-sm text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-100"
                          />

                          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-zinc-500">
                            人
                          </span>
                        </div>
                      </label>
                    </div>

                    <div className="mt-4 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={
                          handleCancelEdit
                        }
                        disabled={isUpdating}
                        className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        キャンセル
                      </button>

                      <PrimaryButton
                        type="submit"
                        disabled={isUpdating}
                      >
                        {isUpdating
                          ? "保存中..."
                          : "変更を保存"}
                      </PrimaryButton>
                    </div>
                  </form>
                );
              }

              return (
                <div
                  key={classroom.id}
                  className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-zinc-950">
                      {classroom.name}
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      定員：{classroom.capacity}
                      人
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleStartEdit(
                          classroom,
                        )
                      }
                      disabled={
                        isDeleting ||
                        updatingClassroomId !==
                          null
                      }
                      className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      編集
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void handleDelete(
                          classroom,
                        )
                      }
                      disabled={
                        isDeleting ||
                        deletingClassroomId !==
                          null
                      }
                      className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDeleting
                        ? "削除中..."
                        : "削除"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}