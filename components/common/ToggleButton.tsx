"use client";

import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  active?: boolean;
  children: ReactNode;
};

export default function ToggleButton({
  selected = false,
  active,
  children,
  type = "button",
  className = "",
  disabled,
  ...props
}: Props) {
  const isSelected = active ?? selected;

  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        "inline-flex min-h-10 items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold transition-all",
        "focus:outline-none focus:ring-2 focus:ring-zinc-300",
        isSelected
          ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
          : "border-zinc-200 bg-white text-zinc-700 shadow-sm hover:border-zinc-400 hover:bg-zinc-50",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}