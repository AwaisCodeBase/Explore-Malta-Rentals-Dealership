"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

type AdminSelectOption<T extends string | number> = {
  value: T;
  label: string;
};

type AdminSelectProps<T extends string | number> = Readonly<{
  value: T;
  onChange: (value: T) => void;
  options: readonly AdminSelectOption<T>[];
  required?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
}>;

function optionButtonClass(isSelected: boolean): string {
  return [
    "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition",
    isSelected ? "bg-[#3a7ca5]/10 text-[#2f6688]" : "text-slate-800 hover:bg-slate-50",
  ].join(" ");
}

export function AdminSelect<T extends string | number>({
  value,
  onChange,
  options,
  required = false,
  className,
  id,
  "aria-label": ariaLabel,
}: AdminSelectProps<T>) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const selected = options.find((option) => option.value === value);

  function selectOption(nextValue: T) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={["relative", className].filter(Boolean).join(" ")}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#3a7ca5]/40 focus:bg-white focus:ring-2 focus:ring-[#3a7ca5]/15"
      >
        <span className="truncate font-medium">{selected?.label ?? ""}</span>
        <ChevronDown
          className={["size-4 shrink-0 text-slate-400 transition", open ? "rotate-180" : ""].join(" ")}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={String(option.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => selectOption(option.value)}
                className={optionButtonClass(isSelected)}
              >
                <span className="flex-1 font-medium">{option.label}</span>
                {isSelected ? <Check className="size-4 shrink-0" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {required && value === "" ? (
        <input
          tabIndex={-1}
          aria-hidden
          value=""
          required
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          onChange={() => undefined}
        />
      ) : null}
    </div>
  );
}
