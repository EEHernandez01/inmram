import type { ComponentProps, ReactNode } from "react";

const inputClasses =
  "w-full rounded border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-secondary focus:border-brand disabled:cursor-not-allowed disabled:bg-bg";

type FieldProps = {
  children: ReactNode;
  hint?: string;
  label: string;
};

export function Field({ children, hint, label }: FieldProps) {
  return (
    <label className="block space-y-2 text-sm font-semibold text-ink">
      <span>{label}</span>
      {children}
      {hint ? (
        <span className="block text-xs font-normal text-ink-secondary">
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
