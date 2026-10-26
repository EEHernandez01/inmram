import type { ComponentProps, ReactNode } from "react";

const inputClasses =
  "min-h-12 w-full rounded border border-border bg-surface px-3 py-3 text-base text-ink outline-none placeholder:text-ink-secondary focus:border-brand disabled:cursor-not-allowed disabled:bg-bg";

type FieldProps = {
  children: ReactNode;
  hint?: string;
  label: string;
};

export function Field({ children, hint, label }: FieldProps) {
  return (
    <label className="block space-y-2 text-base font-semibold text-ink">
      <span>{label}</span>
      {children}
      {hint ? (
        <span className="block text-sm font-normal leading-6 text-ink-secondary">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={`${inputClasses} ${props.className ?? ""}`} />;
}

export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={`${inputClasses} ${props.className ?? ""}`} />;
}

export function Textarea(props: ComponentProps<"textarea">) {
  return (
    <textarea {...props} className={`${inputClasses} ${props.className ?? ""}`} />
  );
}
