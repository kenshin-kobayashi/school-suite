"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import PrimaryButton from "@/components/common/PrimaryButton";

import {
  getRegularScheduleSettings,
  saveRegularScheduleSettings,
} from "@/lib/firebase/setting";
import { defaultScheduleSettings } from "@/lib/schedule/defaultScheduleSettings";

import type { RegularScheduleSettings } from "@/types/schedule-settings";

import RegularLessonRuleSettings from "./RegularLessonRuleSettings";
import RegularPeriodSettings from "./RegularPeriodSettings";
import RegularWeekdaySettings from "./RegularWeekdaySettings";

function cloneDefaultSettings(): RegularScheduleSettings {
  return {
    ...defaultScheduleSettings.regular,
    enabledWeekdays: [
      ...defaultScheduleSettings.regular.enabledWeekdays,
    ],
    lessonRule: {
      ...defaultScheduleSettings.regular.lessonRule,
    },
    periods: defaultScheduleSettings.regular.periods.map(
      (period) => ({
        ...period,
      }),
    ),
  };
}

export default function RegularLessonSettings() {
  const [settings, setSettings] =
    useState<RegularScheduleSettings>(
      cloneDefaultSettings,
    );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [errorMessage, setErrorMessage] = useState<
    string | null
  >(null);

  const [successMessage, setSuccessMessage] = useState<
    string | null
  >(null);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const savedSettings =
        await getRegularScheduleSettings();

      setSettings(savedSettings);
      setHasChanges(false);
    } catch (error) {
      console.error(
        "通常授業設定の取得に失敗しました。",
        error,
      );

      setErrorMessage(
        "通常授業設定を読み込めませんでした。",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  function updateSettings(
    updater: (
      current: RegularScheduleSettings,
    ) => RegularScheduleSettings,
  ) {
    setSettings((current) => updater(current));
    setHasChanges(true);
    setSuccessMessage(null);
  }

  async function handleSave() {
    if (settings.enabledWeekdays.length === 0) {
      setErrorMessage(
        "通常授業を実施する曜日を1つ以上選択してください。",
      );

      return;
    }

    if (settings.lessonRule.lessonDurationMinutes < 1) {
      setErrorMessage(
        "授業時間は1分以上で設定してください。",
      );

      return;
    }

    if (
      settings.lessonRule.maxStudentsPerTeacher < 1
    ) {
      setErrorMessage(
        "講師1人あたりの生徒数は1人以上で設定してください。",
      );

      return;
    }

    if (settings.periods.length === 0) {
      setErrorMessage(
        "時限を1つ以上登録してください。",
      );

      return;
    }

    const enabledPeriods = settings.periods.filter(
      (period) => period.isEnabled,
    );

    if (enabledPeriods.length === 0) {
      setErrorMessage(
        "有効な時限を1つ以上設定してください。",
      );

      return;
    }

    const hasInvalidPeriod = settings.periods.some(
      (period) =>
        !period.startTime || !period.endTime,
    );

    if (hasInvalidPeriod) {
      setErrorMessage(
        "すべての時限に開始時刻と終了時刻を設定してください。",
      );

      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await saveRegularScheduleSettings(settings);

      setHasChanges(false);
      setSuccessMessage(
        "通常授業設定を保存しました。",
      );
    } catch (error) {
      console.error(
        "通常授業設定の保存に失敗しました。",
        error,
      );

      setErrorMessage(
        "通常授業設定を保存できませんでした。",
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
            通常授業設定を読み込んでいます。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
  <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
    通常授業設定
  </h1>

  <p className="mt-2 text-sm leading-6 text-zinc-500">
    通常授業を実施する曜日、授業ルール、
    時限を設定します。
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

      <RegularWeekdaySettings
        value={settings.enabledWeekdays}
        onChange={(enabledWeekdays) =>
          updateSettings((current) => ({
            ...current,
            enabledWeekdays,
          }))
        }
      />

      <RegularLessonRuleSettings
        value={settings.lessonRule}
        onChange={(lessonRule) =>
          updateSettings((current) => ({
            ...current,
            lessonRule,
          }))
        }
      />

      <RegularPeriodSettings
        periods={settings.periods}
        lessonDurationMinutes={
          settings.lessonRule.lessonDurationMinutes
        }
        onChange={(periods) =>
          updateSettings((current) => ({
            ...current,
            periods,
          }))
        }
      />

      <div className="flex justify-end border-t border-zinc-200 pt-6">
        <PrimaryButton
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? "保存中..." : "変更を保存"}
        </PrimaryButton>
      </div>
    </div>
  );
}