"use client";

export function ConfirmSubmitButton({
  children,
  className = "min-h-11 cursor-pointer px-4 py-3 text-base font-semibold text-brand hover:text-brand-hover",
  message,
}: {
  children: React.ReactNode;
  className?: string;
  message: string;
}) {
  return (
    <button
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      type="submit"
    >
      {children}
    </button>
  );
}
