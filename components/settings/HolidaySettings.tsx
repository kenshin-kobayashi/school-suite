"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import PrimaryButton from "@/components/common/PrimaryButton";

import {
  getSchoolHolidays,
  saveSchoolHolidays,
} from "@/lib/firebase/setting";

import type { SchoolHoliday } from "@/types/schedule-settings";

/**
 * 休塾日のIDを生成します。
 */
function createHolidayId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return [
    "holiday",
    Date.now().toString(),
    Math.random().toString(36).slice(2),
  ].join("-");
}

/**
 * 日付を日本語表示に変換します。
 */
function formatHolidayDate(
  dateString: string,
): string {
  if (!dateString) {
    return "";
  }

  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  if (!year || !month || !day) {
    return dateString;
  }

  const date = new Date(
    year,
    month - 1,
    day,
  );

  const weekday =
    new Intl.DateTimeFormat("ja-JP", {
      weekday: "short",
    }).format(date);

  return `${year}年${month}月${day}日（${weekday}）`;
}

/**
 * 休塾日を日付順に並べます。
 */
function sortHolidays(
  holidays: SchoolHoliday[],
): SchoolHoliday[] {
  return [...holidays].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

export default function HolidaySettings() {
  const [holidays, setHolidays] =
    useState<SchoolHoliday[]>([]);

  const [selectedDate, setSelectedDate] =
    useState("");

  const [
    editingHolidayId,
    setEditingHolidayId,
  ] = useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [hasChanges, setHasChanges] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const sortedHolidays = useMemo(
    () => sortHolidays(holidays),
    [holidays],
  );

  const loadHolidays =
    useCallback(async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      try {
        const savedHolidays =
          await getSchoolHolidays();

        setHolidays(
          sortHolidays(savedHolidays),
        );

        setHasChanges(false);
      } catch (error) {
        console.error(
          "休塾日設定の取得に失敗しました。",
          error,
        );

        setErrorMessage(
          "休塾日設定を読み込めませんでした。",
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadHolidays();
  }, [loadHolidays]);

  function resetForm() {
    setSelectedDate("");
    setEditingHolidayId(null);
  }

  function handleDateChange(
    value: string,
  ) {
    setSelectedDate(value);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function validateDate(): boolean {
    const date = selectedDate.trim();

    if (!date) {
      setErrorMessage(
        "休塾日の日付を選択してください。",
      );

      return false;
    }

    const hasDuplicateDate =
      holidays.some(
        (holiday) =>
          holiday.date === date &&
          holiday.id !==
            editingHolidayId,
      );

    if (hasDuplicateDate) {
      setErrorMessage(
        "同じ日付の休塾日がすでに登録されています。",
      );

      return false;
    }

    return true;
  }

  function handleAddOrUpdateHoliday() {
    if (!validateDate()) {
      return;
    }

    const date = selectedDate.trim();

    if (editingHolidayId) {
      setHolidays((current) =>
        sortHolidays(
          current.map((holiday) =>
            holiday.id ===
            editingHolidayId
              ? {
                  ...holiday,
                  date,
                }
              : holiday,
          ),
        ),
      );

      setSuccessMessage(
        "休塾日を変更しました。変更を保存してください。",
      );
    } else {
      const newHoliday: SchoolHoliday = {
        id: createHolidayId(),
        date,
      };

      setHolidays((current) =>
        sortHolidays([
          ...current,
          newHoliday,
        ]),
      );

      setSuccessMessage(
        "休塾日を追加しました。変更を保存してください。",
      );
    }

    setHasChanges(true);
    setErrorMessage(null);
    resetForm();
  }

  function handleEditHoliday(
    holiday: SchoolHoliday,
  ) {
    setEditingHolidayId(holiday.id);
    setSelectedDate(holiday.date);

    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function handleCancelEdit() {
    resetForm();
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function handleDeleteHoliday(
    holiday: SchoolHoliday,
  ) {
    const shouldDelete =
      window.confirm(
        `${formatHolidayDate(
          holiday.date,
        )}を休塾日から削除しますか？`,
      );

    if (!shouldDelete) {
      return;
    }

    setHolidays((current) =>
      current.filter(
        (item) =>
          item.id !== holiday.id,
      ),
    );

    if (
      editingHolidayId === holiday.id
    ) {
      resetForm();
    }

    setHasChanges(true);
    setErrorMessage(null);

    setSuccessMessage(
      "休塾日を削除しました。変更を保存してください。",
    );
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const holidaysToSave =
        sortHolidays(holidays);

      await saveSchoolHolidays(
        holidaysToSave,
      );

      setHolidays(holidaysToSave);
      setHasChanges(false);

      setSuccessMessage(
        "休塾日設定を保存しました。",
      );
    } catch (error) {
      console.error(
        "休塾日設定の保存に失敗しました。",
        error,
      );

      setErrorMessage(
        "休塾日設定を保存できませんでした。",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />

          <p className="mt-4 text-sm text-zinc-500">
            休塾日設定を読み込んでいます。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
          休塾日設定
        </h1>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          通常授業・講習授業を実施しない日を登録します。
          登録した日はスケジュール上で休塾日として表示されます。
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

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-6 py-5">
          <h2 className="text-base font-semibold text-zinc-950">
            {editingHolidayId
              ? "休塾日を編集"
              : "休塾日を追加"}
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            休塾日にする日付を選択してください。
          </p>
        </div>

        <div className="px-6 py-6">
          <div className="max-w-md">
            <label
              htmlFor="holiday-date"
              className="mb-2 block text-sm font-semibold text-zinc-800"
            >
              日付
            </label>

            <input
              id="holiday-date"
              type="date"
              value={selectedDate}
              onChange={(event) =>
                handleDateChange(
                  event.target.value,
                )
              }
              className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-zinc-200 bg-zinc-50 px-6 py-4">
          {editingHolidayId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
            >
              編集をキャンセル
            </button>
          )}

          <button
            type="button"
            onClick={
              handleAddOrUpdateHoliday
            }
            className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            {editingHolidayId
              ? "変更する"
              : "追加する"}
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-6 py-5">
          <h2 className="text-base font-semibold text-zinc-950">
            登録済みの休塾日
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            {sortedHolidays.length}
            件登録されています。
          </p>
        </div>

        {sortedHolidays.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-zinc-700">
              休塾日は登録されていません。
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              上の入力欄から休塾日を追加してください。
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200">
            {sortedHolidays.map(
              (holiday) => (
                <div
                  key={holiday.id}
                  className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-sm font-semibold text-zinc-950">
                    {formatHolidayDate(
                      holiday.date,
                    )}
                  </p>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleEditHoliday(
                          holiday,
                        )
                      }
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                    >
                      編集
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteHoliday(
                          holiday,
                        )
                      }
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </section>

      <div className="flex justify-end border-t border-zinc-200 pt-6">
        <PrimaryButton
          type="button"
          onClick={() =>
            void handleSave()
          }
          disabled={
            isSaving || !hasChanges
          }
        >
          {isSaving
            ? "保存中..."
            : "変更を保存"}
        </PrimaryButton>
      </div>
    </div>
  );
}