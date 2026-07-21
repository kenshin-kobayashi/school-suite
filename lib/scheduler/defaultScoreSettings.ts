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
        Number.isInteger(value) &&
        value >= 0 &&
        value <= 100,
    ) &&
    getAISchedulerScoreSettingsTotal(settings) === 100
  );
}

export function normalizeAISchedulerScoreSettings(
  value: unknown,
): AISchedulerScoreSettings {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return defaultAISchedulerScoreSettings;
  }

  const candidate =
    value as Partial<AISchedulerScoreSettings>;

  const settings: AISchedulerScoreSettings = {
    teacherIdleWeight:
      candidate.teacherIdleWeight ??
      defaultAISchedulerScoreSettings.teacherIdleWeight,
    studentIdleWeight:
      candidate.studentIdleWeight ??
      defaultAISchedulerScoreSettings.studentIdleWeight,
    teacherPreferenceWeight:
      candidate.teacherPreferenceWeight ??
      defaultAISchedulerScoreSettings.teacherPreferenceWeight,
  };

  return isValidAISchedulerScoreSettings(settings)
    ? settings
    : defaultAISchedulerScoreSettings;
}