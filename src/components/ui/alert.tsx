import type { HTMLAttributes, ReactNode } from "react";

const variantClasses = {
  danger: "border-danger bg-danger-soft text-danger",
  info: "border-brand bg-brand-soft text-ink",
  success: "border-success bg-success-soft text-success",
  warning: "border-warning bg-warning-soft text-warning",
} as const;

type AlertVariant = keyof typeof variantClasses;

export function Alert({
  children,
  className = "",
  variant = "info",
  ...props
}: {
  children: ReactNode;
  variant?: AlertVariant;
} & Omit<HTMLAttributes<HTMLDivElement>, "children" | "role">) {
  const urgent = variant === "danger";

  return (
    <div
      {...props}
      aria-live={urgent ? "assertive" : "polite"}
      className={`rounded border px-4 py-3 text-sm ${variantClasses[variant]} ${className}`}
      role={urgent ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
