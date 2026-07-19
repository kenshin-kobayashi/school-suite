"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

export type SearchSelectOption = {
  value: string;
  label: string;
  description?: string;
  searchText?: string;
  disabled?: boolean;
};

type SearchSelectProps = {
  label: string;
  placeholder: string;
  value: string;
  options: SearchSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  emptyMessage?: string;
};

export default function SearchSelect({
  label,
  placeholder,
  value,
  options,
  onChange,
  disabled = false,
  error,
  emptyMessage = "該当する候補がありません。",
}: SearchSelectProps) {
  const inputId = useId();
  const listboxId = useId();

  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () =>
      options.find(
        (option) => option.value === value,
      ) ?? null,
    [options, value],
  );

  const [query, setQuery] = useState(
    selectedOption?.label ?? "",
  );

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] =
    useState(-1);

  useEffect(() => {
    setQuery(selectedOption?.label ?? "");
  }, [selectedOption]);

  useEffect(() => {
    const handlePointerDown = (
      event: PointerEvent,
    ) => {
      const clickedOutside =
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        );

      if (!clickedOutside) {
        return;
      }

      setOpen(false);
      setActiveIndex(-1);
      setQuery(selectedOption?.label ?? "");
    };

    document.addEventListener(
      "pointerdown",
      handlePointerDown,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );
    };
  }, [selectedOption]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query
      .trim()
      .toLocaleLowerCase();

    const selectedLabel =
      selectedOption?.label
        .trim()
        .toLocaleLowerCase() ?? "";

    if (
      !normalizedQuery ||
      normalizedQuery === selectedLabel
    ) {
      return options;
    }

    return options.filter((option) => {
      const searchableText = [
        option.label,
        option.description,
        option.searchText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();

      return searchableText.includes(
        normalizedQuery,
      );
    });
  }, [options, query, selectedOption]);

  const selectOption = (
    option: SearchSelectOption,
  ) => {
    if (option.disabled) {
      return;
    }

    onChange(option.value);
    setQuery(option.label);
    setOpen(false);
    setActiveIndex(-1);
  };

  const moveActiveIndex = (
    direction: "next" | "previous",
  ) => {
    if (filteredOptions.length === 0) {
      setActiveIndex(-1);
      return;
    }

    setActiveIndex((currentIndex) => {
      let nextIndex =
        direction === "next"
          ? currentIndex + 1
          : currentIndex - 1;

      if (nextIndex >= filteredOptions.length) {
        nextIndex = 0;
      }

      if (nextIndex < 0) {
        nextIndex =
          filteredOptions.length - 1;
      }

      /*
       * 無効な候補をキーボード操作で飛ばします。
       */
      let attempts = 0;

      while (
        filteredOptions[nextIndex]?.disabled &&
        attempts < filteredOptions.length
      ) {
        nextIndex =
          direction === "next"
            ? nextIndex + 1
            : nextIndex - 1;

        if (
          nextIndex >= filteredOptions.length
        ) {
          nextIndex = 0;
        }

        if (nextIndex < 0) {
          nextIndex =
            filteredOptions.length - 1;
        }

        attempts += 1;
      }

      return nextIndex;
    });
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (disabled) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      moveActiveIndex("next");
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      moveActiveIndex("previous");
      return;
    }

    if (
      event.key === "Enter" &&
      open &&
      activeIndex >= 0
    ) {
      event.preventDefault();

      const activeOption =
        filteredOptions[activeIndex];

      if (activeOption) {
        selectOption(activeOption);
      }

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();

      setOpen(false);
      setActiveIndex(-1);
      setQuery(selectedOption?.label ?? "");
    }
  };

  const toggleOptions = () => {
    if (disabled) {
      return;
    }

    setOpen((currentOpen) => !currentOpen);
    setActiveIndex(-1);
  };

  return (
    <div
      ref={containerRef}
      className="relative space-y-2"
    >
      <label
        htmlFor={inputId}
        className="block text-sm font-semibold text-zinc-700"
      >
        {label}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-zinc-400">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4"
          >
            <path
              d="m21 21-4.35-4.35m2.35-5.4A7.75 7.75 0 1 1 3.5 11.25a7.75 7.75 0 0 1 15.5 0Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <input
          id={inputId}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && activeIndex >= 0
              ? `${listboxId}-option-${activeIndex}`
              : undefined
          }
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={(event) => {
            if (disabled) {
              return;
            }

            setOpen(true);
            setActiveIndex(-1);

            event.currentTarget.select();
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          className={`h-12 w-full rounded-xl border bg-white py-2 pl-11 pr-11 text-sm text-zinc-900 outline-none transition ${
            error
              ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
              : "border-zinc-200 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
          } placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400`}
        />

        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label={
            open
              ? "候補を閉じる"
              : "候補を開く"
          }
          onClick={toggleOptions}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-zinc-400 transition hover:text-zinc-600 disabled:cursor-not-allowed"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className={`h-4 w-4 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          >
            <path
              d="m5 7.5 5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {error && (
        <p className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}

      {open && !disabled && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-xl"
        >
          {filteredOptions.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-zinc-400">
              {emptyMessage}
            </p>
          ) : (
            filteredOptions.map(
              (option, index) => {
                const selected =
                  option.value === value;

                const active =
                  index === activeIndex;

                return (
                  <button
                    id={`${listboxId}-option-${index}`}
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    disabled={option.disabled}
                    onMouseEnter={() => {
                      if (!option.disabled) {
                        setActiveIndex(index);
                      }
                    }}
                    onMouseDown={(event) => {
                      /*
                       * inputのフォーカスが外れて、
                       * 候補が閉じることを防ぎます。
                       */
                      event.preventDefault();
                    }}
                    onClick={() =>
                      selectOption(option)
                    }
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left transition ${
                      selected || active
                        ? "bg-zinc-100"
                        : "hover:bg-zinc-50"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-800">
                        {option.label}
                      </p>

                      {option.description && (
                        <p className="mt-0.5 truncate text-xs text-zinc-400">
                          {option.description}
                        </p>
                      )}
                    </div>

                    {selected && (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                        fill="none"
                        className="h-4 w-4 shrink-0 text-zinc-700"
                      >
                        <path
                          d="m4.5 10.5 3.25 3.25L15.5 6"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                );
              },
            )
          )}
        </div>
      )}
    </div>
  );
}