"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * A single-select dropdown with a type-to-filter box. Picking the "all" row
 * reports an empty string.
 */
export default function SearchableSelect({
  label,
  options,
  value,
  onChange,
  allLabel,
}: {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  /** Label of the leading "no filter" row, e.g. "All companies". */
  allLabel: string;
}) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const selected = options.find((o) => o.value === value);

  const rows = useMemo<SelectOption[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [{ value: "", label: allLabel }, ...options];
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, allLabel]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function pick(option: SelectOption) {
    onChange(option.value);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && open && rows[active]) {
      e.preventDefault();
      pick(rows[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={id} className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.1em] text-ink-500">
        {label}
      </label>
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        autoComplete="off"
        value={open ? query : selected?.label ?? ""}
        placeholder={selected?.label ?? allLabel}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className="w-full rounded-[10px] border border-line-strong bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
      />
      {open && (
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-[10px] border border-line bg-white py-1 shadow-lg"
        >
          {rows.length === 0 ? (
            <li className="px-3.5 py-2.5 text-sm text-ink-500">No matches</li>
          ) : (
            rows.map((o, i) => (
              <li
                key={o.value || "__all"}
                role="option"
                aria-selected={o.value === value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(o);
                }}
                onMouseEnter={() => setActive(i)}
                className={`cursor-pointer px-3.5 py-2 text-sm ${
                  i === active ? "bg-brand-100 text-brand-800" : "text-ink-900"
                } ${o.value === value ? "font-semibold" : ""}`}
              >
                {o.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
