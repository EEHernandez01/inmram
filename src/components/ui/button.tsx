import type { ComponentProps } from "react";

const variantClasses = {
  danger: "bg-danger text-white hover:bg-danger/90",
  primary: "bg-brand text-white hover:bg-brand-hover",
  secondary: "border border-border bg-surface text-ink hover:bg-bg",
} as const;

type ButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof variantClasses;
};

export function Button({
  className = "",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`cursor-pointer rounded px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
      type={type}
    />
  );
}
