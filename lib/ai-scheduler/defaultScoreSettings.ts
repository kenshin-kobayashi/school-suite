import type { AISchedulerScoreSettings } from "./types";

export const defaultAISchedulerScoreSettings: AISchedulerScoreSettings = {
  teacherIdleWeight: 40,
  studentIdleWeight: 30,
  teacherPreferenceWeight: 30,
};

export function getAISchedulerScoreSettingsTotal(
  settings: AISchedulerScoreSettings,
): number {
  return (
    settings.teacherIdleWeight +
    settings.studentIdleWeight +
    settings.teacherPreferenceWeight
  );
}

export function isValidAISchedulerScoreSettings(
  settings: AISchedulerScoreSettings,
): boolean {
  const values = [
    settings.teacherIdleWeight,
    settings.studentIdleWeight,
    settings.teacherPreferenceWeight,
  ];

  return (
    values.every(
      (value) =>
        Number.isFinite(value) &&
        value >= 0 &&
        value <= 100,
    ) &&
    getAISchedulerScoreSettingsTotal(settings) === 100
  );
}

export function normalizeAISchedulerScoreSettings(
  settings?: Partial<AISchedulerScoreSettings> | null,
): AISchedulerScoreSettings {
  const normalizedSettings: AISchedulerScoreSettings = {
    teacherIdleWeight:
      settings?.teacherIdleWeight ??
      defaultAISchedulerScoreSettings.teacherIdleWeight,
    studentIdleWeight:
      settings?.studentIdleWeight ??
      defaultAISchedulerScoreSettings.studentIdleWeight,
    teacherPreferenceWeight:
      settings?.teacherPreferenceWeight ??
      defaultAISchedulerScoreSettings.teacherPreferenceWeight,
  };

  if (!isValidAISchedulerScoreSettings(normalizedSettings)) {
    return defaultAISchedulerScoreSettings;
  }

  return normalizedSettings;
}