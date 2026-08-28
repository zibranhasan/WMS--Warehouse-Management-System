"use client";

export interface StatusTabOption<T extends string = string> {
  label: string;
  value: T;
}

interface StatusTabFilterProps<T extends string = string> {
  options: StatusTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  disabled?: boolean;
}

export function StatusTabFilter<T extends string = string>({
  options,
  value,
  onChange,
  label,
  disabled = false,
}: StatusTabFilterProps<T>) {
  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          {label}
        </span>
      )}
      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                isSelected
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
