"use client";

type AIScheduleProgressDialogProps = {
  open: boolean;
  progress: number;
  message: string;
};

export default function AIScheduleProgressDialog({
  open,
  progress,
  message,
}: AIScheduleProgressDialogProps) {
  if (!open) {
    return null;
  }

  const normalizedProgress = Math.max(
    0,
    Math.min(progress, 100),
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/35 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-progress-title"
      aria-describedby="ai-progress-description"
    >
      <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
            <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-zinc-200 border-t-zinc-900" />
          </div>

          <h2
            id="ai-progress-title"
            className="mt-5 text-lg font-semibold tracking-tight text-zinc-950"
          >
            AI時間割を作成しています
          </h2>

          <p
            id="ai-progress-description"
            className="mt-2 min-h-6 text-sm leading-6 text-zinc-500"
          >
            {message}
          </p>

          <p className="mt-6 text-4xl font-bold tracking-tight text-zinc-950">
            {normalizedProgress}

            <span className="ml-1 text-xl font-semibold text-zinc-500">
              %
            </span>
          </p>
        </div>

        <div
          className="mt-6 h-2.5 overflow-hidden rounded-full bg-zinc-100"
          role="progressbar"
          aria-label="AI時間割の作成進捗"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={normalizedProgress}
        >
          <div
            className="h-full rounded-full bg-zinc-900 transition-[width] duration-300 ease-out"
            style={{
              width: `${normalizedProgress}%`,
            }}
          />
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-zinc-400">
          作成中は画面を閉じずにお待ちください。
        </p>
      </div>
    </div>
  );
}